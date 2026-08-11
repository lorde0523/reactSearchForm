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

## 필드별 onChange 추가 동작

모든 필드의 `onChange`는 RHF 값이 먼저 변경된 다음 `onChange(value, context)` 형태로 호출됩니다. `value`는 이벤트가 아닌 실제 입력값으로 정규화됩니다.

```jsx
<SelectField
  name="dateType"
  label="날짜 기준"
  options={dateTypeOptions}
  onChange={(value, { form, name, values, rawValue, args }) => {
    // 다른 필드를 함께 변경하는 예시
    form.setValue('period', undefined, { shouldDirty: true });

    // value: 현재 필드의 변경값
    // values: 변경 직후 전체 폼 값
    // args: Select option, DatePicker의 dateString 같은 AntD 추가 인자
  }}
/>
```

`TextField`는 문자열, `NumberField`는 숫자 또는 `null`, `SelectField`는 선택값, `DateField`는 dayjs 객체, `DateRangeField`는 dayjs 배열, `CheckboxField`는 boolean, `CheckboxGroupField`는 선택값 배열을 첫 번째 인자로 전달합니다.

자기 필드의 변경값은 `ControlledField`가 RHF에 먼저 저장하므로 사용자 `onChange` 안에서 다시 `setValue(name, value)`를 호출할 필요가 없습니다. `setValue`는 연관된 다른 필드를 변경할 때만 사용하면 됩니다.

```jsx
<TextField
  name="keyword"
  label="검색어"
  onChange={(value, { name, values }) => {
    // 이 시점에 keyword는 이미 RHF에 저장되어 있습니다.
    trackFieldChange({ name, value, allValues: values });
  }}
/>
```

## 서버에서 받은 초기값 적용

서버 응답을 state에 넣고 `defaultValues`로 전달하면 응답 객체가 변경되는 시점에 RHF의 `reset()`으로 전체 필드에 적용됩니다.

```jsx
function OrderSearchPage() {
  const [serverInitialValues, setServerInitialValues] = useState({});

  useEffect(() => {
    let active = true;

    getOrderSearchDefaults().then((response) => {
      if (active) setServerInitialValues(response.data);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <SearchConditionForm defaultValues={serverInitialValues}>
      <SearchRow rowKey="basic" label="기본 조건">
        <TextField name="keyword" label="검색어" />
        <SearchGroup groupKey="period" label="조회 기간">
          <DateRangeField name="period" label="조회 기간" />
        </SearchGroup>
      </SearchRow>
    </SearchConditionForm>
  );
}
```

서버 응답 예시는 다음과 같습니다. 날짜와 기간은 문자열로 받아도 필드의 `deserialize` 규칙에 따라 dayjs 값으로 변환됩니다.

```js
{
  keyword: '테스트 고객',
  dateType: 'createdAt',
  period: ['2026-08-01', '2026-08-31'],
  urgent: true,
  notificationChannels: ['sms', 'email']
}
```

### 필드별 초기값과 개별 변경

전체 `defaultValues`와 별도로 각 필드에 `initialValue`를 줄 수 있습니다. `initialValue`가 변경되면 해당 필드만 RHF에 다시 적용됩니다.

```jsx
function CustomerFields({ serverCustomer }) {
  return (
    <SearchRow rowKey="customer" label="고객 조건">
      <TextField
        name="customerName"
        label="고객명"
        initialValue={serverCustomer?.name}
        onChange={(value) => {
          console.log('RHF 저장 후 실행:', value);
        }}
      />

      <SelectField
        name="status"
        label="진행 상태"
        initialValue={serverCustomer?.status}
        options={statusOptions}
      />
    </SearchRow>
  );
}
```

초기값 우선순위는 `SearchConditionForm.defaultValues` → 필드 `initialValue` → 필드 `defaultValue`입니다. 배열이나 객체 형태의 `initialValue`는 불필요한 재적용을 막기 위해 state 또는 `useMemo`로 동일한 참조를 유지하는 것이 좋습니다.

저장조건은 다음 형식으로 전달합니다.

```js
[{ id: 'condition-id', name: '저장 이름', values: { status: 'active' } }]
```
