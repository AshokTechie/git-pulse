import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Dashboard } from './Dashboard';
import { ContributionAnalytics } from './ContributionAnalytics';
import { RepositoryAnalytics } from './RepositoryAnalytics';
import { DeveloperInsights } from './DeveloperInsights';
import { AIInsights } from './AIInsights';
import { TeamCollaboration } from './TeamCollaboration';
import { RepositoryHealth } from './RepositoryHealth';

export function DashboardLayout() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'contributions': return <ContributionAnalytics />;
      case 'repositories': return <RepositoryAnalytics />;
      case 'developers': return <DeveloperInsights />;
      case 'ai-insights': return <AIInsights />;
      case 'team': return <TeamCollaboration />;
      case 'health': return <RepositoryHealth />;
      default: return <Dashboard />;
    }
  };

  return (
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
  );
}
