import { Input } from 'antd';
import ControlledField, { getFieldLabel, getFieldWidth, resolveField } from './ControlledField';

export default function TextField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'text');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <Input
          {...controllerField}
          value={controllerField.value ?? ''}
          allowClear
          aria-label={getFieldLabel(field)}
          className={field.className}
          disabled={disabled}
          placeholder={field.placeholder || '입력'}
          style={getFieldWidth(field)}
        />
      )}
    />
  );
}

TextField.fieldType = 'text';
