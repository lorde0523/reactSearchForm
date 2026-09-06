import { Form } from 'antd';
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
      layout="horizontal"
    >
      <div className="condition-group__fields">{children}</div>
    </Form.Item>
  );
}

function ToggleableGroup({ className, label, toggle, children }) {
  const { control } = useFormContext();
  const parentDisabled = useContext(ConditionDisabledContext);
  const enabled = useWatch({ control, name: toggle.name });
  const controlsRow = Boolean(toggle.controlRow);

  return (
    <>
      <div className="condition-group__toggle">
        <ConditionDisabledContext.Provider value={controlsRow ? false : parentDisabled}>
          <CheckboxField field={toggle} />
        </ConditionDisabledContext.Provider>
      </div>
      <div className="condition-group__body">
        <ConditionDisabledContext.Provider value={parentDisabled || !Boolean(enabled)}>
          <GroupFormItem className={className} label={label}>{children}</GroupFormItem>
        </ConditionDisabledContext.Provider>
      </div>
    </>
  );
}

export default function SearchGroup({ label, className, groupClassName, style, toggle, children }) {
  const toggleField = createToggleField(toggle, label);

  return (
    <div
      className={[
        'category-item condition-group condition-group--labeled',
        groupClassName,
      ].filter(Boolean).join(' ')}
      style={style}
    >
      <div className="condition-group__row">
        {toggleField ? (
          <ToggleableGroup className={className} label={label} toggle={toggleField}>
            {children}
          </ToggleableGroup>
        ) : (
          <div className="condition-group__body">
            <GroupFormItem className={className} label={label}>{children}</GroupFormItem>
          </div>
        )}
      </div>
    </div>
  );
}

SearchGroup.conditionKind = 'group';
