import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { App as AntdApp } from 'antd';
import { describe, expect, it } from 'vitest';
import { TextField } from '../fields';
import SearchConditionForm from './SearchConditionForm';
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
