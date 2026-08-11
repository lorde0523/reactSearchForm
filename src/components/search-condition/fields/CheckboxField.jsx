import { Checkbox } from 'antd';
import ControlledField, { resolveField } from './ControlledField';

export default function CheckboxField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'checkbox');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <Checkbox
          checked={Boolean(controllerField.value)}
          className={field.className}
          disabled={disabled}
          name={controllerField.name}
          ref={controllerField.ref}
          style={field.style}
          onBlur={controllerField.onBlur}
          onChange={(event) => controllerField.onChange(event.target.checked, event)}
        >
          {field.text}
        </Checkbox>
      )}
    />
  );
}

CheckboxField.fieldType = 'checkbox';
