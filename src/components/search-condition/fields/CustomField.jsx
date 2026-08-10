import ControlledField, { resolveField } from './ControlledField';

export default function CustomField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'custom');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, fieldState, form }) => (
        field.render({ field, controllerField, fieldState, form })
      )}
    />
  );
}

CustomField.fieldType = 'custom';
