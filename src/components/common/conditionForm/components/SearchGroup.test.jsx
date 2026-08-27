import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { App as AntdApp } from 'antd';
import { describe, expect, it } from 'vitest';
import { TextField } from '../fields';
import SearchConditionForm, { parseSavedConditionValue } from './SearchConditionForm';
import {
  PreviewTable,
  createSaveConditionPayload,
} from './SaveConditionModal';
import SearchGroup from './SearchGroup';
import SearchRow from './SearchRow';

globalThis.React = React;

describe('SearchGroup row control toggle', () => {
  it('controlRow가 꺼져 있어도 제어 체크박스는 활성화하고 row 필드만 비활성화한다', () => {
    const html = renderToStaticMarkup(
      <AntdApp>
        <SearchConditionForm>
          <SearchRow rowKey="customer">
            <SearchGroup
              groupKey="customerInfo"
              label="고객 정보"
              toggle={{
                name: 'useCustomerConditions',
                text: '고객 조건 사용',
                controlRow: true,
              }}
            >
              <TextField name="customerName" label="고객명" />
            </SearchGroup>
          </SearchRow>
        </SearchConditionForm>
      </AntdApp>,
    );

    const checkbox = html.match(/<input(?=[^>]+type="checkbox")[^>]*>/)?.[0];
    const textInput = html.match(/<input(?=[^>]+aria-label="고객명")[^>]*>/)?.[0];

    expect(checkbox).toBeDefined();
    expect(checkbox).not.toContain('disabled');
    expect(textInput).toContain('disabled');
  });
});

describe('PreviewTable', () => {
  it('커스텀 멀티 셀렉트는 5개까지만 표시하고 더보기 버튼을 제공한다', () => {
    const html = renderToStaticMarkup(
      <PreviewTable
        preview={[
          {
            key: 'codes',
            label: '기술 조건',
            fields: [
              {
                name: 'codes',
                label: '기술 코드',
                type: 'custom',
                value: '1 / 2 / 3 / 4 / 5 / 6',
                previewItems: ['1', '2', '3', '4', '5', '6'],
              },
            ],
          },
        ]}
      />,
    );

    expect(html).toContain('1 / 2 / 3 / 4 / 5');
    expect(html).not.toContain('1 / 2 / 3 / 4 / 5 / 6');
    expect(html).toContain('더보기');
  });
});

describe('saved condition value', () => {
  it('모달이 key, name, value 저장 payload를 만든다', () => {
    expect(createSaveConditionPayload(
      'reception',
      '  진행 중  ',
      { status: 'active' },
    )).toEqual({
      key: 'reception',
      name: '진행 중',
      value: { status: 'active' },
    });
  });

  it('key, name, value 컬럼의 value 객체를 복원한다', () => {
    expect(parseSavedConditionValue({
      key: 'reception',
      name: '진행 중',
      value: { status: 'active' },
    })).toEqual({ status: 'active' });
  });

  it('서버에서 JSON 문자열로 받은 value도 복원한다', () => {
    expect(parseSavedConditionValue({
      key: 'reception',
      name: '진행 중',
      value: '{"status":"active"}',
    })).toEqual({ status: 'active' });
  });

  it('기존 values 데이터도 읽기 호환한다', () => {
    expect(parseSavedConditionValue({ values: { status: 'done' } }))
      .toEqual({ status: 'done' });
  });

});
