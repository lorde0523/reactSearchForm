import { Checkbox } from 'antd';
import ControlledField from './ControlledField';

export default function CheckboxField({ field }) {
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField }) => (
        <Checkbox
          checked={Boolean(controllerField.value)}
          name={controllerField.name}
          ref={controllerField.ref}
          onBlur={controllerField.onBlur}
          onChange={(event) => controllerField.onChange(event.target.checked)}
        >
          {field.text}
        </Checkbox>
      )}
    />
  );
}
