import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './components/Dashboard';
import { ContributionAnalytics } from './components/ContributionAnalytics';
import { RepositoryAnalytics } from './components/RepositoryAnalytics';
import { DeveloperInsights } from './components/DeveloperInsights';
import { AIInsights } from './components/AIInsights';
import { TeamCollaboration } from './components/TeamCollaboration';
import { RepositoryHealth } from './components/RepositoryHealth';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { router } from './routes';
export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'contributions':
        return <ContributionAnalytics />;
      case 'repositories':
        return <RepositoryAnalytics />;
      case 'developers':
        return <DeveloperInsights />;
      case 'ai-insights':
        return <AIInsights />;
      case 'team':
        return <TeamCollaboration />;
      case 'health':
        return <RepositoryHealth />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AuthProvider>
      <RouterProvider router={router}>
        <div className="dark size-full flex bg-background text-foreground overflow-hidden">
          <Sidebar
            currentView={currentView}
            onViewChange={setCurrentView}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-auto p-6 md:p-8">
              {renderView()}
            </main>
          </div>
        </div>
      </RouterProvider>
    </AuthProvider>
  );
}
