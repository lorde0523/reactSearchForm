import { Input } from 'antd';
import ControlledField, { getFieldLabel, getFieldWidth } from './ControlledField';

export default function TextField({ field }) {
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField }) => (
        <Input
          {...controllerField}
          value={controllerField.value ?? ''}
          allowClear
          aria-label={getFieldLabel(field)}
          placeholder={field.placeholder || '입력'}
          style={getFieldWidth(field)}
        />
      )}
    />
  );
}
