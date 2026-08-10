import { DatePicker } from 'antd';
import ControlledField, { getFieldLabel, getFieldWidth } from './ControlledField';

export default function DateField({ field }) {
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
