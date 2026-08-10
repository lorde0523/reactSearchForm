import { useMemo, useState } from 'react';
import { App as AntdApp, Col, ConfigProvider, Input, Row, Table, Tag, Typography } from 'antd';
import koKR from 'antd/locale/ko_KR';
import SearchConditionForm from './components/search-condition/SearchConditionForm';
import SearchGroup from './components/search-condition/SearchGroup';
import SearchRow from './components/search-condition/SearchRow';
import {
  CheckboxField,
  CheckboxGroupField,
  CustomField,
  DateRangeField,
  NumberField,
  SelectField,
  TextField,
} from './components/search-condition/fields';

const statusOptions = [
  { label: '대기', value: 'waiting' },
  { label: '진행 중', value: 'active' },
  { label: '완료', value: 'done' },
];

const dateTypeOptions = [
  { label: '등록일', value: 'createdAt' },
  { label: '수정일', value: 'updatedAt' },
];

const channelOptions = [
  { label: '온라인', value: 'online' },
  { label: '전화', value: 'phone' },
  { label: '방문', value: 'visit' },
];

const notificationOptions = [
  { label: 'SMS', value: 'sms' },
  { label: '이메일', value: 'email' },
];

const searchConditionFields = (
  <>
    <SearchRow rowKey="basic" label="기본 조건" required>
      <TextField
        name="keyword"
        label="통합 검색"
        width={170}
        placeholder="고객명 또는 번호"
      />

      <SearchGroup groupKey="period" label="조회 기간">
        <SelectField
          name="dateType"
          label="날짜 기준"
          width={118}
          placeholder="날짜 기준"
          options={dateTypeOptions}
        />
        <DateRangeField name="period" label="조회 기간" width={250} />
      </SearchGroup>

      <SearchGroup groupKey="status" label="진행 상태">
        <SelectField
          name="status"
          label="진행 상태"
          width={140}
          placeholder="전체"
          options={statusOptions}
        />
      </SearchGroup>
    </SearchRow>

    <SearchRow rowKey="customer" label="고객 조건">
      <SearchGroup groupKey="customerInfo" label="고객 정보">
        <TextField name="customerName" label="고객명" width={140} placeholder="고객명" />
        <TextField
          name="customerNumber"
          label="고객 번호"
          width={150}
          placeholder="고객 번호"
          rules={{ pattern: { value: /^[0-9-]*$/, message: '숫자와 하이픈만 입력할 수 있습니다.' } }}
        />
      </SearchGroup>

      <SearchGroup groupKey="channel" label="접수 채널">
        <SelectField
          name="channel"
          label="접수 채널"
          width={140}
          placeholder="채널 선택"
          options={channelOptions}
        />
      </SearchGroup>
    </SearchRow>

    <SearchRow rowKey="detail" label="상세 조건" detail>
      <CheckboxField
        name="urgent"
        label="긴급 여부"
        text="긴급 건만"
        checkedText="긴급 건만"
        defaultValue={false}
      />

      <SearchGroup groupKey="amount" label="금액 범위">
        <NumberField name="minAmount" label="최소 금액" width={130} placeholder="최소 금액" />
        <NumberField name="maxAmount" label="최대 금액" width={130} placeholder="최대 금액" />
      </SearchGroup>

      <SearchGroup groupKey="notificationChannels" label="알림 채널">
        <CheckboxGroupField
          name="notificationChannels"
          label="알림 채널"
          defaultValue={[]}
          options={notificationOptions}
        />
      </SearchGroup>

      <SearchGroup groupKey="manager" label="담당자 코드">
        <CustomField
          name="managerCode"
          label="담당자 코드"
          width={150}
          render={({ controllerField }) => (
            <Input
              {...controllerField}
              value={controllerField.value ?? ''}
              allowClear
              prefix="M-"
              placeholder="코드 입력"
              style={{ width: 150 }}
            />
          )}
          serialize={(value) => String(value).trim().toUpperCase()}
          deserialize={(value) => String(value).toLowerCase()}
          formatDisplay={(value) => `M-${value}`}
        />
      </SearchGroup>
    </SearchRow>
  </>
);

const tableColumns = [
  { title: '번호', dataIndex: 'id', width: 80, align: 'center' },
  { title: '고객명', dataIndex: 'customer' },
  { title: '접수 채널', dataIndex: 'channel', width: 140 },
  {
    title: '진행 상태',
    dataIndex: 'status',
    width: 140,
    render: (value) => {
      const color = value === '완료' ? 'green' : value === '진행 중' ? 'blue' : 'default';
      return <Tag color={color}>{value}</Tag>;
    },
  },
  { title: '등록일', dataIndex: 'createdAt', width: 140 },
];

const tableData = [
  { id: '001', customer: '세빛상사', channel: '온라인', status: '진행 중', createdAt: '2026-08-01' },
  { id: '002', customer: '한봄유통', channel: '전화', status: '대기', createdAt: '2026-08-02' },
  { id: '003', customer: '미래테크', channel: '방문', status: '완료', createdAt: '2026-08-03' },
];

function BusinessSearchPage() {
  const { message } = AntdApp.useApp();
  const defaultValues = useMemo(() => ({ dateType: 'createdAt' }), []);
  const [savedConditions, setSavedConditions] = useState([
    { id: 'active-online', name: '진행 중인 온라인 건', values: { status: 'active', channel: 'online' } },
  ]);
  const [lastSearch, setLastSearch] = useState({});

  const handleSearch = ({ values }) => {
    setLastSearch(values);
    message.success('조회조건을 적용했습니다.');
  };

  const handleSaveCondition = async ({ name, values }) => {
    setSavedConditions((current) => [
      ...current,
      { id: `condition-${Date.now()}`, name, values },
    ]);
  };

  return (
    <main className="app-shell">
      <Row className="page-heading" align="bottom" justify="space-between">
        <Col>
          <Typography.Title level={3}>업무 조회</Typography.Title>
          <Typography.Text type="secondary">조건을 입력한 다음 조회해 주세요.</Typography.Text>
        </Col>
      </Row>

      <SearchConditionForm
        conditionKey="business-search"
        defaultValues={defaultValues}
        savedConditions={savedConditions}
        onSaveCondition={handleSaveCondition}
        onSearch={handleSearch}
      >
        {searchConditionFields}
      </SearchConditionForm>

      <section className="result-grid" aria-label="조회 결과">
        <Row className="result-grid__heading" align="middle" justify="space-between">
          <Col><Typography.Title level={5}>조회 결과</Typography.Title></Col>
          <Col><Typography.Text type="secondary">총 {tableData.length}건</Typography.Text></Col>
        </Row>
        <Table bordered columns={tableColumns} dataSource={tableData} pagination={false} rowKey="id" />
        <details className="query-debug">
          <summary>마지막 조회 payload</summary>
          <pre>{JSON.stringify(lastSearch, null, 2)}</pre>
        </details>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <ConfigProvider
      locale={koKR}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
          controlHeight: 32,
          colorBgLayout: '#f4f6f9',
        },
      }}
    >
      <AntdApp>
        <BusinessSearchPage />
      </AntdApp>
    </ConfigProvider>
  );
}
