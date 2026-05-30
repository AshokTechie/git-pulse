import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Github, Shield, Zap, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [authState, setAuthState] = useState<'idle' | 'redirecting' | 'exchanging' | 'done'>('idle');

  const handleGitHubLogin = async () => {
    setAuthState('redirecting');
    await new Promise(res => setTimeout(res, 600));
    setAuthState('exchanging');
    await login();
    setAuthState('done');
    navigate('/select-repo');
  };

  const statusMessages = {
    idle: '',
    redirecting: 'Redirecting to GitHub...',
    exchanging: 'Authenticating with GitHub...',
    done: 'Success! Loading your repositories...',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#2ea043]/[0.05] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-[#6e56cf]/[0.06] rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#06b6d4]/[0.06] rounded-full blur-[80px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 h-16 border-b border-white/[0.06]">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-[#9ca3af] hover:text-[#e8e8f0] transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-gradient-to-br from-[#2ea043] to-[#06b6d4] flex items-center justify-center">
            <Activity className="size-4 text-white" />
          </div>
          <span className="text-sm text-[#e8e8f0]">GitPulse AI</span>
        </div>
        <div className="w-16" />
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[rgba(15,15,20,0.8)] backdrop-blur-xl p-8 shadow-2xl shadow-black/50">
            <div className="text-center mb-8">
              <div className="size-16 rounded-2xl bg-gradient-to-br from-[#2ea043] to-[#06b6d4] flex items-center justify-center mx-auto mb-5 shadow-xl shadow-[rgba(46,160,67,0.3)]">
                <Activity className="size-8 text-white" />
              </div>
              <h1 className="text-2xl text-[#e8e8f0] mb-2">Welcome to GitPulse AI</h1>
              <p className="text-sm text-[#9ca3af]">
                Sign in with GitHub to start analyzing your repositories and team performance.
              </p>
            </div>

            {/* OAuth Button */}
            <button
              onClick={handleGitHubLogin}
              disabled={authState !== 'idle'}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-[#e8e8f0] text-[#0a0a0f] hover:bg-white transition-all font-medium disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              {authState === 'idle' ? (
                <>
                  <Github className="size-5" />
                  Continue with GitHub
                </>
              ) : (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  {statusMessages[authState]}
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-[rgba(15,15,20,0.8)] text-xs text-[#9ca3af]/50">or</span>
              </div>
            </div>

            <button
              onClick={handleGitHubLogin}
              disabled={authState !== 'idle'}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/[0.08] text-[#9ca3af] hover:text-[#e8e8f0] hover:border-white/20 hover:bg-white/[0.02] transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Github className="size-4" />
              Sign in with GitHub Enterprise
            </button>

            {/* Trust signals */}
            <div className="mt-8 pt-6 border-t border-white/[0.06]">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Shield, label: 'SOC 2 Type II', sub: 'Certified' },
                  { icon: Zap, label: 'Read-only', sub: 'Access' },
                  { icon: Activity, label: 'Real-time', sub: 'Analytics' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="text-center">
                    <div className="flex justify-center mb-1.5">
                      <Icon className="size-4 text-[#2ea043]" />
                    </div>
                    <p className="text-xs text-[#e8e8f0]/70">{label}</p>
                    <p className="text-xs text-[#9ca3af]/50">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Permissions note */}
          <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-xs text-[#9ca3af]/70 text-center leading-relaxed">
              GitPulse AI requests <span className="text-[#e8e8f0]/70">read-only</span> access to your repositories,
              commits, and pull requests. We never write to your repos or store your code.
            </p>
          </div>

          <p className="text-center text-xs text-[#9ca3af]/40 mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
