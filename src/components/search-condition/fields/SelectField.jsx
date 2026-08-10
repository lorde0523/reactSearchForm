import { Select } from 'antd';
import ControlledField, { getFieldLabel, getFieldWidth } from './ControlledField';

export default function SelectField({ field }) {
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField }) => (
        <Select
          {...controllerField}
          allowClear
          aria-label={getFieldLabel(field)}
          mode={field.mode}
          options={field.options}
          placeholder={field.placeholder || '선택'}
          style={getFieldWidth(field)}
        />
      )}
    />
  );
}
