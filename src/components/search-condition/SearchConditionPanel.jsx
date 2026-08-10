import { useMemo, useState } from 'react';
import {
  App as AntdApp,
  Button,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import { DownOutlined, SearchOutlined, StarFilled, UpOutlined } from '@ant-design/icons';
import { FormProvider, useForm } from 'react-hook-form';
import FieldRenderer from './FieldRenderer';
import {
  buildDefaultValues,
  createConditionSnapshot,
  hydrateSavedValues,
} from './conditionUtils';

function PreviewContent({ preview }) {
  if (!preview.length) {
    return <div className="save-preview__empty">입력된 조회조건이 없습니다.</div>;
  }

  return (
    <div className="save-preview">
      {preview.map((row) => (
        <section className="save-preview__row" key={row.key}>
          <div className="save-preview__row-label">{row.label}</div>
          <div className="save-preview__groups">
            {row.groups.map((group) => (
              <Row className="save-preview__group" key={group.key} wrap={false}>
                <Col className="save-preview__group-label" flex="130px">{group.label}</Col>
                <Col flex="auto">
                  {group.fields.map((field) => (
                    <div className="save-preview__field" key={field.name}>
                      <span className="save-preview__field-name">{field.label}</span>
                      <span>{field.value}</span>
                    </div>
                  ))}
                </Col>
              </Row>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function SearchConditionPanel({
  conditionKey,
  rows,
  defaultValues = {},
  savedConditions = [],
  onSearch,
  onSaveCondition,
}) {
  const { message } = AntdApp.useApp();
  const initialValues = useMemo(
    () => buildDefaultValues(rows, defaultValues),
    [rows, defaultValues],
  );
  const methods = useForm({ defaultValues: initialValues, mode: 'onSubmit' });
  const [detailOpen, setDetailOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [conditionName, setConditionName] = useState('');
  const [selectedConditionId, setSelectedConditionId] = useState();
  const [snapshot, setSnapshot] = useState({ values: {}, preview: [] });
  const [saving, setSaving] = useState(false);

  const basicRows = useMemo(() => rows.filter((row) => !row.detail), [rows]);
  const detailRows = useMemo(() => rows.filter((row) => row.detail), [rows]);
  const visibleRows = detailOpen ? rows : basicRows;

  const collectSnapshot = () => createConditionSnapshot(rows, methods.getValues());

  const submitSearch = async () => {
    const nextSnapshot = collectSnapshot();
    await onSearch?.({ conditionKey, values: nextSnapshot.values });
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
        <Row className="search-panel__layout" align="stretch" wrap>
          <Col xs={24} md={6} xl={4} className="favorite-box">
            <Row align="middle" justify="space-between" wrap={false}>
              <Col><Typography.Text strong>조회조건 즐겨찾기</Typography.Text></Col>
              <Col>
                <Button type="text" size="small" icon={<StarFilled />} onClick={openSaveModal}>
                  저장
                </Button>
              </Col>
            </Row>
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
          </Col>

          <Col xs={24} md={18} xl={18} className="condition-box">
            {visibleRows.map((row) => (
              <Row className="condition-row" align="middle" key={row.key} wrap={false}>
                <Col className="condition-row__label" flex="112px">
                  <Typography.Text strong>{row.label}</Typography.Text>
                  {row.required && <span className="required-mark" aria-label="필수">*</span>}
                </Col>
                <Col className="condition-row__groups" flex="auto">
                  <Row align="middle" gutter={[28, 8]}>
                    {row.groups.map((group) => (
                      <Col className="condition-group" flex="none" key={group.key}>
                        <Row align="top" gutter={10} wrap={false}>
                          <Col className="condition-group__label" flex="none">
                            <Typography.Text>{group.label}</Typography.Text>
                          </Col>
                          <Col flex="auto">
                            <Space align="start" size={8} wrap>
                              {group.fields.map((field) => (
                                <FieldRenderer field={field} key={field.name} />
                              ))}
                            </Space>
                          </Col>
                        </Row>
                      </Col>
                    ))}
                  </Row>
                </Col>
              </Row>
            ))}
          </Col>

          <Col xs={24} xl={2} className="search-actions">
            <Row className="search-actions__buttons" align="middle" gutter={[8, 8]}>
              <Col xs={12} xl={24}>
                <Button block htmlType="submit" type="primary" icon={<SearchOutlined />}>
                  조회
                </Button>
              </Col>
              {detailRows.length > 0 && (
                <Col xs={12} xl={24}>
                  <Button
                    block
                    type="text"
                    icon={detailOpen ? <UpOutlined /> : <DownOutlined />}
                    onClick={() => setDetailOpen((current) => !current)}
                  >
                    {detailOpen ? '상세 닫기' : '상세조회'}
                  </Button>
                </Col>
              )}
            </Row>
          </Col>
        </Row>
      </Form>

      <Modal
        centered
        destroyOnHidden
        footer={null}
        open={saveModalOpen}
        title="조회조건 저장"
        width={680}
        onCancel={() => !saving && setSaveModalOpen(false)}
      >
        <Row className="save-modal__name" align="middle" gutter={12}>
          <Col flex="90px"><Typography.Text strong>저장 이름</Typography.Text></Col>
          <Col flex="auto">
            <Input
              autoFocus
              maxLength={40}
              placeholder="예: 이번 달 진행 건"
              showCount
              value={conditionName}
              onChange={(event) => setConditionName(event.target.value)}
              onPressEnter={saveCondition}
            />
          </Col>
        </Row>

        <PreviewContent preview={snapshot.preview} />

        <Divider className="save-modal__divider" />
        <Row justify="end" gutter={8}>
          <Col><Button disabled={saving} onClick={() => setSaveModalOpen(false)}>취소</Button></Col>
          <Col><Button loading={saving} type="primary" onClick={saveCondition}>저장</Button></Col>
        </Row>
      </Modal>
    </FormProvider>
  );
}
