import { DatePicker } from 'antd';
import ControlledField, { getFieldLabel, getFieldWidth, resolveField } from './ControlledField';

const { RangePicker } = DatePicker;

export default function DateRangeField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'dateRange');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField }) => (
        <RangePicker
          {...controllerField}
          aria-label={getFieldLabel(field)}
          format={field.format || 'YYYY-MM-DD'}
          style={getFieldWidth(field, 260)}
        />
      )}
    />
  );
}

DateRangeField.fieldType = 'dateRange';
