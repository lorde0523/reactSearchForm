import { Checkbox } from 'antd';
import ControlledField from './ControlledField';

export default function CheckboxGroupField({ field }) {
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
