# React 조회조건 폼

Ant Design과 react-hook-form으로 만든 JSX composition 기반 공통 조회조건 폼입니다. JavaScript/JSX만 사용합니다.

## 실행

```bash
pnpm install
pnpm dev
```

검증은 `pnpm test`, `pnpm build`로 실행합니다.

## 페이지에서 사용하기

페이지는 `SearchConditionForm` 안에 row, group, 타입별 필드를 직접 조립합니다.

```jsx
<SearchConditionForm
  conditionKey="order-search"
  defaultValues={{ status: 'active' }}
  savedConditions={savedConditions}
  onSearch={({ conditionKey, values }) => searchOrders(values)}
  onSaveCondition={({ conditionKey, name, values }) =>
    saveCondition({ conditionKey, name, values })
  }
>
  <SearchRow rowKey="basic" label="기본 조건" required>
    <TextField name="keyword" label="검색어" placeholder="검색어 입력" />

    <SearchGroup groupKey="status" label="진행 상태">
      <SelectField name="status" label="진행 상태" options={statusOptions} />
    </SearchGroup>
  </SearchRow>
</SearchConditionForm>
```

그룹에 포함되지 않은 필드는 저장 팝업에서 `SearchRow` 라벨 아래 하나로 합쳐집니다. 기본 입력은 `TextField`, `NumberField`, `SelectField`, `DateField`, `DateRangeField`, `CheckboxField`, `CheckboxGroupField`이며 페이지 전용 입력은 `CustomField`로 추가합니다.

특수 값은 `serialize`, `deserialize`, `formatDisplay`를 전달하면 저장, 복원, 팝업 표시에서도 같은 선언을 사용합니다. 단일 `CheckboxField`는 체크된 경우에만 표시되고, `CheckboxGroupField`는 선택된 option label만 `/`로 연결합니다.

각 입력은 `fields/` 아래 타입별 컴포넌트로 분리되어 있습니다. `ControlledField`가 react-hook-form의 `Controller`와 Ant Design `Form.Item`을 공통 처리합니다.

저장조건은 다음 형식으로 전달합니다.

```js
[{ id: 'condition-id', name: '저장 이름', values: { status: 'active' } }]
```
