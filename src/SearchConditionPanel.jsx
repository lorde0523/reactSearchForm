import { useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  DatePicker,
  Divider,
  Input,
  Modal,
  Col,
  Row,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import {
  DownOutlined,
  SearchOutlined,
  StarFilled,
  UpOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Controller, FormProvider, useForm, useFormContext } from 'react-hook-form';

const { RangePicker } = DatePicker;

const isEmptyValue = (value) => {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value)) return value.length === 0 || value.every(isEmptyValue);
  return false;
};

const formatValue = (value, field) => {
  if (isEmptyValue(value)) return '';

  if (field.type === 'date') return dayjs(value).format(field.format || 'YYYY-MM-DD');
  if (field.type === 'dateRange') {
    return value.map((date) => dayjs(date).format(field.format || 'YYYY-MM-DD')).join(' ~ ');
  }
  if (field.type === 'checkbox') return value ? field.checkedText || '예' : '';
  if (field.type === 'select') {
    const values = Array.isArray(value) ? value : [value];
    return values
      .map((item) => field.options?.find((option) => option.value === item)?.label || item)
      .join(', ');
  }
  return String(value).trim();
};

function FieldRenderer({ field }) {
  const { control } = useFormContext();
  const commonStyle = { width: field.width || 160 };

  return (
    <Controller
      name={field.name}
      control={control}
      defaultValue={field.defaultValue ?? (field.type === 'checkbox' ? false : undefined)}
      render={({ field: hookField }) => {
        if (field.type === 'select') {
          return (
            <Select
              {...hookField}
              aria-label={field.label || field.placeholder}
              allowClear
              mode={field.mode}
              options={field.options}
              placeholder={field.placeholder || '선택'}
              style={commonStyle}
            />
          );
        }

        if (field.type === 'date') {
          return (
            <DatePicker
              {...hookField}
              aria-label={field.label || field.placeholder}
              format={field.format || 'YYYY-MM-DD'}
              placeholder={field.placeholder || '날짜 선택'}
              style={commonStyle}
            />
          );
        }

        if (field.type === 'dateRange') {
          return (
            <RangePicker
              {...hookField}
              aria-label={field.label || field.placeholder}
              format={field.format || 'YYYY-MM-DD'}
              style={{ width: field.width || 250 }}
            />
          );
        }

        if (field.type === 'checkbox') {
          return (
            <Checkbox
              checked={hookField.value}
              onBlur={hookField.onBlur}
              onChange={(event) => hookField.onChange(event.target.checked)}
            >
              {field.text}
            </Checkbox>
          );
        }

        return (
          <Input
            {...hookField}
            aria-label={field.label || field.placeholder}
            allowClear
            placeholder={field.placeholder || '입력'}
            style={commonStyle}
          />
        );
      }}
    />
  );
}

export default function SearchConditionPanel({
  rows,
  favoriteOptions = [],
  onSearch,
  onSaveFavorite,
}) {
  const methods = useForm({ mode: 'onSubmit' });
  const [detailOpen, setDetailOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);
  const [favoriteName, setFavoriteName] = useState('');
  const [selectedFavorite, setSelectedFavorite] = useState();

  const requiredRows = useMemo(() => rows.filter((row) => row.required), [rows]);
  const detailRows = useMemo(() => rows.filter((row) => !row.required), [rows]);
  const visibleRows = detailOpen ? rows : requiredRows;

  const makePreviewRows = () => {
    const values = methods.getValues();
    return rows.flatMap((row) =>
      row.groups.flatMap((group) => {
        const groupValues = group.fields
          .map((field) => formatValue(values[field.name], field))
          .filter(Boolean);

        if (!groupValues.length) return [];

        return [{
          key: `${row.key}-${group.key}`,
          label: group.label,
          value: groupValues.join(' / '),
        }];
      }),
    );
  };

  const openSaveModal = () => {
    setPreviewRows(makePreviewRows());
    setFavoriteName('');
    setSaveModalOpen(true);
  };

  const saveFavorite = async () => {
    if (!favoriteName.trim()) {
      message.warning('저장할 조회 조건의 이름을 입력해 주세요.');
      return;
    }

    const payload = {
      name: favoriteName.trim(),
      conditions: previewRows,
      formValues: methods.getValues(),
    };

    await onSaveFavorite?.(payload);
    message.success('조회 조건을 저장했습니다.');
    setSaveModalOpen(false);
  };

  const previewColumns = [
    { title: '조회 항목', dataIndex: 'label', key: 'label', width: '36%' },
    { title: '조회 값', dataIndex: 'value', key: 'value' },
  ];

  return (
    <FormProvider {...methods}>
      <form className="search-panel" onSubmit={methods.handleSubmit(onSearch)}>
        <Row className="search-panel__grid" align="stretch" wrap>
          <Col xs={24} md={5} xl={4} className="favorite-box" aria-label="조회 조건 즐겨찾기">
            <Row className="favorite-box__title-row" align="middle" justify="space-between" wrap={false}>
              <Col flex="auto">
                <Typography.Text strong>조회 조건 즐겨찾기</Typography.Text>
              </Col>
              <Col flex="none">
                <Button size="small" type="text" icon={<StarFilled />} onClick={openSaveModal}>
                  저장
                </Button>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Select
                  aria-label="저장된 조회 조건"
                  allowClear
                  options={favoriteOptions}
                  placeholder="선택하세요"
                  suffixIcon={<DownOutlined />}
                  value={selectedFavorite}
                  onChange={setSelectedFavorite}
                />
              </Col>
            </Row>
          </Col>

          <Col xs={24} md={19} xl={18} className="condition-box" aria-label="조회 조건 입력">
            {visibleRows.map((row) => (
              <Row className="condition-row" align="middle" key={row.key} wrap={false}>
                <Col className="condition-row__title" flex="112px">
                  <Typography.Text strong>{row.title}</Typography.Text>
                  {row.required && (
                    <Typography.Text className="required-mark" aria-label="필수">*</Typography.Text>
                  )}
                </Col>
                <Col className="condition-row__groups" flex="auto">
                  <Row align="middle" gutter={[28, 8]}>
                    {row.groups.map((group) => (
                      <Col className="condition-group" flex="none" key={group.key}>
                        <Row align="middle" gutter={10} wrap={false}>
                          <Col flex="none">
                            <Typography.Text className="condition-group__label">
                              {group.label}
                            </Typography.Text>
                          </Col>
                          <Col flex="auto">
                            <Space size={8} wrap>
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
                <Button block htmlType="submit" icon={<SearchOutlined />} type="primary">
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
                    {detailOpen ? '상세조회 닫기' : '상세조회'}
                  </Button>
                </Col>
              )}
            </Row>
          </Col>
        </Row>
      </form>

      <Modal
        centered
        destroyOnHidden
        footer={null}
        open={saveModalOpen}
        title="조회 조건 저장"
        width={620}
        onCancel={() => setSaveModalOpen(false)}
      >
        <Row className="save-modal__name" align="middle" gutter={12}>
          <Col flex="84px">
            <Typography.Text strong>저장 이름</Typography.Text>
          </Col>
          <Col flex="auto">
            <Input
              autoFocus
              maxLength={40}
              placeholder="예: 이번 달 진행 건"
              showCount
              value={favoriteName}
              onChange={(event) => setFavoriteName(event.target.value)}
              onPressEnter={saveFavorite}
            />
          </Col>
        </Row>

        <Table
          bordered
          columns={previewColumns}
          dataSource={previewRows}
          locale={{ emptyText: '입력된 조회 조건이 없습니다.' }}
          pagination={false}
          rowKey="key"
          size="small"
        />

        <Divider className="save-modal__divider" />
        <Row className="save-modal__footer" justify="end" gutter={8}>
          <Col>
            <Button onClick={() => setSaveModalOpen(false)}>취소</Button>
          </Col>
          <Col>
            <Button type="primary" onClick={saveFavorite}>저장</Button>
          </Col>
        </Row>
      </Modal>
    </FormProvider>
  );
}
