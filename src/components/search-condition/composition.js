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

function createFieldSchema(props, type) {
  return Object.fromEntries(
    Object.entries({ ...props, type })
      .filter(([key]) => !RUNTIME_FIELD_PROPS.has(key)),
  );
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
        const { children: rowChildren, ...rowProps } = node.props;
        const row = {
          ...rowProps,
          key: rowProps.rowKey || rowProps.label,
          fields: [],
          groups: [],
        };
        rows.push(row);
        visit(rowChildren, row, null);
        return;
      }

      if (kind === 'group' && currentRow) {
        const { children: groupChildren, ...groupProps } = node.props;
        const group = {
          ...groupProps,
          key: groupProps.groupKey || groupProps.label,
          fields: [],
        };
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
