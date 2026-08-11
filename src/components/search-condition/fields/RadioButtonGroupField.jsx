import { Radio } from 'antd';
import ControlledField, { resolveField } from './ControlledField';

export default function RadioButtonGroupField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'radioButtonGroup');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField }) => (
        <Radio.Group
          {...controllerField}
          buttonStyle={field.buttonStyle || 'solid'}
          disabled={field.disabled}
          optionType="button"
          options={field.options}
        />
      )}
    />
  );
}

RadioButtonGroupField.fieldType = 'radioButtonGroup';
