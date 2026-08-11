import { Radio } from 'antd';
import ControlledField, { resolveField } from './ControlledField';

export default function RadioGroupField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'radioGroup');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <Radio.Group
          {...controllerField}
          className={field.className}
          disabled={disabled}
          options={field.options}
          style={field.style}
        />
      )}
    />
  );
}

RadioGroupField.fieldType = 'radioGroup';
