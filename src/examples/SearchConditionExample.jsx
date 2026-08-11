import { Input } from 'antd';
import SearchConditionForm from '../components/search-condition/SearchConditionForm';
import SearchGroup from '../components/search-condition/SearchGroup';
import SearchRow from '../components/search-condition/SearchRow';
import {
  AutoCompleteField,
  CheckboxField,
  CheckboxGroupField,
  CustomField,
  DateRangeField,
  NumberField,
  PeriodPickerField,
  RadioButtonGroupField,
  RadioGroupField,
  SelectField,
  SwitchField,
  TextAreaField,
  TextField,
} from '../components/search-condition/fields';

const statusOptions = [
  { label: '대기', value: 'waiting' },
  { label: '진행 중', value: 'active' },
  { label: '완료', value: 'done' },
];

const dateTypeOptions = [
  { label: '등록일', value: 'createdAt' },
  { label: '수정일', value: 'updatedAt' },
];

const channelOptions = [
  { label: '온라인', value: 'online' },
  { label: '전화', value: 'phone' },
  { label: '방문', value: 'visit' },
];

const notificationOptions = [
  { label: 'SMS', value: 'sms' },
  { label: '이메일', value: 'email' },
];

const priorityOptions = [
  { label: '전체', value: 'all' },
  { label: '일반', value: 'normal' },
  { label: '긴급', value: 'urgent' },
];

const regionOptions = [
  { label: '서울', value: '서울' },
  { label: '경기', value: '경기' },
  { label: '인천', value: '인천' },
];

export default function SearchConditionExample({
  defaultValues,
  savedConditions,
  onSaveCondition,
  onSearch,
}) {
  return (
    <SearchConditionForm
      conditionKey="business-search"
      defaultValues={defaultValues}
      savedConditions={savedConditions}
      onSaveCondition={onSaveCondition}
      onSearch={onSearch}
    >
      <SearchRow rowKey="basic" label="기본 조건" required>
        <TextField
          name="keyword"
          label="통합 검색"
          width={170}
          placeholder="고객명 또는 번호"
        />

        <SearchGroup groupKey="period" label="조회 기간">
          <SelectField
            name="dateType"
            label="날짜 기준"
            width={118}
            placeholder="날짜 기준"
            options={dateTypeOptions}
            onChange={(_, { form }) => {
              form.setValue('period', undefined, { shouldDirty: true });
            }}
          />
          <DateRangeField
            name="period"
            label="조회 기간"
            width={250}
            dependencies={['dateType']}
            disabled={({ values }) => !values.dateType}
          />
        </SearchGroup>

        <SearchGroup groupKey="status" label="진행 상태">
          <SelectField
            name="status"
            label="진행 상태"
            width={140}
            placeholder="전체"
            options={statusOptions}
          />
        </SearchGroup>
      </SearchRow>

      <SearchRow rowKey="customer" label="고객 조건">
        <SearchGroup groupKey="customerInfo" label="고객 정보">
          <TextField name="customerName" label="고객명" width={140} placeholder="고객명" />
          <TextField
            name="customerNumber"
            label="고객 번호"
            width={150}
            placeholder="고객 번호"
            rules={{ pattern: { value: /^[0-9-]*$/, message: '숫자와 하이픈만 입력할 수 있습니다.' } }}
          />
        </SearchGroup>

        <SearchGroup groupKey="channel" label="접수 채널">
          <SelectField
            name="channel"
            label="접수 채널"
            width={140}
            placeholder="채널 선택"
            options={channelOptions}
          />
        </SearchGroup>
      </SearchRow>

      <SearchRow rowKey="detail" label="상세 조건" detail>
        <CheckboxField
          name="urgent"
          label="긴급 여부"
          text="긴급 건만"
          checkedText="긴급 건만"
          defaultValue={false}
        />

        <SearchGroup groupKey="amount" label="금액 범위">
          <NumberField name="minAmount" label="최소 금액" width={130} placeholder="최소 금액" />
          <NumberField name="maxAmount" label="최대 금액" width={130} placeholder="최대 금액" />
        </SearchGroup>

        <SearchGroup groupKey="notificationChannels" label="알림 채널">
          <CheckboxGroupField
            name="notificationChannels"
            label="알림 채널"
            defaultValue={[]}
            options={notificationOptions}
          />
        </SearchGroup>

        <SearchGroup groupKey="manager" label="담당자 코드">
          <CustomField
            name="managerCode"
            label="담당자 코드"
            width={150}
            render={({ controllerField }) => (
              <Input
                {...controllerField}
                value={controllerField.value ?? ''}
                allowClear
                prefix="M-"
                placeholder="코드 입력"
                style={{ width: 150 }}
              />
            )}
            serialize={(value) => String(value).trim().toUpperCase()}
            deserialize={(value) => String(value).toLowerCase()}
            formatDisplay={(value) => `M-${value}`}
          />
        </SearchGroup>
      </SearchRow>

      <SearchRow rowKey="pickerExamples" label="날짜 조건" detail>
        <SearchGroup groupKey="weekPickers" label="주차">
          <PeriodPickerField name="week" label="기준 주차" picker="week" />
          <PeriodPickerField name="weekRange" label="주차 범위" picker="week" range />
        </SearchGroup>

        <SearchGroup groupKey="monthPickers" label="월">
          <PeriodPickerField name="month" label="기준 월" picker="month" />
          <PeriodPickerField name="monthRange" label="월 범위" picker="month" range />
        </SearchGroup>

        <SearchGroup groupKey="yearPickers" label="연도">
          <PeriodPickerField name="year" label="기준 연도" picker="year" />
          <PeriodPickerField name="yearRange" label="연도 범위" picker="year" range />
        </SearchGroup>
      </SearchRow>

      <SearchRow rowKey="additionalFields" label="추가 필드" detail>
        <SearchGroup groupKey="radioExamples" label="라디오">
          <RadioGroupField
            name="priority"
            label="우선순위"
            defaultValue="all"
            options={priorityOptions}
          />
          <RadioButtonGroupField
            name="priorityButton"
            label="우선순위 버튼"
            defaultValue="all"
            options={priorityOptions}
          />
        </SearchGroup>

        <SearchGroup groupKey="inputExamples" label="기타 입력">
          <SwitchField
            name="includeClosed"
            label="종료 건 포함"
            checkedText="포함"
            uncheckedText="제외"
            defaultValue={false}
            dependencies={['priority']}
            disabled={({ values }) => values.priority !== 'urgent'}
            style={{ marginInline: 4 }}
          />
          <AutoCompleteField
            name="region"
            label="지역"
            options={regionOptions}
            placeholder="지역 입력"
          />
          <TextAreaField
            name="memoKeyword"
            label="메모 검색어"
            width={220}
            placeholder="메모 검색어 입력"
            style={{ minWidth: 220 }}
          />
        </SearchGroup>
      </SearchRow>
    </SearchConditionForm>
  );
}
