import { InputNumber } from 'antd';
import ControlledField, { getFieldLabel, getFieldWidth } from './ControlledField';

export default function NumberField({ field }) {
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField }) => (
        <InputNumber
          {...controllerField}
          aria-label={getFieldLabel(field)}
          placeholder={field.placeholder || '입력'}
          style={getFieldWidth(field)}
        />
      )}
    />
  );
}
