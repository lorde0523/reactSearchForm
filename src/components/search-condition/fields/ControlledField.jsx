import { Form } from 'antd';
import { Controller, useFormContext } from 'react-hook-form';

export default function ControlledField({ field, renderInput }) {
  const methods = useFormContext();

  return (
    <Controller
      control={methods.control}
      name={field.name}
      rules={field.rules}
      render={({ field: controllerField, fieldState }) => (
        <Form.Item
          className="condition-field"
          help={fieldState.error?.message}
          validateStatus={fieldState.error ? 'error' : undefined}
        >
          {renderInput({ controllerField, fieldState, form: methods })}
        </Form.Item>
      )}
    />
  );
}

export function getFieldLabel(field) {
  return field.label || field.placeholder;
}

export function getFieldWidth(field, fallback = 160) {
  return { width: field.width || fallback };
}
