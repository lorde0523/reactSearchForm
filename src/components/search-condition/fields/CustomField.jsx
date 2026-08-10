import ControlledField from './ControlledField';

export default function CustomField({ field }) {
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, fieldState, form }) => (
        field.render({ field, controllerField, fieldState, form })
      )}
    />
  );
}
