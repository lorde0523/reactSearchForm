import { Switch } from 'antd';
import ControlledField, { resolveField } from './ControlledField';

export default function SwitchField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'switch');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <Switch
          checked={Boolean(controllerField.value)}
          checkedChildren={field.checkedText}
          className={field.className}
          disabled={disabled}
          style={field.style}
          unCheckedChildren={field.uncheckedText}
          onBlur={controllerField.onBlur}
          onChange={(checked, event) => controllerField.onChange(checked, event)}
        />
      )}
    />
  );
}

SwitchField.fieldType = 'switch';
