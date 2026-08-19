import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import {
  buildDefaultValues,
  createConditionSnapshot,
  hydrateSavedValues,
  normalizeSavedValues,
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
  it('JSON 문자열과 이중 직렬화 문자열을 폼 값 객체로 정규화한다', () => {
    const values = { keyword: '테스트', urgent: true };

    expect(normalizeSavedValues(JSON.stringify(values))).toEqual(values);
    expect(normalizeSavedValues(JSON.stringify(JSON.stringify(values)))).toEqual(values);
  });

  it('문자열을 Object.entries로 순회하지 않고 잘못된 값은 빈 객체로 처리한다', () => {
    expect(normalizeSavedValues('not-json')).toEqual({});
    expect(normalizeSavedValues(['keyword', '테스트'])).toEqual({});
    expect(hydrateSavedValues(rows, 'not-json', { urgent: false }))
      .toEqual({ urgent: false });
  });

  it('stores custom multi-select objects and uses their labels in the preview', () => {
    const customRows = [{
      key: 'codes',
      label: 'Code conditions',
      fields: [{ name: 'sharedCodes', label: 'Shared codes', type: 'custom' }],
      groups: [],
    }];
    const selected = [
      { disabled: false, key: 'A', label: 'Active', title: 'Active', value: 'active' },
      { disabled: false, key: 'B', label: 'Done', title: 'Done', value: 'done' },
    ];

    const snapshot = createConditionSnapshot(customRows, { sharedCodes: selected });

    expect(snapshot.values.sharedCodes).toEqual(selected);
    expect(snapshot.preview[0].fields[0].value).toBe('Active / Done');
    expect(snapshot.preview[0].fields[0].previewItems).toEqual(['Active', 'Done']);
    expect(hydrateSavedValues(customRows, snapshot.values).sharedCodes).toEqual(selected);
  });

  it('커스텀 필드의 단일 선택 객체는 저장 모달에 label만 표시한다', () => {
    const customRows = [{
      key: 'code',
      label: '코드 조건',
      fields: [{ name: 'sharedCode', label: '공통 코드', type: 'custom' }],
      groups: [],
    }];
    const selected = {
      disabled: false,
      key: 'A',
      label: '진행 중',
      title: '진행 중',
      value: 'active',
    };

    const snapshot = createConditionSnapshot(customRows, { sharedCode: selected });

    expect(snapshot.values.sharedCode).toEqual(selected);
    expect(snapshot.preview[0].fields[0].value).toBe('진행 중');
  });

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
    expect(snapshot.preview[0].fields.map(({ name, value }) => ({ name, value }))).toEqual([
      { name: 'week', value: weekStart.format('YYYY-w[주차]') },
      {
        name: 'weekRange',
        value: `${weekStart.format('YYYY-w[주차]')} ~ ${weekEnd.format('YYYY-w[주차]')}`,
      },
      { name: 'month', value: '2026-08' },
      { name: 'monthRange', value: '2026-08 ~ 2026-10' },
      { name: 'year', value: '2026' },
      { name: 'yearRange', value: '2025 ~ 2027' },
    ]);

    const hydrated = hydrateSavedValues(pickerRows, snapshot.values);
    expect(hydrated.week.format('YYYYwo')).toBe(snapshot.values.week);
    expect(hydrated.month.format('YYYYMM')).toBe('202608');
    expect(hydrated.yearRange.map((value) => value.format('YYYY'))).toEqual(['2025', '2027']);
  });

  it('라디오, Switch, 자동완성, TextArea 값을 스냅샷으로 만든다', () => {
    const additionalRows = [
      {
        key: 'additional',
        label: '추가 필드',
        fields: [
          {
            name: 'priority',
            label: '우선순위',
            type: 'radioGroup',
            options: [{ label: '긴급', value: 'urgent' }],
          },
          {
            name: 'priorityButton',
            label: '우선순위 버튼',
            type: 'radioButtonGroup',
            options: [{ label: '일반', value: 'normal' }],
          },
          { name: 'includeClosed', label: '종료 건 포함', type: 'switch', checkedText: '포함' },
          {
            name: 'region',
            label: '지역',
            type: 'autoComplete',
            options: [{ label: '서울특별시', value: '서울' }],
          },
          { name: 'memoKeyword', label: '메모 검색어', type: 'textArea' },
        ],
        groups: [],
      },
    ];

    const snapshot = createConditionSnapshot(additionalRows, {
      priority: 'urgent',
      priorityButton: 'normal',
      includeClosed: true,
      region: '서울',
      memoKeyword: 'VIP 고객',
    });

    expect(snapshot.values).toEqual({
      priority: 'urgent',
      priorityButton: 'normal',
      includeClosed: true,
      region: '서울',
      memoKeyword: 'VIP 고객',
    });
    expect(snapshot.preview[0].fields.map(({ value }) => value)).toEqual([
      '긴급',
      '일반',
      '포함',
      '서울특별시',
      'VIP 고객',
    ]);
    expect(createConditionSnapshot(additionalRows, { includeClosed: false }).values).toEqual({});
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

  it('그룹 toggle이 꺼지면 내부 필드를 제외하고 false 상태만 저장한다', () => {
    const toggleRows = [
      {
        key: 'basic',
        label: '기본 조건',
        fields: [],
        groups: [
          {
            key: 'period',
            label: '조회 기간',
            toggleName: 'usePeriod',
            fields: [
              {
                name: 'usePeriod',
                label: '조회 기간 사용',
                type: 'checkbox',
                includeFalsy: true,
                hideFalsyInPreview: true,
                defaultValue: true,
                checkedText: '사용',
              },
              { name: 'dateType', label: '날짜 기준', type: 'text' },
            ],
          },
        ],
      },
    ];

    expect(createConditionSnapshot(toggleRows, {
      usePeriod: false,
      dateType: '등록일',
    })).toEqual({
      values: { usePeriod: false },
      preview: [],
    });

    expect(createConditionSnapshot(toggleRows, {
      usePeriod: true,
      dateType: '등록일',
    })).toEqual({
      values: { usePeriod: true, dateType: '등록일' },
      preview: [
        {
          key: 'basic-period',
          label: '조회 기간',
          fields: [
            {
              name: 'usePeriod',
              label: '조회 기간 사용',
              type: 'checkbox',
              value: '사용',
            },
            {
              name: 'dateType',
              label: '날짜 기준',
              type: 'text',
              value: '등록일',
            },
          ],
        },
      ],
    });

    expect(hydrateSavedValues(
      toggleRows,
      { usePeriod: false },
      { usePeriod: true },
    ).usePeriod).toBe(false);
  });

  it('controlRow 그룹 toggle이 꺼지면 해당 줄의 일반 필드와 모든 그룹을 제외한다', () => {
    const rowToggleRows = [
      {
        key: 'customer',
        label: '고객 조건',
        controlToggleName: 'useCustomerConditions',
        fields: [{ name: 'keyword', label: '검색어', type: 'text' }],
        groups: [
          {
            key: 'customerInfo',
            label: '고객 정보',
            controlsRow: true,
            toggleName: 'useCustomerConditions',
            fields: [
              {
                name: 'useCustomerConditions',
                label: '고객 조건 사용',
                type: 'checkbox',
                includeFalsy: true,
                hideFalsyInPreview: true,
                defaultValue: false,
                checkedText: '사용',
              },
              { name: 'customerName', label: '고객명', type: 'text' },
            ],
          },
        ],
      },
    ];

    expect(createConditionSnapshot(rowToggleRows, {
      useCustomerConditions: false,
      keyword: '숨김 검색어',
      customerName: '숨김 고객명',
    })).toEqual({
      values: { useCustomerConditions: false },
      preview: [],
    });

    const enabled = createConditionSnapshot(rowToggleRows, {
      useCustomerConditions: true,
      keyword: '검색어',
      customerName: '세빛상사',
    });

    expect(enabled.values).toEqual({
      useCustomerConditions: true,
      keyword: '검색어',
      customerName: '세빛상사',
    });
    expect(enabled.preview.map(({ label }) => label)).toEqual(['고객 조건', '고객 정보']);
  });

  it('SearchGroup 라벨이 없으면 저장 모달에 상위 SearchRow 라벨을 사용한다', () => {
    const rowsWithoutGroupLabel = [
      {
        key: 'technology',
        label: '기술 조건',
        fields: [],
        groups: [
          {
            key: 'technologyCodes',
            fields: [
              { name: 'techCd', label: '기술 코드', type: 'text' },
            ],
          },
          {
            key: 'detailTechnologyCodes',
            fields: [
              { name: 'detailTechCd', label: '상세 기술 코드', type: 'text' },
            ],
          },
        ],
      },
    ];

    const snapshot = createConditionSnapshot(rowsWithoutGroupLabel, {
      techCd: 'TECH01',
      detailTechCd: 'DETAIL01',
    });

    expect(snapshot.preview[0].label).toBe('기술 조건');
    expect(snapshot.preview).toHaveLength(1);
    expect(snapshot.preview[0].lines).toHaveLength(2);
    expect(snapshot.preview[0].lines.map((line) => line.fields[0].value)).toEqual([
      'TECH01',
      'DETAIL01',
    ]);
    expect(snapshot.preview[0].fields.map(({ value }) => value)).toEqual([
      'TECH01',
      'DETAIL01',
    ]);
  });
});
