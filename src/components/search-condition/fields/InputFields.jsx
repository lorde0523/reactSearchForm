import { AutoComplete, Input, InputNumber } from 'antd';
import ControlledField, { getFieldLabel, getFieldWidth, resolveField } from './ControlledField';

const { TextArea } = Input;

export function TextField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'text');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <Input
          {...controllerField}
          value={controllerField.value ?? ''}
          allowClear
          aria-label={getFieldLabel(field)}
          className={field.className}
          disabled={disabled}
          placeholder={field.placeholder || '입력'}
          style={getFieldWidth(field)}
        />
      )}
    />
  );
}

TextField.fieldType = 'text';

export function TextAreaField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'textArea');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <TextArea
          {...controllerField}
          value={controllerField.value ?? ''}
          allowClear
          aria-label={getFieldLabel(field)}
          autoSize={field.autoSize || { minRows: 1, maxRows: 3 }}
          className={field.className}
          disabled={disabled}
          maxLength={field.maxLength}
          placeholder={field.placeholder || '입력'}
          showCount={field.showCount}
          style={getFieldWidth(field, 240)}
        />
      )}
    />
  );
}

TextAreaField.fieldType = 'textArea';

export function NumberField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'number');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <InputNumber
          {...controllerField}
          aria-label={getFieldLabel(field)}
          className={field.className}
          disabled={disabled}
          placeholder={field.placeholder || '입력'}
          style={getFieldWidth(field)}
        />
      )}
    />
  );
}

NumberField.fieldType = 'number';

export function AutoCompleteField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'autoComplete');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <AutoComplete
          {...controllerField}
          value={controllerField.value ?? ''}
          allowClear
          aria-label={getFieldLabel(field)}
          className={field.className}
          disabled={disabled}
          filterOption={field.filterOption ?? true}
          options={field.options}
          placeholder={field.placeholder || '입력 또는 선택'}
          style={getFieldWidth(field)}
        />
      )}
    />
  );
}

AutoCompleteField.fieldType = 'autoComplete';
