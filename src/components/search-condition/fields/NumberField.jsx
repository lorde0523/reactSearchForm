import { InputNumber } from 'antd';
import ControlledField, { getFieldLabel, getFieldWidth, resolveField } from './ControlledField';

export default function NumberField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'number');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <InputNumber
          {...controllerField}
          aria-label={getFieldLabel(field)}
          disabled={disabled}
          placeholder={field.placeholder || '입력'}
          style={getFieldWidth(field)}
        />
      )}
    />
  );
}

NumberField.fieldType = 'number';
