import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './views/Layout';

// {{ROUTES}}
// Import your view components and define routes below.
// Pattern:
//   import { Home } from './views/Home';
//   import { Detail } from './views/Detail';
//
// Then add route objects to the children array:
//   { index: true, element: <Home /> },
//   { path: 'detail/:id', element: <Detail /> },

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      // {{ROUTES}}
    ],
  },
]);
