import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { FrontierSDK } from '@frontiertower/frontier-sdk';

const SdkContext = createContext<FrontierSDK | null>(null);

export const useSdk = (): FrontierSDK => {
  const sdk = useContext(SdkContext);
  if (!sdk) throw new Error('useSdk must be used within SdkProvider');
  return sdk;
};

export const SdkProvider = ({ children }: { children: ReactNode }) => {
  const sdkRef = useRef<FrontierSDK | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sdk = new FrontierSDK();
    sdkRef.current = sdk;
    setReady(true);

    return () => {
      sdk.destroy();
    };
  }, []);

  if (!ready) return null;

  return (
    <SdkContext.Provider value={sdkRef.current}>
      {children}
    </SdkContext.Provider>
  );
};
