import { DatePicker } from 'antd';
import ControlledField, { getFieldLabel, getFieldWidth, resolveField } from './ControlledField';

const { RangePicker } = DatePicker;

export default function DateRangeField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'dateRange');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <RangePicker
          {...controllerField}
          allowEmpty={field.allowEmpty ?? (disabled ? [true, true] : undefined)}
          aria-label={getFieldLabel(field)}
          disabled={disabled}
          format={field.format || 'YYYY-MM-DD'}
          style={getFieldWidth(field, 260)}
        />
      )}
    />
  );
}

DateRangeField.fieldType = 'dateRange';
