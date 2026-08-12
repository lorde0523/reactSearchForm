import React from 'react';
import { describe, expect, it } from 'vitest';
import SearchGroup from '../components/SearchGroup';
import SearchRow from '../components/SearchRow';
import { CheckboxField, PeriodPickerField, SelectField, TextField } from '../fields';
import { createRowsFromChildren } from './composition';

describe('createRowsFromChildren', () => {
  it('페이지가 전달한 JSX를 저장 메타데이터 구조로 변환한다', () => {
    const children = (
      <SearchRow
        rowKey="basic"
        label="기본 조건"
        required
      >
        <TextField
          field={{ label: '검색어', name: 'keyword' }}
          placeholder="입력"
          rules={{ required: '필수값입니다.' }}
          style={{ width: 200 }}
        />
        <SearchGroup
          groupKey="status"
          label="진행 상태"
          className="status-form-item"
          toggle={{ name: 'useStatus', defaultValue: true, text: '사용' }}
        >
          <SelectField
            name="status"
            label="진행 상태"
            options={[{ label: '진행 중', value: 'active' }]}
          />
          <CheckboxField name="urgent" label="긴급" text="긴급 건만" />
        </SearchGroup>
        <SearchGroup groupKey="period" label="기간">
          <PeriodPickerField name="weekRange" label="주차 범위" picker="week" range />
        </SearchGroup>
      </SearchRow>
    );

    const rows = createRowsFromChildren(children);

    expect(rows[0].key).toBe('basic');
    expect(rows[0]).not.toHaveProperty('controlToggleName');
    expect(rows[0].fields[0]).toEqual({
      label: '검색어',
      name: 'keyword',
      placeholder: '입력',
      type: 'text',
    });
    expect(rows[0].groups[0].key).toBe('status');
    expect(rows[0].groups[0].toggleName).toBe('useStatus');
    expect(rows[0].groups[0]).not.toHaveProperty('className');
    expect(rows[0].groups[0].fields).toEqual([
      expect.objectContaining({
        defaultValue: true,
        hideFalsyInPreview: true,
        includeFalsy: true,
        name: 'useStatus',
        type: 'checkbox',
      }),
      expect.objectContaining({ name: 'status', type: 'select' }),
      expect.objectContaining({ name: 'urgent', type: 'checkbox' }),
    ]);
    expect(rows[0].groups[1].fields[0]).toMatchObject({
      name: 'weekRange',
      picker: 'week',
      range: true,
      type: 'weekRange',
    });
  });

  it('SearchGroup의 controlRow toggle로 라벨 없는 row의 두 그룹을 제어한다', () => {
    const children = (
      <SearchRow rowKey="customer">
        <SearchGroup
          groupKey="customerInfo"
          label="고객 정보"
          toggle={{
            name: 'useCustomerConditions',
            label: '고객 조건 사용 여부',
            text: '고객 조건 사용',
            controlRow: true,
            hideInPreview: true,
          }}
        >
          <TextField name="customerName" label="고객명" />
        </SearchGroup>
        <SearchGroup groupKey="channel" label="접수 채널">
          <SelectField name="channel" label="접수 채널" options={[]} />
        </SearchGroup>
      </SearchRow>
    );

    const rows = createRowsFromChildren(children);

    expect(rows[0].key).toBe('customer');
    expect(rows[0]).not.toHaveProperty('label');
    expect(rows[0].controlToggleName).toBe('useCustomerConditions');
    expect(rows[0].fields).toEqual([]);
    expect(rows[0].groups[0].controlsRow).toBe(true);
    expect(rows[0].groups[0].fields[0]).toMatchObject({
      controlRow: true,
      defaultValue: false,
      hideInPreview: true,
      name: 'useCustomerConditions',
      text: '고객 조건 사용',
    });
    expect(rows[0].groups[0]).toMatchObject({
      key: 'customerInfo',
      label: '고객 정보',
    });
    expect(rows[0].groups[1]).toMatchObject({
      key: 'channel',
      label: '접수 채널',
    });
  });
});
