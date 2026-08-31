import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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

export function createTabTransferRequest({
  fieldNames = EMPTY_FIELD_NAMES,
  id,
  sourceTab,
  sourceValues = EMPTY_VALUES,
  targetTab,
  targetValues = EMPTY_VALUES,
}) {
  return {
    id,
    sourceTab,
    targetTab,
    values: {
      ...targetValues,
      ...pickSharedValues(sourceValues, fieldNames),
    },
  };
}

export function useSearchConditionShareState({
  activeTab,
  enabled = false,
  fieldNames = EMPTY_FIELD_NAMES,
} = {}) {
  const snapshotsByTab = useRef({});
  const transferSequence = useRef(0);
  const [transferRequest, setTransferRequest] = useState(null);

  useEffect(() => {
    if (!enabled) setTransferRequest(null);
  }, [enabled]);

  const capture = useCallback((tabKey, values) => {
    if (!tabKey) return;
    snapshotsByTab.current[tabKey] = { ...values };
  }, []);

  const getTabValues = useCallback(
    (tabKey) => ({ ...(snapshotsByTab.current[tabKey] || {}) }),
    [],
  );

  const transfer = useCallback((sourceTab, targetTab) => {
    if (!enabled || !sourceTab || !targetTab || sourceTab === targetTab) return null;

    transferSequence.current += 1;
    const request = createTabTransferRequest({
      fieldNames,
      id: transferSequence.current,
      sourceTab,
      sourceValues: snapshotsByTab.current[sourceTab],
      targetTab,
      targetValues: snapshotsByTab.current[targetTab],
    });

    setTransferRequest(request);
    return request;
  }, [enabled, fieldNames]);

  return useMemo(() => ({
    activeTab,
    capture,
    enabled,
    getTabValues,
    // publish와 snapshot은 기존 사용처 호환을 위한 별칭이다.
    publish: capture,
    snapshot: transferRequest,
    transfer,
    transferRequest,
  }), [
    activeTab,
    capture,
    enabled,
    getTabValues,
    transfer,
    transferRequest,
  ]);
}

export function useSearchConditionSync({
  conditionShare,
  formMethods,
  tabKey,
}) {
  const activeTab = conditionShare?.activeTab;
  const capture = conditionShare?.capture || conditionShare?.publish;
  const enabled = conditionShare?.enabled ?? false;
  const transferRequest = conditionShare?.transferRequest || conditionShare?.snapshot;

  // 기존 직접 사용 방식은 대상 탭에 전달값을 필드 단위로 적용한다.
  // 날짜/커스텀 필드는 SearchConditionForm의 conditionShare prop 사용을 권장한다.
  useEffect(() => {
    if (!enabled || transferRequest?.targetTab !== tabKey) return;
    applySharedValues(formMethods, transferRequest.values);
  }, [enabled, formMethods, tabKey, transferRequest]);

  useEffect(() => {
    if (activeTab !== tabKey || !capture) return undefined;

    capture(tabKey, formMethods.getValues());

    const subscription = formMethods.watch((values) => {
      capture(tabKey, values);
    });

    return () => subscription.unsubscribe();
  }, [activeTab, capture, formMethods, tabKey]);

  return transferRequest?.targetTab === tabKey ? transferRequest : null;
}
