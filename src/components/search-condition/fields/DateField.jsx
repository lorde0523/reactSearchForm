import { DatePicker } from 'antd';
import ControlledField, { getFieldLabel, getFieldWidth, resolveField } from './ControlledField';

export default function DateField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'date');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField }) => (
        <DatePicker
          {...controllerField}
          aria-label={getFieldLabel(field)}
          format={field.format || 'YYYY-MM-DD'}
          placeholder={field.placeholder || '날짜 선택'}
          style={getFieldWidth(field)}
        />
      )}
    />
  );
}

DateField.fieldType = 'date';
