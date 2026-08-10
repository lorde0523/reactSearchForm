import { Children, useContext } from 'react';
import { Space, Typography } from 'antd';
import SearchGroup from './SearchGroup';
import { DetailVisibilityContext } from './SearchConditionContext';

export default function SearchRow({ label, required, detail, detailOpen, children }) {
  const contextDetailOpen = useContext(DetailVisibilityContext);
  const isDetailOpen = detailOpen ?? contextDetailOpen;
  const childItems = Children.toArray(children);
  const groups = childItems.filter((child) => child.type === SearchGroup);
  const fields = childItems.filter((child) => child.type !== SearchGroup);

  return (
    <div className={`condition-row${detail && !isDetailOpen ? ' condition-row--hidden' : ''}`}>
      <div className="condition-row__label">
        <Typography.Text strong>{label}</Typography.Text>
        {required && <span className="required-mark" aria-label="필수">*</span>}
      </div>
      <div className="condition-row__groups">
        {fields.length > 0 && (
          <div className="condition-group condition-group--ungrouped">
            <Space align="start" size={8} wrap>{fields}</Space>
          </div>
        )}
        {groups}
      </div>
    </div>
  );
}

SearchRow.conditionKind = 'row';
