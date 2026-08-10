import { Col, Space, Typography } from 'antd';

export default function SearchGroup({ label, children }) {
  return (
    <Col className="category-item condition-group" flex="none">
      <div className="condition-group__label">
        <Typography.Text>{label}</Typography.Text>
      </div>
      <div className="condition-group__fields">
        <Space align="start" size={8} wrap>{children}</Space>
      </div>
    </Col>
  );
}

SearchGroup.conditionKind = 'group';
