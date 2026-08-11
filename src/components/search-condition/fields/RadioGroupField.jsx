import { Radio } from 'antd';
import ControlledField, { resolveField } from './ControlledField';

export default function RadioGroupField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'radioGroup');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField }) => (
        <Radio.Group
          {...controllerField}
          disabled={field.disabled}
          options={field.options}
        />
      )}
    />
  );
}

RadioGroupField.fieldType = 'radioGroup';
