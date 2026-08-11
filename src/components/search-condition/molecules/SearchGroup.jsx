import { Col, Form, Space } from 'antd';

export default function SearchGroup({ label, children }) {
  return (
    <Col className="category-item condition-group condition-group--labeled" flex="none">
      <Form.Item
        className="condition-group__form-item"
        colon={false}
        label={label}
        labelCol={{ flex: '68px' }}
        layout="horizontal"
        wrapperCol={{ flex: 'auto' }}
      >
        <Space align="start" size={8} wrap>{children}</Space>
      </Form.Item>
    </Col>
  );
}

SearchGroup.conditionKind = 'group';
