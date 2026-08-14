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

export default function SearchConditionForm({
  conditionKey,
  defaultValues = EMPTY_VALUES,
  formMethods,
  savedConditions = EMPTY_CONDITIONS,
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

    synchronizedForm.current = { defaultValues, methods };
    methods.reset(initialValues);
    setSelectedConditionId(undefined);
  }, [defaultValues, initialValues, methods]);

  const collectSnapshot = () => createConditionSnapshot(rows, methods.getValues());

  const submitSearch = async () => {
    const nextSnapshot = collectSnapshot();
    await onSearch?.({ conditionKey, values: nextSnapshot.values });
  };

  const resetConditions = () => {
    methods.reset(initialValues);
    setSelectedConditionId(undefined);
    message.success('조회조건을 초기화했습니다.');
  };

  const openSaveModal = () => {
    setSnapshot(collectSnapshot());
    setSaveModalOpen(true);
  };

  const restoreCondition = (id) => {
    setSelectedConditionId(id);
    const selected = availableConditions.find((condition) => condition.selectionId === id);
    if (!selected) return;
    methods.reset(hydrateSavedValues(rows, parseSavedConditionValue(selected), initialValues));
    message.success(`‘${selected.name}’ 조건을 적용했습니다.`);
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
              onClear={() => setSelectedConditionId(undefined)}
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
