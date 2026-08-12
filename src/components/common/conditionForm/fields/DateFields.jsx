import { DatePicker } from 'antd';
import { PICKER_CONFIGS, getPickerFieldType } from '../model/pickerFormats';
import ControlledField, { getFieldLabel, getFieldWidth, resolveField } from './ControlledField';

const { RangePicker } = DatePicker;

export function DateField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'date');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <DatePicker
          {...controllerField}
          aria-label={getFieldLabel(field)}
          className={field.className}
          disabled={disabled}
          format={field.format || 'YYYY-MM-DD'}
          placeholder={field.placeholder || '날짜 선택'}
          style={getFieldWidth(field)}
        />
      )}
    />
  );
}

DateField.fieldType = 'date';

export function DateRangeField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'dateRange');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <RangePicker
          {...controllerField}
          allowEmpty={field.allowEmpty ?? (disabled ? [true, true] : undefined)}
          aria-label={getFieldLabel(field)}
          className={field.className}
          disabled={disabled}
          format={field.format || 'YYYY-MM-DD'}
          style={getFieldWidth(field)}
        />
      )}
    />
  );
}

DateRangeField.fieldType = 'dateRange';

function PickerFieldControl({ field }) {
  const config = PICKER_CONFIGS[field.type];
  const Picker = config.range ? RangePicker : DatePicker;

  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <Picker
          {...controllerField}
          {...(config.range ? {
            allowEmpty: field.allowEmpty ?? (disabled ? [true, true] : undefined),
          } : {})}
          aria-label={getFieldLabel(field)}
          className={field.className}
          disabled={disabled}
          format={field.displayFormat || config.displayFormat}
          picker={config.picker}
          placeholder={field.placeholder}
          style={getFieldWidth(field)}
        />
      )}
    />
  );
}

function resolvePeriodPickerType(props) {
  const source = { ...props, ...(props.field || {}) };
  return getPickerFieldType(source.picker, Boolean(source.range));
}

export function PeriodPickerField({ field: suppliedField, ...props }) {
  const type = resolvePeriodPickerType({ ...props, field: suppliedField });
  const field = resolveField(suppliedField, props, type);

  return <PickerFieldControl field={{ ...field, range: Boolean(field.range), type }} />;
}

PeriodPickerField.fieldType = 'periodPicker';
PeriodPickerField.getFieldType = resolvePeriodPickerType;

function createPeriodPicker(type) {
  function PickerField({ field: suppliedField, ...props }) {
    return <PickerFieldControl field={resolveField(suppliedField, props, type)} />;
  }

  PickerField.displayName = `${type[0].toUpperCase()}${type.slice(1)}PickerField`;
  PickerField.fieldType = type;
  return PickerField;
}

export const WeekPickerField = createPeriodPicker('week');
export const WeekRangePickerField = createPeriodPicker('weekRange');
export const MonthPickerField = createPeriodPicker('month');
export const MonthRangePickerField = createPeriodPicker('monthRange');
export const YearPickerField = createPeriodPicker('year');
export const YearRangePickerField = createPeriodPicker('yearRange');
