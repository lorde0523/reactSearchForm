import { describe, expect, it, vi } from 'vitest';
import { getFieldWidth, resolveField, resolveFieldDisabled } from './ControlledField';

describe('resolveFieldDisabled', () => {
  it('boolean disabled를 그대로 적용한다', () => {
    expect(resolveFieldDisabled({ name: 'keyword', disabled: true }, {}, [])).toBe(true);
    expect(resolveFieldDisabled({ name: 'keyword', disabled: false }, {}, [])).toBe(false);
  });

  it('함수형 disabled에 변경 후 전체 폼값과 의존값을 전달한다', () => {
    const getValues = vi.fn(() => ({ dateType: undefined }));
    const form = { getValues };
    const disabled = vi.fn(({ values }) => !values.dateType);

    expect(resolveFieldDisabled(
      { name: 'period', disabled },
      form,
      [undefined],
    )).toBe(true);
    expect(disabled).toHaveBeenCalledWith(expect.objectContaining({
      dependencyValues: [undefined],
      name: 'period',
      values: { dateType: undefined },
    }));
  });

  it('그룹이 비활성화되면 필드 설정과 관계없이 비활성화한다', () => {
    expect(resolveFieldDisabled(
      { name: 'keyword', disabled: false },
      {},
      [],
      true,
    )).toBe(true);
  });

  it('기본 width와 전달받은 style을 병합하고 style을 우선한다', () => {
    expect(getFieldWidth({
      width: 160,
      style: { color: 'red', width: 240 },
    })).toEqual({
      color: 'red',
      width: 240,
    });
  });
});

describe('resolveField', () => {
  it('컴포넌트 props와 field 설정을 병합하고 field 설정을 우선한다', () => {
    expect(resolveField(
      { label: '필드 라벨', width: 200 },
      { name: 'keyword', width: 160 },
      'text',
    )).toEqual({
      label: '필드 라벨',
      name: 'keyword',
      type: 'text',
      width: 200,
    });
  });
});
