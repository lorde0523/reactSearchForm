import { AutoComplete } from 'antd';
import ControlledField, { getFieldLabel, getFieldWidth, resolveField } from './ControlledField';

export default function AutoCompleteField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'autoComplete');
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField }) => (
        <AutoComplete
          {...controllerField}
          value={controllerField.value ?? ''}
          allowClear
          aria-label={getFieldLabel(field)}
          disabled={field.disabled}
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
