import { resolveField } from './ControlledField';
import PickerFieldControl from './PickerFieldControl';

export default function MonthRangePickerField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'monthRange');
  return <PickerFieldControl field={field} />;
}

MonthRangePickerField.fieldType = 'monthRange';
