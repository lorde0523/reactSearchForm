import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import weekOfYear from 'dayjs/plugin/weekOfYear.js';
import { PICKER_CONFIGS } from './pickerFormats';

dayjs.extend(advancedFormat);
dayjs.extend(customParseFormat);
dayjs.extend(weekOfYear);

export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';

function getPickerConfig(field) {
  return PICKER_CONFIGS[field.type];
}

function getPickerValueFormat(field) {
  return field.valueFormat || getPickerConfig(field)?.valueFormat || DEFAULT_DATE_FORMAT;
}

function parsePickerValue(value, field) {
  if (!value) return undefined;

  if (field.type === 'week' || field.type === 'weekRange') {
    const text = String(value);
    const year = Number(text.slice(0, 4));
    const week = Number(text.slice(4).match(/\d{1,2}/)?.[0]);
    if (!year || !week) return undefined;
    return dayjs(`${year}-01-01`).week(week);
  }

  const parsed = dayjs(value, getPickerValueFormat(field), true);
  return parsed.isValid() ? parsed : undefined;
}

export function isEmptyValue(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0 || value.every(isEmptyValue);
  return false;
}

function isActiveFieldValue(value, field) {
  if (field.type === 'checkbox' && value === false && !field.includeFalsy) return false;
  return !isEmptyValue(value);
}

export function serializeFieldValue(value, field) {
  if (field.serialize) return field.serialize(value, field);

  if (field.type === 'date') {
    const date = dayjs(value);
    return date.isValid() ? date.format(field.format || DEFAULT_DATE_FORMAT) : undefined;
  }

  if (field.type === 'dateRange') {
    if (!Array.isArray(value)) return undefined;
    const dates = value.map((item) => dayjs(item));
    if (dates.some((date) => !date.isValid())) return undefined;
    return dates.map((date) => date.format(field.format || DEFAULT_DATE_FORMAT));
  }

  const pickerConfig = getPickerConfig(field);
  if (pickerConfig) {
    if (pickerConfig.range) {
      if (!Array.isArray(value)) return undefined;
      const dates = value.map((item) => dayjs(item));
      if (dates.some((date) => !date.isValid())) return undefined;
      return dates.map((date) => date.format(getPickerValueFormat(field)));
    }

    const date = dayjs(value);
    return date.isValid() ? date.format(getPickerValueFormat(field)) : undefined;
  }

  return value;
}

export function deserializeFieldValue(value, field) {
  if (field.deserialize) return field.deserialize(value, field);
  if (field.type === 'date') return value ? dayjs(value) : undefined;
  if (field.type === 'dateRange') {
    return Array.isArray(value) ? value.map((item) => dayjs(item)) : undefined;
  }
  const pickerConfig = getPickerConfig(field);
  if (pickerConfig) {
    return pickerConfig.range && Array.isArray(value)
      ? value.map((item) => parsePickerValue(item, field))
      : parsePickerValue(value, field);
  }
  return value;
}

export function formatFieldValue(value, field) {
  if (field.formatDisplay) return field.formatDisplay(value, field);

  if (field.type === 'select') {
    const selectedValues = Array.isArray(value) ? value : [value];
    return selectedValues
      .map((selected) => field.options?.find((option) => option.value === selected)?.label ?? selected)
      .join(', ');
  }

  if (field.type === 'checkboxGroup') {
    if (!Array.isArray(value)) return '';
    return value
      .map((selected) => field.options?.find((option) => option.value === selected)?.label ?? selected)
      .join(' / ');
  }

  if (field.type === 'dateRange' || getPickerConfig(field)?.range) {
    return Array.isArray(value) ? value.join(' ~ ') : '';
  }
  if (field.type === 'checkbox') return value ? field.checkedText || field.text || '선택' : '선택 안 함';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

export function flattenFields(rows) {
  return rows.flatMap((row) => [
    ...(row.fields || []),
    ...(row.groups || []).flatMap((group) => group.fields),
  ]);
}

export function getFieldInitialValue(field) {
  return field.initialValue !== undefined ? field.initialValue : field.defaultValue;
}

export function buildDefaultValues(rows, suppliedDefaults = {}) {
  const schemaDefaults = Object.fromEntries(
    flattenFields(rows)
      .filter((field) => getFieldInitialValue(field) !== undefined)
      .map((field) => [
        field.name,
        deserializeFieldValue(getFieldInitialValue(field), field),
      ]),
  );

  return hydrateSavedValues(rows, suppliedDefaults, schemaDefaults);
}

export function createConditionSnapshot(rows, formValues) {
  const values = {};
  const preview = [];

  const collectFields = (fields) => {
    const previewFields = [];

    fields.forEach((field) => {
        const currentValue = formValues[field.name];
        if (!isActiveFieldValue(currentValue, field)) return;

        const serializedValue = serializeFieldValue(currentValue, field);
        if (isEmptyValue(serializedValue)) return;

        values[field.name] = serializedValue;
        previewFields.push({
          name: field.name,
          label: field.label || field.placeholder || field.name,
          type: field.type,
          value: formatFieldValue(serializedValue, field),
        });
    });

    return previewFields;
  };

  rows.forEach((row) => {
    const ungroupedFields = collectFields(row.fields || []);
    if (ungroupedFields.length) {
      preview.push({
        key: `${row.key}-ungrouped`,
        label: row.label,
        fields: ungroupedFields,
      });
    }

    (row.groups || []).forEach((group) => {
      const previewFields = collectFields(group.fields);

      if (previewFields.length) {
        preview.push({
          key: `${row.key}-${group.key}`,
          label: group.label,
          fields: previewFields,
        });
      }
    });
  });

  return { values, preview };
}

export function hydrateSavedValues(rows, savedValues, defaults = {}) {
  const fieldsByName = new Map(flattenFields(rows).map((field) => [field.name, field]));
  const hydrated = { ...defaults };

  Object.entries(savedValues || {}).forEach(([name, value]) => {
    const field = fieldsByName.get(name);
    if (field) hydrated[name] = deserializeFieldValue(value, field);
  });

  return hydrated;
}
