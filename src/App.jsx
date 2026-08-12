import { useState } from 'react';
import { App as AntdApp, Col, ConfigProvider, Row, Switch, Table, Tabs, Tag, Typography } from 'antd';
import koKR from 'antd/locale/ko_KR';
import { useSearchConditionShareState } from './components/common/conditionForm';
import SearchConditionExample from './examples/SearchConditionExample';

const TAB_DEFAULT_VALUES = {
  reception: { dateType: 'createdAt', usePeriod: true },
  history: { dateType: 'updatedAt', usePeriod: true },
};

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
  const [activeTab, setActiveTab] = useState('reception');
  const [shareEnabled, setShareEnabled] = useState(false);
  const [savedConditionsByTab, setSavedConditionsByTab] = useState({
    reception: [
      { id: 'active-online', name: '진행 중인 온라인 건', values: { status: 'active', channel: 'online' } },
    ],
    history: [
      { id: 'completed', name: '완료된 변경 이력', values: { status: 'done' } },
    ],
  });
  const [lastSearch, setLastSearch] = useState({});
  const conditionShare = useSearchConditionShareState({
    activeTab,
    enabled: shareEnabled,
  });

  const handleSearch = ({ conditionKey, values }) => {
    setLastSearch({ conditionKey, values });
    message.success('조회조건을 적용했습니다.');
  };

  const handleSaveCondition = async ({ conditionKey, name, values }) => {
    setSavedConditionsByTab((current) => ({
      ...current,
      [conditionKey]: [
        ...(current[conditionKey] || []),
        { id: `${conditionKey}-${Date.now()}`, name, values },
      ],
    }));
  };

  return (
    <main className="app-shell">
      <Row className="page-heading" align="bottom" justify="space-between">
        <Col>
          <Typography.Title level={3}>업무 조회</Typography.Title>
          <Typography.Text type="secondary">조건을 입력한 다음 조회해 주세요.</Typography.Text>
        </Col>
        <Col className="share-control">
          <Typography.Text>현재 조회조건을 다른 탭에 공유</Typography.Text>
          <Switch
            aria-label="현재 조회조건 공유"
            checked={shareEnabled}
            onChange={setShareEnabled}
          />
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        className="search-tabs"
        destroyOnHidden={false}
        onChange={setActiveTab}
      >
        <Tabs.TabPane tab="접수 조회" key="reception">
          <SearchConditionExample
            conditionShare={conditionShare}
            defaultValues={TAB_DEFAULT_VALUES.reception}
            savedConditions={savedConditionsByTab.reception}
            tabKey="reception"
            onSaveCondition={handleSaveCondition}
            onSearch={handleSearch}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab="변경 이력 조회" key="history">
          <SearchConditionExample
            conditionShare={conditionShare}
            defaultValues={TAB_DEFAULT_VALUES.history}
            savedConditions={savedConditionsByTab.history}
            tabKey="history"
            onSaveCondition={handleSaveCondition}
            onSearch={handleSearch}
          />
        </Tabs.TabPane>
      </Tabs>

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
