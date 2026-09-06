import React from 'react';
import { describe, expect, it } from 'vitest';
import SearchGroup from '../components/SearchGroup';
import SearchRow from '../components/SearchRow';
import SearchRowFlow from '../components/SearchRowFlow';
import { CheckboxField, PeriodPickerField, SelectField, TextField } from '../fields';
import { createConditionSnapshot } from './conditionUtils';
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
      expect.objectContaining({
        hideFalsyInPreview: true,
        includeFalsy: true,
        name: 'urgent',
        type: 'checkbox',
      }),
    ]);
    expect(rows[0].groups[1].fields[0]).toMatchObject({
      name: 'weekRange',
      picker: 'week',
      range: true,
      type: 'weekRange',
    });
  });

  it('CheckboxField의 미체크값 저장과 미리보기 숨김을 기본으로 적용한다', () => {
    const children = (
      <SearchRow rowKey="checkbox" label="체크 조건">
        <CheckboxField name="enabled" label="사용 여부" />
        <CheckboxField
          name="visibleUnchecked"
          label="미체크 표시"
          hideFalsyInPreview={false}
          includeFalsy={false}
        />
      </SearchRow>
    );

    const [row] = createRowsFromChildren(children);

    expect(row.fields[0]).toMatchObject({
      hideFalsyInPreview: true,
      includeFalsy: true,
    });
    expect(row.fields[1]).toMatchObject({
      hideFalsyInPreview: false,
      includeFalsy: false,
    });

    expect(createConditionSnapshot([row], {
      enabled: false,
      visibleUnchecked: false,
    })).toEqual({
      values: { enabled: false },
      preview: [],
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


describe('layout-independent composition', () => {
  it('Flow와 Fragment를 추가해도 메타데이터와 저장 결과가 같다', () => {
    const children = [
      <SearchRow key="a" rowKey="a" label="첫째">
        <TextField name="keyword" label="검색어" />
      </SearchRow>,
      <SearchRow key="b" rowKey="b" label="둘째" detail>
        <SearchGroup groupKey="status" label="상태" toggle={{ name: 'useStatus', controlRow: true }}>
          <TextField name="status" label="진행 상태" />
        </SearchGroup>
      </SearchRow>,
    ];
    const original = createRowsFromChildren(children);
    const wrapped = createRowsFromChildren(
      <SearchRowFlow gap={24} className="publisher-grid" style={{ display: 'grid' }}>
        <>{children}</>
      </SearchRowFlow>,
    );
    expect(wrapped).toEqual(original);
    for (const useStatus of [true, false]) {
      const values = { keyword: '고객', status: '진행', useStatus };
      expect(createConditionSnapshot(wrapped, values)).toEqual(createConditionSnapshot(original, values));
    }
  });

  it('행과 그룹의 배치 props를 저장 메타데이터에서 제외한다', () => {
    const plain = <SearchRow rowKey="row" label="조건"><SearchGroup label="그룹"><TextField name="q" /></SearchGroup></SearchRow>;
    const styled = (
      <SearchRow rowKey="row" label="조건" fullWidth labelPlacement="stacked" className="custom" style={{ gap: 24 }} detailOpen>
        <SearchGroup label="그룹" className="item" groupClassName="group" style={{ padding: 8 }}>
          <TextField name="q" />
        </SearchGroup>
      </SearchRow>
    );
    expect(createRowsFromChildren(styled)).toEqual(createRowsFromChildren(plain));
  });
});
