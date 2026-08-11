import { InputNumber } from 'antd';
import ControlledField, { getFieldLabel, getFieldWidth, resolveField } from './ControlledField';

export default function NumberField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'number');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField }) => (
        <InputNumber
          {...controllerField}
          aria-label={getFieldLabel(field)}
          placeholder={field.placeholder || '입력'}
          style={getFieldWidth(field)}
        />
      )}
    />
  );
}

NumberField.fieldType = 'number';
