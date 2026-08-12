import { Children, isValidElement } from 'react';

const RUNTIME_FIELD_PROPS = new Set([
  'className',
  'dependencies',
  'disabled',
  'formItemClassName',
  'formItemStyle',
  'onChange',
  'render',
  'rules',
  'style',
  'width',
]);

const RUNTIME_ROW_PROPS = new Set([
  'className',
  'classNames',
  'contentRowProps',
  'fieldSpaceProps',
  'labelColProps',
  'rowProps',
  'ungroupedColProps',
]);

const RUNTIME_GROUP_PROPS = new Set([
  'className',
  'classNames',
  'colProps',
  'fieldSpaceProps',
  'fieldsColProps',
  'groupClassName',
  'labelColProps',
  'rowProps',
  'toggleColProps',
]);

function omitProps(props, omittedKeys) {
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => !omittedKeys.has(key)),
  );
}

function createFieldSchema(props, type) {
  return Object.fromEntries(
    Object.entries({ ...props, type })
      .filter(([key]) => !RUNTIME_FIELD_PROPS.has(key)),
  );
}

export function createToggleField(toggle, label) {
  if (!toggle) return undefined;
  if (!toggle.name) throw new Error('SearchGroup의 toggle에는 name이 필요합니다.');

  return {
    defaultValue: false,
    hideFalsyInPreview: true,
    includeFalsy: true,
    label: `${label} 사용`,
    ...toggle,
    type: 'checkbox',
  };
}

function fieldFromElement(element) {
  const { children, field: suppliedField, ...elementProps } = element.props;
  const props = { ...elementProps, ...(suppliedField || {}) };
  const type = element.type.getFieldType?.(props) || props.type || element.type.fieldType;
  return createFieldSchema(props, type);
}

export function createRowsFromChildren(children) {
  const rows = [];

  const visit = (nodes, currentRow, currentGroup) => {
    Children.forEach(nodes, (node) => {
      if (!isValidElement(node)) return;

      const kind = node.type.conditionKind;
      if (kind === 'row') {
        const { children: rowChildren, toggle: ignoredRowToggle, ...rowProps } = node.props;
        void ignoredRowToggle;
        const row = {
          ...omitProps(rowProps, RUNTIME_ROW_PROPS),
          key: rowProps.rowKey || rowProps.label,
          fields: [],
          groups: [],
        };
        rows.push(row);
        visit(rowChildren, row, null);
        return;
      }

      if (kind === 'group' && currentRow) {
        const { children: groupChildren, toggle, ...groupProps } = node.props;
        const toggleField = createToggleField(toggle, groupProps.label);
        const group = {
          ...omitProps(groupProps, RUNTIME_GROUP_PROPS),
          controlsRow: Boolean(toggle?.controlRow),
          key: groupProps.groupKey || groupProps.label,
          fields: toggleField ? [createFieldSchema(toggleField, 'checkbox')] : [],
          toggleName: toggleField?.name,
        };
        if (group.controlsRow) {
          if (currentRow.controlToggleName) {
            throw new Error('한 SearchRow에는 controlRow가 true인 SearchGroup을 하나만 사용할 수 있습니다.');
          }
          currentRow.controlToggleName = toggleField.name;
        }
        currentRow.groups.push(group);
        visit(groupChildren, currentRow, group);
        return;
      }

      if (node.type.fieldType && currentRow) {
        const field = fieldFromElement(node);
        if (currentGroup) currentGroup.fields.push(field);
        else currentRow.fields.push(field);
        return;
      }

      if (node.props.children) visit(node.props.children, currentRow, currentGroup);
    });
  };

  visit(children, null, null);
  return rows;
}
