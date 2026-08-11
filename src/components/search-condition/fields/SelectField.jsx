import { Select } from 'antd';
import ControlledField, { getFieldLabel, getFieldWidth, resolveField } from './ControlledField';

export default function SelectField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'select');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <Select
          {...controllerField}
          allowClear
          aria-label={getFieldLabel(field)}
          disabled={disabled}
          mode={field.mode}
          options={field.options}
          placeholder={field.placeholder || '선택'}
          style={getFieldWidth(field)}
        />
      )}
    />
  );
}

SelectField.fieldType = 'select';
