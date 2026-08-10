import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import {
  buildDefaultValues,
  createConditionSnapshot,
  hydrateSavedValues,
} from './conditionUtils';

const rows = [
  {
    key: 'basic',
    label: '기본 조건',
    groups: [
      {
        key: 'period',
        label: '조회 기간',
        fields: [
          { name: 'keyword', label: '검색어', type: 'text' },
          { name: 'period', label: '기간', type: 'dateRange' },
        ],
      },
      {
        key: 'status',
        label: '상태',
        fields: [
          {
            name: 'status',
            label: '진행 상태',
            type: 'select',
            options: [{ label: '진행 중', value: 'active' }],
          },
          { name: 'urgent', label: '긴급', type: 'checkbox', defaultValue: false },
        ],
      },
    ],
  },
];

describe('conditionUtils', () => {
  it('입력된 값만 직렬화하고 라벨 계층의 미리보기를 만든다', () => {
    const snapshot = createConditionSnapshot(rows, {
      keyword: '테스트',
      period: [dayjs('2026-08-01'), dayjs('2026-08-10')],
      status: 'active',
      urgent: false,
    });

    expect(snapshot.values).toEqual({
      keyword: '테스트',
      period: ['2026-08-01', '2026-08-10'],
      status: 'active',
    });
    expect(snapshot.preview[0].label).toBe('기본 조건');
    expect(snapshot.preview[0].groups[1].fields[0]).toEqual({
      name: 'status',
      label: '진행 상태',
      value: '진행 중',
    });
  });

  it('빈 값만 있는 그룹과 row를 제외한다', () => {
    expect(createConditionSnapshot(rows, { keyword: '  ', urgent: false })).toEqual({
      values: {},
      preview: [],
    });
  });

  it('스키마 기본값과 페이지 기본값을 병합한다', () => {
    expect(buildDefaultValues(rows, { keyword: '페이지 값' })).toEqual({
      urgent: false,
      keyword: '페이지 값',
    });
  });

  it('저장된 날짜 값을 RHF 입력 값으로 복원한다', () => {
    const hydrated = hydrateSavedValues(
      rows,
      { keyword: '복원', period: ['2026-07-01', '2026-07-31'] },
      { urgent: false },
    );

    expect(hydrated.keyword).toBe('복원');
    expect(hydrated.urgent).toBe(false);
    expect(hydrated.period[0].format('YYYY-MM-DD')).toBe('2026-07-01');
  });
});
