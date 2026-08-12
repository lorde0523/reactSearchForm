import ControlledField, { resolveField } from './ControlledField';

export default function CustomField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'custom');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled, fieldState, form }) => (
        field.render({
          controllerField,
          disabled,
          field: { ...field, disabled },
          fieldState,
          form,
        })
      )}
    />
  );
}

CustomField.fieldType = 'custom';
