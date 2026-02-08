import { createContext, useContext } from 'react';

const DemoContext = createContext(false);

export const useIsDemo = () => useContext(DemoContext);
export const DemoProvider = DemoContext.Provider;
