import { Checkbox } from 'antd';
import ControlledField, { resolveField } from './ControlledField';

export default function CheckboxGroupField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'checkboxGroup');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <Checkbox.Group
          className={field.className}
          disabled={disabled}
          name={controllerField.name}
          options={field.options}
          style={field.style}
          value={controllerField.value || []}
          onBlur={controllerField.onBlur}
          onChange={controllerField.onChange}
        />
      )}
    />
  );
}

CheckboxGroupField.fieldType = 'checkboxGroup';
