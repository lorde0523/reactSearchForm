import React from 'react';
import { describe, expect, it } from 'vitest';
import SearchGroup from './SearchGroup';
import SearchRow from './SearchRow';
import { CheckboxField, SelectField, TextField } from './fields';
import { createRowsFromChildren } from './composition';

describe('createRowsFromChildren', () => {
  it('페이지가 전달한 JSX를 저장 메타데이터 구조로 변환한다', () => {
    const children = (
      <SearchRow rowKey="basic" label="기본 조건" required>
        <TextField name="keyword" label="검색어" placeholder="입력" />
        <SearchGroup groupKey="status" label="진행 상태">
          <SelectField
            name="status"
            label="진행 상태"
            options={[{ label: '진행 중', value: 'active' }]}
          />
          <CheckboxField name="urgent" label="긴급" text="긴급 건만" />
        </SearchGroup>
      </SearchRow>
    );

    const rows = createRowsFromChildren(children);

    expect(rows[0].key).toBe('basic');
    expect(rows[0].fields[0]).toMatchObject({ name: 'keyword', label: '검색어', type: 'text' });
    expect(rows[0].groups[0].key).toBe('status');
    expect(rows[0].groups[0].fields).toEqual([
      expect.objectContaining({ name: 'status', type: 'select' }),
      expect.objectContaining({ name: 'urgent', type: 'checkbox' }),
    ]);
  });
});
