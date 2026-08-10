# React 조회조건 폼

Ant Design과 react-hook-form으로 만든 스키마 기반 공통 조회조건 폼입니다. JavaScript/JSX만 사용합니다.

## 실행

```bash
pnpm install
pnpm dev
```

검증은 `pnpm test`, `pnpm build`로 실행합니다.

## 페이지에서 사용하기

페이지는 `rows` 스키마와 저장/조회 콜백을 전달합니다.

```jsx
<SearchConditionPanel
  conditionKey="order-search"
  rows={searchRows}
  defaultValues={{ status: 'active' }}
  savedConditions={savedConditions}
  onSearch={({ conditionKey, values }) => searchOrders(values)}
  onSaveCondition={({ conditionKey, name, values }) => saveCondition({ conditionKey, name, values })}
/>
```

`rows`는 `row → group → fields` 구조입니다. 기본 타입은 `text`, `number`, `select`, `date`, `dateRange`, `checkbox`이며, 페이지 전용 컴포넌트는 필드의 `render`로 추가합니다. 특수 값은 `serialize`, `deserialize`, `formatDisplay`를 정의하면 저장, 복원, 팝업 표시에서도 같은 스키마를 사용할 수 있습니다.

저장조건은 다음 형식으로 전달합니다.

```js
[{ id: 'condition-id', name: '저장 이름', values: { status: 'active' } }]
```
