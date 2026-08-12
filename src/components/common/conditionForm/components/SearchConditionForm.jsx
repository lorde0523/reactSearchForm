import { useEffect, useMemo, useRef, useState } from 'react';
import {
  App as AntdApp,
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Select,
  Table,
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
} from '../model/conditionUtils';

const EMPTY_VALUES = {};
const EMPTY_CONDITIONS = [];

function PreviewTable({ preview }) {
  if (!preview.length) {
    return <div className="save-preview__empty">입력된 조회조건이 없습니다.</div>;
  }

  const columns = [
    { title: '조회 항목', dataIndex: 'label', key: 'label', width: 150, className: 'save-preview__label' },
    {
      title: '조회 값',
      key: 'value',
      render: (_, row) => row.fields.map((field) => {
        const valueOnly = field.type === 'checkbox' || row.fields.length === 1;
        return valueOnly ? field.value : `${field.label}: ${field.value}`;
      }).join(' / '),
    },
  ];

  return (
    <Table
      bordered
      className="save-preview"
      columns={columns}
      dataSource={preview}
      pagination={false}
      rowKey="key"
      size="small"
    />
  );
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
  const [conditionName, setConditionName] = useState('');
  const [selectedConditionId, setSelectedConditionId] = useState();
  const [snapshot, setSnapshot] = useState({ values: {}, preview: [] });
  const [saving, setSaving] = useState(false);
  const synchronizedForm = useRef({ defaultValues: undefined, methods: undefined });
  const hasDetail = rows.some((row) => row.detail);

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
    setConditionName('');
    setSaveModalOpen(true);
  };

  const saveCondition = async () => {
    const name = conditionName.trim();
    if (!name) {
      message.warning('저장할 조회조건 이름을 입력해 주세요.');
      return;
    }

    setSaving(true);
    try {
      await onSaveCondition?.({ conditionKey, name, values: snapshot.values });
      message.success('조회조건을 저장했습니다.');
      setSaveModalOpen(false);
    } catch (error) {
      message.error(error?.message || '조회조건을 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const restoreCondition = (id) => {
    setSelectedConditionId(id);
    const selected = savedConditions.find((condition) => condition.id === id);
    if (!selected) return;
    methods.reset(hydrateSavedValues(rows, selected.values, initialValues));
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
              options={savedConditions.map(({ id, name }) => ({ value: id, label: name }))}
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

        <Modal
        centered
        destroyOnHidden
        footer={null}
        open={saveModalOpen}
        title="조회조건 저장"
        width={680}
        onCancel={() => !saving && setSaveModalOpen(false)}
      >
        <div className="save-modal__name">
          <Typography.Text strong>저장 이름</Typography.Text>
          <Input
            autoFocus
            maxLength={40}
            placeholder="예: 이번 달 진행 건"
            showCount
            value={conditionName}
            onChange={(event) => setConditionName(event.target.value)}
            onPressEnter={(event) => {
              event.preventDefault();
              saveCondition();
            }}
          />
        </div>
        <PreviewTable preview={snapshot.preview} />
        <Divider className="save-modal__divider" />
        <div className="save-modal__footer">
          <Button disabled={saving} onClick={() => setSaveModalOpen(false)}>취소</Button>
          <Button loading={saving} type="primary" onClick={saveCondition}>저장</Button>
        </div>
        </Modal>
      </Form>
    </FormProvider>
  );
}
