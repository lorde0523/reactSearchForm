import { Col, Row, Space } from 'antd';
import { useContext } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { CheckboxField } from '../fields';
import {
  ConditionDisabledContext,
  RowControlToggleContext,
} from '../model/SearchConditionContext';
import { createToggleField } from '../model/composition';

function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(' ');
}

function GroupContent({
  label,
  classNames,
  labelColProps,
  fieldsColProps,
  fieldSpaceProps,
  children,
}) {
  return (
    <>
      {label && (
        <Col
          {...labelColProps}
          className={joinClassNames(
            'condition-form__group-label',
            labelColProps.className,
            classNames.label,
          )}
        >
          <span>{label}</span>
        </Col>
      )}
      <Col
        {...fieldsColProps}
        className={joinClassNames(
          'condition-form__group-fields',
          fieldsColProps.className,
          classNames.fields,
        )}
      >
        <Space align="start" size={8} wrap {...fieldSpaceProps}>{children}</Space>
      </Col>
    </>
  );
}

function ToggleableGroup({
  label,
  toggle,
  classNames,
  toggleColProps,
  labelColProps,
  fieldsColProps,
  fieldSpaceProps,
  children,
}) {
  const { control } = useFormContext();
  const parentDisabled = useContext(ConditionDisabledContext);
  const rowControlToggleName = useContext(RowControlToggleContext);
  const enabled = useWatch({ control, name: toggle.name });
  const controlsRow = toggle.name === rowControlToggleName;

  return (
    <>
      <Col
        {...toggleColProps}
        className={joinClassNames(
          'condition-form__group-toggle',
          toggleColProps.className,
          classNames.toggle,
        )}
      >
        <ConditionDisabledContext.Provider value={controlsRow ? false : parentDisabled}>
          <CheckboxField field={toggle} />
        </ConditionDisabledContext.Provider>
      </Col>
      <ConditionDisabledContext.Provider value={parentDisabled || !Boolean(enabled)}>
        <GroupContent
          classNames={classNames}
          fieldSpaceProps={fieldSpaceProps}
          fieldsColProps={fieldsColProps}
          label={label}
          labelColProps={labelColProps}
        >
          {children}
        </GroupContent>
      </ConditionDisabledContext.Provider>
    </>
  );
}

export default function SearchGroup({
  label,
  className,
  classNames = {},
  toggle,
  colProps = {},
  rowProps = {},
  toggleColProps = {},
  labelColProps = {},
  fieldsColProps = {},
  fieldSpaceProps = {},
  children,
}) {
  const toggleField = createToggleField(toggle, label);

  return (
    <Col
      {...colProps}
      className={joinClassNames(
        'condition-form__group',
        colProps.className,
        className,
        classNames.root,
      )}
    >
      <Row
        align="top"
        wrap
        {...rowProps}
        className={joinClassNames(
          'condition-form__group-row',
          rowProps.className,
          classNames.row,
        )}
      >
        {toggleField ? (
          <ToggleableGroup
            classNames={classNames}
            fieldSpaceProps={fieldSpaceProps}
            fieldsColProps={fieldsColProps}
            label={label}
            labelColProps={labelColProps}
            toggle={toggleField}
            toggleColProps={toggleColProps}
          >
            {children}
          </ToggleableGroup>
        ) : (
          <GroupContent
            classNames={classNames}
            fieldSpaceProps={fieldSpaceProps}
            fieldsColProps={fieldsColProps}
            label={label}
            labelColProps={labelColProps}
          >
            {children}
          </GroupContent>
        )}
      </Row>
    </Col>
  );
}

SearchGroup.conditionKind = 'group';
