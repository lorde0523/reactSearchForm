# 탭별 useForm + Snapshot 공유 가이드

## 결론부터 보기

이 프로젝트처럼 탭마다 다음 조건이 다르면 **각 탭이 자기 `useForm`을 가지고, 탭을 이동할 때 필요한 값만 snapshot으로 전달하는 방식**을 권장합니다.

- 조회조건 필드 구성
- 서버 API와 Select options
- 조회조건 즐겨찾기 목록
- 초기화 기준
- validation 규칙

권장 구조는 다음과 같습니다.

```text
상위 Tabs
├─ 탭별 snapshot 보관
├─ 현재 공유 여부 보관
└─ 탭 이동 요청 전달

Tab A
└─ Tab A 전용 useForm

Tab B
└─ Tab B 전용 useForm
```

쉽게 말하면 `useForm`은 각 탭의 개인 서랍이고, snapshot은 다른 탭으로 옮기는 작은 상자입니다.

## 공용 useForm을 사용해도 필드 구성이 같아야 하나요?

아닙니다. 하나의 `useForm` 안에 서로 다른 필드를 등록할 수 있습니다.

```jsx
const formMethods = useForm({
  shouldUnregister: false,
});

<Tabs destroyOnHidden={false}>
  <Tabs.TabPane key="customer" tab="고객">
    <SearchConditionForm formMethods={formMethods}>
      <TextField name="customerName" label="고객명" />
      <SelectField name="status" label="진행상태" options={statusOptions} />
    </SearchConditionForm>
  </Tabs.TabPane>

  <Tabs.TabPane key="history" tab="이력">
    <SearchConditionForm formMethods={formMethods}>
      <SelectField name="historyType" label="이력 구분" options={historyOptions} />
      <DateRangeField name="period" label="조회기간" />
    </SearchConditionForm>
  </Tabs.TabPane>
</Tabs>
```

폼에는 모든 필드가 함께 저장됩니다.

```js
{
  customerName: '홍길동',
  status: 'active',
  historyType: 'change',
  period: ['20260801', '20260831'],
}
```

같은 `name`을 사용한 필드는 같은 값을 바라봅니다.

```jsx
// Tab A와 Tab B가 같은 status 값을 사용한다.
<SelectField name="status" />
```

단, 의미나 값 형식이 다른 필드에 같은 이름을 사용하면 안 됩니다.

```jsx
// 잘못된 예: 하나는 문자열이고 하나는 날짜 배열이다.
<SelectField name="period" />
<DateRangeField name="period" />
```

## 두 방식 비교

| 구분 | 공용 useForm 하나 | 탭별 useForm + snapshot |
| --- | --- | --- |
| 탭 필드 구성이 다름 | 가능 | 가능 |
| 같은 이름의 값 실시간 공유 | 쉬움 | 전달 처리가 필요함 |
| 탭별 초기화 | 전체 폼에 영향을 주기 쉬움 | 해당 탭만 초기화 |
| 탭별 validation | 한 폼에 함께 쌓임 | 완전히 분리 |
| 탭별 API options | 서로 영향을 줄 수 있음 | 각 탭에서 독립 관리 |
| 탭별 즐겨찾기 | 별도 구분 로직 필요 | 자연스럽게 분리 |
| 일부 필드만 선택적으로 공유 | 추가 관리 필요 | snapshot 필드 선택으로 처리 |
| 서버 재조회 후 복원 | 전체 폼 순서 관리 필요 | 대상 탭 복원 순서만 관리 |

## 공용 useForm이 더 적합한 경우

두 탭이 실제로는 하나의 입력 양식을 나눠 보여주고, 마지막에 한 번에 저장하는 화면에 적합합니다.

```text
Tab A: 기본정보
Tab B: 상세정보
→ 마지막에 하나의 데이터로 저장
```

다음 조건을 대부분 만족한다면 공용 `useForm`을 고려할 수 있습니다.

- 두 탭을 항상 하나의 데이터로 제출함
- 초기화도 모든 탭에 함께 적용함
- 동일한 필드는 항상 실시간으로 같은 값을 사용함
- 즐겨찾기와 validation을 탭별로 나눌 필요가 없음

## 탭별 useForm + snapshot이 적합한 경우

다음과 같은 조회 화면에 적합합니다.

- 각 탭의 조회 API가 다름
- 각 탭의 즐겨찾기를 별도로 저장함
- 탭마다 필드와 기본값이 다름
- 공유 토글이 켜졌을 때만 값을 전달함
- 공유하지 않는 필드는 해당 탭의 이전 값을 유지해야 함
- 앞 필드값에 따라 뒤 Select의 options API가 달라짐

현재 프로젝트에는 이 방식이 더 안전합니다.

## Snapshot에는 무엇을 저장하나요?

탭을 복원하는 데 필요한 폼값만 저장합니다.

```js
{
  tabKey: 'order',
  values: {
    keyword: '고객',
    status: 'active',
    period: ['20260801', '20260831'],
  },
}
```

다음 상태는 탭마다 다시 계산하므로 snapshot에 넣지 않는 것을 권장합니다.

- validation errors
- touchedFields
- dirtyFields
- Select options
- 서버 조회 결과
- loading 상태
- 모달 열림 상태

## 값 우선순위

탭 B로 이동할 때 최종값은 다음 순서로 합칩니다.

```text
Tab B 기본값
< Tab B에서 이전에 변경한 값
< Tab A에서 전달된 공유값
```

코드로 표현하면 다음과 같습니다.

```js
const nextValues = {
  ...targetTabDefaults,
  ...targetTabSnapshot,
  ...sourceTabSharedValues,
};
```

- 공유하지 않는 필드: Tab B의 이전값 유지
- 공유하는 필드: Tab A 값으로 변경
- 두 snapshot에 없는 필드: Tab B 기본값 사용

## 탭별 Snapshot 보관 예시

공통 `useSearchConditionShareState`가 탭별 snapshot을 `useRef`에 보관합니다.

```jsx
const SHARED_FIELD_NAMES = ['keyword', 'status', 'period'];

const conditionShare = useSearchConditionShareState({
  activeTab,
  enabled: shareEnabled,
  fieldNames: SHARED_FIELD_NAMES,
});
```

제공되는 값과 함수:

| 이름 | 설명 |
| --- | --- |
| `capture(tabKey, values)` | 해당 탭의 최신 snapshot 저장 |
| `getTabValues(tabKey)` | 해당 탭의 마지막 snapshot 복사본 반환 |
| `transfer(sourceTab, targetTab)` | 대상 탭 기존값과 출발 탭 공유값을 병합해 전달 요청 생성 |
| `transferRequest` | 가장 최근 탭 이동 요청 |
| `enabled` | 공유 활성 여부 |

## 현재 탭값 기록하기

각 탭의 `SearchConditionForm`에 `conditionShare`와 `tabKey`를 전달하면 현재 활성 탭의 값을 자동으로 기록합니다.

```jsx
<SearchConditionForm
  conditionShare={conditionShare}
  conditionKey="order"
  formMethods={formMethods}
  tabKey="order"
>
  {/* 현재 탭 필드 */}
</SearchConditionForm>
```

공통 폼은 현재 탭의 필드 schema만 순회해 값을 직렬화합니다. 다른 탭 전용 필드가 RHF 내부에 있더라도 snapshot과 즐겨찾기 저장값에서는 제외됩니다. 탭 공유 snapshot은 빈 문자열, 빈 배열, `undefined`도 기록하므로 출발 탭에서 비운 값이 대상 탭에도 반영됩니다.

## 탭 이동 요청 만들기

```jsx
const changeTab = (nextTab) => {
  conditionShare.transfer(activeTab, nextTab);
  setActiveTab(nextTab);
};

<Tabs
  activeKey={activeTab}
  destroyOnHidden={false}
  onChange={changeTab}
/>
```

공유가 꺼져 있다면 대상 탭의 자기 snapshot만 유지합니다.

## 대상 탭 useForm에 적용하기

`SearchConditionForm`에 `conditionShare`가 연결되어 있으면 `transferRequest.targetTab`이 자기 `tabKey`와 같을 때 자동으로 복원합니다. 페이지에서 직접 `reset()`할 필요가 없습니다.

```jsx
<SearchConditionForm
  conditionShare={conditionShare}
  conditionKey="delivery"
  formMethods={formMethods}
  prepareRestoreValues={prepareRestoreValues}
  tabKey="delivery"
>
  {/* 배송 탭 필드 */}
</SearchConditionForm>
```

`tabKey`를 생략하면 `conditionKey`를 탭 구분값으로 사용합니다.

## 즐겨찾기 복원 방식 재사용

탭 snapshot도 즐겨찾기처럼 처리합니다.

```text
탭 snapshot 수신
→ 현재 탭에 존재하는 필드만 추출
→ 날짜와 커스텀값 deserialize
→ 연동 options API 준비
→ 모든 options 적용
→ useForm.reset() 한 번 실행
```

`SearchConditionForm`은 즐겨찾기와 탭 공유에 동일한 내부 `applyConditionValues` 경로를 사용합니다.

```jsx
const applyConditionValues = async ({
  rawValues,
  savedCondition,
  source,
}) => {
  restoreController.current?.abort();

  const controller = new AbortController();
  restoreController.current = controller;

  try {
    const values = hydrateSavedValues(
      rows,
      rawValues,
      initialValues,
    );

    const preparedValues = prepareRestoreValues
      ? await prepareRestoreValues({
          conditionKey,
          form: methods,
          initialValues,
          savedCondition,
          signal: controller.signal,
          source,
          values,
        })
      : values;

    if (controller.signal.aborted) return;

    methods.reset(preparedValues ?? values);
  } finally {
    if (restoreController.current === controller) {
      restoreController.current = undefined;
    }
  }
};
```

즐겨찾기는 다음처럼 호출합니다.

```js
await applyConditionValues({
  rawValues: parseSavedConditionValue(selected),
  savedCondition: selected,
  source: 'favorite',
});
```

탭 공유는 다음처럼 호출합니다.

```js
await applyConditionValues({
  rawValues: transferRequest.values,
  source: 'tab-share',
});
```

`prepareRestoreValues`에는 적용 경로를 구분할 수 있는 `source`가 함께 전달됩니다.

```js
const prepareRestoreValues = async ({ source, values, signal }) => {
  // source === 'favorite' | 'tab-share'
  const options = await loadOptions(values, { signal });
  setOptions(options);
  return values;
};
```

## 왜 필드별 setValue보다 reset이 안전한가요?

단순한 공유 훅은 다음처럼 필드값을 바로 적용할 수 있습니다.

```js
formMethods.setValue(name, value);
```

하지만 연동 Select의 options가 준비되기 전에 값이 들어가면 커스텀 컴포넌트가 값을 유효하지 않다고 판단해 지울 수 있습니다.

즐겨찾기와 같은 복원 순서를 사용하면 options가 모두 준비된 다음 최종값을 한 번에 넣을 수 있습니다.

## 서버 재조회와 폼값을 분리하기

폼 필드 변경으로 서버 재조회가 실행되는 것은 정상입니다.

```js
const response = await searchApi(params);

setOptions(response.options);
setTableData(response.list);
```

서버 응답이 올 때마다 폼 기본값을 다시 넣으면 snapshot으로 복원한 값이 사라집니다.

```js
// 피해야 할 처리
formMethods.reset(serverDefaults);
```

서버 재조회는 가능한 한 다음 데이터만 변경합니다.

- Select options
- 테이블 목록
- 합계와 건수
- loading 상태

폼 기본값은 최초 진입이나 사용자가 명시적으로 초기화했을 때만 적용합니다.

## defaultValues 참조 주의

`SearchConditionForm`은 `defaultValues` 참조가 바뀌면 초기값을 다시 계산합니다. `conditionShare.enabled`가 `true`이면 현재 폼값을 초기값보다 우선해서 병합하므로 서버 재조회 때문에 공유값이 덮이지 않습니다.

```js
const currentSnapshot = createConditionSnapshot(
  rows,
  methods.getValues(),
  { includeEmptyValues: true },
);

const nextValues = hydrateSavedValues(
  rows,
  currentSnapshot.values,
  initialValues,
);
```

공유가 없거나 `preserveValuesOnDefaultChange={false}`를 명시하면 기존처럼 새 기본값으로 초기화합니다.

```jsx
<SearchConditionForm
  conditionShare={conditionShare}
  preserveValuesOnDefaultChange={false}
/>
```

공유 중에는 현재값 보존이 기본이지만, 렌더링마다 불필요하게 새 기본값 객체를 만드는 것은 피하는 것이 좋습니다.

```jsx
// 피해야 할 예: 렌더링마다 객체가 새로 만들어질 수 있다.
<SearchConditionForm
  defaultValues={{ status: serverData.status }}
/>
```

필요하다면 참조를 안정화합니다.

```jsx
const defaultValues = useMemo(() => ({
  status: serverData.status,
}), [serverData.status]);

<SearchConditionForm defaultValues={defaultValues} />
```

탭 snapshot을 복원하는 화면에서는 서버 재조회 결과를 계속 `defaultValues`로 넘기기보다 `prepareRestoreValues`에서 options를 준비하고 공통 복원 경로가 마지막 `reset()`을 실행하도록 두는 것이 가장 안전합니다.

## 같은 name을 공유할 때 규칙

| 상황 | 권장 처리 |
| --- | --- |
| 두 탭에서 의미와 값 형식이 같음 | 같은 `name` 사용 가능 |
| 이름은 같지만 의미가 다름 | 탭별로 다른 `name` 사용 |
| 한쪽은 문자열, 다른 쪽은 배열 | 반드시 다른 `name` 사용 |
| 탭마다 API 코드가 다름 | 공유 전에 값 매핑 함수 사용 |

서로 다른 코드 체계를 사용한다면 직접 매핑합니다.

```js
const sharedValues = {
  ...sourceValues,
  status: convertStatusForTarget(sourceValues.status),
};
```

## 탭이 사라질 때 값 유지하기

탭 컴포넌트를 유지할 수 있다면 다음 설정을 사용합니다.

```jsx
<Tabs destroyOnHidden={false} />
```

공용 `useForm`에서는 필드 등록 해제를 막는 설정도 사용할 수 있습니다.

```js
const formMethods = useForm({
  shouldUnregister: false,
});
```

탭 컴포넌트가 실제로 unmount되더라도 snapshot이 있으면 새 `useForm`에 값을 다시 복원할 수 있습니다.

## 즐겨찾기 목록은 공유하지 않기

현재 폼값과 저장된 즐겨찾기는 서로 다른 데이터입니다.

```text
현재 조회조건 snapshot: 필요할 때 탭 사이 공유
저장된 즐겨찾기 목록: conditionKey 기준으로 탭별 분리
```

따라서 탭 A의 현재 조건을 탭 B로 옮겨도 탭 A의 즐겨찾기 목록까지 옮길 필요는 없습니다.

```jsx
<SearchConditionForm
  conditionKey="order"
  savedConditions={orderSavedConditions}
/>

<SearchConditionForm
  conditionKey="delivery"
  savedConditions={deliverySavedConditions}
/>
```

## 권장 최종 구조

```text
Tabs 화면
├─ activeTab
├─ shareEnabled
├─ tabSnapshotsRef
└─ transferRequest

각 하위 탭
├─ 자기 useForm
├─ 자기 API options
├─ 자기 즐겨찾기 목록
├─ 활성 상태일 때 snapshot 기록
└─ transferRequest를 받으면
   ├─ 대상 탭 기존값과 공유값 병합
   ├─ prepareRestoreValues 실행
   └─ reset 한 번 실행
```

## 적용 체크리스트

- [ ] 각 탭이 자기 `useForm`을 가지고 있는가?
- [ ] 탭별 snapshot을 별도로 보관하는가?
- [ ] 공유 대상 필드 이름을 명확하게 정했는가?
- [ ] 대상 탭 기존값보다 공유값의 우선순위가 높은가?
- [ ] 서버 재조회 결과가 폼값을 다시 초기화하지 않는가?
- [ ] 렌더링마다 새로운 `defaultValues` 객체를 만들지 않는가?
- [ ] 날짜와 커스텀 필드는 hydrate/deserialize 후 복원하는가?
- [ ] 연동 options가 준비된 다음 `reset()`하는가?
- [ ] 탭별 즐겨찾기 목록은 `conditionKey`로 분리되어 있는가?
- [ ] 동일한 `name`이 두 탭에서 같은 의미와 값 형식을 가지는가?

## 한 줄 정리

필드 구성이 같아야 해서 snapshot 방식을 쓰는 것이 아닙니다. **탭마다 초기화, 서버 연동, 즐겨찾기와 validation을 독립적으로 유지하면서 필요한 값만 안전하게 이동하기 위해 탭별 `useForm + snapshot`을 사용합니다.**
