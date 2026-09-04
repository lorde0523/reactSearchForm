import { getConditionFields, getFieldEmptyValue } from './conditionUtils';

const CHOICE_FIELD_TYPES = new Set([
  'checkboxGroup',
  'radioButtonGroup',
  'radioGroup',
  'select',
]);

function throwIfAborted(signal) {
  if (!signal?.aborted) return;
  const error = new Error('조회조건 복원이 취소되었습니다.');
  error.name = 'AbortError';
  throw error;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function isEmptyRestoreValue(value) {
  return value === undefined
    || value === null
    || value === ''
    || (Array.isArray(value) && value.length === 0);
}

function isValueInOptions(value, options, field) {
  if (!Array.isArray(options) || options.length === 0 || isEmptyRestoreValue(value)) return true;
  const enabledValues = options
    .filter((option) => !option.disabled)
    .map((option) => option.value);

  if (field.type === 'checkboxGroup' || (field.type === 'select' && field.mode)) {
    return Array.isArray(value)
      && value.every((item) => enabledValues.some((optionValue) => Object.is(optionValue, item)));
  }

  return enabledValues.some((optionValue) => Object.is(optionValue, value));
}

export function createRestoreLevels(rows) {
  const fields = getConditionFields(rows);
  const fieldsByName = new Map();

  fields.forEach((field) => {
    if (fieldsByName.has(field.name)) {
      throw new Error(`조회조건 필드 이름이 중복되었습니다: ${field.name}`);
    }
    fieldsByName.set(field.name, field);
  });

  const dependenciesByName = new Map(fields.map((field) => {
    const dependencies = field.restore?.dependsOn || [];
    dependencies.forEach((dependency) => {
      if (!fieldsByName.has(dependency)) {
        throw new Error(`${field.name} 복원 의존 필드를 찾을 수 없습니다: ${dependency}`);
      }
    });
    return [field.name, new Set(dependencies)];
  }));
  const remaining = new Set(fields.map((field) => field.name));
  const levels = [];

  while (remaining.size) {
    const ready = fields.filter((field) => (
      remaining.has(field.name)
      && [...dependenciesByName.get(field.name)].every((name) => !remaining.has(name))
    ));

    if (!ready.length) {
      throw new Error(`조회조건 복원 의존성이 순환합니다: ${[...remaining].join(', ')}`);
    }

    levels.push(ready);
    ready.forEach((field) => remaining.delete(field.name));
  }

  return levels;
}

export async function prepareFieldRestoreValues({
  conditionKey,
  externalFieldNames = [],
  form,
  rows,
  savedCondition,
  signal,
  source,
  values,
}) {
  const levels = createRestoreLevels(rows);
  const explicitNames = new Set(externalFieldNames);
  const workingValues = { ...values };
  const commits = [];
  const invalidFieldNames = [];
  const warnings = [];

  for (const level of levels) {
    throwIfAborted(signal);
    const levelValues = { ...workingValues };
    const results = await Promise.all(level.map(async (field) => {
      const result = await field.restore?.prepare?.({
        conditionKey,
        emptyValue: getFieldEmptyValue(field),
        field,
        form,
        hasExternalValue: explicitNames.has(field.name),
        savedCondition,
        signal,
        source,
        value: levelValues[field.name],
        values: levelValues,
      }) || {};
      throwIfAborted(signal);

      let nextValue = hasOwn(result, 'nextValue')
        ? result.nextValue
        : levelValues[field.name];
      const options = result.options ?? field.options;
      const mustValidate = explicitNames.has(field.name)
        && CHOICE_FIELD_TYPES.has(field.type)
        && Array.isArray(options)
        && options.length > 0;
      const valid = typeof result.valid === 'boolean'
        ? result.valid
        : !mustValidate || isValueInOptions(nextValue, options, field);

      if (!valid) nextValue = getFieldEmptyValue(field);

      return {
        commit: result.commit,
        field,
        invalid: !valid,
        nextValue,
        warning: result.warning || (!valid
          ? `${field.label || field.name}의 저장값이 현재 선택 목록에 없어 초기화했습니다.`
          : undefined),
      };
    }));

    results.forEach(({ commit, field, invalid, nextValue, warning }) => {
      workingValues[field.name] = nextValue;
      if (commit) commits.push({ commit, name: field.name });
      if (invalid) invalidFieldNames.push(field.name);
      if (warning) warnings.push(warning);
    });
  }

  return {
    commits,
    invalidFieldNames,
    values: workingValues,
    warnings,
  };
}

export async function commitPreparedRestore(commits, signal) {
  for (const { commit } of commits) {
    throwIfAborted(signal);
    await commit();
  }
  throwIfAborted(signal);
}
