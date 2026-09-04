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
  const tabValuesByKey = useRef({});
  const tabReadersByKey = useRef({});
  const transferSequence = useRef(0);
  const [transferRequest, setTransferRequest] = useState(null);

  const capture = useCallback((tabKey, values) => {
    if (!tabKey) return;
    tabValuesByKey.current[tabKey] = { ...values };
  }, []);

  const getTabValues = useCallback(
    (tabKey) => ({ ...(tabValuesByKey.current[tabKey] || {}) }),
    [],
  );

  const registerTab = useCallback((tabKey, getValues) => {
    if (!tabKey || typeof getValues !== 'function') return () => {};
    tabReadersByKey.current[tabKey] = getValues;

    return () => {
      if (tabReadersByKey.current[tabKey] === getValues) {
        delete tabReadersByKey.current[tabKey];
      }
    };
  }, []);

  const acknowledgeTransfer = useCallback((id) => {
    setTransferRequest((current) => (current?.id === id ? null : current));
  }, []);

  const transfer = useCallback((sourceTab, targetTab) => {
    if (!enabled || !sourceTab || !targetTab || sourceTab === targetTab) return null;

    const sourceValues = tabReadersByKey.current[sourceTab]?.()
      ?? tabValuesByKey.current[sourceTab]
      ?? {};
    tabValuesByKey.current[sourceTab] = { ...sourceValues };
    transferSequence.current += 1;
    const request = createTabTransferRequest({
      fieldNames,
      id: transferSequence.current,
      sourceTab,
      sourceValues,
      targetTab,
      targetValues: tabValuesByKey.current[targetTab],
    });

    setTransferRequest(request);
    return request;
  }, [enabled, fieldNames]);

  return useMemo(() => ({
    activeTab,
    acknowledgeTransfer,
    capture,
    enabled,
    getTabValues,
    registerTab,
    // publish와 snapshot은 기존 사용처 호환을 위한 별칭이다.
    publish: capture,
    snapshot: transferRequest,
    transfer,
    transferRequest,
  }), [
    activeTab,
    acknowledgeTransfer,
    capture,
    enabled,
    getTabValues,
    registerTab,
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
  const acknowledgeTransfer = conditionShare?.acknowledgeTransfer;
  const registerTab = conditionShare?.registerTab;
  const transferRequest = conditionShare?.transferRequest || conditionShare?.snapshot;

  // 기존 직접 사용 방식은 대상 탭에 전달값을 필드 단위로 적용한다.
  // 날짜/커스텀 필드는 SearchConditionForm의 conditionShare prop 사용을 권장한다.
  useEffect(() => {
    if (
      !transferRequest
      || !tabKey
      || transferRequest.targetTab !== tabKey
    ) {
      return;
    }
    applySharedValues(formMethods, transferRequest.values);
    capture?.(tabKey, formMethods.getValues());
    acknowledgeTransfer?.(transferRequest.id, 'applied');
  }, [acknowledgeTransfer, capture, formMethods, tabKey, transferRequest]);

  useEffect(() => {
    if (!tabKey || !capture) return undefined;

    capture(tabKey, formMethods.getValues());
    const unregister = registerTab?.(tabKey, () => formMethods.getValues());
    let unsubscribe;
    if (formMethods.subscribe) {
      unsubscribe = formMethods.subscribe({
        callback: ({ values }) => capture(tabKey, values),
        formState: { values: true },
      });
    } else {
      const subscription = formMethods.watch((values) => capture(tabKey, values));
      unsubscribe = () => subscription.unsubscribe();
    }

    return () => {
      unsubscribe?.();
      unregister?.();
    };
  }, [activeTab, capture, formMethods, registerTab, tabKey]);

  return transferRequest?.targetTab === tabKey ? transferRequest : null;
}
