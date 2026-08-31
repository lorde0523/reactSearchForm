import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import weekOfYear from 'dayjs/plugin/weekOfYear.js';
import { PICKER_CONFIGS } from './pickerFormats';

dayjs.extend(advancedFormat);
dayjs.extend(customParseFormat);
dayjs.extend(weekOfYear);

const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';

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

function isEmptyValue(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0 || value.every(isEmptyValue);
  return false;
}

function isActiveFieldValue(value, field) {
  if ((field.type === 'checkbox' || field.type === 'switch') && value === false && !field.includeFalsy) {
    return false;
  }
  return !isEmptyValue(value);
}

function serializeFieldValue(value, field) {
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

function formatFieldValue(value, field) {
  if (field.formatDisplay) return field.formatDisplay(value, field);

  if (['select', 'radioGroup', 'radioButtonGroup', 'autoComplete'].includes(field.type)) {
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

  const pickerConfig = getPickerConfig(field);
  if (pickerConfig) {
    const displayFormat = field.displayFormat || pickerConfig.displayFormat;
    const formatPickerValue = (item) => {
      const parsed = parsePickerValue(item, field);
      return parsed?.isValid() ? parsed.format(displayFormat) : String(item ?? '');
    };

    return pickerConfig.range
      ? (Array.isArray(value) ? value.map(formatPickerValue).join(' ~ ') : '')
      : formatPickerValue(value);
  }

  if (field.type === 'dateRange') {
    return Array.isArray(value) ? value.join(' ~ ') : '';
  }
  if (field.type === 'checkbox') return value ? field.checkedText || field.text || '선택' : '선택 안 함';
  if (field.type === 'switch') return value
    ? field.checkedText || '사용'
    : field.uncheckedText || '사용 안 함';
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item || typeof item !== 'object') return item;
        return item.label ?? item.title ?? item.value ?? item.key ?? '';
      })
      .filter((item) => item !== undefined && item !== null && item !== '')
      .join(' / ');
  }
  if (value && typeof value === 'object') {
    return String(value.label ?? value.title ?? value.value ?? value.key ?? '');
  }
  return String(value);
}

function getCustomPreviewItems(value, field) {
  if (field.type !== 'custom' || !Array.isArray(value)) return undefined;

  const items = value
    .map((item) => {
      if (!item || typeof item !== 'object') return item;
      return item.label ?? item.title ?? item.value ?? item.key ?? '';
    })
    .filter((item) => item !== undefined && item !== null && item !== '')
    .map(String);

  return items.length ? items : undefined;
}

function flattenFields(rows) {
  return rows.flatMap((row) => [
    ...(row.fields || []),
    ...(row.groups || []).flatMap((group) => group.fields),
  ]);
}

function getFieldInitialValue(field) {
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

export function createConditionSnapshot(rows, formValues, { includeEmptyValues = false } = {}) {
  const values = {};
  const preview = [];

  const collectFields = (fields) => {
    const previewFields = [];

    fields.forEach((field) => {
        const currentValue = formValues[field.name];
        const active = isActiveFieldValue(currentValue, field);
        if (!active) {
          if (includeEmptyValues) values[field.name] = currentValue;
          return;
        }

        const serializedValue = serializeFieldValue(currentValue, field);
        if (isEmptyValue(serializedValue)) {
          if (includeEmptyValues) values[field.name] = serializedValue;
          return;
        }

        values[field.name] = serializedValue;
        if (field.hideInPreview || (field.hideFalsyInPreview && serializedValue === false)) return;

        const previewItems = getCustomPreviewItems(serializedValue, field);
        previewFields.push({
          name: field.name,
          label: field.label || field.placeholder || field.name,
          type: field.type,
          value: formatFieldValue(serializedValue, field),
          ...(previewItems ? { previewItems } : {}),
        });
    });

    return previewFields;
  };

  rows.forEach((row) => {
    const rowDisabled = row.controlToggleName && formValues[row.controlToggleName] !== true;
    const rowFields = rowDisabled ? [] : (row.fields || []);
    const ungroupedFields = collectFields(rowFields);
    if (ungroupedFields.length) {
      preview.push({
        key: `${row.key}-ungrouped`,
        label: row.label,
        fields: ungroupedFields,
      });
    }

    if (rowDisabled) {
      const rowControlGroup = (row.groups || []).find((group) => group.controlsRow);
      if (rowControlGroup) {
        collectFields(rowControlGroup.fields.filter((field) => field.name === row.controlToggleName));
      }
      return;
    }

    let unlabeledGroupsPreview;

    (row.groups || []).forEach((group) => {
      const fields = group.toggleName && formValues[group.toggleName] !== true
        ? group.fields.filter((field) => field.name === group.toggleName)
        : group.fields;
      const previewFields = collectFields(fields);

      if (!previewFields.length) return;

      if (group.label) {
        preview.push({
          key: `${row.key}-${group.key}`,
          label: group.label,
          fields: previewFields,
        });
        return;
      }

      if (!unlabeledGroupsPreview) {
        unlabeledGroupsPreview = {
          key: `${row.key}-unlabeled-groups`,
          label: row.label,
          fields: [],
          lines: [],
        };
        preview.push(unlabeledGroupsPreview);
      }

      unlabeledGroupsPreview.fields.push(...previewFields);
      unlabeledGroupsPreview.lines.push({
        key: `${row.key}-${group.key}`,
        fields: previewFields,
      });
    });
  });

  return { values, preview };
}

export function hydrateSavedValues(rows, savedValues, defaults = {}) {
  const fieldsByName = new Map(flattenFields(rows).map((field) => [field.name, field]));
  const hydrated = { ...defaults };
  const normalizedValues = normalizeSavedValues(savedValues);

  Object.entries(normalizedValues).forEach(([name, value]) => {
    const field = fieldsByName.get(name);
    if (field) hydrated[name] = deserializeFieldValue(value, field);
  });

  return hydrated;
}

export function normalizeSavedValues(savedValues) {
  let normalized = savedValues ?? {};

  // 서버 저장 과정에서 JSON.stringify가 중복 적용된 응답도 안전하게 복원한다.
  for (let depth = 0; depth < 3 && typeof normalized === 'string'; depth += 1) {
    if (!normalized.trim()) return {};

    try {
      normalized = JSON.parse(normalized);
    } catch {
      return {};
    }
  }

  if (!normalized || typeof normalized !== 'object' || Array.isArray(normalized)) {
    return {};
  }

  return normalized;
}
