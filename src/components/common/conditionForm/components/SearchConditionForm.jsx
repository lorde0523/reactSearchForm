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
import { DetailVisibilityContext } from '../model/SearchConditionContext';
import { createRowsFromChildren } from '../model/composition';
import {
  buildDefaultValues,
  createConditionSnapshot,
  hydrateSavedValues,
  normalizeSavedValues,
} from '../model/conditionUtils';
import SaveConditionModal from './SaveConditionModal';

const EMPTY_VALUES = {};
const EMPTY_CONDITIONS = [];

export function parseSavedConditionValue(condition) {
  const rawValue = condition?.value ?? condition?.values ?? {};
  return normalizeSavedValues(rawValue);
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
  const restoreController = useRef();
  const appliedTransferId = useRef();
  const synchronizedForm = useRef({ defaultValues: undefined, methods: undefined });
  const resolvedTabKey = tabKey || conditionKey;
  const shareActiveTab = conditionShare?.activeTab;
  const shareCapture = conditionShare?.capture || conditionShare?.publish;
  const shareEnabled = conditionShare?.enabled ?? false;
  const shareTransferRequest = conditionShare?.transferRequest || conditionShare?.snapshot;
  const preserveCurrentValues = preserveValuesOnDefaultChange
    ?? shareEnabled;
  const hasDetail = rows.some((row) => row.detail);
  const availableConditions = useMemo(() => savedConditions
    .filter((condition) => !conditionKey || !condition.key || condition.key === conditionKey)
    .map((condition, index) => ({
      ...condition,
      selectionId: condition.id ?? `${condition.key ?? conditionKey ?? 'condition'}-${index}`,
    })), [conditionKey, savedConditions]);

  useEffect(() => {
    const previous = synchronizedForm.current;
    if (previous.methods === methods && previous.defaultValues === defaultValues) return;

    if (previous.methods !== methods || !preserveCurrentValues) {
      restoreController.current?.abort();
    }
    synchronizedForm.current = { defaultValues, methods };
    const nextValues = preserveCurrentValues
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
  }, [
    defaultValues,
    initialValues,
    methods,
    preserveCurrentValues,
    rows,
  ]);

  useEffect(() => () => {
    restoreController.current?.abort();
  }, []);

  const collectSnapshot = useCallback(
    () => createConditionSnapshot(rows, methods.getValues()),
    [methods, rows],
  );

  const submitSearch = async () => {
    const nextSnapshot = collectSnapshot();
    await onSearch?.({ conditionKey, values: nextSnapshot.values });
  };

  const resetConditions = () => {
    restoreController.current?.abort();
    methods.reset(initialValues);
    setSelectedConditionId(undefined);
    message.success('조회조건을 초기화했습니다.');
  };

  const openSaveModal = () => {
    setSnapshot(collectSnapshot());
    setSaveModalOpen(true);
  };

  const applyConditionValues = useCallback(async ({
    errorMessage,
    rawValues,
    savedCondition,
    source,
  }) => {
    restoreController.current?.abort();
    const controller = new AbortController();
    restoreController.current = controller;

    try {
      const values = hydrateSavedValues(
        rows,
        rawValues,
        initialValues,
      );
      const preparedValues = prepareRestoreValues
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

      methods.reset(preparedValues ?? values);
      return 'applied';
    } catch (error) {
      if (controller.signal.aborted || restoreController.current !== controller) return 'stale';

      if (errorMessage) message.error(errorMessage);
      console.error(error);
      return 'error';
    } finally {
      if (restoreController.current === controller) restoreController.current = undefined;
    }
  }, [conditionKey, initialValues, message, methods, prepareRestoreValues, rows]);

  const restoreCondition = async (id) => {
    setSelectedConditionId(id);
    const selected = availableConditions.find((condition) => condition.selectionId === id);
    if (!selected) return;

    const result = await applyConditionValues({
      errorMessage: '조회조건을 불러오지 못했습니다.',
      rawValues: parseSavedConditionValue(selected),
      savedCondition: selected,
      source: 'favorite',
    });

    if (result === 'applied') {
      message.success(`‘${selected.name}’ 조건을 적용했습니다.`);
    } else if (result === 'error') {
      setSelectedConditionId(undefined);
    }
  };

  useEffect(() => {
    if (!shareCapture || shareActiveTab !== resolvedTabKey) return undefined;

    const captureValues = (values) => {
      shareCapture(
        resolvedTabKey,
        createConditionSnapshot(rows, values, { includeEmptyValues: true }).values,
      );
    };

    captureValues(methods.getValues());
    const subscription = methods.watch(captureValues);
    return () => subscription.unsubscribe();
  }, [methods, resolvedTabKey, rows, shareActiveTab, shareCapture]);

  useEffect(() => {
    if (
      !shareEnabled
      || !shareTransferRequest
      || shareTransferRequest.targetTab !== resolvedTabKey
      || appliedTransferId.current === shareTransferRequest.id
    ) {
      return;
    }

    appliedTransferId.current = shareTransferRequest.id;
    setSelectedConditionId(undefined);
    void applyConditionValues({
      errorMessage: '공유된 조회조건을 적용하지 못했습니다.',
      rawValues: shareTransferRequest.values,
      source: 'tab-share',
    });
  }, [applyConditionValues, resolvedTabKey, shareEnabled, shareTransferRequest]);

  const clearSelectedCondition = () => {
    restoreController.current?.abort();
    setSelectedConditionId(undefined);
  };

  return (
    <FormProvider {...methods}>
      <Form className="search-panel" layout="vertical" onFinish={methods.handleSubmit(submitSearch)}>
        <div className="search-panel__layout">
          <div className="favorite-box">
            <div className="favorite-box__heading">
              <Typography.Text strong>조회조건 즐겨찾기</Typography.Text>
              <Button type="text" size="small" icon={<StarFilled />} onClick={openSaveModal}>저장</Button>
            </div>
            <Select
              allowClear
              aria-label="저장된 조회조건"
              className="favorite-box__select"
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
            <Button block icon={<ReloadOutlined />} onClick={resetConditions}>초기화</Button>
            <Button block htmlType="submit" type="primary" icon={<SearchOutlined />}>조회</Button>
            {hasDetail && (
              <Button
                block
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
    </FormProvider>
  );
}
