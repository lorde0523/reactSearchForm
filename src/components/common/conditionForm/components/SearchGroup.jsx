import { Col, Form, Row, Space } from 'antd';
import { useContext } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { CheckboxField } from '../fields';
import { ConditionDisabledContext } from '../model/SearchConditionContext';
import { createToggleField } from '../model/composition';

function GroupFormItem({ className, label, children }) {
  return (
    <Form.Item
      className={['condition-group__form-item', className].filter(Boolean).join(' ')}
      colon={false}
      label={label}
      labelCol={{ flex: '68px' }}
      layout="horizontal"
      wrapperCol={{ flex: 'auto' }}
    >
      <Space align="start" size={8} wrap>{children}</Space>
    </Form.Item>
  );
}

function ToggleableGroup({ className, label, toggle, children }) {
  const { control } = useFormContext();
  const parentDisabled = useContext(ConditionDisabledContext);
  const enabled = useWatch({ control, name: toggle.name });

  return (
    <>
      <Col className="condition-group__toggle" flex="none">
        <CheckboxField field={toggle} />
      </Col>
      <Col className="condition-group__body" flex="auto">
        <ConditionDisabledContext.Provider value={parentDisabled || !Boolean(enabled)}>
          <GroupFormItem className={className} label={label}>{children}</GroupFormItem>
        </ConditionDisabledContext.Provider>
      </Col>
    </>
  );
}

export default function SearchGroup({ label, className, groupClassName, toggle, children }) {
  const toggleField = createToggleField(toggle, label);

  return (
    <Col
      className={[
        'category-item condition-group condition-group--labeled',
        groupClassName,
      ].filter(Boolean).join(' ')}
      flex="none"
    >
      <Row className="condition-group__row" align="top" gutter={8} wrap={false}>
        {toggleField ? (
          <ToggleableGroup className={className} label={label} toggle={toggleField}>
            {children}
          </ToggleableGroup>
        ) : (
          <Col className="condition-group__body" flex="auto">
            <GroupFormItem className={className} label={label}>{children}</GroupFormItem>
          </Col>
        )}
      </Row>
    </Col>
  );
}

SearchGroup.conditionKind = 'group';
