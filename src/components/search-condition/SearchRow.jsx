import { Children, useContext } from 'react';
import { Col, Row, Space, Typography } from 'antd';
import SearchGroup from './SearchGroup';
import { DetailVisibilityContext } from './SearchConditionContext';

export default function SearchRow({ label, required, detail, detailOpen, children }) {
  const contextDetailOpen = useContext(DetailVisibilityContext);
  const isDetailOpen = detailOpen ?? contextDetailOpen;
  const childItems = Children.toArray(children);
  const groups = childItems.filter((child) => child.type === SearchGroup);
  const fields = childItems.filter((child) => child.type !== SearchGroup);

  return (
    <Row
      align="middle"
      className={`flex-group condition-row${detail && !isDetailOpen ? ' condition-row--hidden' : ''}`}
      wrap={false}
    >
      <Col className="category-name condition-row__label" flex="112px">
        <Typography.Text strong>{label}</Typography.Text>
        {required && <span className="required-mark" aria-label="필수">*</span>}
      </Col>
      <Row className="category-list condition-row__groups" align="middle" wrap>
        {fields.length > 0 && (
          <Col className="category-item condition-group condition-group--ungrouped" flex="none">
            <Space align="start" size={8} wrap>{fields}</Space>
          </Col>
        )}
        {groups}
      </Row>
    </Row>
  );
}

SearchRow.conditionKind = 'row';
