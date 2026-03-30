import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { isInFrontierApp, createStandaloneHTML } from '@frontiertower/frontier-sdk/ui-utils';
import { SdkProvider } from '../lib/sdk-context';
import { FrontierServicesProvider } from '../lib/frontier-services';
import { NavBar } from '../components/NavBar';

const AppShell = () => (
  <FrontierServicesProvider>
    <div className="flex flex-col min-h-screen bg-background">
      <NavBar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  </FrontierServicesProvider>
);

export const Layout = () => {
  const [loading, setLoading] = useState(true);
  const [standaloneHtml, setStandaloneHtml] = useState('');

  useEffect(() => {
    const inFrontier = isInFrontierApp();

    if (!inFrontier) {
      setStandaloneHtml(createStandaloneHTML('x402 Agent Market'));
      setLoading(false);
      return;
    }

    setLoading(false);
  }, []);

  if (standaloneHtml) {
    return (
      <div
        className="min-h-screen bg-background text-foreground"
        dangerouslySetInnerHTML={{ __html: standaloneHtml }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <SdkProvider>
      <AppShell />
    </SdkProvider>
  );
};
