import { Switch } from 'antd';
import ControlledField, { resolveField } from './ControlledField';

export default function SwitchField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'switch');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField }) => (
        <Switch
          checked={Boolean(controllerField.value)}
          checkedChildren={field.checkedText}
          disabled={field.disabled}
          unCheckedChildren={field.uncheckedText}
          onBlur={controllerField.onBlur}
          onChange={(checked, event) => controllerField.onChange(checked, event)}
        />
      )}
    />
  );
}

SwitchField.fieldType = 'switch';
