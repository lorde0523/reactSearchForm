import {
  CheckboxField,
  CheckboxGroupField,
  CustomField,
  DateField,
  DateRangeField,
  NumberField,
  SelectField,
  TextField,
} from './fields';

const fieldComponents = {
  text: TextField,
  number: NumberField,
  select: SelectField,
  date: DateField,
  dateRange: DateRangeField,
  checkbox: CheckboxField,
  checkboxGroup: CheckboxGroupField,
};

export default function FieldRenderer({ field }) {
  const Component = field.render ? CustomField : fieldComponents[field.type] || TextField;
  return <Component field={field} />;
}
