import { Children, useContext } from 'react';
import { Col, Row, Space } from 'antd';
import { useFormContext, useWatch } from 'react-hook-form';
import SearchGroup from './SearchGroup';
import {
  ConditionDisabledContext,
  DetailVisibilityContext,
  RowControlToggleContext,
} from '../model/SearchConditionContext';

function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(' ');
}

export default function SearchRow({
  label,
  required,
  detail,
  detailOpen,
  className,
  classNames = {},
  rowProps = {},
  labelColProps = {},
  contentRowProps = {},
  ungroupedColProps = {},
  fieldSpaceProps = {},
  children,
}) {
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
      align="top"
      hidden={detail && !isDetailOpen}
      wrap
      {...rowProps}
      className={joinClassNames(
        'condition-form__row',
        detail && !isDetailOpen && 'condition-form__row--hidden',
        rowProps.className,
        className,
        classNames.root,
      )}
    >
      <Col
        {...labelColProps}
        className={joinClassNames(
          'condition-form__row-label',
          labelColProps.className,
          classNames.label,
        )}
      >
        {label && (
          <span>
            {label}
            {required && <span aria-label="필수"> *</span>}
          </span>
        )}
      </Col>
      <RowControlToggleContext.Provider value={rowControlToggleName}>
        <ConditionDisabledContext.Provider value={rowDisabled}>
          <Row
            align="top"
            wrap
            {...contentRowProps}
            className={joinClassNames(
              'condition-form__row-content',
              contentRowProps.className,
              classNames.content,
            )}
          >
            {fields.length > 0 && (
              <Col
                {...ungroupedColProps}
                className={joinClassNames(
                  'condition-form__ungrouped-fields',
                  ungroupedColProps.className,
                  classNames.ungrouped,
                )}
              >
                <Space align="start" size={8} wrap {...fieldSpaceProps}>{fields}</Space>
              </Col>
            )}
            {groups}
          </Row>
        </ConditionDisabledContext.Provider>
      </RowControlToggleContext.Provider>
    </Row>
  );
}

SearchRow.conditionKind = 'row';
