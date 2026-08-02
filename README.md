# 조회 조건 컴포넌트

React, Ant Design, react-hook-form으로 만든 스키마 기반 조회 조건 화면입니다. 모든 소스는 JavaScript/JSX로 작성되어 있습니다.

## 실행

```bash
pnpm install
pnpm dev
```

## 조건 구성

`src/App.jsx`의 `searchRows` 배열에 행과 소제목 그룹, 입력 필드를 선언합니다.

- `row.required: true`: 기본 노출되는 필수 조회 행
- `row.required: false`: 상세조회 버튼으로 펼쳐지는 행
- `group.label`: 저장 모달 테이블의 첫 번째 컬럼 값
- `group.fields`: 다음 소제목 전까지 하나의 값 세트로 묶을 입력 항목

지원 필드 타입은 `text`, `select`, `date`, `dateRange`, `checkbox`입니다. 같은 그룹의 값이 두 개 이상이면 저장 모달의 두 번째 컬럼에 `/`로 연결됩니다.
