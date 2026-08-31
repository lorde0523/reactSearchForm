import { describe, expect, it, vi } from 'vitest';
import {
  applySharedValues,
  createTabTransferRequest,
  pickSharedValues,
} from './useSearchConditionShare';

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

describe('createTabTransferRequest', () => {
  it('대상 탭의 기존값을 유지하고 지정한 공유 필드만 출발 탭 값으로 덮어쓴다', () => {
    expect(createTabTransferRequest({
      fieldNames: ['keyword', 'status'],
      id: 1,
      sourceTab: 'order',
      sourceValues: {
        keyword: '새 검색어',
        orderOnly: '주문 전용',
        status: 'active',
      },
      targetTab: 'delivery',
      targetValues: {
        deliveryOnly: '배송 전용',
        keyword: '이전 검색어',
      },
    })).toEqual({
      id: 1,
      sourceTab: 'order',
      targetTab: 'delivery',
      values: {
        deliveryOnly: '배송 전용',
        keyword: '새 검색어',
        status: 'active',
      },
    });
  });

  it('공유 필드 목록을 생략하면 출발 탭의 전체 snapshot을 합친다', () => {
    expect(createTabTransferRequest({
      id: 2,
      sourceTab: 'order',
      sourceValues: { keyword: '', orderOnly: '주문 전용' },
      targetTab: 'delivery',
      targetValues: { deliveryOnly: '배송 전용' },
    }).values).toEqual({
      deliveryOnly: '배송 전용',
      keyword: '',
      orderOnly: '주문 전용',
    });
  });
});
