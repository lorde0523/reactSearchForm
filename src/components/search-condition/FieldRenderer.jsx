import { Checkbox, DatePicker, Form, Input, InputNumber, Select } from 'antd';
import { Controller, useFormContext } from 'react-hook-form';

const { RangePicker } = DatePicker;

export default function FieldRenderer({ field }) {
  const methods = useFormContext();

  return (
    <Controller
      control={methods.control}
      name={field.name}
      rules={field.rules}
      render={({ field: controllerField, fieldState }) => {
        const formItemProps = {
          className: 'condition-field',
          help: fieldState.error?.message,
          validateStatus: fieldState.error ? 'error' : undefined,
        };
        const widthStyle = { width: field.width || 160 };

        if (field.render) {
          return (
            <Form.Item {...formItemProps}>
              {field.render({ field, controllerField, fieldState, form: methods })}
            </Form.Item>
          );
        }

        if (field.type === 'select') {
          return (
            <Form.Item {...formItemProps}>
              <Select
                {...controllerField}
                allowClear
                aria-label={field.label || field.placeholder}
                mode={field.mode}
                options={field.options}
                placeholder={field.placeholder || '선택'}
                style={widthStyle}
              />
            </Form.Item>
          );
        }

        if (field.type === 'date') {
          return (
            <Form.Item {...formItemProps}>
              <DatePicker
                {...controllerField}
                aria-label={field.label || field.placeholder}
                format={field.format || 'YYYY-MM-DD'}
                placeholder={field.placeholder || '날짜 선택'}
                style={widthStyle}
              />
            </Form.Item>
          );
        }

        if (field.type === 'dateRange') {
          return (
            <Form.Item {...formItemProps}>
              <RangePicker
                {...controllerField}
                aria-label={field.label || field.placeholder}
                format={field.format || 'YYYY-MM-DD'}
                style={{ width: field.width || 260 }}
              />
            </Form.Item>
          );
        }

        if (field.type === 'checkbox') {
          return (
            <Form.Item {...formItemProps}>
              <Checkbox
                checked={Boolean(controllerField.value)}
                name={controllerField.name}
                ref={controllerField.ref}
                onBlur={controllerField.onBlur}
                onChange={(event) => controllerField.onChange(event.target.checked)}
              >
                {field.text}
              </Checkbox>
            </Form.Item>
          );
        }

        if (field.type === 'checkboxGroup') {
          return (
            <Form.Item {...formItemProps}>
              <Checkbox.Group
                name={controllerField.name}
                options={field.options}
                value={controllerField.value || []}
                onBlur={controllerField.onBlur}
                onChange={controllerField.onChange}
              />
            </Form.Item>
          );
        }

        if (field.type === 'number') {
          return (
            <Form.Item {...formItemProps}>
              <InputNumber
                {...controllerField}
                aria-label={field.label || field.placeholder}
                placeholder={field.placeholder || '입력'}
                style={widthStyle}
              />
            </Form.Item>
          );
        }

        return (
          <Form.Item {...formItemProps}>
            <Input
              {...controllerField}
              value={controllerField.value ?? ''}
              allowClear
              aria-label={field.label || field.placeholder}
              placeholder={field.placeholder || '입력'}
              style={widthStyle}
            />
          </Form.Item>
        );
      }}
    />
  );
}
