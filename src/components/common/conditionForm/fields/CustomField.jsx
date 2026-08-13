import ControlledField, { resolveField } from './ControlledField';

const FIELD_ONLY_PROPS = new Set([
  'changeEventName',
  'component',
  'defaultValue',
  'dependencies',
  'deserialize',
  'disabled',
  'emptyValue',
  'field',
  'formatDisplay',
  'formItemClassName',
  'formItemStyle',
  'getValueFromChange',
  'hideFalsyInPreview',
  'hideInPreview',
  'includeFalsy',
  'initialValue',
  'label',
  'name',
  'onBlur',
  'onChange',
  'render',
  'rules',
  'serialize',
  'type',
  'valuePropName',
]);

export function getCustomComponentProps(field) {
  return Object.fromEntries(
    Object.entries(field).filter(([key]) => !FIELD_ONLY_PROPS.has(key)),
  );
}

export function getCustomChangeValue(field, args) {
  return field.getValueFromChange
    ? field.getValueFromChange(...args)
    : args[0];
}

export default function CustomField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'custom');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled, fieldState, form }) => {
        if (field.render) {
          return field.render({
            controllerField,
            disabled,
            field: { ...field, disabled },
            fieldState,
            form,
          });
        }

        const Component = field.component;
        if (!Component) {
          throw new Error('CustomField에는 component 또는 render가 필요합니다.');
        }

        const componentProps = getCustomComponentProps(field);
        const valuePropName = field.valuePropName || 'value';
        const changeEventName = field.changeEventName || 'onChange';
        const value = controllerField.value ?? field.emptyValue;

        return (
          <Component
            {...componentProps}
            name={controllerField.name}
            ref={controllerField.ref}
            disabled={disabled}
            onBlur={(...args) => {
              controllerField.onBlur();
              field.onBlur?.(...args);
            }}
            {...{
              [valuePropName]: value,
              [changeEventName]: (...args) => {
                controllerField.onChange(getCustomChangeValue(field, args), ...args.slice(1));
              },
            }}
          />
        );
      }}
    />
  );
}

CustomField.fieldType = 'custom';
