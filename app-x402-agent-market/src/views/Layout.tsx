import { Outlet } from 'react-router-dom';
import { FrontierServicesProvider } from '../lib/frontier-services';
import { NavBar } from '../components/NavBar';
import { ToastProvider, ToastContainer } from '../components/Toast';
import { ScrollToTop } from '../components/ScrollToTop';

export const Layout = () => (
  <FrontierServicesProvider>
    <ToastProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <ScrollToTop />
        <NavBar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <ToastContainer />
      </div>
    </ToastProvider>
  </FrontierServicesProvider>
);
