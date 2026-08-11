import { Checkbox, Radio, Select, Switch } from 'antd';
import ControlledField, { getFieldLabel, getFieldWidth, resolveField } from './ControlledField';

export function SelectField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'select');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <Select
          {...controllerField}
          allowClear
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
