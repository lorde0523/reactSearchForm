import { resolveField } from './ControlledField';
import PickerFieldControl from './PickerFieldControl';

export default function MonthPickerField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'month');
  return <PickerFieldControl field={field} />;
}

MonthPickerField.fieldType = 'month';
