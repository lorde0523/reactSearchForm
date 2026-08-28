import { Checkbox, Radio, Select, Switch } from 'antd';
import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import ControlledField, { getFieldLabel, getFieldWidth, resolveField } from './ControlledField';

const EMPTY_OPTIONS = [];

function getOptionState(options) {
  return options.map((option) => ({ disabled: Boolean(option.disabled), value: option.value }));
}

export function haveSelectOptionsChanged(previousOptions, nextOptions) {
  if (!previousOptions || previousOptions.length !== nextOptions.length) return true;

  return previousOptions.some((option, index) => (
    option.disabled !== nextOptions[index].disabled
    || !Object.is(option.value, nextOptions[index].value)
  ));
}

export function resolveSelectAutoValue({
  autoSelectFirst,
  currentValue,
  options,
  optionsChanged,
  resetToFirstOnOptionsChange,
}) {
  if (!autoSelectFirst && !resetToFirstOnOptionsChange) return currentValue;

  const enabledOptions = options.filter((option) => !option.disabled);
  if (!enabledOptions.length) return currentValue;

  const hasValue = currentValue !== undefined && currentValue !== null && currentValue !== '';
  const isValidValue = hasValue
    && enabledOptions.some((option) => Object.is(option.value, currentValue));
  const shouldReset = resetToFirstOnOptionsChange && optionsChanged;

  if (!shouldReset && isValidValue) return currentValue;
  return enabledOptions[0].value;
}

function useSelectAutoValue(field) {
  const form = useFormContext();
  const currentValue = useWatch({ control: form.control, name: field.name });
  const previousOptions = useRef();
  const options = field.options || EMPTY_OPTIONS;

  useEffect(() => {
    const nextOptionState = getOptionState(options);
    const optionsChanged = previousOptions.current !== undefined
      && haveSelectOptionsChanged(previousOptions.current, nextOptionState);
    previousOptions.current = nextOptionState;

    // mode가 있는 Select는 배열값 또는 사용자 입력값을 사용하므로 자동 단일 선택에서 제외한다.
    if (field.mode) return;

    const nextValue = resolveSelectAutoValue({
      autoSelectFirst: field.autoSelectFirst,
      currentValue,
      options,
      optionsChanged,
      resetToFirstOnOptionsChange: field.resetToFirstOnOptionsChange,
    });

    if (Object.is(currentValue, nextValue)) return;

    form.setValue(field.name, nextValue, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: true,
    });
    field.onChange?.(nextValue, {
      args: [],
      field,
      form,
      name: field.name,
      rawValue: nextValue,
      reason: optionsChanged ? 'options-change' : 'missing-value',
      source: 'auto',
      values: form.getValues(),
    });
  }, [
    currentValue,
    field.autoSelectFirst,
    field.mode,
    field.name,
    field.onChange,
    field.resetToFirstOnOptionsChange,
    form,
    options,
  ]);
}

export function SelectField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'select');
  useSelectAutoValue(field);
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <Select
          {...controllerField}
          allowClear={field.allowClear ?? !(
            field.autoSelectFirst || field.resetToFirstOnOptionsChange
          )}
          aria-label={getFieldLabel(field)}
          className={field.className}
          disabled={disabled}
          mode={field.mode}
          options={field.options}
          placeholder={field.placeholder || '선택'}
          style={getFieldWidth(field)}
        />
      )}
    />
  );
}

SelectField.fieldType = 'select';

export function RadioGroupField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'radioGroup');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <Radio.Group
          {...controllerField}
          className={field.className}
          disabled={disabled}
          options={field.options}
          style={field.style}
        />
      )}
    />
  );
}

RadioGroupField.fieldType = 'radioGroup';

export function RadioButtonGroupField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'radioButtonGroup');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <Radio.Group
          {...controllerField}
          buttonStyle={field.buttonStyle || 'solid'}
          className={field.className}
          disabled={disabled}
          optionType="button"
          options={field.options}
          style={field.style}
        />
      )}
    />
  );
}

RadioButtonGroupField.fieldType = 'radioButtonGroup';

export function CheckboxField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'checkbox');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <Checkbox
          aria-label={getFieldLabel(field)}
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
CheckboxField.fieldDefaults = {
  includeFalsy: true,
  hideFalsyInPreview: true,
};

export function CheckboxGroupField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'checkboxGroup');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <Checkbox.Group
          className={field.className}
          disabled={disabled}
          name={controllerField.name}
          options={field.options}
          style={field.style}
          value={controllerField.value || []}
          onBlur={controllerField.onBlur}
          onChange={controllerField.onChange}
        />
      )}
    />
  );
}

CheckboxGroupField.fieldType = 'checkboxGroup';

export function SwitchField({ field: suppliedField, ...props }) {
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
