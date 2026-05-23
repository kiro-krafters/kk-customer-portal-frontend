import { createBrowserRouter } from 'react-router';
import Layout from './Pages/Layout';
import HomePage from './Pages/HomePage';
import ClaimsPage from './Pages/ClaimsPage';
import PolicyPage from './Pages/PolicyPage';
import CallbackPage from './Pages/CallbackPage';
import ContactPage from './Pages/ContactPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'claims', element: <ClaimsPage /> },
      { path: 'policy', element: <PolicyPage /> },
      { path: 'callback', element: <CallbackPage /> },
      { path: 'contact', element: <ContactPage /> },
    ],
  },
]);
