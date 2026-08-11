import { Form } from 'antd';
import { Controller, useFormContext } from 'react-hook-form';

export function normalizeChangeValue(value) {
  if (value && typeof value === 'object' && 'target' in value) {
    return value.target.type === 'checkbox' ? value.target.checked : value.target.value;
  }
  return value;
}

export default function ControlledField({ field, renderInput }) {
  const methods = useFormContext();

  return (
    <Controller
      control={methods.control}
      name={field.name}
      rules={field.rules}
      render={({ field: controllerField, fieldState }) => {
        const fieldWithChangeHandler = {
          ...controllerField,
          onChange: (rawValue, ...args) => {
            controllerField.onChange(rawValue);
            field.onChange?.(normalizeChangeValue(rawValue), {
              args,
              field,
              form: methods,
              name: field.name,
              rawValue,
              values: methods.getValues(),
            });
          },
        };

        return (
          <Form.Item
            className="condition-field"
            help={fieldState.error?.message}
            validateStatus={fieldState.error ? 'error' : undefined}
          >
            {renderInput({ controllerField: fieldWithChangeHandler, fieldState, form: methods })}
          </Form.Item>
        );
      }}
    />
  );
}

export function getFieldLabel(field) {
  return field.label || field.placeholder;
}

export function getFieldWidth(field, fallback = 160) {
  return { width: field.width || fallback };
}

export function resolveField(suppliedField, props, type) {
  return suppliedField || { ...props, type };
}
