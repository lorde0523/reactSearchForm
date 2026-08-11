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
    fields: [
      { name: 'keyword', label: '검색어', type: 'text' },
      { name: 'urgent', label: '긴급', type: 'checkbox', text: '긴급 건만', defaultValue: false },
    ],
    groups: [
      {
        key: 'period',
        label: '조회 기간',
        fields: [
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
          {
            name: 'channels',
            label: '알림 채널',
            type: 'checkboxGroup',
            defaultValue: [],
            options: [
              { label: 'SMS', value: 'sms' },
              { label: '이메일', value: 'email' },
            ],
          },
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
      channels: ['sms', 'email'],
    });

    expect(snapshot.values).toEqual({
      keyword: '테스트',
      period: ['2026-08-01', '2026-08-10'],
      status: 'active',
      channels: ['sms', 'email'],
    });
    expect(snapshot.preview[0].label).toBe('기본 조건');
    expect(snapshot.preview[1].label).toBe('조회 기간');
    expect(snapshot.preview[2].fields[0]).toEqual({
      name: 'status',
      label: '진행 상태',
      type: 'select',
      value: '진행 중',
    });
    expect(snapshot.preview[2].fields[1]).toEqual({
      name: 'channels',
      label: '알림 채널',
      type: 'checkboxGroup',
      value: 'SMS / 이메일',
    });
  });

  it('빈 값만 있는 그룹과 row를 제외한다', () => {
    expect(createConditionSnapshot(rows, { keyword: '  ', urgent: false })).toEqual({
      values: {},
      preview: [],
    });
  });

  it('단일 체크박스는 체크된 경우에만 문구를 미리보기에 포함한다', () => {
    const checked = createConditionSnapshot(rows, { urgent: true });
    const unchecked = createConditionSnapshot(rows, { urgent: false });

    expect(checked.values).toEqual({ urgent: true });
    expect(checked.preview[0].fields[0]).toEqual({
      name: 'urgent',
      label: '긴급',
      type: 'checkbox',
      value: '긴급 건만',
    });
    expect(unchecked.preview).toEqual([]);
  });

  it('스키마 기본값과 페이지 기본값을 병합한다', () => {
    expect(buildDefaultValues(rows, { keyword: '페이지 값' })).toEqual({
      urgent: false,
      channels: [],
      keyword: '페이지 값',
    });
  });

  it('서버 초기 날짜 문자열을 RHF 입력 값으로 변환한다', () => {
    const defaults = buildDefaultValues(rows, {
      keyword: '서버 값',
      period: ['2026-08-01', '2026-08-31'],
    });

    expect(defaults.keyword).toBe('서버 값');
    expect(defaults.period[0].format('YYYY-MM-DD')).toBe('2026-08-01');
    expect(defaults.period[1].format('YYYY-MM-DD')).toBe('2026-08-31');
  });

  it('필드 initialValue를 적용하고 폼 전체 초기값을 우선한다', () => {
    const rowsWithInitialValue = [
      {
        key: 'basic',
        label: '기본 조건',
        fields: [
          { name: 'keyword', type: 'text', initialValue: '필드 초기값' },
          { name: 'urgent', type: 'checkbox', defaultValue: false },
        ],
        groups: [],
      },
    ];

    expect(buildDefaultValues(rowsWithInitialValue)).toEqual({
      keyword: '필드 초기값',
      urgent: false,
    });
    expect(buildDefaultValues(rowsWithInitialValue, { keyword: '폼 전체 초기값' })).toEqual({
      keyword: '폼 전체 초기값',
      urgent: false,
    });
  });

  it('주차, 월, 연도 Picker 값을 지정 포맷으로 저장하고 복원한다', () => {
    const pickerRows = [
      {
        key: 'pickers',
        label: '날짜 조건',
        fields: [
          { name: 'week', label: '기준 주차', type: 'week' },
          { name: 'weekRange', label: '주차 범위', type: 'weekRange' },
          { name: 'month', label: '기준 월', type: 'month' },
          { name: 'monthRange', label: '월 범위', type: 'monthRange' },
          { name: 'year', label: '기준 연도', type: 'year' },
          { name: 'yearRange', label: '연도 범위', type: 'yearRange' },
        ],
        groups: [],
      },
    ];
    const weekStart = dayjs('2026-08-12');
    const weekEnd = dayjs('2026-08-26');

    const snapshot = createConditionSnapshot(pickerRows, {
      week: weekStart,
      weekRange: [weekStart, weekEnd],
      month: dayjs('2026-08-01'),
      monthRange: [dayjs('2026-08-01'), dayjs('2026-10-01')],
      year: dayjs('2026-01-01'),
      yearRange: [dayjs('2025-01-01'), dayjs('2027-01-01')],
    });

    expect(snapshot.values).toEqual({
      week: weekStart.format('YYYYwo'),
      weekRange: [weekStart.format('YYYYwo'), weekEnd.format('YYYYwo')],
      month: '202608',
      monthRange: ['202608', '202610'],
      year: '2026',
      yearRange: ['2025', '2027'],
    });

    const hydrated = hydrateSavedValues(pickerRows, snapshot.values);
    expect(hydrated.week.format('YYYYwo')).toBe(snapshot.values.week);
    expect(hydrated.month.format('YYYYMM')).toBe('202608');
    expect(hydrated.yearRange.map((value) => value.format('YYYY'))).toEqual(['2025', '2027']);
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
