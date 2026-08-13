import { Children, useContext } from 'react';
import { Col, Row, Space, Typography } from 'antd';
import { useFormContext, useWatch } from 'react-hook-form';
import SearchGroup from './SearchGroup';
import {
  ConditionDisabledContext,
  DetailVisibilityContext,
} from '../model/SearchConditionContext';

export default function SearchRow({ label, required, detail, detailOpen, children }) {
  const { control } = useFormContext();
  const contextDetailOpen = useContext(DetailVisibilityContext);
  const isDetailOpen = detailOpen ?? contextDetailOpen;
  const childItems = Children.toArray(children);
  const groups = childItems.filter((child) => child.type === SearchGroup);
  const fields = childItems.filter((child) => child.type !== SearchGroup);
  const rowControlGroups = groups.filter((group) => group.props.toggle?.controlRow);

  if (rowControlGroups.length > 1) {
    throw new Error('한 SearchRow에는 controlRow가 true인 SearchGroup을 하나만 사용할 수 있습니다.');
  }

  const rowControlToggleName = rowControlGroups[0]?.props.toggle?.name;
  const rowEnabled = useWatch({
    control,
    disabled: !rowControlToggleName,
    name: rowControlToggleName,
  });
  const rowDisabled = Boolean(rowControlToggleName) && !Boolean(rowEnabled);

  return (
    <Row
      align="middle"
      className={`flex-group condition-row${detail && !isDetailOpen ? ' condition-row--hidden' : ''}`}
      wrap={false}
    >
      <Col className="category-name condition-row__label" flex="112px">
        {label && <Typography.Text strong>{label}</Typography.Text>}
        {required && <span className="required-mark" aria-label="필수">*</span>}
      </Col>
      <ConditionDisabledContext.Provider value={rowDisabled}>
        <Row className="category-list condition-row__groups" align="middle" wrap>
          {fields.length > 0 && (
            <Col className="category-item condition-group condition-group--ungrouped" flex="none">
              <Space align="start" size={8} wrap>{fields}</Space>
            </Col>
          )}
          {groups}
        </Row>
      </ConditionDisabledContext.Provider>
    </Row>
  );
}

SearchRow.conditionKind = 'row';
