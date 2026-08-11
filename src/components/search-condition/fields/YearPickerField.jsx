import { resolveField } from './ControlledField';
import PickerFieldControl from './PickerFieldControl';

export default function YearPickerField({ field: suppliedField, ...props }) {
  const field = resolveField(suppliedField, props, 'year');
  return <PickerFieldControl field={field} />;
}

YearPickerField.fieldType = 'year';
