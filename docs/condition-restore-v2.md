# 조회조건 복원 트랜잭션 v2

조회조건 즐겨찾기와 탭 상속은 같은 복원 코디네이터를 사용합니다. 저장값을 곧바로 `reset()`하지 않고 옵션과 의존 데이터를 먼저 준비한 뒤, 검증된 최종값을 한 번만 적용합니다.

## 세 가지 데이터의 분리

| 데이터 | 보관 위치 | 포함 범위 |
| --- | --- | --- |
| 즐겨찾기 | 서버의 `{ key, name, value }` | 현재 폼의 모든 필드와 표준 빈 값 |
| 탭 세션값 | `useSearchConditionShareState` 메모리 | 탭의 현재 전체 상태 |
| 검색 payload | `onSearch` | 활성화된 실제 조회조건 |

즐겨찾기 `value`에는 `__conditionMeta.version: 2`가 추가됩니다. 최상위 서버 계약은 바뀌지 않으며, 메타데이터가 없는 기존 평면 객체·JSON 문자열·`values` 응답도 계속 복원합니다.

## 우선순위

하나의 복원 요청 안에서는 다음 순서로 값을 선택합니다.

1. 사용자가 마지막으로 선택한 즐겨찾기 또는 탭 상속값
2. 대상 탭에 남아 있던 세션값
3. `SearchConditionForm.defaultValues`
4. 필드 `initialValue`
5. 필드 `defaultValue`

복원값이 명시된 필드는 `initialValue` 변경 Effect와 Select 첫 옵션 자동 선택으로 덮어쓰지 않습니다. 사용자가 직접 해당 필드를 변경하면 보호 상태와 선택된 즐겨찾기 표시가 해제됩니다.

## 필드 restore 계약

```jsx
<SelectField
  name="cityCode"
  restore={{
    dependsOn: ['regionCode'],
    prepare: async ({ value, values, source, signal, emptyValue }) => {
      const options = await fetchCities(values.regionCode, { signal });
      const valid = options.some((option) => option.value === value);

      return {
        options,
        valid,
        nextValue: valid ? value : emptyValue,
        commit: () => setCityOptions(options),
        warning: valid ? undefined : '저장된 도시를 사용할 수 없어 초기화했습니다.',
      };
    },
  }}
/>
```

- `dependsOn`: 먼저 준비할 필드 이름 배열
- `prepare`: API 조회·정규화·검증 함수
- `nextValue`: 최종 RHF 값. 생략하면 기존 후보값 유지
- `options`: 공통 Select 유효성 검사에 사용할 이번 조회 결과
- `valid`: 필드 검증 결과. `false`이면 표준 빈 값으로 초기화하고 자동 초기값 선택도 막음
- `commit`: 모든 필드 준비가 성공한 뒤 옵션 state 등에 반영
- `warning`: 복원은 성공시키면서 사용자에게 보여 줄 안내

같은 의존 단계는 병렬로 준비합니다. 존재하지 않는 의존 필드와 순환 관계는 전체 복원 오류이며 기존 폼 값은 유지합니다. `prepare`에서는 아직 갱신되지 않은 React state가 아니라 함수가 반환받은 지역 `options`로 값을 검증해야 합니다.

## 복원 수명주기

```text
저장 형식 정규화
→ 현재 폼 스키마로 필터링
→ 기본값·탭값 병합
→ 폼 prepareRestoreValues
→ 필드 restore.prepare
→ commit
→ methods.reset() 1회
→ 탭 세션 저장
→ 전달 요청 확인 완료
```

새 요청이 시작되거나 컴포넌트가 사라지면 기존 `AbortSignal`이 취소됩니다. 전달 ID는 `reset()` 성공 뒤에만 완료 처리하므로 React StrictMode의 최초 Effect 재실행과 지연 마운트 탭에서도 요청을 다시 받을 수 있습니다.

`onRestoreStateChange.source`는 즐겨찾기 `favorite`, 다른 탭 상속 `tab-inherit`, 언마운트되었던 탭의 세션 복원 `tab-session`으로 구분합니다. 기존 폼 단위 `prepareRestoreValues`에는 호환성을 위해 탭 상속을 `tab-share`로 전달합니다.

복원 중 상위 탭 이동을 막으려면 `onRestoreStateChange`를 사용합니다.

```jsx
<SearchConditionForm
  onRestoreStateChange={({ isRestoring, tabKey }) => {
    setRestoringByTab((current) => ({ ...current, [tabKey]: isRestoring }));
  }}
/>
```

페이지 세션값은 브라우저 저장소에 기록하지 않으므로 새로고침하면 기본값으로 돌아갑니다.
