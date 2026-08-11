import { DatePicker } from 'antd';
import { PICKER_CONFIGS } from '../pickerFormats';
import ControlledField, { getFieldLabel, getFieldWidth } from './ControlledField';

export default function PickerFieldControl({ field }) {
  const config = PICKER_CONFIGS[field.type];
  const Picker = config.range ? DatePicker.RangePicker : DatePicker;

  return (
    <ControlledField
      field={field}
      renderInput={({ controllerField, disabled }) => (
        <Picker
          {...controllerField}
          {...(config.range ? {
            allowEmpty: field.allowEmpty ?? (disabled ? [true, true] : undefined),
          } : {})}
          aria-label={getFieldLabel(field)}
          disabled={disabled}
          format={field.displayFormat || config.displayFormat}
          picker={config.picker}
          placeholder={field.placeholder}
          style={getFieldWidth(field, config.width)}
        />
      )}
    />
  );
}
