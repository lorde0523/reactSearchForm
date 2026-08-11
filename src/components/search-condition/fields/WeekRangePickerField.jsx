import { resolveField } from './ControlledField';
import PickerFieldControl from './PickerFieldControl';

export default function WeekRangePickerField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'weekRange');
  return <PickerFieldControl field={field} />;
}

WeekRangePickerField.fieldType = 'weekRange';
