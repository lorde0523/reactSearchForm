import { Children, useContext } from 'react';
import { Col, Row, Space, Typography } from 'antd';
import { useFormContext, useWatch } from 'react-hook-form';
import { CheckboxField } from '../fields';
import SearchGroup from './SearchGroup';
import {
  ConditionDisabledContext,
  DetailVisibilityContext,
} from '../model/SearchConditionContext';
import { createToggleField } from '../model/composition';

export default function SearchRow({ label, required, detail, detailOpen, toggle, children }) {
  const { control } = useFormContext();
  const contextDetailOpen = useContext(DetailVisibilityContext);
  const isDetailOpen = detailOpen ?? contextDetailOpen;
  const toggleField = createToggleField(toggle, label);
  const enabled = useWatch({
    control,
    disabled: !toggleField,
    name: toggleField?.name,
  });
  const rowDisabled = Boolean(toggleField) && !Boolean(enabled);
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
        {toggleField && (
          <span className="condition-row__toggle">
            <CheckboxField field={toggleField} />
          </span>
        )}
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
