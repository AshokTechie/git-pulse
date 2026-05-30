import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, requireRepo = false }: { children: React.ReactNode; requireRepo?: boolean }) {
  const { isAuthenticated, isLoading, selectedRepo } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="size-8 border-2 border-[#2ea043]/30 border-t-[#2ea043] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireRepo && !selectedRepo) return <Navigate to="/select-repo" replace />;

  return <>{children}</>;
}
