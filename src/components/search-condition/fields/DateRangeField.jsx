import { DatePicker } from 'antd';
import ControlledField, { getFieldLabel, getFieldWidth } from './ControlledField';

const { RangePicker } = DatePicker;

export default function DateRangeField({ field }) {
  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField }) => (
        <RangePicker
          {...controllerField}
          aria-label={getFieldLabel(field)}
          format={field.format || 'YYYY-MM-DD'}
          style={getFieldWidth(field, 260)}
        />
      )}
    />
  );
}
