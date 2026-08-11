import { resolveField } from './ControlledField';
import PickerFieldControl from './PickerFieldControl';

export default function YearRangePickerField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'yearRange');
  return <PickerFieldControl field={field} />;
}

YearRangePickerField.fieldType = 'yearRange';
