import { describe, expect, it, vi } from 'vitest';
import { resolveFieldDisabled } from './ControlledField';

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
});
