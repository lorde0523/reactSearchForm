import { createContext } from 'react';

export const DetailVisibilityContext = createContext(false);
export const ConditionDisabledContext = createContext(false);
export const ConditionRestoreContext = createContext({
  isAutoValueBlocked: () => false,
  isRestoring: false,
  hasExternalValue: () => false,
  releaseField: () => {},
  reportUserChange: () => {},
  source: undefined,
});
