import { Space, Typography } from 'antd';

export default function SearchGroup({ label, children }) {
  return (
    <div className="condition-group">
      <div className="condition-group__label">
        <Typography.Text>{label}</Typography.Text>
      </div>
      <div className="condition-group__fields">
        <Space align="start" size={8} wrap>{children}</Space>
      </div>
    </div>
  );
}

SearchGroup.conditionKind = 'group';
