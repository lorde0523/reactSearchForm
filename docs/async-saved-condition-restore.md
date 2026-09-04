# 비동기 연동 필드의 저장조건 복원

앞 필드값으로 뒤 필드 옵션 API를 호출하는 화면에서 저장조건을 안전하게 복원하는 방법입니다.

## 문제 흐름

기존처럼 저장값을 바로 `reset()`하면 뒤 필드의 옵션보다 값이 먼저 적용될 수 있습니다.

```text
저장조건 선택
→ 전체값 reset
→ 상위 필드값 변경
→ 하위 옵션 API 호출
→ 옵션이 준비되기 전에 하위 저장값 적용 또는 초기화
```

`prepareRestoreValues`를 사용하면 순서가 다음처럼 바뀝니다.

```text
저장조건 선택
→ 저장값 deserialize
→ prepareRestoreValues 호출
→ 연동 옵션 API 순차 조회
→ 저장값과 option 유효성 확인
→ 최종값 반환
→ SearchConditionForm이 reset 한 번 실행
```

## 변경 위치

공통 `SearchConditionForm`은 이미 `prepareRestoreValues`를 지원합니다. 저장 모달은 기존처럼 별도 `SaveConditionModal` 컴포넌트를 그대로 사용하며 수정할 필요가 없습니다. 실제 페이지에서는 다음 두 곳만 작성합니다.

1. 연동 옵션을 순서대로 불러오는 `loadConditionDependencies`
2. 옵션 state를 반영하고 최종 폼값을 반환하는 `prepareRestoreValues`

## SearchConditionForm 최소 수정 내용

다른 프로젝트에 옮길 때는 기존 `SearchConditionForm` 전체를 교체하지 않고 아래 세 부분만 반영하면 됩니다.

### 1. prop과 요청 ref 추가

```jsx
export default function SearchConditionForm({
  // 기존 props
  prepareRestoreValues,
}) {
  // 기존 hooks
  const restoreController = useRef();
```

### 2. 기존 restoreCondition만 비동기로 교체

기존 모달 저장 로직이나 Row/Group 렌더링은 변경하지 않습니다.

```jsx
const restoreCondition = async (id) => {
  setSelectedConditionId(id);

  const selected = availableConditions.find(
    (condition) => condition.selectionId === id,
  );
  if (!selected) return;

  restoreController.current?.abort();
  const controller = new AbortController();
  restoreController.current = controller;

  try {
    const values = hydrateSavedValues(
      rows,
      parseSavedConditionValue(selected),
      initialValues,
    );

    const preparedValues = prepareRestoreValues
      ? await prepareRestoreValues({
        conditionKey,
        form: methods,
        initialValues,
        savedCondition: selected,
        signal: controller.signal,
        values,
      })
      : values;

    if (controller.signal.aborted || restoreController.current !== controller) return;

    methods.reset(preparedValues ?? values);
    message.success(`‘${selected.name}’ 조건을 적용했습니다.`);
  } catch (error) {
    if (controller.signal.aborted || restoreController.current !== controller) return;

    setSelectedConditionId(undefined);
    message.error('조회조건을 불러오지 못했습니다.');
    console.error(error);
  } finally {
    if (restoreController.current === controller) {
      restoreController.current = undefined;
    }
  }
};
```

### 3. 초기화·clear·unmount에서 진행 요청 취소

```jsx
restoreController.current?.abort();
```

위 한 줄을 조회조건 초기화 함수와 저장조건 clear 처리에 추가합니다. 컴포넌트가 사라질 때도 취소합니다.

```jsx
useEffect(() => () => {
  restoreController.current?.abort();
}, []);
```

`SaveConditionModal`은 계속 별도 컴포넌트로 렌더링합니다.

```jsx
<SaveConditionModal
  conditionKey={conditionKey}
  open={saveModalOpen}
  preview={snapshot.preview}
  value={snapshot.values}
  onCancel={() => setSaveModalOpen(false)}
  onSaveCondition={onSaveCondition}
/>
```

## 1. 값 비교 유틸

기본 Select 값과 `{ label, value }` 객체를 함께 처리합니다.

```jsx
function getOptionValue(item) {
  if (item && typeof item === 'object') return item.value;
  return item;
}

function getOptionValues(items) {
  return Array.isArray(items) ? items.map(getOptionValue) : [];
}

function toOption(item) {
  return {
    disabled: item.disabledYn === 'Y',
    key: item.code,
    label: item.name,
    title: item.name,
    value: item.code,
  };
}

function reconcileSingle(savedValue, options) {
  const code = getOptionValue(savedValue);
  if (code === undefined || code === null || code === '') return undefined;
  return options.find((option) => option.value === code);
}

function reconcileMultiple(savedValues, options) {
  const savedCodes = new Set(getOptionValues(savedValues));
  return options.filter((option) => savedCodes.has(option.value));
}
```

일반 Ant Design Select가 primitive 값만 사용한다면 `reconcileSingle()` 결과에서 `.value`만 반환하도록 바꿉니다.

```jsx
function reconcilePrimitive(savedValue, options) {
  return options.some((option) => option.value === savedValue)
    ? savedValue
    : undefined;
}
```

## 2. 연쇄 API 로더

저장값을 지역 변수에 누적하면서 상위 필드부터 옵션을 준비합니다. 초기 화면 조회에서도 같은 함수를 재사용할 수 있습니다.

```jsx
async function loadConditionDependencies({ savedValues, signal }) {
  let values = { ...savedValues };
  const options = {
    tech: [],
    detailTech: [],
    product: [],
    model: [],
  };

  const techResponse = await getTechOptions({
    params: {
      companyCd: values.companyCd,
      siteCd: values.siteCd,
    },
    signal,
  });

  options.tech = techResponse.data.map(toOption);
  values = {
    ...values,
    techCd: reconcileSingle(values.techCd, options.tech),
  };

  const detailResponse = await getDetailTechOptions({
    params: {
      companyCd: values.companyCd,
      siteCd: values.siteCd,
      techCd: getOptionValue(values.techCd),
    },
    signal,
  });

  options.detailTech = detailResponse.data.map(toOption);
  values = {
    ...values,
    detailTechCd: reconcileMultiple(values.detailTechCd, options.detailTech),
  };

  const productResponse = await getProductOptions({
    params: {
      companyCd: values.companyCd,
      siteCd: values.siteCd,
      techCd: getOptionValue(values.techCd),
      detailTechCds: getOptionValues(values.detailTechCd),
    },
    signal,
  });

  options.product = productResponse.data.map(toOption);
  values = {
    ...values,
    productCd: reconcileSingle(values.productCd, options.product),
  };

  const modelResponse = await getModelOptions({
    params: {
      companyCd: values.companyCd,
      siteCd: values.siteCd,
      techCd: getOptionValue(values.techCd),
      productCd: getOptionValue(values.productCd),
    },
    signal,
  });

  options.model = modelResponse.data.map(toOption);
  values = {
    ...values,
    modelCd: reconcileMultiple(values.modelCd, options.model),
  };

  return { options, values };
}
```

각 API 함수가 `AbortSignal`을 지원한다면 전달된 `signal`을 HTTP 클라이언트에 연결합니다. 지원하지 않아도 공통 폼이 요청 번호를 비교하므로 오래된 결과는 폼에 적용되지 않습니다.

## 3. 페이지의 prepareRestoreValues

옵션은 마지막에 한 번에 반영하고 최종 폼값을 반환합니다.

```jsx
const [fieldOptions, setFieldOptions] = useState({
  tech: [],
  detailTech: [],
  product: [],
  model: [],
});

const prepareRestoreValues = useCallback(async ({ values, signal }) => {
  const result = await loadConditionDependencies({
    savedValues: values,
    signal,
  });

  if (signal.aborted) return values;

  setFieldOptions(result.options);
  return result.values;
}, []);
```

```jsx
<SearchConditionForm
  conditionKey="product-search"
  formMethods={formMethods}
  savedConditions={savedConditions}
  prepareRestoreValues={prepareRestoreValues}
  onSearch={handleSearch}
  onSaveCondition={handleSaveCondition}
>
  {/* SearchRow / SearchGroup / Fields */}
</SearchConditionForm>
```

`prepareRestoreValues`가 받는 값:

| 값 | 설명 |
| --- | --- |
| `values` | 현재 필드 타입에 맞게 deserialize된 저장값 |
| `signal` | 이전 복원 요청을 취소하기 위한 AbortSignal |
| `conditionKey` | 현재 화면 조회조건 키 |
| `savedCondition` | 사용자가 선택한 원본 저장조건 레코드 |
| `source` | 기존 폼 전처리 호환값. 즐겨찾기는 `favorite`, 탭 조회조건 상속은 `tab-share` |
| `initialValues` | 화면 기본값 |
| `form` | react-hook-form methods |

반환값이 `undefined`이면 원래 `values`를 그대로 적용합니다.

## 4. 필드 연결

```jsx
<CustomField
  component={ApiSharedCodeSelect}
  name="techCd"
  options={fieldOptions.tech}
/>

<CustomField
  component={ApiSharedCodeSelect}
  name="detailTechCd"
  options={fieldOptions.detailTech}
/>

<CustomField
  component={ApiSharedCodeSelect}
  name="productCd"
  options={fieldOptions.product}
/>

<CustomField
  component={ApiSharedCodeSelect}
  name="modelCd"
  options={fieldOptions.model}
/>
```

## 커스텀 컴포넌트가 내부에서 API를 조회하는 경우

외부 `options`를 받을 수 없다면 커스텀 컴포넌트가 다음 중 하나를 지원해야 공통 폼이 준비 시점을 확실하게 알 수 있습니다.

- 전달된 `value`를 options 로딩 전에도 유지
- `onOptionsLoaded` 또는 `onReady` 제공
- `loadOptions`를 외부로 분리

`params`가 바뀔 때마다 값을 지우는 코드는 저장조건 복원과 충돌합니다.

```jsx
// 사용하지 않음
useEffect(() => {
  setSelectedItems([]);
  onChange?.([]);
}, [params]);
```

옵션만 다시 조회하도록 변경합니다.

```jsx
useEffect(() => {
  loadOptions(params).then(setOptions);
}, [params]);
```

사용자가 상위 필드를 직접 변경했을 때만 상위 필드 `onChange`에서 하위값을 지웁니다. `reset()` 복원은 이 사용자 이벤트를 발생시키지 않습니다.

## 실패와 중복 요청 처리

공통 폼이 다음을 처리합니다.

- 복원 Promise가 끝난 뒤 `reset()` 실행
- 새 요청 또는 기본값 초기화 시 이전 AbortController 취소
- 취소를 지원하지 않는 API도 현재 AbortController와 비교해 오래된 결과 무시
- API 실패 시 현재 폼을 유지하고 오류 메시지 표시

페이지에서는 API 오류를 숨기지 말고 `prepareRestoreValues` 밖으로 throw해야 공통 오류 처리가 동작합니다.
