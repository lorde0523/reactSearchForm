import { useEffect, useMemo, useRef, useState } from 'react';
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

export async function resolvePreparedRestoreValues(prepareRestoreValues, context) {
  if (!prepareRestoreValues) return context.values;
  return (await prepareRestoreValues(context)) ?? context.values;
}

export default function SearchConditionForm({
  conditionKey,
  defaultValues = EMPTY_VALUES,
  formMethods,
  savedConditions = EMPTY_CONDITIONS,
  prepareRestoreValues,
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
  const [restoring, setRestoring] = useState(false);
  const restoreRequest = useRef({ controller: undefined, id: 0 });
  const synchronizedForm = useRef({ defaultValues: undefined, methods: undefined });
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

    restoreRequest.current.controller?.abort();
    restoreRequest.current = { controller: undefined, id: restoreRequest.current.id + 1 };
    synchronizedForm.current = { defaultValues, methods };
    methods.reset(initialValues);
    setRestoring(false);
    setSelectedConditionId(undefined);
  }, [defaultValues, initialValues, methods]);

  useEffect(() => () => {
    restoreRequest.current.controller?.abort();
  }, []);

  const collectSnapshot = () => createConditionSnapshot(rows, methods.getValues());

  const submitSearch = async () => {
    if (restoring) return;
    const nextSnapshot = collectSnapshot();
    await onSearch?.({ conditionKey, values: nextSnapshot.values });
  };

  const resetConditions = () => {
    restoreRequest.current.controller?.abort();
    restoreRequest.current = { controller: undefined, id: restoreRequest.current.id + 1 };
    setRestoring(false);
    methods.reset(initialValues);
    setSelectedConditionId(undefined);
    message.success('조회조건을 초기화했습니다.');
  };

  const openSaveModal = () => {
    setSnapshot(collectSnapshot());
    setSaveModalOpen(true);
  };

  const restoreCondition = async (id) => {
    setSelectedConditionId(id);
    const selected = availableConditions.find((condition) => condition.selectionId === id);
    if (!selected) return;

    restoreRequest.current.controller?.abort();
    const controller = new AbortController();
    const requestId = restoreRequest.current.id + 1;
    restoreRequest.current = { controller, id: requestId };
    setRestoring(true);

    try {
      const values = hydrateSavedValues(
        rows,
        parseSavedConditionValue(selected),
        initialValues,
      );
      const preparedValues = await resolvePreparedRestoreValues(prepareRestoreValues, {
        conditionKey,
        form: methods,
        initialValues,
        savedCondition: selected,
        signal: controller.signal,
        values,
      });

      if (controller.signal.aborted || restoreRequest.current.id !== requestId) return;

      methods.reset(preparedValues);
      message.success(`‘${selected.name}’ 조건을 적용했습니다.`);
    } catch (error) {
      if (controller.signal.aborted || restoreRequest.current.id !== requestId) return;

      setSelectedConditionId(undefined);
      message.error('조회조건을 불러오지 못했습니다.');
      console.error(error);
    } finally {
      if (restoreRequest.current.id === requestId) {
        restoreRequest.current = { controller: undefined, id: requestId };
        setRestoring(false);
      }
    }
  };

  const clearSelectedCondition = () => {
    restoreRequest.current.controller?.abort();
    restoreRequest.current = { controller: undefined, id: restoreRequest.current.id + 1 };
    setRestoring(false);
    setSelectedConditionId(undefined);
  };

  return (
    <FormProvider {...methods}>
      <Form
        aria-busy={restoring}
        className={`search-panel${restoring ? ' search-panel--restoring' : ''}`}
        layout="vertical"
        onFinish={methods.handleSubmit(submitSearch)}
      >
        <div className="search-panel__layout">
          <div className="favorite-box">
            <div className="favorite-box__heading">
              <Typography.Text strong>조회조건 즐겨찾기</Typography.Text>
              <Button
                disabled={restoring}
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
              disabled={restoring}
              loading={restoring}
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
            <Button block disabled={restoring} icon={<ReloadOutlined />} onClick={resetConditions}>초기화</Button>
            <Button block disabled={restoring} htmlType="submit" type="primary" icon={<SearchOutlined />}>조회</Button>
            {hasDetail && (
              <Button
                block
                disabled={restoring}
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
