import { describe, expect, it, vi } from 'vitest';
import { getCustomChangeValue, getCustomComponentProps } from './CustomField';

describe('CustomField component adapter', () => {
  it('조회조건 전용 props를 제외하고 커스텀 컴포넌트 props를 그대로 전달한다', () => {
    const api = vi.fn();
    const params = { groupCode: 'STATUS' };

    expect(getCustomComponentProps({
      activeTabKey: 'order',
      api,
      component: vi.fn(),
      defaultValue: [],
      disabled: true,
      label: '공통 코드',
      name: 'sharedCodes',
      onChange: vi.fn(),
      params,
      rules: { required: true },
      type: 'custom',
    })).toEqual({
      activeTabKey: 'order',
      api,
      params,
    });
  });

  it('기본적으로 첫 번째 변경 인자를 값으로 사용한다', () => {
    const selected = [{ label: '진행 중', value: 'active' }];
    expect(getCustomChangeValue({}, [selected, { source: 'user' }])).toBe(selected);
  });

  it('getValueFromChange로 커스텀 변경 인자에서 값을 추출할 수 있다', () => {
    const selected = [{ label: '진행 중', value: 'active' }];
    const field = {
      getValueFromChange: (event) => event.selectedItems,
    };

    expect(getCustomChangeValue(field, [{ selectedItems: selected }])).toBe(selected);
  });
});
