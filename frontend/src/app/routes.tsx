import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { RepositorySelector } from './components/RepositorySelector';
import { DashboardLayout } from './components/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/select-repo',
    element: (
      <ProtectedRoute>
        <RepositorySelector />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute requireRepo>
        <DashboardLayout />
      </ProtectedRoute>
    ),
  },
]);
