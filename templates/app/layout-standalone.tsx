import { Outlet } from 'react-router-dom';
import { FrontierServicesProvider } from '../lib/frontier-services';

export const Layout = () => (
  <FrontierServicesProvider>
    <Outlet />
  </FrontierServicesProvider>
);
