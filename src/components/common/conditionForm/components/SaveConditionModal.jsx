import { Fragment, useEffect, useState } from 'react';
import {
  App as AntdApp,
  Button,
  Divider,
  Input,
  Modal,
  Table,
  Typography,
} from 'antd';

const COLLAPSED_ITEM_COUNT = 5;

export function createSaveConditionPayload(conditionKey, name, value) {
  return {
    key: conditionKey,
    name: name.trim(),
    value,
  };
}

function PreviewFieldValue({ field }) {
  const [expanded, setExpanded] = useState(false);
  const items = field.previewItems;

  if (!items?.length) return field.value;

  const hasMore = items.length > COLLAPSED_ITEM_COUNT;
  const visibleItems = expanded ? items : items.slice(0, COLLAPSED_ITEM_COUNT);

  return (
    <span className="save-preview__multi-value">
      <span>{visibleItems.join(' / ')}</span>
      {hasMore && (
        <Button
          className="save-preview__more"
          size="small"
          type="link"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? '접기' : '더보기'}
        </Button>
      )}
    </span>
  );
}

function PreviewLine({ fields }) {
  return (
    <div className="save-preview__line">
      {fields.map((field, index) => {
        const valueOnly = field.type === 'checkbox' || fields.length === 1;

        return (
          <Fragment key={field.name}>
            {index > 0 && <span> / </span>}
            <span>
              {!valueOnly && `${field.label}: `}
              <PreviewFieldValue field={field} />
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}

export function PreviewTable({ preview }) {
  if (!preview.length) {
    return <div className="save-preview__empty">입력된 조회조건이 없습니다.</div>;
  }

  const columns = [
    { title: '조회 항목', dataIndex: 'label', key: 'label', width: 150, className: 'save-preview__label' },
    {
      title: '조회 값',
      key: 'value',
      render: (_, row) => (row.lines || [{ key: row.key, fields: row.fields }])
        .map((line) => <PreviewLine key={line.key} fields={line.fields} />),
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

export default function SaveConditionModal({
  conditionKey,
  open,
  preview,
  value,
  onCancel,
  onSaveCondition,
}) {
  const { message } = AntdApp.useApp();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setName('');
  }, [open]);

  const saveCondition = async () => {
    const payload = createSaveConditionPayload(conditionKey, name, value);
    if (!payload.name) {
      message.warning('저장할 조회조건 이름을 입력해 주세요.');
      return;
    }

    setSaving(true);
    try {
      await onSaveCondition?.(payload);
      message.success('조회조건을 저장했습니다.');
      onCancel();
    } catch (error) {
      message.error(error?.message || '조회조건을 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      centered
      destroyOnHidden
      footer={null}
      open={open}
      title="조회조건 저장"
      width={680}
      onCancel={() => !saving && onCancel()}
    >
      <div className="save-modal__name">
        <Typography.Text strong>저장 이름</Typography.Text>
        <Input
          autoFocus
          maxLength={40}
          placeholder="예: 이번 달 진행 건"
          showCount
          value={name}
          onChange={(event) => setName(event.target.value)}
          onPressEnter={(event) => {
            event.preventDefault();
            if (!saving) saveCondition();
          }}
        />
      </div>
      <PreviewTable preview={preview} />
      <Divider className="save-modal__divider" />
      <div className="save-modal__footer">
        <Button disabled={saving} onClick={onCancel}>취소</Button>
        <Button loading={saving} type="primary" onClick={saveCondition}>저장</Button>
      </div>
    </Modal>
  );
}
