import { Checkbox } from 'antd';
import ControlledField, { resolveField } from './ControlledField';

export default function CheckboxGroupField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'checkboxGroup');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField }) => (
        <Checkbox.Group
          name={controllerField.name}
          options={field.options}
          value={controllerField.value || []}
          onBlur={controllerField.onBlur}
          onChange={controllerField.onChange}
        />
      )}
    />
  );
}

CheckboxGroupField.fieldType = 'checkboxGroup';
