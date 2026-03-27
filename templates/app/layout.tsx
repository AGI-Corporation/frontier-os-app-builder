import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { isInFrontierApp, createStandaloneHTML } from '@frontiertower/frontier-sdk/ui-utils';
import { SdkProvider } from '../lib/sdk-context';

export const Layout = () => {
  const [loading, setLoading] = useState(true);
  const [standaloneHtml, setStandaloneHtml] = useState('');

  useEffect(() => {
    const inFrontier = isInFrontierApp();

    if (!inFrontier) {
      setStandaloneHtml(createStandaloneHTML('{{APP_NAME}}'));
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
      <div className="loading-screen">
        <div className="spinner spinner-lg" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <SdkProvider>
      <Outlet />
    </SdkProvider>
  );
};
