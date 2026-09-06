import { useContext } from 'react';
import { Typography } from 'antd';
import { useFormContext, useWatch } from 'react-hook-form';
import { flattenConditionChildren } from '../model/composition';
import useSearchRowLayout from '../hooks/useSearchRowLayout';
import {
  ConditionDisabledContext,
  DetailVisibilityContext,
} from '../model/SearchConditionContext';

export default function SearchRow({
  label, required, detail, detailOpen, children,
  className, style, fullWidth = false, labelPlacement = 'auto',
}) {
  const { control } = useFormContext();
  const contextDetailOpen = useContext(DetailVisibilityContext);
  const isDetailOpen = detailOpen ?? contextDetailOpen;
  const hidden = Boolean(detail && !isDetailOpen);
  const { rowRef, labelRef, contentRef, placement } = useSearchRowLayout(labelPlacement, hidden);
  const childItems = flattenConditionChildren(children);
  const groups = childItems.filter((child) => child.type?.conditionKind === 'group');
  const fields = childItems.filter((child) => child.type?.conditionKind !== 'group');
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
    <div
      ref={rowRef}
      className={['flex-group condition-row', hidden && 'condition-row--hidden', className].filter(Boolean).join(' ')}
      style={style}
      hidden={hidden}
      data-label-placement={placement}
      data-label-mode={labelPlacement}
      data-full-width={fullWidth || undefined}
      data-has-label={Boolean(label || required)}
    >
      <div ref={labelRef} className="category-name condition-row__label">
        {label && <Typography.Text strong>{label}</Typography.Text>}
        {required && <span className="required-mark" aria-label="필수">*</span>}
      </div>
      <ConditionDisabledContext.Provider value={rowDisabled}>
        <div ref={contentRef} className="category-list condition-row__groups">
          {fields.length > 0 && (
            <div className="category-item condition-group condition-group--ungrouped">
              <div className="condition-group__fields">{fields}</div>
            </div>
          )}
          {groups}
        </div>
      </ConditionDisabledContext.Provider>
    </div>
  );
}

SearchRow.conditionKind = 'row';
