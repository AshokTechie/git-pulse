import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Github, Shield, Zap, ArrowLeft, Loader2, PlayCircle, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginDemo, loginWithEmail, registerWithEmail } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }
    setSubmitting(true);
    try {
      if (tab === 'signin') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name);
      }
      navigate('/select-repo');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setSubmitting(true);
    await loginDemo();
    navigate('/select-repo');
  };

  const handleGitHubLogin = async () => {
    await login();
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
          <span className="text-sm font-medium text-[#e8e8f0]">GitPulse AI</span>
        </div>
        <div className="w-16" />
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 relative z-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/[0.08] bg-[rgba(15,15,20,0.85)] backdrop-blur-xl p-8 shadow-2xl shadow-black/50">
            <div className="text-center mb-6">
              <div className="size-14 rounded-2xl bg-gradient-to-br from-[#2ea043] to-[#06b6d4] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[rgba(46,160,67,0.3)]">
                <Activity className="size-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#e8e8f0] mb-1">Welcome to GitPulse AI</h1>
              <p className="text-xs text-[#9ca3af]">
                Sign in with email and password to access repository analytics & AI copilot.
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex rounded-xl bg-white/[0.04] p-1 mb-6 border border-white/[0.06]">
              <button
                type="button"
                onClick={() => { setTab('signin'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  tab === 'signin' ? 'bg-[#2ea043] text-white shadow-md' : 'text-[#9ca3af] hover:text-[#e8e8f0]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setTab('signup'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  tab === 'signup' ? 'bg-[#2ea043] text-white shadow-md' : 'text-[#9ca3af] hover:text-[#e8e8f0]'
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {tab === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-[#9ca3af] mb-1">Your Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9ca3af]/60" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Rivera"
                      className="w-full bg-[#161622] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-[#e8e8f0] placeholder:text-[#9ca3af]/40 focus:outline-none focus:border-[#2ea043]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#9ca3af] mb-1">Email or Username</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9ca3af]/60" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@company.com"
                    className="w-full bg-[#161622] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-[#e8e8f0] placeholder:text-[#9ca3af]/40 focus:outline-none focus:border-[#2ea043]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#9ca3af] mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9ca3af]/60" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#161622] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-[#e8e8f0] placeholder:text-[#9ca3af]/40 focus:outline-none focus:border-[#2ea043]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2ea043] text-white hover:bg-[#34b34b] transition-all font-semibold text-sm shadow-lg shadow-[#2ea043]/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  tab === 'signin' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-[rgba(15,15,20,0.85)] text-xs text-[#9ca3af]/60">or quick options</span>
              </div>
            </div>

            {/* Quick Demo Access Button */}
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-[#e8e8f0] transition-all text-xs font-medium mb-2.5"
            >
              <PlayCircle className="size-4 text-[#06b6d4]" />
              <span>Instant Demo Access (No Password)</span>
            </button>

            {/* Real GitHub OAuth Button */}
            <button
              type="button"
              onClick={handleGitHubLogin}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-[#9ca3af] hover:text-[#e8e8f0] transition-all text-xs font-medium"
            >
              <Github className="size-4" />
              <span>Sign in with GitHub OAuth</span>
            </button>

            {/* Trust signals */}
            <div className="mt-6 pt-5 border-t border-white/[0.06]">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Shield, label: 'Encrypted', sub: 'AES-256' },
                  { icon: Zap, label: 'Fast Access', sub: 'Instant' },
                  { icon: Activity, label: 'Analytics', sub: 'Telemetry' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="text-center">
                    <div className="flex justify-center mb-1">
                      <Icon className="size-3.5 text-[#2ea043]" />
                    </div>
                    <p className="text-[11px] text-[#e8e8f0]/80 font-medium">{label}</p>
                    <p className="text-[10px] text-[#9ca3af]/50">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
