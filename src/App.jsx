import { useState } from 'react';
import { Col, ConfigProvider, Row, Table, Typography, message } from 'antd';
import koKR from 'antd/locale/ko_KR';
import SearchConditionPanel from './SearchConditionPanel';

const searchRows = [
  {
    key: 'basic', title: '기본 조건', required: true,
    groups: [
      {
        key: 'period', label: '조회 기간',
        fields: [
          { name: 'startType', type: 'select', width: 120, placeholder: '기준일', options: [
            { label: '등록일', value: 'created' }, { label: '수정일', value: 'updated' },
          ] },
          { name: 'period', type: 'dateRange', width: 245 },
        ],
      },
      {
        key: 'status', label: '진행 상태',
        fields: [{ name: 'status', type: 'select', width: 140, placeholder: '전체', options: [
          { label: '대기', value: 'waiting' }, { label: '진행 중', value: 'active' },
          { label: '완료', value: 'done' },
        ] }],
      },
    ],
  },
  {
    key: 'detail-a', title: '상세 조건 1', required: false,
    groups: [
      {
        key: 'customer', label: '고객 정보',
        fields: [
          { name: 'customerName', type: 'text', width: 140, placeholder: '고객명' },
          { name: 'customerNumber', type: 'text', width: 150, placeholder: '고객 번호' },
        ],
      },
      {
        key: 'channel', label: '접수 채널',
        fields: [{ name: 'channel', type: 'select', width: 140, placeholder: '채널 선택', options: [
          { label: '온라인', value: 'online' }, { label: '전화', value: 'phone' },
          { label: '방문', value: 'visit' },
        ] }],
      },
    ],
  },
  {
    key: 'detail-b', title: '상세 조건 2', required: false,
    groups: [
      {
        key: 'amount', label: '금액 범위',
        fields: [
          { name: 'minAmount', type: 'text', width: 130, placeholder: '최소 금액' },
          { name: 'maxAmount', type: 'text', width: 130, placeholder: '최대 금액' },
        ],
      },
      {
        key: 'urgent', label: '처리 구분',
        fields: [{ name: 'urgent', type: 'checkbox', text: '긴급 건만', checkedText: '긴급 건' }],
      },
    ],
  },
];

const gridColumns = [
  { title: '번호', dataIndex: 'id', width: 80, align: 'center' },
  { title: '고객명', dataIndex: 'customer' },
  { title: '접수 채널', dataIndex: 'channel', width: 140 },
  { title: '진행 상태', dataIndex: 'status', width: 140 },
  { title: '등록일', dataIndex: 'createdAt', width: 140 },
];

const gridData = [
  { id: '001', customer: '한빛상사', channel: '온라인', status: '진행 중', createdAt: '2026-08-01' },
  { id: '002', customer: '새봄유통', channel: '전화', status: '대기', createdAt: '2026-08-02' },
  { id: '003', customer: '미래테크', channel: '방문', status: '완료', createdAt: '2026-08-03' },
];

export default function App() {
  const [favoriteOptions, setFavoriteOptions] = useState([
    { label: '최근 등록 건', value: 'recent' },
    { label: '진행 중인 온라인 건', value: 'active-online' },
  ]);

  const handleSearch = (values) => {
    console.log('조회 조건:', values);
    message.success('조회 조건을 적용했습니다.');
  };

  const handleSaveFavorite = (payload) => {
    console.log('저장할 조회 조건:', payload);
    setFavoriteOptions((current) => [
      ...current,
      { label: payload.name, value: `favorite-${Date.now()}` },
    ]);
  };

  return (
    <ConfigProvider locale={koKR} theme={{ token: {
      colorPrimary: '#1677ff', borderRadius: 6, controlHeight: 32, colorBgLayout: '#f5f7fa',
    } }}>
      <main className="app-shell">
        <Row className="page-heading" align="bottom" justify="space-between">
          <Col>
            <Typography.Title level={3}>업무 조회</Typography.Title>
            <Typography.Text type="secondary">조건을 입력한 후 조회해 주세요.</Typography.Text>
          </Col>
        </Row>

        <SearchConditionPanel
          favoriteOptions={favoriteOptions}
          rows={searchRows}
          onSaveFavorite={handleSaveFavorite}
          onSearch={handleSearch}
        />

        <section className="result-grid" aria-label="조회 결과">
          <Row className="result-grid__heading" align="middle" justify="space-between">
            <Col><Typography.Title level={5}>조회 결과</Typography.Title></Col>
            <Col><Typography.Text type="secondary">총 {gridData.length}건</Typography.Text></Col>
          </Row>
          <Table bordered columns={gridColumns} dataSource={gridData} pagination={false} rowKey="id" />
        </section>
      </main>
    </ConfigProvider>
  );
}
