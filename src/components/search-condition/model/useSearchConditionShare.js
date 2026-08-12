import { useCallback, useEffect, useMemo, useState } from 'react';

const EMPTY_VALUES = {};
const EMPTY_FIELD_NAMES = [];

export function pickSharedValues(values = EMPTY_VALUES, fieldNames = EMPTY_FIELD_NAMES) {
  if (!fieldNames.length) return { ...values };

  return fieldNames.reduce((result, name) => {
    if (Object.prototype.hasOwnProperty.call(values, name)) {
      result[name] = values[name];
    }
    return result;
  }, {});
}

export function applySharedValues(formMethods, values = EMPTY_VALUES) {
  Object.entries(values).forEach(([name, value]) => {
    formMethods.setValue(name, value, {
      shouldDirty: true,
      shouldValidate: false,
    });
  });
}

export function useSearchConditionShareState({
  activeTab,
  enabled = false,
  fieldNames = EMPTY_FIELD_NAMES,
} = {}) {
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    if (!enabled) setSnapshot(null);
  }, [enabled]);

  const publish = useCallback((sourceTab, values) => {
    if (!enabled || sourceTab !== activeTab) return;

    setSnapshot({
      sourceTab,
      values: pickSharedValues(values, fieldNames),
    });
  }, [activeTab, enabled, fieldNames]);

  return useMemo(() => ({
    activeTab,
    enabled,
    publish,
    snapshot,
  }), [activeTab, enabled, publish, snapshot]);
}

export function useSearchConditionSync({
  conditionShare,
  formMethods,
  tabKey,
}) {
  const activeTab = conditionShare?.activeTab;
  const enabled = conditionShare?.enabled ?? false;
  const publish = conditionShare?.publish;
  const snapshot = conditionShare?.snapshot;

  // 다른 탭이 보낸 최신값을 먼저 적용한 다음 현재 활성 탭의 구독을 시작한다.
  useEffect(() => {
    if (!enabled || !snapshot || snapshot.sourceTab === tabKey) return;
    applySharedValues(formMethods, snapshot.values);
  }, [enabled, formMethods, snapshot, tabKey]);

  useEffect(() => {
    if (!enabled || activeTab !== tabKey || !publish) return undefined;

    publish(tabKey, formMethods.getValues());

    const subscription = formMethods.watch((values) => {
      publish(tabKey, values);
    });

    return () => subscription.unsubscribe();
  }, [activeTab, enabled, formMethods, publish, tabKey]);
}
