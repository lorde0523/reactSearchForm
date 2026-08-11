import { resolveField } from './ControlledField';
import PickerFieldControl from './PickerFieldControl';

export default function WeekPickerField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'week');
  return <PickerFieldControl field={field} />;
}

WeekPickerField.fieldType = 'week';
