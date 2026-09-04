import { describe, expect, it } from 'vitest';
import {
  haveSelectOptionsChanged,
  resolveSelectAutoValue,
} from './ChoiceFields';

const options = [
  { label: '첫 번째', value: 'first' },
  { label: '두 번째', value: 'second' },
];

describe('resolveSelectAutoValue', () => {
  it('값이 없으면 첫 번째 활성 옵션을 선택한다', () => {
    expect(resolveSelectAutoValue({
      autoSelectFirst: true,
      currentValue: undefined,
      options,
      optionsChanged: false,
      resetToFirstOnOptionsChange: false,
    })).toBe('first');
  });

  it('현재 값이 옵션에 있으면 유지한다', () => {
    expect(resolveSelectAutoValue({
      autoSelectFirst: true,
      currentValue: 'second',
      options,
      optionsChanged: true,
      resetToFirstOnOptionsChange: false,
    })).toBe('second');
  });

  it('현재 값이 새 옵션에 없으면 첫 번째 활성 옵션을 선택한다', () => {
    expect(resolveSelectAutoValue({
      autoSelectFirst: true,
      currentValue: 'removed',
      options: [{ label: '사용 불가', value: 'disabled', disabled: true }, ...options],
      optionsChanged: true,
      resetToFirstOnOptionsChange: false,
    })).toBe('first');
  });

  it('강제 변경 옵션이면 현재 값이 남아 있어도 첫 번째로 변경한다', () => {
    expect(resolveSelectAutoValue({
      autoSelectFirst: true,
      currentValue: 'second',
      options,
      optionsChanged: true,
      resetToFirstOnOptionsChange: true,
    })).toBe('first');
  });

  it('외부 복원값을 보호하는 동안에는 강제 변경 옵션보다 유효한 복원값을 우선한다', () => {
    expect(resolveSelectAutoValue({
      autoSelectFirst: true,
      currentValue: 'second',
      options,
      optionsChanged: true,
      preferCurrentValue: true,
      resetToFirstOnOptionsChange: true,
    })).toBe('second');
  });
});

describe('haveSelectOptionsChanged', () => {
  it('배열 인스턴스가 달라도 값과 disabled가 같으면 변경으로 보지 않는다', () => {
    expect(haveSelectOptionsChanged(
      [{ value: 'first', disabled: false }],
      [{ value: 'first', disabled: false }],
    )).toBe(false);
  });
});
