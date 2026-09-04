import { describe, expect, it, vi } from 'vitest';
import {
  commitPreparedRestore,
  createRestoreLevels,
  prepareFieldRestoreValues,
} from './conditionRestore';

function createRows(fields) {
  return [{ fields, groups: [], key: 'restore', label: '복원' }];
}

describe('condition restore coordinator', () => {
  it('필드 의존 순서대로 준비하고 앞 필드의 정규화 값을 뒤 필드에 전달한다', async () => {
    const calls = [];
    const rows = createRows([
      {
        name: 'parent',
        type: 'select',
        restore: {
          prepare: async ({ value }) => {
            calls.push(`parent:${value}`);
            return { nextValue: value.toUpperCase() };
          },
        },
      },
      {
        name: 'child',
        type: 'select',
        restore: {
          dependsOn: ['parent'],
          prepare: async ({ values }) => {
            calls.push(`child:${values.parent}`);
            return { options: [{ value: 'detail' }] };
          },
        },
      },
    ]);

    const prepared = await prepareFieldRestoreValues({
      externalFieldNames: ['parent', 'child'],
      rows,
      source: 'favorite',
      values: { child: 'detail', parent: 'group' },
    });

    expect(calls).toEqual(['parent:group', 'child:GROUP']);
    expect(prepared.values).toEqual({ child: 'detail', parent: 'GROUP' });
  });

  it('저장된 Select 값이 현재 옵션에 없으면 해당 필드만 빈 값으로 바꾼다', async () => {
    const prepared = await prepareFieldRestoreValues({
      externalFieldNames: ['status'],
      rows: createRows([{
        label: '진행 상태',
        name: 'status',
        options: [{ label: '진행 중', value: 'active' }],
        type: 'select',
      }]),
      source: 'favorite',
      values: { keyword: '유지', status: 'removed' },
    });

    expect(prepared.values).toEqual({ keyword: '유지', status: null });
    expect(prepared.invalidFieldNames).toEqual(['status']);
    expect(prepared.warnings[0]).toContain('진행 상태');
  });

  it('모든 prepare가 성공한 뒤에만 commit을 실행한다', async () => {
    const commit = vi.fn();
    const prepared = await prepareFieldRestoreValues({
      externalFieldNames: ['status'],
      rows: createRows([{
        name: 'status',
        type: 'select',
        restore: { prepare: async () => ({ commit }) },
      }]),
      values: { status: 'active' },
    });

    expect(commit).not.toHaveBeenCalled();
    await commitPreparedRestore(prepared.commits);
    expect(commit).toHaveBeenCalledOnce();
  });

  it('의존성이 없는 같은 단계 필드는 병렬로 준비한다', async () => {
    const started = [];
    const resolvers = [];
    const prepare = (name) => async () => {
      started.push(name);
      await new Promise((resolve) => resolvers.push(resolve));
    };
    const promise = prepareFieldRestoreValues({
      rows: createRows([
        { name: 'first', restore: { prepare: prepare('first') }, type: 'text' },
        { name: 'second', restore: { prepare: prepare('second') }, type: 'text' },
      ]),
      values: { first: 'A', second: 'B' },
    });

    await Promise.resolve();
    expect(started).toEqual(['first', 'second']);
    resolvers.forEach((resolve) => resolve());
    await expect(promise).resolves.toMatchObject({
      values: { first: 'A', second: 'B' },
    });
  });

  it('존재하지 않는 의존성과 순환 의존성을 거부한다', () => {
    expect(() => createRestoreLevels(createRows([{
      name: 'child',
      restore: { dependsOn: ['missing'] },
      type: 'select',
    }]))).toThrow('missing');

    expect(() => createRestoreLevels(createRows([
      { name: 'a', restore: { dependsOn: ['b'] }, type: 'select' },
      { name: 'b', restore: { dependsOn: ['a'] }, type: 'select' },
    ]))).toThrow('순환');
  });

  it('중단된 비동기 준비 결과를 적용하지 않는다', async () => {
    const controller = new AbortController();
    const promise = prepareFieldRestoreValues({
      externalFieldNames: ['status'],
      rows: createRows([{
        name: 'status',
        type: 'select',
        restore: {
          prepare: async () => {
            controller.abort();
            return { nextValue: 'done' };
          },
        },
      }]),
      signal: controller.signal,
      values: { status: 'active' },
    });

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});
