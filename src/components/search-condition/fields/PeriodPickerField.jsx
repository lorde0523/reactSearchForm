import { getPickerFieldType } from '../pickerFormats';
import PickerFieldControl from './PickerFieldControl';

function resolvePeriodPickerType(props) {
  const source = props.field || props;
  return getPickerFieldType(source.picker, Boolean(source.range));
}

export default function PeriodPickerField({ field: suppliedField, ...props }) {
  const source = suppliedField || props;
  const type = resolvePeriodPickerType({ ...props, field: suppliedField });
  const field = {
    ...source,
    picker: source.picker,
    range: Boolean(source.range),
    type,
  };

  return <PickerFieldControl field={field} />;
}

PeriodPickerField.fieldType = 'periodPicker';
PeriodPickerField.getFieldType = resolvePeriodPickerType;
