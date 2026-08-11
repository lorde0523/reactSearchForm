import { Radio } from 'antd';
import ControlledField, { resolveField } from './ControlledField';

export default function RadioButtonGroupField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'radioButtonGroup');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <Radio.Group
          {...controllerField}
          buttonStyle={field.buttonStyle || 'solid'}
          className={field.className}
          disabled={disabled}
          optionType="button"
          options={field.options}
          style={field.style}
        />
      )}
    />
  );
}

RadioButtonGroupField.fieldType = 'radioButtonGroup';
