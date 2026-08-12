import { Form } from 'antd';
import { useContext, useEffect, useRef } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { deserializeFieldValue } from '../model/conditionUtils';
import { ConditionDisabledContext } from '../model/SearchConditionContext';

const EMPTY_DEPENDENCIES = [];

function normalizeChangeValue(value) {
  if (value && typeof value === 'object' && 'target' in value) {
    return value.target.type === 'checkbox' ? value.target.checked : value.target.value;
  }
  return value;
}

export function resolveFieldDisabled(field, form, dependencyValues, groupDisabled = false) {
  if (groupDisabled) return true;
  if (typeof field.disabled !== 'function') return Boolean(field.disabled);
  return Boolean(field.disabled({
    dependencyValues,
    field,
    form,
    name: field.name,
    values: form.getValues(),
  }));
}

export default function ControlledField({ field, renderInput }) {
  const methods = useFormContext();
  const contextDisabled = useContext(ConditionDisabledContext);
  const dependencies = field.dependencies || EMPTY_DEPENDENCIES;
  const dependencyValues = useWatch({
    control: methods.control,
    disabled: dependencies.length === 0,
    name: dependencies,
  });
  const previousInitialValue = useRef({ name: field.name, value: field.initialValue });
  const disabled = resolveFieldDisabled(field, methods, dependencyValues, contextDisabled);

  useEffect(() => {
    const previous = previousInitialValue.current;
    if (previous.name === field.name && Object.is(previous.value, field.initialValue)) return;

    previousInitialValue.current = { name: field.name, value: field.initialValue };
    methods.setValue(field.name, deserializeFieldValue(field.initialValue, field), {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [field.deserialize, field.initialValue, field.name, field.type, methods]);

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
            className={['condition-form__field', field.formItemClassName].filter(Boolean).join(' ')}
            help={fieldState.error?.message}
            style={field.formItemStyle}
            validateStatus={fieldState.error ? 'error' : undefined}
          >
            {renderInput({
              controllerField: fieldWithChangeHandler,
              disabled,
              fieldState,
              form: methods,
            })}
          </Form.Item>
        );
      }}
    />
  );
}

export function getFieldLabel(field) {
  return field.label || field.placeholder;
}

export function getFieldWidth(field) {
  return {
    ...(field.width !== undefined ? { width: field.width } : {}),
    ...field.style,
  };
}

export function resolveField(suppliedField, props, type) {
  return { ...props, ...(suppliedField || {}), type };
}
