# 탭 간 조회조건 공유 최초 진입 실패 원인과 개선 가이드

## 1. 문제 현상

다음 순서로 조회조건을 공유할 때 두 번째 탭의 최초 진입에서만 공유값이 정상적으로 적용되지 않을 수 있다.

```text
첫 번째 탭에서 저장된 조회조건 선택
→ 첫 번째 탭 폼에는 정상 적용
→ 두 번째 탭으로 이동하며 현재값 snapshot 전달
→ 두 번째 탭 최초 진입에서는 기본값이 보이거나 일부 필드만 적용
→ 각 탭을 한 번 방문한 뒤 같은 작업을 반복하면 정상 동작
```

현재 구조를 기준으로 가장 가능성이 높은 원인은 다음 두 가지다.

1. 두 번째 탭의 최초 지연 마운트와 React StrictMode가 비동기 복원을 취소하지만, 요청 ID는 이미 처리 완료로 기록되는 문제
2. 공유값을 `reset()`한 뒤 연동 Select의 options 변경 Effect가 첫 옵션 또는 초기값으로 다시 덮는 문제

두 문제가 동시에 발생할 수도 있다.

---

## 2. 가장 유력한 원인: 최초 마운트에서 취소된 요청을 재시도하지 않음

### 2.1 관련 조건

현재 앱은 루트에서 `React.StrictMode`를 사용한다.

```jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

React는 개발 환경의 StrictMode에서 최초 마운트 시 Effect를 다음과 같이 한 번 더 점검한다.

```text
Effect setup
→ Effect cleanup
→ Effect setup 재실행
```

Ant Design Tabs의 `destroyOnHidden={false}`는 한 번 마운트된 탭을 숨길 때 제거하지 않는 설정이다. 모든 탭을 처음부터 렌더링하는 설정은 아니다. `forceRender`가 없으면 비활성 탭의 내용은 최초 클릭 시 지연 마운트될 수 있다.

```jsx
<Tabs
  activeKey={activeTab}
  destroyOnHidden={false}
  onChange={changeTab}
/>
```

따라서 두 번째 탭을 처음 클릭하는 순간 다음 작업이 한꺼번에 발생한다.

- 두 번째 탭 컴포넌트 최초 마운트
- 두 번째 탭의 `useForm`과 필드 등록
- 기본값 `reset()`
- options 관련 Effect 실행
- 공유 요청 Effect 실행
- StrictMode의 추가 cleanup/setup 실행

### 2.2 현재 코드에서 발생 가능한 순서

```text
1. 첫 번째 탭에서 저장조건 적용
2. 두 번째 탭 클릭
3. transferRequest 생성
4. 두 번째 탭 최초 마운트
5. 공유 Effect가 transferRequest 확인
6. appliedTransferId에 요청 ID를 먼저 기록
7. prepareRestoreValues 비동기 작업 시작
8. StrictMode cleanup이 restoreController.abort() 실행
9. 첫 번째 복원 작업은 stale 또는 aborted 상태가 됨
10. 공유 Effect가 다시 실행됨
11. appliedTransferId가 이미 같아서 요청을 건너뜀
12. 최종 reset()이 실행되지 않음
```

문제의 핵심은 요청 성공 전에 처리 완료 ID를 기록한다는 점이다.

```jsx
appliedTransferId.current = shareTransferRequest.id;

void applyConditionValues({
  rawValues: shareTransferRequest.values,
  source: 'tab-share',
});
```

동시에 마운트 cleanup에서는 진행 중인 요청을 취소한다.

```jsx
useEffect(() => () => {
  restoreController.current?.abort();
}, []);
```

`prepareRestoreValues`가 비동기이면 cleanup이 최종 `reset()`보다 먼저 실행될 가능성이 크다. 요청은 취소됐지만 ID가 남아 있으므로 재실행되지 않는다.

### 2.3 왜 한 번 방문한 다음에는 동작하는가

두 번째 탭을 한 번 방문하면 `destroyOnHidden={false}`에 의해 탭 컴포넌트가 마운트된 상태로 유지된다.

이후 탭 전환에서는 다음 조건이 사라진다.

- 대상 탭 최초 마운트
- 최초 마운트에 대한 StrictMode Effect 재실행
- `useForm`과 options state의 최초 준비

따라서 새로운 transfer ID를 가진 요청은 이미 준비된 폼에서 정상 처리될 가능성이 높다.

---

## 3. 개선 원칙: 성공한 뒤에만 요청을 처리 완료로 기록

`appliedTransferId`는 적용 시작 시점이 아니라 `applyConditionValues`가 실제로 성공한 뒤 기록해야 한다.

```jsx
useEffect(() => {
  const request = shareTransferRequest;

  if (
    !shareEnabled
    || !request
    || request.targetTab !== resolvedTabKey
    || appliedTransferId.current === request.id
  ) {
    return undefined;
  }

  let disposed = false;

  void (async () => {
    const result = await applyConditionValues({
      errorMessage: '공유된 조회조건을 적용하지 못했습니다.',
      rawValues: request.values,
      source: 'tab-share',
    });

    if (!disposed && result === 'applied') {
      appliedTransferId.current = request.id;
    }
  })();

  return () => {
    disposed = true;
  };
}, [
  applyConditionValues,
  resolvedTabKey,
  shareEnabled,
  shareTransferRequest,
]);
```

적용 결과별 처리 원칙은 다음과 같다.

| 결과 | 처리 |
| --- | --- |
| `applied` | 요청 ID를 처리 완료로 기록 |
| `stale` | 완료로 기록하지 않고 최신 Effect에서 다시 적용 가능하게 유지 |
| `aborted` | 완료로 기록하지 않음 |
| `error` | 실패 상태를 별도로 기록하거나 사용자 재시도 허용 |

StrictMode를 제거하면 개발 환경에서 증상이 사라질 수 있지만 근본 해결은 아니다. Effect가 `setup → cleanup → setup` 순서에서도 같은 최종 결과를 만들어야 한다.

---

## 4. 두 번째 원인: options 변경 후 자동 초기값이 공유값을 덮음

연동 Select가 options 변경을 감지하고 자동으로 첫 옵션을 설정하면 공유 복원값이 정상이어도 다시 덮어쓸 수 있다.

현재 선택값 자동 계산은 다음 요소의 영향을 받는다.

- `autoSelectFirst`
- `resetToFirstOnOptionsChange`
- options 이전값과 현재값 비교
- 현재 선택값이 options에 포함되어 있는지 여부

특히 `resetToFirstOnOptionsChange`가 활성화되어 있으면 options가 변경됐다는 이유만으로 유효한 현재값까지 첫 옵션으로 바꿀 수 있다.

```text
공유값 전달
→ prepareRestoreValues에서 options API 호출
→ setOptions(...)
→ methods.reset(공유값)
→ 새 options로 렌더링
→ useSelectAutoValue Effect 실행
→ optionsChanged === true
→ 첫 번째 옵션으로 setValue()
→ 공유값이 덮임
```

### 4.1 안전한 기본 규칙

복원된 현재값이 새 options 안에 존재한다면 우선 유지하는 편이 안전하다.

```js
if (isValidValue) {
  return currentValue;
}

return enabledOptions[0].value;
```

사용자가 상위 필드를 직접 변경했을 때만 무조건 첫 옵션으로 초기화해야 한다면 변경 원인을 구분한다.

```text
source === 'user'
→ 하위 필드 초기화 허용

source === 'favorite' | 'tab-share' | 'restore'
→ 현재값이 새 options에 존재하면 유지
```

단순히 `optionsChanged`만으로 초기화 여부를 결정하면 사용자 변경과 복원 작업을 구분할 수 없다.

---

## 5. prepareRestoreValues의 올바른 사용

`prepareRestoreValues`에서는 아직 공유값이 적용되지 않은 `form.getValues()`보다 함수가 전달받은 `values`를 기준으로 API 파라미터를 만들어야 한다.

```jsx
const prepareRestoreValues = async ({ values, signal }) => {
  const firstOptions = await loadFirstOptions({
    parentCode: values.parentCode,
    signal,
  });

  const secondOptions = await loadSecondOptions({
    parentCode: values.parentCode,
    childCode: values.childCode,
    signal,
  });

  setFirstOptions(firstOptions);
  setSecondOptions(secondOptions);

  return values;
};
```

다음 방식은 최초 진입에서 대상 탭의 기본값으로 options를 조회할 수 있다.

```jsx
const prepareRestoreValues = async ({ form }) => {
  const currentValues = form.getValues();

  // 아직 reset 전이므로 공유값이 아니라 대상 탭 기본값일 수 있다.
  await loadOptions(currentValues.parentCode);
};
```

권장 순서는 다음과 같다.

```text
전달 payload 확정
→ payload의 상위값으로 1차 options 조회
→ 정규화된 상위값으로 2차 options 조회
→ 전달값이 새 options에 유효한지 검사
→ 모든 options state 반영
→ 마지막에 reset() 한 번
```

상위 필드를 `useWatch`하는 별도 Effect가 자동으로 options API를 호출한다면 복원 중에는 `prepareRestoreValues`와 중복 요청하지 않도록 해야 한다. 늦게 도착한 기본값 기반 요청이 복원값 기반 options를 덮지 않도록 AbortController나 요청 sequence를 사용한다.

---

## 6. 세 번째 원인: 출발 탭 snapshot이 최신값이 아님

현재 `transfer()`는 이미 저장된 출발 탭 snapshot을 읽어 요청을 만든다.

```jsx
const request = createTabTransferRequest({
  sourceValues: snapshotsByTab.current[sourceTab],
  targetValues: snapshotsByTab.current[targetTab],
});
```

다음 경우에는 이전 snapshot이 전달될 수 있다.

- 저장조건의 비동기 복원이 끝나기 전에 탭을 이동함
- `reset()` 이후 snapshot 구독이 최신값을 기록하기 전에 `transfer()`가 실행됨
- 공유 필드 목록에 필요한 필드가 빠짐
- callback 방식 `watch`가 준비되기 전에 프로그램에서 값을 변경함

안전성을 높이는 방법은 다음과 같다.

1. 저장조건 적용 성공 직후 source snapshot을 명시적으로 갱신
2. 탭 이동 이벤트에서 source form의 `getValues()`를 동기적으로 읽음
3. callback 방식 `watch`를 렌더링 없는 `subscribe()`로 교체

부모가 각 탭의 최신값 getter를 등록받는 방식도 사용할 수 있다.

```text
registerTab('tab1', {
  getSnapshot,
  applySnapshot,
})
```

이 경우 탭 이동 시 subscription 반영 시점에 의존하지 않고 출발 탭의 현재값을 직접 가져올 수 있다.

---

## 7. defaultValues에 의해 공유값이 다시 초기화되는 경우

다음 흐름이 있으면 공유값을 적용한 후 초기값이 다시 들어갈 수 있다.

```text
공유값 reset()
→ options 또는 서버 API 응답
→ defaultValues 객체 재생성
→ 기본값 동기화 Effect 실행
→ 초기값 reset()
```

렌더링할 때마다 새로운 객체를 전달하는 패턴은 피한다.

```jsx
// 피해야 할 형태
<SearchConditionForm
  defaultValues={{
    parentCode: serverData.parentCode,
    childCode: serverData.childCode,
  }}
/>
```

필요하다면 참조를 안정화한다.

```jsx
const defaultValues = useMemo(() => ({
  parentCode: serverData.parentCode,
  childCode: serverData.childCode,
}), [serverData.parentCode, serverData.childCode]);
```

options API 응답은 가급적 다음 데이터만 변경한다.

- Select options
- 조회 목록
- 건수와 합계
- loading 상태

폼 기본값은 최초 진입이나 사용자가 명시적으로 초기화한 경우에만 변경하는 것이 안전하다.

---

## 8. 빠른 원인 확인 절차

### 8.1 StrictMode 확인

개발 환경에서 StrictMode를 잠시 제거하고 최초 이동을 확인한다.

- 정상 동작하면 `abort + appliedTransferId` 문제가 매우 유력하다.
- 확인 후 StrictMode는 다시 활성화하고 Effect를 재실행 가능하게 수정한다.

### 8.2 forceRender 확인

대상 탭을 처음부터 마운트해 본다.

```jsx
<Tabs.TabPane
  forceRender
  tab="변경 이력 조회"
  key="history"
>
  {/* ... */}
</Tabs.TabPane>
```

이 설정으로 해결되면 최초 lazy mount 경쟁 조건이 원인이다. 탭 수가 적다면 실용적인 완화책이지만, 요청 성공 전 ID를 기록하는 문제는 별도로 고쳐야 한다.

### 8.3 옵션 자동 초기화 확인

`resetToFirstOnOptionsChange`를 잠시 끄고 확인한다.

- 연동 Select가 정상화되면 options 변경 Effect가 값을 덮은 것이다.
- 텍스트 필드는 정상이고 Select만 실패하는 경우에도 이 가능성이 높다.

### 8.4 네 지점의 값을 비교

다음 지점에 임시 로그를 추가한다.

```text
A. transfer()가 만든 request.values
B. 대상 탭 applyConditionValues 시작 시 rawValues
C. prepareRestoreValues가 반환한 preparedValues
D. reset 직후 methods.getValues()
```

| 확인 결과 | 의심 원인 |
| --- | --- |
| A부터 값이 잘못됨 | source snapshot 또는 capture 문제 |
| A는 맞지만 B가 실행되지 않음 | target mount 또는 Effect 조건 문제 |
| B 이후 `stale`/`aborted` | StrictMode 또는 경쟁 요청 문제 |
| C가 잘못됨 | options 준비·값 매핑·정규화 문제 |
| D는 맞지만 이후 바뀜 | options 자동 초기화 또는 defaultValues 덮어쓰기 |

---

## 9. 권장하는 탭 간 폼 공유 구조

서로 다른 탭이 서로 다른 초기값, validation, options API를 사용한다면 `탭별 useForm + 부모 snapshot` 방향은 적절하다.

다만 snapshot 전달을 한 번 발생하고 사라지는 이벤트가 아니라 완료 확인이 필요한 요청으로 관리한다.

```text
부모 상태
├─ snapshotsByTab
└─ pendingTransfer
   ├─ id
   ├─ sourceTab
   ├─ targetTab
   ├─ values
   └─ status: pending | applying | applied | failed
```

권장 처리 흐름은 다음과 같다.

```text
출발 탭 현재값 확정
→ 부모에 pending 요청 저장
→ 대상 탭 mount/ready 확인
→ 전달 payload 기준으로 options 준비
→ reset() 한 번 실행
→ 대상 탭이 acknowledge(id)
→ 부모가 요청을 applied 처리하거나 제거
```

이 구조의 핵심은 다음과 같다.

- 대상 탭이 아직 없으면 요청을 `pending`으로 유지
- 비동기 복원이 취소되면 `applied`로 처리하지 않음
- options 준비와 form reset을 하나의 복원 트랜잭션으로 묶음
- 대상 탭이 성공을 확인한 후에만 요청 제거
- StrictMode에서 Effect가 재실행되어도 최종 결과가 동일함

두 탭의 필드 구성과 초기화 정책이 완전히 같다면 부모에서 `useForm` 하나를 만들고 Tabs 전체를 `FormProvider`로 감싸는 방법도 있다. 하지만 탭마다 options API, validation, 기본값 정책이 다르면 독립 폼과 명시적 transfer 구조가 더 안전하다.

---

## 10. 개선 우선순위

### 필수

1. `appliedTransferId`를 복원 성공 후에만 기록
2. `stale` 또는 `aborted` 요청은 재시도 가능하게 유지
3. `prepareRestoreValues`에서 전달받은 `values`로 options API 호출

### 권장

4. 복원 시 유효한 현재 Select 값을 options 변경보다 우선
5. 사용자 변경과 `favorite/tab-share/restore` 변경 원인 구분
6. callback 방식 `watch`를 `subscribe()`로 교체
7. source snapshot을 탭 이동 시점에 동기적으로 확정
8. transfer 요청에 `pending/applied/failed` 상태와 acknowledge 추가

### 상황별

9. 탭 수가 적고 최초 options 로딩 비용이 작으면 `forceRender` 사용
10. `defaultValues` 객체 참조를 `useMemo` 또는 state로 안정화

---

## 11. 참고 문서

- [React StrictMode 공식 문서](https://react.dev/reference/react/StrictMode)
- [React Effect 동기화 공식 문서](https://react.dev/learn/synchronizing-with-effects)
- [Ant Design Tabs 공식 API](https://ant.design/components/tabs/)
- [React Hook Form reset 공식 API](https://react-hook-form.com/docs/useform/reset)
- [React Hook Form useWatch 공식 API](https://react-hook-form.com/docs/usewatch)
- [React Hook Form subscribe 공식 API](https://react-hook-form.com/docs/useform/subscribe)
- [React Hook Form FormProvider 공식 API](https://react-hook-form.com/docs/formprovider)
