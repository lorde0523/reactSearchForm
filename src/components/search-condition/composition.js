import { Children, isValidElement } from 'react';

function fieldFromElement(element) {
  if (element.props.field) return element.props.field;
  const { children, ...props } = element.props;
  return { ...props, type: element.type.fieldType };
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
