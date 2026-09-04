import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  App as AntdApp,
  Button,
  Form,
  Select,
  Typography,
} from 'antd';
import { DownOutlined, ReloadOutlined, SearchOutlined, StarFilled, UpOutlined } from '@ant-design/icons';
import { FormProvider, useForm } from 'react-hook-form';
import {
  ConditionRestoreContext,
  DetailVisibilityContext,
} from '../model/SearchConditionContext';
import { createRowsFromChildren } from '../model/composition';
import {
  buildDefaultValues,
  createCompleteConditionValues,
  createConditionSnapshot,
  createPersistedConditionValue,
  getConditionFields,
  hydrateSavedValues,
  parsePersistedConditionValue,
} from '../model/conditionUtils';
import {
  commitPreparedRestore,
  prepareFieldRestoreValues,
} from '../model/conditionRestore';
import SaveConditionModal from './SaveConditionModal';

const EMPTY_VALUES = {};
const EMPTY_CONDITIONS = [];

export function parseSavedConditionValue(condition) {
  const rawValue = condition?.value ?? condition?.values ?? {};
  return parsePersistedConditionValue(rawValue).values;
}

function waitForCommittedFrame(signal) {
  if (typeof requestAnimationFrame !== 'function') return Promise.resolve();

  return new Promise((resolve, reject) => {
    let abort;
    const frameId = requestAnimationFrame(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    });
    abort = () => {
      cancelAnimationFrame(frameId);
      const error = new Error('조회조건 복원이 취소되었습니다.');
      error.name = 'AbortError';
      reject(error);
    };
    signal?.addEventListener('abort', abort, { once: true });
  });
}

export default function SearchConditionForm({
  conditionShare,
  conditionKey,
  defaultValues = EMPTY_VALUES,
  formMethods,
  preserveValuesOnDefaultChange,
  savedConditions = EMPTY_CONDITIONS,
  prepareRestoreValues,
  tabKey,
  onRestoreStateChange,
  onSearch,
  onSaveCondition,
  children,
}) {
  const { message } = AntdApp.useApp();
  const rows = useMemo(() => createRowsFromChildren(children), [children]);
  const initialValues = useMemo(() => buildDefaultValues(rows, defaultValues), [rows, defaultValues]);
  const internalMethods = useForm({ defaultValues: initialValues, mode: 'onSubmit' });
  const methods = formMethods || internalMethods;
  const [detailOpen, setDetailOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [selectedConditionId, setSelectedConditionId] = useState();
  const [snapshot, setSnapshot] = useState({ values: {}, preview: [] });
  const [restoreState, setRestoreState] = useState({
    externalFieldNames: new Set(),
    isRestoring: false,
    source: undefined,
  });
  const [protectedFieldNames, setProtectedFieldNames] = useState(() => new Set());
  const [autoBlockedFieldNames, setAutoBlockedFieldNames] = useState(() => new Set());
  const restoreController = useRef();
  const appliedTransferId = useRef();
  const processingTransfer = useRef();
  const onRestoreStateChangeRef = useRef(onRestoreStateChange);
  const synchronizedForm = useRef({ defaultValues: undefined, methods: undefined });
  const resolvedTabKey = tabKey || conditionKey;
  const shareAcknowledge = conditionShare?.acknowledgeTransfer;
  const shareCapture = conditionShare?.capture || conditionShare?.publish;
  const shareGetTabValues = conditionShare?.getTabValues;
  const shareRegisterTab = conditionShare?.registerTab;
  const shareTransferRequest = conditionShare?.transferRequest || conditionShare?.snapshot;
  const initialTabSessionValues = useMemo(() => {
    const values = shareGetTabValues?.(resolvedTabKey);
    return values && Object.keys(values).length ? values : undefined;
  }, [resolvedTabKey, shareGetTabValues]);
  const [sessionRestorePending, setSessionRestorePending] = useState(
    () => Boolean(initialTabSessionValues),
  );
  const preserveCurrentValues = preserveValuesOnDefaultChange
    ?? Boolean(conditionShare);
  const hasDetail = rows.some((row) => row.detail);
  const availableConditions = useMemo(() => savedConditions
    .filter((condition) => !conditionKey || !condition.key || condition.key === conditionKey)
    .map((condition, index) => ({
      ...condition,
      selectionId: condition.id ?? `${condition.key ?? conditionKey ?? 'condition'}-${index}`,
    })), [conditionKey, savedConditions]);
  const schemaFieldNames = useMemo(
    () => new Set(getConditionFields(rows).map((field) => field.name)),
    [rows],
  );
  const pendingTransferState = useMemo(() => {
    if (
      !shareTransferRequest
      || shareTransferRequest.targetTab !== resolvedTabKey
      || appliedTransferId.current === shareTransferRequest.id
    ) {
      return undefined;
    }

    const parsed = parsePersistedConditionValue(shareTransferRequest.values);
    return {
      externalFieldNames: new Set(
        Object.keys(parsed.values).filter((name) => schemaFieldNames.has(name)),
      ),
      isRestoring: true,
      source: 'tab-inherit',
    };
  }, [resolvedTabKey, schemaFieldNames, shareTransferRequest]);
  const pendingSessionState = sessionRestorePending && initialTabSessionValues
    ? {
      externalFieldNames: new Set(
        Object.keys(initialTabSessionValues).filter((name) => schemaFieldNames.has(name)),
      ),
      isRestoring: true,
      source: 'tab-session',
    }
    : undefined;
  const effectiveRestoreState = restoreState.isRestoring
    ? restoreState
    : pendingTransferState ?? pendingSessionState ?? restoreState;
  const isRestoring = effectiveRestoreState.isRestoring;

  useEffect(() => {
    onRestoreStateChangeRef.current = onRestoreStateChange;
  }, [onRestoreStateChange]);

  const removeProtectedField = useCallback((name) => {
    setProtectedFieldNames((current) => {
      if (!current.has(name)) return current;
      const next = new Set(current);
      next.delete(name);
      return next;
    });
    setAutoBlockedFieldNames((current) => {
      if (!current.has(name)) return current;
      const next = new Set(current);
      next.delete(name);
      return next;
    });
  }, []);

  const reportUserChange = useCallback((name) => {
    removeProtectedField(name);
    setSelectedConditionId(undefined);
  }, [removeProtectedField]);

  const restoreContextValue = useMemo(() => ({
    hasExternalValue: (name) => (
      effectiveRestoreState.externalFieldNames.has(name) || protectedFieldNames.has(name)
    ),
    isAutoValueBlocked: (name) => autoBlockedFieldNames.has(name),
    isRestoring,
    releaseField: removeProtectedField,
    reportUserChange,
    source: effectiveRestoreState.source,
  }), [
    autoBlockedFieldNames,
    protectedFieldNames,
    removeProtectedField,
    reportUserChange,
    effectiveRestoreState,
    isRestoring,
  ]);

  const publishRestoreState = useCallback((isRestoring, source, externalFieldNames = new Set()) => {
    setRestoreState({ externalFieldNames, isRestoring, source });
    onRestoreStateChangeRef.current?.({
      isRestoring,
      source: isRestoring ? source : undefined,
      tabKey: resolvedTabKey,
    });
  }, [resolvedTabKey]);

  useEffect(() => {
    const previous = synchronizedForm.current;
    if (previous.methods === methods && previous.defaultValues === defaultValues) return;
    const firstSynchronization = previous.methods === undefined;

    if (previous.methods !== methods || !preserveCurrentValues) {
      restoreController.current?.abort();
    }
    synchronizedForm.current = { defaultValues, methods };
    const nextValues = firstSynchronization && initialTabSessionValues
      ? hydrateSavedValues(rows, initialTabSessionValues, initialValues)
      : preserveCurrentValues && !firstSynchronization
        ? hydrateSavedValues(
          rows,
          createConditionSnapshot(
            rows,
            methods.getValues(),
            { includeEmptyValues: true },
          ).values,
          initialValues,
        )
        : initialValues;
    methods.reset(nextValues);
    setSelectedConditionId(undefined);
    if (!preserveCurrentValues) {
      setProtectedFieldNames(new Set());
      setAutoBlockedFieldNames(new Set());
    }
  }, [
    defaultValues,
    initialValues,
    initialTabSessionValues,
    methods,
    preserveCurrentValues,
    rows,
  ]);

  useEffect(() => () => {
    restoreController.current?.abort();
    onRestoreStateChangeRef.current?.({
      isRestoring: false,
      source: undefined,
      tabKey: resolvedTabKey,
    });
  }, [resolvedTabKey]);

  const collectSearchSnapshot = useCallback(
    () => createConditionSnapshot(rows, methods.getValues()),
    [methods, rows],
  );

  const collectSessionValues = useCallback(
    () => createCompleteConditionValues(rows, methods.getValues()),
    [methods, rows],
  );

  const submitSearch = async () => {
    if (isRestoring) return;
    const nextSnapshot = collectSearchSnapshot();
    await onSearch?.({ conditionKey, values: nextSnapshot.values });
  };

  const resetConditions = () => {
    if (isRestoring) return;
    restoreController.current?.abort();
    methods.reset(initialValues);
    setSelectedConditionId(undefined);
    setProtectedFieldNames(new Set());
    setAutoBlockedFieldNames(new Set());
    shareCapture?.(
      resolvedTabKey,
      createCompleteConditionValues(rows, initialValues),
    );
    message.success('조회조건을 초기화했습니다.');
  };

  const openSaveModal = () => {
    if (isRestoring) return;
    const currentValues = methods.getValues();
    setSnapshot({
      preview: createConditionSnapshot(rows, currentValues).preview,
      values: createPersistedConditionValue(rows, currentValues, conditionKey),
    });
    setSaveModalOpen(true);
  };

  const applyConditionValues = useCallback(async ({
    errorMessage,
    rawValues,
    savedCondition,
    source,
  }) => {
    const restoreSource = source === 'tab-share' ? 'tab-inherit' : source;
    restoreController.current?.abort();
    const controller = new AbortController();
    restoreController.current = controller;
    const parsed = parsePersistedConditionValue(rawValues);
    const externalFieldNames = new Set(
      Object.keys(parsed.values).filter((name) => schemaFieldNames.has(name)),
    );
    publishRestoreState(true, restoreSource, externalFieldNames);

    try {
      const values = hydrateSavedValues(
        rows,
        parsed.values,
        initialValues,
      );
      const formPreparedValues = prepareRestoreValues
        ? await prepareRestoreValues({
          conditionKey,
          form: methods,
          initialValues,
          savedCondition,
          signal: controller.signal,
          source,
          values,
        })
        : values;

      if (controller.signal.aborted || restoreController.current !== controller) return 'stale';

      const prepared = await prepareFieldRestoreValues({
        conditionKey,
        externalFieldNames,
        form: methods,
        rows,
        savedCondition,
        signal: controller.signal,
        source: restoreSource,
        values: formPreparedValues ?? values,
      });
      if (controller.signal.aborted || restoreController.current !== controller) return 'stale';

      await commitPreparedRestore(prepared.commits, controller.signal);
      if (controller.signal.aborted || restoreController.current !== controller) return 'stale';

      methods.reset(prepared.values);
      setProtectedFieldNames(new Set(externalFieldNames));
      setAutoBlockedFieldNames(new Set(prepared.invalidFieldNames));
      shareCapture?.(
        resolvedTabKey,
        createCompleteConditionValues(rows, prepared.values),
      );
      prepared.warnings.forEach((warning) => message.warning(warning));
      await waitForCommittedFrame(controller.signal);
      if (controller.signal.aborted || restoreController.current !== controller) return 'stale';

      return 'applied';
    } catch (error) {
      if (controller.signal.aborted || restoreController.current !== controller) return 'stale';

      if (errorMessage) message.error(errorMessage);
      console.error(error);
      return 'error';
    } finally {
      if (restoreController.current === controller) {
        restoreController.current = undefined;
        publishRestoreState(false, restoreSource);
      }
    }
  }, [
    conditionKey,
    initialValues,
    message,
    methods,
    prepareRestoreValues,
    publishRestoreState,
    resolvedTabKey,
    rows,
    schemaFieldNames,
    shareCapture,
  ]);

  const restoreCondition = async (id) => {
    if (!id) {
      setSelectedConditionId(undefined);
      return;
    }
    const selected = availableConditions.find((condition) => condition.selectionId === id);
    if (!selected) return;

    const result = await applyConditionValues({
      errorMessage: '조회조건을 불러오지 못했습니다.',
      rawValues: selected.value ?? selected.values,
      savedCondition: selected,
      source: 'favorite',
    });

    if (result === 'applied') {
      setSelectedConditionId(id);
      message.success(`‘${selected.name}’ 조건을 적용했습니다.`);
    }
  };

  useEffect(() => {
    if (
      !sessionRestorePending
      || !initialTabSessionValues
      || shareTransferRequest?.targetTab === resolvedTabKey
    ) {
      return undefined;
    }

    let cancelled = false;
    void applyConditionValues({
      errorMessage: '탭의 조회조건을 복원하지 못했습니다.',
      rawValues: initialTabSessionValues,
      source: 'tab-session',
    }).then((result) => {
      if (!cancelled && result !== 'stale') setSessionRestorePending(false);
    });

    return () => {
      cancelled = true;
    };
  }, [
    applyConditionValues,
    initialTabSessionValues,
    resolvedTabKey,
    sessionRestorePending,
    shareTransferRequest,
  ]);

  useEffect(() => {
    if (!shareCapture || !resolvedTabKey) return undefined;

    const captureValues = (values) => {
      shareCapture(
        resolvedTabKey,
        createCompleteConditionValues(rows, values),
      );
    };

    if (!sessionRestorePending) captureValues(methods.getValues());
    const unregister = shareRegisterTab?.(resolvedTabKey, collectSessionValues);
    let unsubscribe;
    if (methods.subscribe) {
      unsubscribe = methods.subscribe({
        callback: ({ values }) => {
          if (!sessionRestorePending) captureValues(values);
        },
        formState: { values: true },
      });
    } else {
      const subscription = methods.watch(captureValues);
      unsubscribe = () => subscription.unsubscribe();
    }

    return () => {
      unsubscribe?.();
      unregister?.();
    };
  }, [
    collectSessionValues,
    methods,
    resolvedTabKey,
    rows,
    sessionRestorePending,
    shareCapture,
    shareRegisterTab,
  ]);

  useEffect(() => {
    if (
      !shareTransferRequest
      || shareTransferRequest.targetTab !== resolvedTabKey
      || appliedTransferId.current === shareTransferRequest.id
    ) {
      return;
    }

    const running = processingTransfer.current;
    if (
      running?.id === shareTransferRequest.id
      && restoreController.current
      && !restoreController.current.signal.aborted
    ) {
      return;
    }

    const attempt = Symbol(`transfer-${shareTransferRequest.id}`);
    processingTransfer.current = { attempt, id: shareTransferRequest.id };
    void applyConditionValues({
      errorMessage: '공유된 조회조건을 적용하지 못했습니다.',
      rawValues: shareTransferRequest.values,
      source: 'tab-share',
    }).then((result) => {
      if (result === 'applied') {
        appliedTransferId.current = shareTransferRequest.id;
        setSessionRestorePending(false);
        setSelectedConditionId(undefined);
        shareAcknowledge?.(shareTransferRequest.id, 'applied');
      } else if (result === 'error') {
        setSessionRestorePending(false);
        shareAcknowledge?.(shareTransferRequest.id, 'failed');
      }

      if (processingTransfer.current?.attempt === attempt) {
        processingTransfer.current = undefined;
      }
    });
  }, [
    applyConditionValues,
    resolvedTabKey,
    shareAcknowledge,
    shareTransferRequest,
  ]);

  const clearSelectedCondition = () => {
    setSelectedConditionId(undefined);
  };

  return (
    <FormProvider {...methods}>
      <ConditionRestoreContext.Provider value={restoreContextValue}>
        <Form className="search-panel" layout="vertical" onFinish={methods.handleSubmit(submitSearch)}>
          <div className="search-panel__layout">
            <div className="favorite-box">
              <div className="favorite-box__heading">
                <Typography.Text strong>조회조건 즐겨찾기</Typography.Text>
                <Button
                  disabled={isRestoring}
                  type="text"
                  size="small"
                  icon={<StarFilled />}
                  onClick={openSaveModal}
                >
                  저장
                </Button>
              </div>
              <Select
                allowClear
                aria-label="저장된 조회조건"
                className="favorite-box__select"
                disabled={isRestoring}
                loading={isRestoring && effectiveRestoreState.source === 'favorite'}
                options={availableConditions.map(({ selectionId, name }) => ({
                  value: selectionId,
                  label: name,
                }))}
                placeholder="저장조건 선택"
                value={selectedConditionId}
                onChange={restoreCondition}
                onClear={clearSelectedCondition}
              />
            </div>

            <div className="condition-box">
              <DetailVisibilityContext.Provider value={detailOpen}>
                {children}
              </DetailVisibilityContext.Provider>
            </div>

            <div className="search-actions">
              <Button
                block
                disabled={isRestoring}
                icon={<ReloadOutlined />}
                onClick={resetConditions}
              >
                초기화
              </Button>
              <Button
                block
                disabled={isRestoring}
                htmlType="submit"
                loading={isRestoring && effectiveRestoreState.source !== 'favorite'}
                type="primary"
                icon={<SearchOutlined />}
              >
                조회
              </Button>
              {hasDetail && (
                <Button
                  block
                  disabled={isRestoring}
                  type="text"
                  icon={detailOpen ? <UpOutlined /> : <DownOutlined />}
                  onClick={() => setDetailOpen((current) => !current)}
                >
                  {detailOpen ? '상세 닫기' : '상세검색'}
                </Button>
              )}
            </div>
          </div>

          <SaveConditionModal
            conditionKey={conditionKey}
            open={saveModalOpen}
            preview={snapshot.preview}
            value={snapshot.values}
            onCancel={() => setSaveModalOpen(false)}
            onSaveCondition={onSaveCondition}
          />
        </Form>
      </ConditionRestoreContext.Provider>
    </FormProvider>
  );
}
