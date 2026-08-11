export const PICKER_CONFIGS = {
  week: {
    displayFormat: 'YYYY-w[주차]',
    picker: 'week',
    valueFormat: 'YYYYwo',
    width: 180,
  },
  weekRange: {
    displayFormat: 'YYYY-w[주차]',
    picker: 'week',
    range: true,
    valueFormat: 'YYYYwo',
    width: 300,
  },
  month: {
    displayFormat: 'YYYY-MM',
    picker: 'month',
    valueFormat: 'YYYYMM',
    width: 150,
  },
  monthRange: {
    displayFormat: 'YYYY-MM',
    picker: 'month',
    range: true,
    valueFormat: 'YYYYMM',
    width: 260,
  },
  year: {
    displayFormat: 'YYYY',
    picker: 'year',
    valueFormat: 'YYYY',
    width: 120,
  },
  yearRange: {
    displayFormat: 'YYYY',
    picker: 'year',
    range: true,
    valueFormat: 'YYYY',
    width: 220,
  },
};

export const PICKER_TYPES = Object.keys(PICKER_CONFIGS);
