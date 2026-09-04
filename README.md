# React 조회조건 폼

Ant Design의 `Form`, `Row`, `Col`과 react-hook-form을 결합한 공통 조회조건 폼입니다.
화면별 조회 필드는 JSX로 자유롭게 조립하고, 값 관리·검증·초기화·즐겨찾기 저장과 복원은 공통 모듈이 담당합니다.

> 모든 소스는 JavaScript/JSX로 작성되어 있습니다.

## 주요 기능

- `FormProvider`와 `Controller` 기반의 일관된 폼 상태 관리
- `SearchRow` → `SearchGroup` → 필드 형태의 JSX composition
- Ant Design `Row`, `Col`, `Form.Item` 기반 레이아웃
- 조회조건 초기화, 조회, 상세검색 공통 처리
- 조회조건 즐겨찾기 저장 모달과 저장값 복원
- 날짜·주차·월·연도 값의 직렬화와 역직렬화
- 페이지 전용 API 컴포넌트를 연결하는 `CustomField`
- 다른 필드값에 따른 비활성화와 연쇄 필드 제어
- 탭별 폼을 유지하면서 현재 조회조건만 선택적으로 공유

## 빠른 시작

```bash
pnpm install
pnpm dev
```

검증 명령:

```bash
pnpm test
pnpm build
```

## 폴더 구조

```text
src/components/common/conditionForm/
├─ components/
│  ├─ SearchConditionForm.jsx
│  ├─ SearchRow.jsx
│  ├─ SearchGroup.jsx
│  └─ SaveConditionModal.jsx
├─ fields/
│  ├─ ControlledField.jsx
│  ├─ InputFields.jsx
│  ├─ ChoiceFields.jsx
│  ├─ DateFields.jsx
│  └─ CustomField.jsx
├─ hooks/
│  └─ useSearchConditionShare.js
├─ model/
│  ├─ composition.js
│  ├─ conditionUtils.js
│  ├─ pickerFormats.js
│  └─ SearchConditionContext.js
├─ index.js
└─ styles.css
```

페이지에서는 내부 파일을 직접 참조하지 않고 공통 진입점만 사용합니다.

```jsx
import {
  SearchConditionForm,
  SearchGroup,
  SearchRow,
  SelectField,
  TextField,
} from '@/components/common/conditionForm';
```

## 기본 사용법

각 페이지는 필요한 Row, Group, Field만 선언합니다.

```jsx
const statusOptions = [
  { label: '대기', value: 'waiting' },
  { label: '진행 중', value: 'active' },
  { label: '완료', value: 'done' },
];

function OrderSearchPage({ savedConditions }) {
  return (
    <SearchConditionForm
      conditionKey="order-search"
      defaultValues={{ status: 'active' }}
      savedConditions={savedConditions}
      onSearch={({ values }) => searchOrders(values)}
      onSaveCondition={({ key, name, value }) => (
        saveCondition({ key, name, value })
      )}
    >
      <SearchRow rowKey="basic" label="기본 조건" required>
        <TextField name="keyword" label="검색어" placeholder="검색어 입력" />

        <SearchGroup groupKey="status" label="진행 상태">
          <SelectField name="status" label="진행 상태" options={statusOptions} />
        </SearchGroup>
      </SearchRow>
    </SearchConditionForm>
  );
}
```

`formMethods`를 전달하지 않으면 `SearchConditionForm`이 내부에서 `useForm()`을 생성합니다. 페이지 외부에서 값을 읽거나 변경해야 할 때만 외부 폼을 전달하면 됩니다.

## 화면 구조

렌더링 구조는 다음 순서를 유지합니다.

```text
FormProvider
└─ Ant Design Form
   └─ div.search-panel__layout
      ├─ div.favorite-box       조회조건 즐겨찾기
      ├─ div.condition-box      페이지에서 전달한 Row/Group/Field
      └─ div.search-actions     초기화/조회/상세검색
```

조회조건 본문은 아래 구조로 반복됩니다.

```text
Row.flex-group.condition-row
├─ Col.category-name                 Row 라벨
└─ Row.category-list
   └─ Col.category-item
      └─ Form.Item                   Group 라벨
         └─ 필드들
```

- `SearchRow.label`: 행의 가장 왼쪽 라벨
- `SearchGroup.label`: 그룹 내부 `Form.Item` 라벨
- 그룹 없는 필드: 같은 Row의 기본 영역에 함께 배치
- 라벨 없는 `SearchRow`: 화면에는 빈 라벨 영역을 유지하고 저장 모달에서는 내부 그룹 라벨 사용
- 라벨 없는 그룹들: 저장 모달에서 Row 라벨 아래 한 칸으로 합치고 그룹별 줄바꿈

## Row와 Group

### 상세검색 Row

`detail`을 지정한 Row는 상세검색 버튼으로 열고 닫습니다.

```jsx
<SearchRow rowKey="detail" label="상세 조건" detail>
  <TextField name="memo" label="메모" />
</SearchRow>
```

라벨이 없는 Row에는 안정적인 메타데이터 생성을 위해 `rowKey`를 반드시 지정합니다.

### Group 활성화 체크박스

`toggle`을 지정하면 그룹 앞에 활성화 체크박스가 생깁니다. 기본값은 `false`이며, 체크가 해제된 그룹의 자식 필드는 비활성화되고 조회·저장 스냅샷에서도 제외됩니다.

```jsx
<SearchGroup
  groupKey="period"
  label="조회 기간"
  toggle={{
    name: 'usePeriod',
    label: '조회 기간 사용',
    text: '사용',
  }}
>
  <SelectField name="dateType" label="날짜 기준" options={dateTypeOptions} />
  <DateRangeField name="period" label="조회 기간" />
</SearchGroup>
```

`controlRow: true`를 추가하면 해당 그룹이 아니라 같은 Row 전체를 제어합니다. 한 Row에는 하나만 사용할 수 있습니다.

```jsx
<SearchRow rowKey="customer">
  <SearchGroup
    groupKey="customerInfo"
    label="고객 정보"
    toggle={{
      name: 'useCustomerConditions',
      label: '고객 조건 사용 여부',
      text: '고객 조건 사용',
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

행 전체가 비활성화돼도 제어 체크박스 자체는 다시 선택할 수 있습니다.

## 제공 필드

| 구분 | 컴포넌트 | RHF 값 |
| --- | --- | --- |
| 입력 | `TextField` | `string` |
| 입력 | `NumberField` | `number` 또는 `null` |
| 입력 | `TextAreaField` | `string` |
| 선택 | `SelectField` | 선택값 또는 선택값 배열 |
| 선택 | `AutoCompleteField` | `string` |
| 선택 | `RadioGroupField` | 선택값 |
| 선택 | `RadioButtonGroupField` | 선택값 |
| 선택 | `CheckboxField` | `boolean` |
| 선택 | `CheckboxGroupField` | 선택된 `value` 배열 |
| 선택 | `SwitchField` | `boolean` |
| 날짜 | `DateField` | dayjs 객체 |
| 날짜 | `DateRangeField` | dayjs 객체 배열 |
| 기간 | `PeriodPickerField` | picker 설정에 따른 dayjs 값 |
| 확장 | `CustomField` | 페이지 컴포넌트가 반환한 값 |

필드에서 공통으로 사용할 수 있는 주요 props:

| prop | 설명 |
| --- | --- |
| `name` | RHF 필드명이며 저장과 복원의 기준 |
| `label` | 저장 모달에 표시할 필드 라벨 |
| `defaultValue` | 최초 기본값 |
| `initialValue` | 변경 가능한 필드별 초기값 |
| `rules` | react-hook-form 검증 규칙 |
| `onChange` | RHF 저장 후 실행할 추가 동작 |
| `dependencies` | `disabled` 함수가 구독할 다른 필드명 배열 |
| `disabled` | boolean 또는 계산 함수 |
| `style`, `className` | 입력 컴포넌트 스타일 |
| `formItemStyle`, `formItemClassName` | 필드를 감싼 `Form.Item` 스타일 |
| `serialize`, `deserialize` | 저장·복원 값 변환 |
| `formatDisplay` | 저장 모달 표시값 변환 |

## 폼값 읽기와 변경

화면에서 폼을 직접 제어하려면 페이지에서 `useForm()`을 생성합니다.

```jsx
const formMethods = useForm();

<SearchConditionForm formMethods={formMethods}>
  {/* fields */}
</SearchConditionForm>
```

```js
formMethods.getValues();
formMethods.getValues('status');
formMethods.setValue('status', 'active', {
  shouldDirty: true,
  shouldValidate: true,
});
formMethods.reset(nextValues);
```

`getValues()`는 호출 시점의 값만 읽고 변경을 구독하지 않습니다. 화면 렌더링이나 API `params`가 값 변경에 반응해야 하면 `useWatch()`를 사용합니다.

여러 값은 하나의 `useWatch`로 묶을 수 있습니다.

```jsx
const [techCd, detailTechCd, productCd] = useWatch({
  control: formMethods.control,
  name: ['techCd', 'detailTechCd', 'productCd'],
});
```

## 초기값

초기값 우선순위:

```text
SearchConditionForm.defaultValues
→ 필드 initialValue
→ 필드 defaultValue
```

```jsx
const initialValues = useMemo(() => ({
  keyword: previousPageValues.keyword,
  status: previousPageValues.status,
  notificationChannels: ['sms'],
}), [previousPageValues]);

const formMethods = useForm({ defaultValues: initialValues });

<SearchConditionForm
  formMethods={formMethods}
  defaultValues={initialValues}
>
  {/* fields */}
</SearchConditionForm>
```

서버 응답이 나중에 도착하면 변경된 `defaultValues`가 공통 폼의 `reset()`으로 적용됩니다. 객체·배열 초기값은 불필요한 전체 초기화를 막기 위해 `state` 또는 `useMemo`로 참조를 안정화하는 것이 좋습니다.

필드 하나만 서버값으로 갱신하려면 `initialValue`를 사용합니다.

```jsx
<TextField
  name="customerName"
  label="고객명"
  initialValue={serverCustomer?.name}
/>
```

## onChange와 연관 필드 제어

필드값은 RHF에 먼저 반영된 다음 `onChange(value, context)`가 실행됩니다.

```jsx
<SelectField
  name="dateType"
  label="날짜 기준"
  options={dateTypeOptions}
  onChange={(value, { form, values }) => {
    form.setValue('period', undefined, { shouldDirty: true });
  }}
/>
```

`context`에는 `form`, `name`, `values`, `rawValue`, `args`가 들어옵니다. 자기 필드값은 이미 RHF에 저장되어 있으므로 `onChange`에서는 연관된 다른 필드만 변경하면 됩니다.

### Select 첫 옵션 자동 선택

저장조건이나 탭 공유값에 해당 필드값이 없거나, 현재 값이 새 옵션에 존재하지 않을 때 첫 번째 활성 옵션을 자동 선택할 수 있습니다.

```jsx
<SelectField
  autoSelectFirst
  name="detailCode"
  options={detailOptions}
/>
```

현재 값이 새 옵션에도 있으면 그 값을 유지합니다. 상위 조건 변경으로 옵션 내용이 바뀔 때마다 기존 값의 유효 여부와 관계없이 첫 번째 옵션으로 변경해야 하면 다음 prop을 추가합니다.

```jsx
<SelectField
  autoSelectFirst
  resetToFirstOnOptionsChange
  name="detailCode"
  options={detailOptions}
  onChange={(value, context) => {
    // 자동 선택에서도 실행된다.
    // context.source === 'auto'
    // context.reason === 'missing-value' | 'options-change'
  }}
/>
```

`resetToFirstOnOptionsChange`는 복원된 값이 새 옵션에 존재하더라도 첫 번째 값으로 바꿉니다. 조회조건 저장값을 우선해야 하는 필드는 `autoSelectFirst`만 사용하고, 상위 필드의 사용자 변경 시 하위 값을 비운 뒤 새 옵션을 조회하는 방식을 권장합니다.

```jsx
<SelectField
  name="mainCode"
  options={mainOptions}
  onChange={(_, { form }) => {
    setDetailOptions([]);
    form.setValue('detailCode', undefined);
  }}
/>

<SelectField
  autoSelectFirst
  name="detailCode"
  options={detailOptions}
/>
```

자동 선택은 RHF 값에 반영되고 기존 `onChange`도 실행됩니다. 자동 선택을 사용하는 필드는 빈 값이 즉시 첫 옵션으로 복구되므로 `allowClear`의 기본값도 `false`가 됩니다. 사용자가 빈 값을 유지할 수 있어야 한다면 자동 선택 prop을 사용하지 않아야 합니다.

다른 필드의 단순 비활성화는 페이지 `useWatch` 대신 `dependencies`와 함수형 `disabled`를 사용하는 것이 간결합니다.

```jsx
<DateRangeField
  name="period"
  label="조회 기간"
  dependencies={['dateType']}
  disabled={({ values }) => !values.dateType}
/>
```

비활성화는 현재 값을 자동으로 지우지 않습니다. 사용자가 기준 필드를 변경했을 때 값도 지워야 한다면 기준 필드의 `onChange`에서 처리합니다. 이 방식은 저장조건을 `reset()`으로 복원할 때 불필요한 연쇄 초기화를 막아줍니다.

### 라디오로 CheckboxGroup 제어

```jsx
const periodOptions = [
  { label: '분기', value: 'QUARTER' },
  { label: '반기', value: 'HALF_YEAR' },
  { label: '년도', value: 'YEAR' },
];

const allPeriods = periodOptions.map(({ value }) => value);

<RadioGroupField
  name="periodType"
  defaultValue="MONTH"
  options={[
    { label: '월', value: 'MONTH' },
    { label: '기간', value: 'ETC' },
  ]}
  onChange={(value, { form }) => {
    form.setValue('periods', value === 'ETC' ? allPeriods : [], {
      shouldDirty: true,
    });
  }}
/>

<CheckboxGroupField
  name="periods"
  defaultValue={[]}
  options={periodOptions}
  dependencies={['periodType']}
  disabled={({ values }) => values.periodType !== 'ETC'}
/>
```

서버의 기존 `Y/N` 컬럼은 조회 요청을 만들 때 변환합니다.

```js
const selected = values.periods ?? [];

const request = {
  monthYn: values.periodType === 'MONTH' ? 'Y' : 'N',
  quarterYn: selected.includes('QUARTER') ? 'Y' : 'N',
  halfYearYn: selected.includes('HALF_YEAR') ? 'Y' : 'N',
  yearYn: selected.includes('YEAR') ? 'Y' : 'N',
};
```

## Checkbox 저장 규칙

`CheckboxField`는 별도 옵션 없이 체크 여부를 항상 저장합니다.

```jsx
<CheckboxField name="urgent" label="긴급 여부" text="긴급 건만" />
```

```js
// 체크
{ urgent: true }

// 미체크
{ urgent: false }
```

- 체크값 `true`: 저장하고 저장 모달에 표시
- 미체크값 `false`: 저장하지만 저장 모달에서는 기본으로 숨김
- `CheckboxGroupField`: 선택된 option의 `value` 배열만 저장

필요한 화면에서만 기본 동작을 명시적으로 덮어쓸 수 있습니다.

```jsx
<CheckboxField
  name="urgent"
  hideFalsyInPreview={false}
  includeFalsy={false}
/>
```

## 기간 Picker

개별 컴포넌트 6개와 통합 컴포넌트 `PeriodPickerField`를 제공합니다.

| 컴포넌트 | 저장 포맷 | 화면 포맷 |
| --- | --- | --- |
| `WeekPickerField` | `YYYYwo` | `YYYY-w주차` |
| `WeekRangePickerField` | `YYYYwo[]` | `YYYY-w주차` |
| `MonthPickerField` | `YYYYMM` | `YYYY-MM` |
| `MonthRangePickerField` | `YYYYMM[]` | `YYYY-MM` |
| `YearPickerField` | `YYYY` | `YYYY` |
| `YearRangePickerField` | `YYYY[]` | `YYYY` |

```jsx
<PeriodPickerField name="week" label="기준 주차" picker="week" />
<PeriodPickerField name="weekRange" label="주차 범위" picker="week" range />
<PeriodPickerField name="month" label="기준 월" picker="month" />
<PeriodPickerField name="monthRange" label="월 범위" picker="month" range />
<PeriodPickerField name="year" label="기준 연도" picker="year" />
<PeriodPickerField name="yearRange" label="연도 범위" picker="year" range />
```

`valueFormat`, `displayFormat`, `initialValue`, `rules`, `onChange`, `width`를 공통으로 지원합니다.

## 조회조건 저장과 복원

### 컴포넌트 계약

| prop | 설명 |
| --- | --- |
| `conditionShare` | 탭별 페이지 세션값과 전달 요청. 최신값 등록, transfer, 성공·실패 확인 처리를 공통 폼이 담당 |
| `conditionKey` | 페이지 또는 탭을 구분하는 조회조건 키 |
| `tabKey` | 탭 세션값을 구분하는 키. 생략하면 `conditionKey` 사용 |
| `savedConditions` | 현재 사용자가 저장한 조회조건 목록 |
| `prepareRestoreValues` | 기존 화면 호환용 폼 단위 복원 전처리 함수. 이후 필드별 `restore.prepare`가 실행됨 |
| `preserveValuesOnDefaultChange` | `defaultValues` 변경 시 현재값 유지 여부. 생략하면 `conditionShare` 연결 시 자동으로 유지 |
| `onRestoreStateChange` | 복원 시작·종료 알림. `source`는 `favorite`, `tab-inherit`, `tab-session`이며 상위 Tabs 이동을 잠그는 데 사용 |
| `onSaveCondition` | 저장 모달에서 호출할 API 함수 |
| `onSearch` | 실제 활성 조회조건만 전달받아 조회할 함수 |

저장 콜백은 하나의 레코드를 전달합니다.

```js
{
  key: 'order-search',
  name: '진행 중 주문',
  value: {
    __conditionMeta: {
      version: 2,
      conditionKey: 'order-search',
      fieldNames: ['status', 'urgent'],
    },
    status: 'active',
    urgent: false,
  },
}
```

서버의 `value` 컬럼이 문자열이면 API 경계에서만 JSON으로 변환합니다.

```jsx
const handleSaveCondition = ({ key, name, value }) => (
  saveConditionApi({ key, name, value: JSON.stringify(value) })
);
```

저장 목록의 `value`는 객체와 JSON 문자열을 모두 지원합니다.

```js
const savedConditions = [
  {
    id: 'condition-id',
    key: 'order-search',
    name: '진행 중 주문',
    value: '{"status":"active","urgent":false}',
  },
];
```

### 저장값 규칙

- 실제 저장과 복원 기준은 필드의 `name`
- Row/Group/Field `label`은 저장 모달 표시용
- 즐겨찾기는 현재 폼 스키마의 모든 필드와 `false`, 빈 문자열, 빈 배열을 포함
- JSON에서 제거되는 `undefined`는 필드 유형에 따라 `''`, `false`, `[]`, `null`로 변환
- 단일 Checkbox의 `false`는 저장하되 모달에서 숨김
- CheckboxGroup은 선택된 값 배열 저장
- 비활성화된 Group/Row의 값도 정확한 화면 재현을 위해 저장하지만 조회 payload에서는 제외
- 날짜와 기간은 필드 포맷에 맞는 문자열로 직렬화
- CustomField 객체와 객체 배열은 그대로 저장
- 검색 payload는 즐겨찾기 전체 저장값과 별도로 활성 필드만 생성

커스텀 멀티셀렉트 값이 6개 이상이면 저장 모달에는 처음 5개와 `더보기` 버튼이 표시됩니다.

### 복원 과정

```text
savedConditions에서 conditionKey 필터링
→ condition.value 버전·메타데이터 분리
→ 현재 화면 필드의 name과 매칭
→ 필드별 deserialize
→ prepareRestoreValues 실행
→ restore.dependsOn 순서로 필드 옵션 준비·값 검증
→ 모든 준비 성공 후 react-hook-form reset() 1회 실행
→ 탭 세션값 갱신 및 전달 요청 완료 확인
```

`condition.value`는 객체, JSON 문자열, 이중 JSON 문자열까지 정규화합니다. 이전 데이터 형식인 `condition.values`도 읽을 수 있지만 새 저장 요청은 `value`를 사용합니다.

앞 필드값에 따라 뒤 필드의 옵션 API가 달라지는 화면은 필드의 `restore` 계약을 사용합니다. `prepareRestoreValues`도 기존 화면과의 호환을 위해 먼저 실행됩니다. 더 늦게 시작한 즐겨찾기 또는 탭 상속 요청이 이전 요청을 취소합니다.

```jsx
<SearchConditionForm
  formMethods={formMethods}
  savedConditions={savedConditions}
  prepareRestoreValues={prepareRestoreValues}
>
  {/* fields */}
</SearchConditionForm>
```

```jsx
<SelectField
  name="detailCode"
  restore={{
    dependsOn: ['categoryCode'],
    prepare: async ({ value, values, signal, emptyValue }) => {
      const options = await loadDetailOptions(values.categoryCode, { signal });
      const valid = options.some((option) => option.value === value);

      return {
        options,
        valid,
        nextValue: valid ? value : emptyValue,
        commit: () => setDetailOptions(options),
        warning: valid ? undefined : '저장된 상세 코드가 현재 목록에 없어 초기화했습니다.',
      };
    },
  }}
/>
```

복원 중에는 즐겨찾기 선택, 저장, 초기화, 조회가 비활성화됩니다. 저장된 Select 값이 준비된 옵션에 없으면 해당 필드만 비우고 초기값 자동 선택을 막습니다.

페이지별 연쇄 API 구현과 커스텀 컴포넌트 수정 위치는 [비동기 저장조건 복원 가이드](./docs/async-saved-condition-restore.md)를 참고합니다.

저장 성공 후에는 목록을 다시 조회하거나 성공 응답을 `savedConditions`에 추가해야 즐겨찾기 Select에 새 항목이 나타납니다.

```jsx
const handleSaveCondition = async (condition) => {
  await saveConditionApi({
    ...condition,
    value: JSON.stringify(condition.value),
  });
  await refetchSavedConditions(condition.key);
};
```

## CustomField

페이지 전용 입력은 공통 필드를 새로 만들지 않고 `CustomField`로 연결할 수 있습니다.

### render 방식

```jsx
<CustomField
  name="managerCode"
  label="담당자 코드"
  render={({ controllerField, disabled }) => (
    <MyInput {...controllerField} disabled={disabled} />
  )}
/>
```

### component 방식

```jsx
<CustomField
  component={ApiSharedCodeSelect}
  name="sharedCodes"
  label="공통 코드"
  defaultValue={[]}
  emptyValue={[]}
  api={getSharedCodes}
  params={{ groupCode: 'STATUS' }}
  activeTabKey={activeTabKey}
  mode="multiple"
  allowClear
/>
```

`CustomField`가 사용하는 공통 props를 제외한 나머지는 지정한 컴포넌트에 그대로 전달됩니다. 기본 인터페이스는 제어형 `value`, `onChange`, `disabled`입니다.

```jsx
function ApiSharedCodeSelect({ value = [], onChange, disabled, ...apiProps }) {
  return (
    <ActualMultiSelect
      {...apiProps}
      value={value}
      disabled={disabled}
      onChange={onChange}
    />
  );
}
```

컴포넌트 API가 다르면 adapter props로 맞춥니다.

```jsx
<CustomField
  component={ApiSharedCodeSelect}
  name="sharedCodes"
  valuePropName="selectedItems"
  changeEventName="onSelectionChange"
  getValueFromChange={(event) => event.selectedItems}
/>
```

### 다른 필드값을 API params로 사용

```jsx
const [techCd, detailTechCd] = useWatch({
  control: formMethods.control,
  name: ['techCd', 'detailTechCd'],
});

const productParams = useMemo(() => ({
  techCd: techCd?.value ?? techCd,
  detailTechCds: detailTechCd?.map((item) => item.value) ?? [],
}), [techCd, detailTechCd]);

<CustomField
  component={ApiSharedCodeSelect}
  name="productCd"
  defaultValue={[]}
  emptyValue={[]}
  api={getProducts}
  params={productParams}
/>
```

`getValues()`는 반응형이 아니므로 변경되는 API `params`에는 `useWatch()`를 사용합니다. API 컴포넌트가 `params` 객체 참조 변경마다 재조회한다면 `useMemo()`로 필요한 값만 고정합니다.

### params 변경과 저장조건 복원

`params`가 바뀌었을 때 커스텀 컴포넌트는 옵션만 다시 조회해야 합니다. 내부 effect에서 무조건 `onChange([])`를 호출하면 저장조건 복원 직후 하위 필드값이 사라집니다.

```jsx
useEffect(() => {
  loadOptions(params).then(setOptions);
}, [params]);
```

사용자가 상위 필드를 직접 변경한 경우에만 상위 필드의 `onChange`에서 하위값을 초기화합니다.

```jsx
<SelectField
  name="techCd"
  options={techOptions}
  onChange={(_, { form }) => {
    form.setValue('detailTechCd', [], { shouldDirty: true });
    form.setValue('productCd', [], { shouldDirty: true });
  }}
/>
```

저장된 객체 배열은 그대로 복원하고, 실제 조회 API에 필요한 코드값은 조회 요청을 만들 때 변환합니다.

```jsx
const handleSearch = ({ values }) => {
  const request = {
    ...values,
    sharedCodes: values.sharedCodes?.map((item) => item.value) ?? [],
  };
  return searchApi(request);
};
```

## 탭 사이 현재 조회조건 공유

각 탭은 자체 `useForm()`과 저장조건 목록을 유지합니다. 전체 현재값은 페이지 메모리에 보관하고, 이동할 때 지정된 필드만 상속할 수 있습니다.

상위 Tabs:

```jsx
const SHARED_FIELD_NAMES = ['keyword', 'dateType', 'period', 'status'];

function SearchTabs() {
  const [activeTab, setActiveTab] = useState('order');
  const [shareEnabled, setShareEnabled] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const conditionShare = useSearchConditionShareState({
    activeTab,
    enabled: shareEnabled,
    fieldNames: SHARED_FIELD_NAMES,
  });

  const changeTab = (nextTab) => {
    if (isRestoring) return;
    conditionShare.transfer(activeTab, nextTab);
    setActiveTab(nextTab);
  };

  return (
    <Tabs
      activeKey={activeTab}
      destroyOnHidden={false}
      onChange={changeTab}
    >
      <Tabs.TabPane tab="주문" key="order">
        <OrderSearchTab
          conditionShare={conditionShare}
          onRestoreStateChange={({ isRestoring: restoring }) => setIsRestoring(restoring)}
        />
      </Tabs.TabPane>
      <Tabs.TabPane tab="배송" key="delivery">
        <DeliverySearchTab
          conditionShare={conditionShare}
          onRestoreStateChange={({ isRestoring: restoring }) => setIsRestoring(restoring)}
        />
      </Tabs.TabPane>
    </Tabs>
  );
}
```

하위 탭:

```jsx
function OrderSearchTab({ conditionShare, onRestoreStateChange }) {
  const formMethods = useForm();

  return (
    <SearchConditionForm
      conditionShare={conditionShare}
      conditionKey="order"
      formMethods={formMethods}
      savedConditions={orderSavedConditions}
      tabKey="order"
      onRestoreStateChange={onRestoreStateChange}
    >
      {/* 주문 조회조건 */}
    </SearchConditionForm>
  );
}
```

- 토글형 공유: `enabled`에 화면 state 전달
- 항상 공유: `enabled: true`
- 공유하지 않음: `enabled: false` 또는 공유 훅 생략
- `fieldNames` 생략: 폼 전체 공유
- `transfer(sourceTab, targetTab)`: 등록된 `getValues()`로 출발 탭 최신값을 동기 수집하고 대상 탭 세션값과 병합
- 대상 탭이 복원 성공 또는 실패를 확인하기 전에는 전달 요청을 제거하지 않음
- 대상 탭에 없는 출발 탭 전용 필드: 현재 화면 schema를 기준으로 자동 제외
- 날짜·커스텀 필드: 즐겨찾기와 동일한 복원 트랜잭션과 필드 `restore` 단계 사용
- `conditionShare` 연결 중 `defaultValues` 변경: 현재 폼값을 우선해 서버 재조회로 인한 덮어쓰기 방지
- 공유 토글을 꺼도 탭별 세션값은 유지하고 새로운 전달만 막음
- 페이지 새로고침 후에는 세션값을 복구하지 않음
- 저장조건 목록: 공유하지 않고 각 탭의 `conditionKey`로 분리

전체 복원 우선순위와 필드 API는 [조회조건 복원 트랜잭션 v2](./docs/condition-restore-v2.md)를 참고합니다. 기존 구조 비교는 [탭별 useForm + Snapshot 공유 가이드](./docs/tab-use-form-snapshot-guide.md)에 남겨 두었습니다.

## 값 변환

특수 입력은 저장, 복원, 모달 표시 규칙을 필드에 선언할 수 있습니다.

```jsx
<CustomField
  name="managerCode"
  label="담당자 코드"
  render={({ controllerField }) => <Input {...controllerField} />}
  serialize={(value) => String(value).trim().toUpperCase()}
  deserialize={(value) => String(value).toLowerCase()}
  formatDisplay={(value) => `M-${value}`}
/>
```

- `serialize`: RHF 값 → 저장값
- `deserialize`: 저장값 → RHF 입력값
- `formatDisplay`: 저장값 → 저장 모달 표시 문자열

## 스타일

공통 클래스는 [styles.css](./src/components/common/conditionForm/styles.css)에 있습니다.

```jsx
<TextField
  name="keyword"
  width={160}
  style={{ width: 240 }}
  className="keyword-input"
  formItemStyle={{ marginRight: 12 }}
  formItemClassName="keyword-form-item"
/>
```

- `style`, `className`: 실제 입력 컴포넌트
- `formItemStyle`, `formItemClassName`: 필드를 감싼 `Form.Item`
- `SearchGroup.className`: 그룹의 `Form.Item`
- `SearchGroup.groupClassName`: 그룹 바깥쪽 `Col`
- `width`와 `style.width`를 함께 사용하면 `style.width` 우선

전체 동작 예시는 [SearchConditionExample.jsx](./src/examples/SearchConditionExample.jsx)에서 확인할 수 있습니다.
