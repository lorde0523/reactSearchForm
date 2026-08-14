# React 조회조건 폼

Ant Design과 react-hook-form으로 만든 JSX composition 기반 공통 조회조건 폼입니다. JavaScript/JSX만 사용합니다.

## 실행

```bash
pnpm install
pnpm dev
```

검증은 `pnpm test`, `pnpm build`로 실행합니다.

## 공통 조회조건 모듈 구조

조회조건 모듈은 페이지와 분리된 공통 컴포넌트이며, 내부 구조는 다음과 같습니다.

```text
src/components/common/conditionForm/
├─ fields/      # RHF Controller와 연결된 입력 필드
├─ components/  # SearchConditionForm, SearchGroup, SearchRow
├─ hooks/       # 탭 사이 현재 조회조건 공유 훅
├─ model/       # 초기값, 저장 스냅샷, picker 설정, context
├─ styles.css
└─ index.js     # 모든 페이지에서 사용하는 공개 API
```

하위 폴더별 `index.js`는 일괄적으로 만들지 않습니다. 여러 필드를 묶는 `fields/index.js`와 조회조건 모듈의 공개 진입점인 최상위 `index.js`만 유지합니다. `components`, `hooks`는 최상위에서 각 파일을 직접 export합니다.

페이지에서는 조회조건 내부 경로를 직접 참조하지 않고 공통 진입점만 import합니다.

```jsx
import {
  SearchConditionForm,
  SearchGroup,
  SearchRow,
  SelectField,
  TextField,
} from '../components/common/conditionForm';
```

## 페이지에서 사용하기

페이지는 `SearchConditionForm` 안에 row, group, 타입별 필드를 직접 조립합니다.

```jsx
<SearchConditionForm
  conditionKey="order-search"
  defaultValues={{ status: 'active' }}
  savedConditions={savedConditions}
  onSearch={({ conditionKey, values }) => searchOrders(values)}
  onSaveCondition={({ key, name, value }) =>
    saveCondition({ key, name, value })
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

`SearchGroup`의 `label`과 `className`은 내부 `Form.Item`에 적용됩니다. 그룹 바깥쪽 `Col`에 클래스가 필요하면 `groupClassName`을 사용합니다.

그룹 앞의 활성화 체크박스는 `toggle`로 설정합니다. `defaultValue`를 생략하면 기본값은 `false`이므로 처음에는 체크가 해제되고 자식 필드도 비활성화됩니다. 체크를 해제하면 자식 필드는 조회·저장 값에서도 제외됩니다. 각 자식 필드에 같은 `dependencies`와 `disabled`를 반복할 필요가 없습니다.

```jsx
<SearchGroup
  groupKey="period"
  label="조회 기간"
  className="period-form-item"
  groupClassName="period-group"
  toggle={{
    name: 'usePeriod',
    label: '조회 기간 사용',
    checkedText: '사용',
    onChange: (checked, { form }) => {
      console.log(checked, form.getValues());
    },
  }}
>
  <SelectField name="dateType" label="날짜 기준" options={dateTypeOptions} />
  <DateRangeField name="period" label="조회 기간" />
</SearchGroup>
```

`SearchRow`에는 `toggle`을 두지 않습니다. 행 전체를 제어해야 하면 기준이 되는 `SearchGroup.toggle`에 `controlRow: true`를 추가합니다. 이 옵션을 생략하면 해당 그룹만 활성화·비활성화합니다.

```jsx
<SearchRow rowKey="customer" label="고객 조건">
  <TextField name="customerName" label="고객명" />

  <SearchGroup
    groupKey="channel"
    label="접수 채널"
    toggle={{
      name: 'useChannel',
      label: '접수 채널 사용',
      checkedText: '사용',
      controlRow: true,
    }}
  >
    <SelectField name="channel" label="접수 채널" options={channelOptions} />
  </SearchGroup>
</SearchRow>
```

위 예제에서는 `useChannel`이 해제되면 그룹 바깥의 `customerName`과 같은 행의 다른 그룹까지 비활성화됩니다. 행을 제어하는 체크박스는 다시 켤 수 있도록 비활성화되지 않습니다. 한 행에는 `controlRow: true`인 그룹을 하나만 둘 수 있습니다.

최상단 행 라벨이 필요하지 않은 줄은 `SearchRow.label`을 생략할 수 있습니다. 이때 저장 메타데이터와 React key가 안정적으로 생성되도록 `rowKey`는 반드시 지정합니다.

```jsx
<SearchRow rowKey="customer">
  <SearchGroup
    groupKey="customerInfo"
    label="고객 정보"
    toggle={{
      name: 'useCustomerConditions',
      label: '고객 조건 사용 여부',
      text: '고객 조건 사용',
      checkedText: '고객 조건 사용',
      controlRow: true,
      hideInPreview: true,
    }}
  >
    <TextField name="customerName" label="고객명" />
  </SearchGroup>
  <SearchGroup groupKey="channel" label="접수 채널">
    <SelectField name="channel" label="접수 채널" options={channelOptions} />
  </SearchGroup>
</SearchRow>
```

`toggle.label`은 접근성 이름이고 `text`는 화면에 표시할 체크박스 문구입니다. `defaultValue`를 생략하면 체크 해제 상태로 시작하며 두 그룹도 비활성화됩니다. `hideInPreview: true`이면 저장값에는 체크 상태를 유지하되 저장 팝업에는 체크박스 자체를 표시하지 않습니다.

주차·월·연도 Picker는 다음 6개를 제공합니다.

| 컴포넌트 | Picker | 저장 value 포맷 | 화면 포맷 |
| --- | --- | --- | --- |
| `WeekPickerField` | 주차 단일 | `YYYYwo` | `YYYY-w주차` |
| `WeekRangePickerField` | 주차 범위 | `YYYYwo` 배열 | `YYYY-w주차` |
| `MonthPickerField` | 월 단일 | `YYYYMM` | `YYYY-MM` |
| `MonthRangePickerField` | 월 범위 | `YYYYMM` 배열 | `YYYY-MM` |
| `YearPickerField` | 연도 단일 | `YYYY` | `YYYY` |
| `YearRangePickerField` | 연도 범위 | `YYYY` 배열 | `YYYY` |

6개 개별 컴포넌트 대신 `PeriodPickerField` 하나로도 동일하게 작성할 수 있습니다. `picker`는 `week`, `month`, `year` 중 하나이며 `range`를 지정하면 범위 Picker가 됩니다.

```jsx
<PeriodPickerField name="week" label="기준 주차" picker="week" />
<PeriodPickerField name="weekRange" label="주차 범위" picker="week" range />

<PeriodPickerField name="month" label="기준 월" picker="month" />
<PeriodPickerField name="monthRange" label="월 범위" picker="month" range />

<PeriodPickerField name="year" label="기준 연도" picker="year" />
<PeriodPickerField name="yearRange" label="연도 범위" picker="year" range />
```

통합 컴포넌트도 `initialValue`, `onChange`, `valueFormat`, `displayFormat`, `width`, `rules`를 동일하게 지원합니다. `valueFormat`과 `displayFormat`을 생략하면 위 표의 기본 포맷을 사용합니다.

추가 기본 필드는 다음과 같습니다.

| 컴포넌트 | 용도 |
| --- | --- |
| `RadioGroupField` | 일반 라디오 옵션 그룹 |
| `RadioButtonGroupField` | 버튼 형태 라디오 그룹 |
| `SwitchField` | boolean on/off 입력 |
| `TextAreaField` | 여러 줄 텍스트 입력 |
| `AutoCompleteField` | 직접 입력과 추천 옵션 선택 |

```jsx
<RadioGroupField
  name="priority"
  label="우선순위"
  options={priorityOptions}
/>

<RadioButtonGroupField
  name="priorityButton"
  label="우선순위 버튼"
  options={priorityOptions}
/>

<SwitchField
  name="includeClosed"
  label="종료 건 포함"
  checkedText="포함"
  uncheckedText="제외"
/>

<AutoCompleteField
  name="region"
  label="지역"
  options={regionOptions}
/>

<TextAreaField
  name="memoKeyword"
  label="메모 검색어"
/>
```

```jsx
<SearchGroup groupKey="pickerExamples" label="날짜 기준">
  <WeekPickerField name="week" label="기준 주차" />
  <WeekRangePickerField name="weekRange" label="주차 범위" />
  <MonthPickerField name="month" label="기준 월" />
  <MonthRangePickerField name="monthRange" label="월 범위" />
  <YearPickerField name="year" label="기준 연도" />
  <YearRangePickerField name="yearRange" label="연도 범위" />
</SearchGroup>
```

특수 값은 `serialize`, `deserialize`, `formatDisplay`를 전달하면 저장, 복원, 팝업 표시에서도 같은 선언을 사용합니다. 단일 `CheckboxField`는 체크된 경우에만 표시되고, `CheckboxGroupField`는 선택된 option label만 `/`로 연결합니다.

각 입력은 `fields/` 아래 타입별 컴포넌트로 분리되어 있습니다. `ControlledField`가 react-hook-form의 `Controller`와 Ant Design `Form.Item`을 공통 처리합니다.

## 화면 외부에서 폼값 변경

페이지에서 폼값을 직접 읽거나 변경해야 하면 부모에서 `useForm()`을 만들고 `formMethods`로 전달합니다. `formMethods`를 생략하면 `SearchConditionForm`이 내부 폼을 생성하므로 기존 사용법도 그대로 동작합니다.

```jsx
const formMethods = useForm();

<Button
  onClick={() => {
    formMethods.setValue('usePeriod', true, { shouldDirty: true });
    formMethods.setValue('dateType', 'updatedAt', {
      shouldDirty: true,
      shouldValidate: true,
    });
  }}
>
  외부에서 폼 값 변경
</Button>

<SearchConditionForm formMethods={formMethods}>
  {/* 조회조건 */}
</SearchConditionForm>
```

현재 전체값은 `formMethods.getValues()`, 특정값 구독은 `useWatch({ control: formMethods.control, name: 'status' })`, 전체 초기화는 `formMethods.reset(values)`를 사용합니다.

## 탭 사이 현재 조회조건 공유

각 `Tabs.TabPane` 안의 화면이 자체 `useForm()`과 `SearchConditionForm`을 가지면서도 현재 조회조건만 선택적으로 공유할 수 있습니다. 공유 폼을 따로 만들지 않고 다음 두 훅을 사용합니다.

- `useSearchConditionShareState`: Tabs가 있는 상위 화면에서 공유 여부와 최신 공유값 관리
- `useSearchConditionSync`: 각 하위 탭의 RHF 폼을 공유값과 동기화

공유 여부에는 별도 type이 필요하지 않습니다. 토글 화면은 state, 항상 공유하는 화면은 `true`, 공유하지 않는 화면은 `false`를 전달합니다.

```jsx
const SHARED_FIELD_NAMES = [
  'keyword',
  'dateType',
  'period',
  'status',
];

function SearchTabs() {
  const [activeTab, setActiveTab] = useState('order');
  const [shareEnabled, setShareEnabled] = useState(false);

  const conditionShare = useSearchConditionShareState({
    activeTab,
    enabled: shareEnabled,
    fieldNames: SHARED_FIELD_NAMES,
  });

  return (
    <>
      <Switch
        checked={shareEnabled}
        onChange={setShareEnabled}
      />

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="주문 조회" key="order">
          <OrderSearchTab conditionShare={conditionShare} />
        </Tabs.TabPane>

        <Tabs.TabPane tab="배송 조회" key="delivery">
          <DeliverySearchTab conditionShare={conditionShare} />
        </Tabs.TabPane>
      </Tabs>
    </>
  );
}
```

하위 탭은 기존처럼 자체 폼을 생성하고 동기화 훅만 추가합니다.

```jsx
function OrderSearchTab({ conditionShare }) {
  const formMethods = useForm();

  useSearchConditionSync({
    tabKey: 'order',
    formMethods,
    conditionShare,
  });

  return (
    <SearchConditionForm
      conditionKey="order"
      formMethods={formMethods}
      savedConditions={orderSavedConditions}
    >
      {/* 주문 탭 조회조건 */}
    </SearchConditionForm>
  );
}
```

활성 탭이 공유값의 기준이 됩니다. 토글을 켜는 순간 현재 활성 탭의 기존값이 전달되고, 이후 변경값도 다른 탭에 반영됩니다. 아직 열지 않은 탭은 처음 마운트될 때 최신 공유값을 적용합니다.

항상 공유하는 화면은 토글을 렌더링하지 않고 고정값을 사용합니다.

```jsx
const shareEnabled = true;
```

공유하지 않는 화면은 `false`를 전달하거나 두 훅을 사용하지 않습니다.

```jsx
const shareEnabled = false;
```

`fieldNames`를 생략하면 폼 전체를 공유하고, 지정하면 해당 필드만 공유합니다. 저장된 조회조건 목록은 이 훅의 대상이 아니므로 기존처럼 각 탭의 `conditionKey`와 `savedConditions`로 분리합니다.

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

## 다른 필드값으로 disabled 제어

모든 기본 필드는 고정 boolean `disabled`와 함수형 `disabled`를 지원합니다. 함수형 조건에서는 `dependencies`에 감시할 RHF 필드명을 지정합니다.

```jsx
<SelectField
  name="dateType"
  label="날짜 기준"
  options={dateTypeOptions}
/>

<DateRangeField
  name="period"
  label="조회 기간"
  dependencies={['dateType']}
  disabled={({ values }) => !values.dateType}
/>
```

여러 필드를 함께 사용할 수도 있습니다.

```jsx
<PeriodPickerField
  name="monthRange"
  label="월 범위"
  picker="month"
  range
  dependencies={['dateType', 'status']}
  disabled={({ values }) => (
    !values.dateType || values.status === 'done'
  )}
/>
```

`disabled` 함수에는 `{ dependencyValues, field, form, name, values }`가 전달됩니다. `useWatch`는 `dependencies`에 지정된 필드만 구독하므로 관련 값이 변경될 때 해당 입력만 다시 계산됩니다.

비활성화는 현재 값을 자동으로 지우지 않습니다. 값도 제거해야 한다면 원인이 되는 필드의 `onChange`에서 처리합니다.

```jsx
<SelectField
  name="dateType"
  label="날짜 기준"
  onChange={(value, { form }) => {
    if (!value) form.setValue('period', undefined);
  }}
/>
```

`CustomField`에는 계산된 `disabled`가 render 콜백으로 전달되므로 실제 커스텀 입력에 직접 연결합니다.

```jsx
<CustomField
  name="customCode"
  label="사용자 코드"
  dependencies={['status']}
  disabled={({ values }) => values.status === 'done'}
  render={({ controllerField, disabled }) => (
    <MyCustomInput
      {...controllerField}
      disabled={disabled}
    />
  )}
/>
```

## 필드 스타일 전달

모든 기본 필드는 입력 컴포넌트에 적용되는 `style`, `className`과 `Form.Item`에 적용되는 `formItemStyle`, `formItemClassName`을 지원합니다.

```jsx
<TextField
  name="keyword"
  label="검색어"
  width={160}
  style={{ width: 240, backgroundColor: '#fafafa' }}
  className="keyword-input"
  formItemStyle={{ marginRight: 12 }}
  formItemClassName="keyword-form-item"
/>
```

`width`와 `style.width`를 함께 전달하면 `style.width`가 우선합니다. `CustomField`는 render의 `field.style`, `field.className`, `field.formItemStyle`을 사용해 커스텀 입력에 직접 연결할 수 있습니다.

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

조회조건 저장 API는 `key`, `name`, `value` 컬럼 기준으로 전달합니다.

```js
{
  key: 'order-search',
  name: '진행 중 주문',
  value: {
    status: 'active',
    channel: 'online'
  }
}
```

- `key`: 화면 또는 탭을 구분하는 `SearchConditionForm.conditionKey`
- `name`: 저장 모달에서 사용자가 입력한 조회조건 이름
- `value`: RHF에서 수집하고 직렬화한 실제 조회조건 값

서버로 전송할 때 `value` 컬럼이 문자열 타입이면 API 호출 직전에 JSON으로 변환합니다.

```jsx
const handleSaveCondition = ({ key, name, value }) => {
  return saveConditionApi({
    key,
    name,
    value: JSON.stringify(value),
  });
};
```

저장 목록은 다음 형태로 `savedConditions`에 전달합니다. `value`는 객체와 JSON 문자열을 모두 지원합니다.

```js
[
  {
    id: 'condition-id', // API가 식별자를 제공하면 전달
    key: 'order-search',
    name: '진행 중 주문',
    value: '{"status":"active","channel":"online"}'
  }
]
```

### 저장한 조회조건 불러오기

조회조건 복원은 다음 순서로 처리됩니다.

```text
savedConditions에서 현재 conditionKey와 같은 항목 필터링
→ 사용자가 저장조건 name 선택
→ 선택한 항목의 value 파싱
→ 화면 필드의 name과 저장값의 key 매칭
→ 필드 타입에 맞게 deserialize
→ react-hook-form methods.reset()
```

실제 값을 다시 필드에 넣을 때 기준이 되는 것은 Row 또는 Group 라벨이 아니라 각 필드의 `name`입니다. Row/Group 라벨과 `preview`는 저장 모달 표시 용도로만 사용됩니다.

```jsx
<TextField name="customerName" label="고객명" />
<DateRangeField name="period" label="조회 기간" />
<CustomField
  component={ApiSharedCodeSelect}
  name="sharedCodes"
  label="공통 코드"
/>
```

위 화면에 다음 `value`를 적용하면 같은 이름의 필드에 값이 연결됩니다.

```js
{
  customerName: '홍길동',
  period: ['2026-08-01', '2026-08-31'],
  sharedCodes: [
    {
      disabled: false,
      key: 'A',
      label: '진행 중',
      title: '진행 중',
      value: 'active'
    }
  ]
}
```

저장 목록을 선택하면 `SearchConditionForm`은 객체 또는 JSON 문자열인 `condition.value`를 파싱합니다. 이전 형식인 `condition.values`도 읽기 호환하지만 새 저장 요청은 항상 `value`를 사용합니다. 문자열 상태에서 `Object.entries()`를 실행하면 문자 인덱스가 수천 개 생성되므로 반드시 먼저 객체로 정규화합니다.

```js
const rawValue = condition.value ?? condition.values ?? {};
const savedValue = normalizeSavedValues(rawValue);
```

`normalizeSavedValues()`는 객체, JSON 문자열, 이중으로 `JSON.stringify()`된 문자열까지 처리하며 잘못된 문자열이나 배열은 빈 객체로 반환합니다. `hydrateSavedValues()` 내부에서도 동일한 정규화를 수행하므로 직접 호출해도 문자열이 문자 단위로 분해되지 않습니다.

파싱한 값은 현재 화면에 존재하는 필드만 `name`으로 매칭합니다. 저장 데이터에 현재 화면에 없는 이름이 있으면 복원 대상에서 제외됩니다.

```js
const hydratedValues = hydrateSavedValues(
  rows,
  savedValue,
  initialValues,
);

methods.reset(hydratedValues);
```

타입별 복원 방식은 다음과 같습니다.

- 일반 입력, Select, Checkbox: 저장값을 그대로 사용
- DatePicker: 날짜 문자열을 dayjs 객체로 변환
- RangePicker: 날짜 문자열 배열을 dayjs 객체 배열로 변환
- Week/Month/Year Picker: 해당 필드의 저장 포맷으로 파싱
- CustomField: 객체 또는 객체 배열을 그대로 사용
- `deserialize`를 지정한 필드: 해당 함수의 반환값 사용

커스텀 멀티셀렉트는 저장한 객체 배열이 `Controller`를 통해 컴포넌트의 `value`로 다시 전달됩니다.

```text
condition.value.sharedCodes
→ hydrateSavedValues()
→ methods.reset({ sharedCodes: [...] })
→ Controller(name="sharedCodes")
→ ApiSharedCodeSelect.value
```

서버 저장 후에는 저장 API의 성공 응답을 기존 `savedConditions`에 추가하거나 목록 API를 다시 호출해야 즐겨찾기 Select에 새 항목이 나타납니다.

```jsx
const handleSaveCondition = async ({ key, name, value }) => {
  await saveConditionApi({
    key,
    name,
    value: JSON.stringify(value),
  });

  await refetchSavedConditions(key);
};
```

## API 기반 커스텀 멀티 셀렉트 연결

`CustomField`에 `component`를 지정하면 조회조건 관리에 필요한 props를 제외한 나머지 props가 커스텀 컴포넌트로 그대로 전달됩니다. 따라서 `api`, `params`, `activeTabKey` 등 `ApiSharedCodeSelect`가 제공하는 API를 최상위 props로 작성하면 됩니다.

### RHF 값으로 기존 `searchForm` 객체 만들기

기존 컴포넌트가 `searchForm.techCd`처럼 값을 참조한다면 `useForm()`의 메서드 객체를 직접 보내지 않고 `useWatch()` 결과를 `searchForm`으로 전달합니다.

```jsx
import { useForm, useWatch } from 'react-hook-form';

function useSearchFormValues(formMethods) {
  return useWatch({
    control: formMethods.control,
  }) ?? {};
}
```

페이지에서 다음처럼 사용합니다.

```jsx
function TechSearchPage() {
  const formMethods = useForm({
    defaultValues: {
      useTechCondition: false,
      techCd: undefined,
      detailTechCd: [],
    },
  });
  const searchForm = useSearchFormValues(formMethods);

  return (
    <SearchConditionForm formMethods={formMethods}>
      <SearchRow rowKey="tech" label="기술 조건">
        <CheckboxField
          name="useTechCondition"
          text="기술 조건 사용"
          defaultValue={false}
        />
        <SelectField
          name="techCd"
          label="기술 코드"
          options={techOptions}
        />
        <CustomField
          component={ApiSharedCodeSelect}
          name="detailTechCd"
          label="상세 기술 코드"
          defaultValue={[]}
          api={getSharedCodes}
          params={{ techCd: searchForm.techCd }}
          disabled={!searchForm.useTechCondition || !searchForm.techCd}
        />
      </SearchRow>
    </SearchConditionForm>
  );
}
```

`useWatch()`가 폼 변경을 구독하므로 `techCd`가 바뀌면 `searchForm.techCd`와 `params`도 다시 계산됩니다. 이 경우 `params` 갱신을 위한 별도의 `dependencies`는 필요하지 않습니다.

각 필드에는 필요한 파라미터만 명시적으로 추가하면 됩니다.

```jsx
// 첫 번째 필드: params 없음
<CustomField
  component={ApiSharedCodeSelect}
  name="techCd"
  api={getTechCodes}
/>

// 두 번째 필드: 이전 값 1개
<CustomField
  component={ApiSharedCodeSelect}
  name="detailTechCd"
  api={getDetailTechCodes}
  params={{ techCd: searchForm.techCd }}
/>

// 다음 필드: 필요한 이전 값만 추가
<CustomField
  component={ApiSharedCodeSelect}
  name="productCd"
  api={getProductCodes}
  params={{
    techCd: searchForm.techCd,
    detailTechCd: searchForm.detailTechCd,
  }}
/>
```

필드 값이 `{ label, value }` 객체나 멀티 셀렉트 객체 배열이라면 API에 필요한 값만 꺼냅니다.

```jsx
params={{
  techCd: searchForm.techCd?.value,
  detailTechCds: searchForm.detailTechCd?.map((item) => item.value) ?? [],
}}
```

`ApiSharedCodeSelect`가 `params` 객체의 참조가 바뀔 때마다 재조회한다면 필요한 경우에만 `useMemo`로 고정합니다.

```jsx
const detailTechParams = useMemo(() => ({
  techCd: searchForm.techCd?.value ?? searchForm.techCd,
}), [searchForm.techCd]);

<CustomField
  component={ApiSharedCodeSelect}
  name="detailTechCd"
  api={getDetailTechCodes}
  params={detailTechParams}
/>
```

`formMethods.getValues('techCd')`는 호출 시점의 값만 읽고 변경을 구독하지 않으므로 반응형 `params`를 만들 때는 사용하지 않습니다.

```jsx
import ApiSharedCodeSelect from '@/components/ApiSharedCodeSelect';
import { CustomField } from '@/components/common/conditionForm';

<CustomField
  component={ApiSharedCodeSelect}
  name="sharedCodes"
  label="공통 코드"
  defaultValue={[]}
  api={getSharedCodes}
  params={{ groupCode: 'STATUS' }}
  activeTabKey={activeTabKey}
  mode="multiple"
  allowClear
  dependencies={['activeTabKey']}
  disabled={({ values }) => !values.activeTabKey}
  rules={{ required: '공통 코드를 선택해 주세요.' }}
  onChange={(selectedItems, { form }) => {
    console.log(selectedItems);
    console.log(form.getValues());
  }}
/>
```

커스텀 컴포넌트가 아래 제어형 인터페이스를 지원하면 추가 설정은 필요 없습니다.

```jsx
function ApiSharedCodeSelect({ value, onChange, disabled, ...apiProps }) {
  // onChange([{ disabled, key, label, title, value }, ...])
}
```

선택 결과인 객체 배열은 RHF 값과 조회조건 저장 데이터에 그대로 보관됩니다. 저장 팝업에는 각 객체의 `label`이 ` / `로 구분되어 표시되므로 저장 후에도 같은 객체 배열로 복원할 수 있습니다. 조회 API에 `value`만 필요하면 저장 데이터를 바꾸지 말고 조회 요청을 만들 때 변환하는 편이 안전합니다.

```jsx
const handleSearch = ({ values }) => {
  const request = {
    ...values,
    sharedCodes: values.sharedCodes?.map((item) => item.value),
  };

  search(request);
};
```

컴포넌트의 값/이벤트 이름이나 이벤트 반환 형태가 다르면 다음 옵션으로 맞출 수 있습니다.

```jsx
<CustomField
  component={ApiSharedCodeSelect}
  name="sharedCodes"
  valuePropName="selectedItems"
  changeEventName="onSelectionChange"
  getValueFromChange={(event) => event.selectedItems}
/>
```
