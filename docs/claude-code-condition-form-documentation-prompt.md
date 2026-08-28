# Claude Code용 조회조건 폼 문서화 프롬프트

이 문서의 `프롬프트 시작` 아래 내용을 적용할 프로젝트 루트에서 Claude Code CLI에 붙여 넣습니다.

---

## 프롬프트 시작

현재 프로젝트의 실제 소스 코드를 직접 분석해서, 프로젝트에 구현된 “조회조건 폼과 공통 필드 사용 설명서”를 작성해줘.

목표:

- 새로 들어온 개발자가 문서만 읽고 조회조건 화면을 만들 수 있어야 한다.
- 설명은 5살 아이도 흐름을 이해할 정도로 쉽고 친절하게 작성한다.
- 단, 실제 개발에 필요한 prop, 데이터 타입, 예제 코드는 빠뜨리지 않는다.
- TypeScript가 아니라 현재 프로젝트와 동일한 JavaScript/JSX로 작성한다.
- 추측해서 작성하지 말고 반드시 실제 코드에 구현된 내용만 문서화한다.

중요한 작업 규칙:

1. 먼저 현재 Git 상태를 확인한다.
2. 사용자가 수정 중인 파일이나 관계없는 변경사항은 절대 되돌리지 않는다.
3. `rg`, `rg --files` 등을 이용해 조회조건 폼 관련 파일을 전부 찾는다.
4. public `index.js`의 export 목록을 기준으로 외부에서 사용할 수 있는 컴포넌트와 훅을 확인한다.
5. 컴포넌트 구현, 테스트, 예제 화면, 기존 README를 함께 읽는다.
6. 코드와 문서가 다르면 실제 코드를 기준으로 작성한다.
7. 존재하지 않는 prop이나 동작을 만들어내지 않는다.
8. 이번 작업에서는 기능 코드를 수정하지 말고 문서만 작성한다.
9. 기존 README에 조회조건 폼과 관계없는 내용이 있다면 삭제하지 않는다.
10. 문서 작성 후 사용한 컴포넌트명, prop명, import 경로가 실제 코드와 일치하는지 다시 검증한다.

우선 다음 영역을 찾아서 분석해줘:

- SearchConditionForm
- SaveConditionModal
- SearchRow
- SearchGroup
- ControlledField
- CustomField
- fields 폴더의 모든 공통 필드
- useSearchConditionShare 또는 탭 공유 관련 훅
- 조회조건 snapshot 생성 및 hydrate/deserialize 관련 함수
- picker format 관련 함수
- 실제 사용 예제 컴포넌트
- 관련 테스트 코드
- README 및 docs 폴더

문서는 기존 README의 조회조건 폼 설명을 최신 코드에 맞게 다시 정리하거나, 내용이 너무 길면 `docs/condition-form-guide.md`로 분리하고 README에는 링크와 빠른 시작 방법을 넣어줘.

문서 구성은 반드시 다음 순서를 사용해줘.

# 1. 이 기능이 무엇인가요?

아주 쉬운 말로 설명한다.

예:

- SearchConditionForm은 여러 입력칸을 담는 큰 상자
- SearchRow는 한 줄
- SearchGroup은 한 줄 안에서 서로 관련된 필드 묶음
- 각 Field는 사용자가 값을 넣는 입력칸
- react-hook-form은 입력한 값을 기억하는 역할

간단한 구조 그림도 넣어줘.

예시 형태:

```text
FormProvider
└─ SearchConditionForm
   ├─ 조회조건 즐겨찾기
   ├─ SearchRow
   │  ├─ Row 라벨
   │  └─ SearchGroup
   │     ├─ Group 라벨
   │     └─ Field
   ├─ 초기화
   ├─ 조회
   └─ 상세검색
```

실제 코드 구조와 다르면 실제 코드에 맞게 수정해라.

# 2. 5분 만에 조회조건 화면 만들기

가장 작은 실행 가능한 JSX 예제를 작성한다.

반드시 포함할 것:

- 필요한 import
- useForm 생성
- SearchConditionForm
- SearchRow
- SearchGroup
- TextField
- SelectField
- onSearch
- defaultValues
- JavaScript/JSX 코드

복사해서 바로 사용할 수 있는 완전한 예제로 작성한다.

# 3. 폼값은 어디에 저장되나요?

다음 내용을 쉽게 설명한다:

- FormProvider
- useForm
- formMethods
- getValues
- setValue
- reset
- useWatch
- handleSubmit
- Controller가 담당하는 역할

각 기능마다 짧은 예제를 제공한다.

예:

```jsx
const formMethods = useForm({
  defaultValues: {
    customerName: '',
    status: 'waiting',
  },
});

formMethods.getValues();
formMethods.setValue('status', 'done');
formMethods.reset();
```

# 4. 기본 레이아웃 사용법

실제 구현을 기준으로 다음 컴포넌트를 각각 설명한다:

- SearchConditionForm
- SearchRow
- SearchGroup

각 컴포넌트마다 다음 표를 만든다:

- prop 이름
- 필수 여부
- 기본값
- 설명
- 간단한 사용 예

다음 내용도 실제 구현 여부를 확인해서 설명한다:

- row 라벨
- group 라벨
- 라벨이 없는 group
- detail row
- className
- Form.Item 관련 prop
- toggle
- 그룹 비활성화
- row 전체 비활성화
- 저장 모달에서 라벨을 묶는 방식

# 5. 모든 필드 사용법

fields 폴더와 public export를 조사해서 현재 외부에서 사용할 수 있는 모든 필드를 빠짐없이 작성한다.

예상 가능한 필드 이름을 그대로 믿지 말고 실제 export를 기준으로 목록을 만든다.

각 필드마다 반드시 다음 형식을 사용한다.

## 필드명

한 문장 설명:

“이 필드는 무엇을 입력할 때 사용합니다.”

가장 단순한 예제:

```jsx
<FieldName
  name="..."
  label="..."
/>
```

주요 prop 표:

- name
- label
- defaultValue
- initialValue
- disabled
- dependencies
- rules
- className
- style
- formItemClassName
- formItemStyle
- onChange
- options
- format
- width
- placeholder
- 실제 해당 필드에서 지원하는 추가 prop

폼에 저장되는 값의 모양:

```js
{
  fieldName: '실제 저장 형태'
}
```

주의사항:

- 값이 문자열인지
- 배열인지
- boolean인지
- dayjs인지
- 서버 전송 전에 변환이 필요한지
- 조회조건 저장 시 어떤 형태로 직렬화되는지

# 6. SelectField 사용법

특히 자세하게 작성한다.

다음 내용을 실제 구현과 비교해서 설명한다:

- options 형식
- value와 label
- disabled option
- allowClear
- mode
- autoSelectFirst
- resetToFirstOnOptionsChange
- 옵션 변경 시 기존 값 유지 조건
- 값이 없을 때 첫 옵션 자동 선택
- 현재 값이 새 옵션에 없을 때 처리
- 옵션이 바뀌어도 기존 값이 남아 있을 때 처리
- 자동 선택 시 onChange 실행 여부
- `context.source`
- `context.reason`

다음 세 가지 예제를 각각 작성한다.

1. 값이 없을 때만 첫 옵션 선택

```jsx
<SelectField
  autoSelectFirst
  name="detailCode"
  options={detailOptions}
/>
```

2. 옵션이 바뀌면 무조건 첫 옵션 선택

```jsx
<SelectField
  autoSelectFirst
  resetToFirstOnOptionsChange
  name="detailCode"
  options={detailOptions}
/>
```

3. 저장조건 값은 유지하고, 사용자가 앞 필드를 변경했을 때만 하위 필드를 초기화한 뒤 첫 옵션 선택

이 예제에서는 이전 options를 먼저 비우고, RHF 값을 `undefined`로 만든 후, API 조회 결과를 options에 넣는 순서를 보여줘.

# 7. onChange 사용법

기본 RHF 저장은 자동으로 되고, 추가 함수도 실행할 수 있다는 점을 설명한다.

실제 `onChange(value, context)`의 context 구조를 코드에서 확인해서 표로 작성한다.

다음 사례를 포함한다:

- 다른 필드 초기화
- API 재조회
- 여러 필드 한 번에 변경
- 자동 선택인지 사용자 선택인지 구분
- shouldDirty 설정
- setValue 사용

# 8. dependencies와 disabled

다음 패턴을 설명한다:

```jsx
<SelectField
  name="detailCode"
  dependencies={['mainCode']}
  disabled={({ values }) => !values.mainCode}
/>
```

반드시 실제 코드에서 함수형 disabled에 전달되는 값을 확인해서 작성한다:

- values
- dependencyValues
- form
- name
- field

페이지마다 useWatch를 여러 개 작성하는 방식과 dependencies를 사용하는 방식의 차이도 쉽게 설명한다.

# 9. 체크박스 관련 필드

실제 구현된 다음 종류를 구분해서 설명한다:

- 단일 Checkbox
- CheckboxGroup
- Switch
- SearchGroup toggle

다음 내용도 포함한다:

- boolean 저장 형태
- 체크하지 않은 false 값도 저장되는지
- 저장 모달에서는 false가 숨겨지는지
- CheckboxGroup의 배열값
- 라디오값에 따라 CheckboxGroup을 활성화/비활성화하는 예
- 서버에 Y/N으로 보내는 변환 예

# 10. 날짜 필드 사용법

실제 구현된 날짜 필드를 전부 조사한다.

다음 항목이 있다면 각각 설명한다:

- 일반 DatePicker
- DateRangePicker
- week picker
- week range
- month picker
- month range
- year picker
- year range
- 하나로 합쳐진 period picker

각 필드마다 다음을 구분해서 작성한다:

- 화면 표시 포맷
- RHF 내부 값
- 조회조건 저장값
- 서버 전송값
- 저장값을 다시 불러올 때 변환 방식

주차 값이 `202631st`처럼 표시되지 않고 사용자가 이해할 수 있는 주차 라벨로 보이는 처리도 실제 코드에서 확인해서 설명한다.

# 11. CustomField 사용법

CustomField의 실제 구현을 읽고 다음 내용을 설명한다:

- component 전달 방법
- controllerProps
- componentProps 또는 실제 사용 중인 prop 전달 방식
- value
- onChange
- disabled
- name
- options
- dependencies
- 커스텀 컴포넌트의 반환값 변환
- serialize
- deserialize
- getPreviewValue 또는 실제 미리보기 변환 함수

`ApiSharedCodeSelect`처럼 다음 형태를 반환하는 멀티 셀렉트 예제를 작성한다.

```js
[
  {
    disabled: false,
    key: 'A',
    label: '항목 A',
    title: '항목 A',
    value: 'A',
  },
]
```

다음도 설명한다:

- 실제 폼에는 무엇을 저장하는지
- 서버에는 무엇을 보내는지
- 저장 모달에는 객체 전체가 아니라 label만 표시하는 방법
- 6개 이상일 때 더보기 처리
- API, params, activeTabKey 등의 기존 props 전달 방법

# 12. 조회조건 저장

실제 코드를 기준으로 전체 과정을 설명한다.

흐름 그림:

```text
현재 폼값
→ snapshot 생성
→ 저장 모달에 preview 출력
→ 저장 이름 입력
→ 서버 payload 생성
```

서버 저장 payload가 실제로 다음 형태인지 확인해서 작성한다:

```js
{
  key: '페이지 조회조건 키',
  name: '사용자가 입력한 저장 이름',
  value: {
    fieldName: 'field value',
  },
}
```

다음 내용도 포함한다:

- key
- name
- value
- preview는 서버 저장용이 아니라 모달 출력용이라는 점
- row 라벨
- group 라벨
- 라벨 없는 group 표시
- 여러 필드 `/` 구분
- 여러 줄 표시
- 체크박스 false 숨김
- 커스텀 멀티 셀렉트 더보기

# 13. 저장된 조회조건 불러오기

실제 다음 함수의 역할을 확인해서 설명한다:

- parseSavedConditionValue
- normalizeSavedValues
- hydrateSavedValues
- deserializeFieldValue
- prepareRestoreValues
- methods.reset

다음 순서를 아주 쉽게 설명한다:

```text
저장조건 선택
→ 저장된 문자열 또는 객체 정리
→ 현재 화면 필드에 맞게 값 변환
→ 연동 옵션 API 준비
→ 모든 options 적용
→ 마지막에 reset 한 번 실행
```

`prepareRestoreValues`의 실제 인자도 표로 작성한다:

- values
- signal
- conditionKey
- savedCondition
- initialValues
- form

# 14. 연동 API가 여러 개인 조회조건 복원

앞 API 결과가 다음 API 파라미터가 되는 경우를 실제 사용 가능한 코드로 작성한다.

예:

```text
기본 저장값
→ 기술 옵션 API
→ 상세기술 옵션 API
→ 상품 옵션 API
→ 모델 옵션 API
→ 최종 options 반영
→ reset
```

중요한 규칙:

- Promise.all을 사용하면 안 되는 순차 의존 API 사례
- API 파라미터는 아직 reset되지 않은 `form.getValues()`가 아니라 `prepareRestoreValues`의 `values`를 기준으로 만드는 이유
- AbortSignal
- 빠르게 다른 저장조건을 선택했을 때 이전 결과를 무시하는 방식
- 옵션이 준비되기 전에 값을 넣으면 커스텀 셀렉트가 값을 초기화할 수 있는 문제

# 15. 탭 간 조회조건 공유

실제 공유 훅 구현을 읽고 설명한다.

다음 사례를 분리한다:

- 항상 공유
- 토글이 true일 때만 공유
- 공유하지 않음
- 폼값은 공유하지만 저장된 즐겨찾기 목록은 탭별로 분리
- 각 탭이 자기 useForm을 가지고 있는 구조

실제 프로젝트에서 사용하는 함수명과 prop명으로 예제를 작성한다.

# 16. 초기값 사용법

다음을 구분해서 설명한다:

- useForm의 defaultValues
- SearchConditionForm의 defaultValues
- 필드별 defaultValue
- 필드별 initialValue
- 서버 비동기 응답 후 reset
- 여러 API 응답을 합쳐서 한 번만 reset
- 순차 API 응답을 기존 기본값에 계속 합치는 방식

# 17. 자주 발생하는 문제

최소한 다음 문제를 Q&A 형식으로 작성한다.

- 값이 화면에 안 보여요.
- options는 있는데 Select가 선택되지 않아요.
- options가 바뀌었는데 이전 값이 남아 있어요.
- 저장조건을 불러오면 뒤쪽 커스텀 필드가 초기화돼요.
- getValues로 가져온 초기값 비교가 안 돼요.
- defaultValue가 서버 응답 후 반영되지 않아요.
- useWatch와 useEffect가 너무 많아졌어요.
- disabled는 됐는데 값은 그대로 남아 있어요.
- 체크박스 false가 저장되지 않아요.
- 커스텀 멀티 셀렉트가 모달에서 object로 보여요.
- 주차가 `202631st`처럼 보여요.
- API params에 다른 필드값을 어떻게 넣나요?
- reset 후 커스텀 컴포넌트의 화면값이 남아 있어요.

각 답변에는 원인, 해결 방법, 짧은 코드를 넣어줘.

# 18. 전체 props 참고표

실제 소스를 기준으로 다음 표를 작성한다:

- SearchConditionForm props
- SearchRow props
- SearchGroup props
- 모든 Field 공통 props
- 필드별 전용 props
- onChange context
- prepareRestoreValues 인자
- 저장 payload
- snapshot 데이터

# 19. 마지막 점검표

새 페이지를 만들 때 확인할 체크리스트를 작성한다.

예:

- [ ] useForm을 만들었나요?
- [ ] 모든 필드 name이 중복되지 않나요?
- [ ] options의 label/value가 올바른가요?
- [ ] API 연동 필드는 dependencies를 지정했나요?
- [ ] 저장조건 key가 페이지별로 구분되나요?
- [ ] DatePicker 저장 포맷을 확인했나요?
- [ ] 커스텀 필드 serialize/deserialize를 작성했나요?
- [ ] 저장 후 다시 불러오기까지 테스트했나요?

문서 작성 스타일:

- 어려운 용어를 먼저 쉬운 말로 풀어쓴다.
- 한 문단은 짧게 작성한다.
- 긴 설명보다 작은 코드 예제를 우선한다.
- “왜 필요한지 → 어떻게 쓰는지 → 어떤 값이 저장되는지” 순서로 설명한다.
- 표를 적극적으로 사용한다.
- 모든 코드 예제는 JavaScript/JSX로 작성한다.
- 예제의 import 문을 생략하지 않는다.
- 실제 파일과 줄 번호를 확인할 수 있도록 중요한 설명에는 상대 경로를 표시한다.
- 내부 구현 세부사항과 페이지 사용법을 명확하게 분리한다.
- 처음 보는 사람이 반드시 알아야 할 내용에는 “중요” 표시를 한다.
- 고급 기능에는 “필요할 때만 사용” 표시를 한다.

최종 검증:

1. 문서에 적은 모든 컴포넌트가 실제 export되어 있는지 확인한다.
2. 문서에 적은 모든 prop이 실제 구현되어 있는지 확인한다.
3. 예제에서 사용하는 import 경로가 실제 public export와 일치하는지 확인한다.
4. 기존 테스트를 실행한다.
5. 프로덕션 빌드를 실행한다.
6. 문서만 변경되었는지 Git diff로 확인한다.
7. 발견한 코드와 문서의 불일치는 임의로 고치지 말고 마지막 결과에 별도로 보고한다.
8. 테스트나 빌드가 실패하면 원인과 문서 작업과의 관련 여부를 보고한다.

작업 완료 후 다음 내용을 간단히 보고해줘:

- 생성 또는 수정한 문서 파일
- 문서화한 컴포넌트 및 필드 목록
- 테스트 결과
- 빌드 결과
- 실제 코드와 기존 문서 사이에서 발견한 불일치
- 추가 문서화가 필요한 부분

## 프롬프트 끝
