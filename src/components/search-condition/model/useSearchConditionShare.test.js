import { describe, expect, it, vi } from 'vitest';
import { applySharedValues, pickSharedValues } from './useSearchConditionShare';

describe('pickSharedValues', () => {
  it('공유 대상으로 지정한 필드만 추출한다', () => {
    expect(pickSharedValues(
      { keyword: '고객', status: 'active', tabOnlyValue: '제외' },
      ['keyword', 'status'],
    )).toEqual({ keyword: '고객', status: 'active' });
  });

  it('필드 목록을 생략하면 현재 폼값 전체를 공유한다', () => {
    expect(pickSharedValues({ keyword: '고객', status: 'active' })).toEqual({
      keyword: '고객',
      status: 'active',
    });
  });
});

describe('applySharedValues', () => {
  it('공유값을 기존 폼의 필드 단위로 적용한다', () => {
    const setValue = vi.fn();

    applySharedValues({ setValue }, { keyword: '세빛상사', status: 'active' });

    expect(setValue).toHaveBeenNthCalledWith(1, 'keyword', '세빛상사', {
      shouldDirty: true,
      shouldValidate: false,
    });
    expect(setValue).toHaveBeenNthCalledWith(2, 'status', 'active', {
      shouldDirty: true,
      shouldValidate: false,
    });
  });
});
