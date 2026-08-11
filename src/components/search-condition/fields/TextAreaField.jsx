import { Input } from 'antd';
import ControlledField, { getFieldLabel, getFieldWidth, resolveField } from './ControlledField';

const { TextArea } = Input;

export default function TextAreaField({ field: suppliedField, ...props }) {
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
