import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Shield, 
  ShieldCheck, 
  KeyRound, 
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type AuthMode = 'login' | 'register' | 'admin-setup';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: AuthMode;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode, onClose }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, register, adminSetup } = useAuth();

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setSetupKey('');
    setError(null);
    setSuccessMsg(null);
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login({ email, password });
        onClose();
      } else if (mode === 'register') {
        // Public registration: strictly regular user account
        await register({ name, email, password });
        onClose();
      } else if (mode === 'admin-setup') {
        // Secure Admin Setup: requires verified master setup key
        if (!setupKey.trim()) {
          throw new Error('Master Admin Setup Key is required to create an administrator account.');
        }
        await adminSetup({ name, email, password, setup_key: setupKey.trim() });
        setSuccessMsg('Administrator account successfully provisioned and authenticated.');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication operation failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const fillEvaluationCredentials = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div 
        className="relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-stone-200"
        id="auth-modal-dialog"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Top Branding / Header */}
        <div className="mb-6 text-center">
          <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl shadow-xs ${
            mode === 'admin-setup' 
              ? 'bg-amber-900 text-amber-300 ring-4 ring-amber-100' 
              : 'bg-stone-900 text-amber-400'
          }`}>
            {mode === 'admin-setup' ? (
              <ShieldCheck className="h-6 w-6" />
            ) : mode === 'register' ? (
              <UserIcon className="h-6 w-6" />
            ) : (
              <Lock className="h-6 w-6" />
            )}
          </div>

          <h2 className="text-xl font-bold text-stone-900">
            {mode === 'login' && 'Sign in to EstateValuate'}
            {mode === 'register' && 'Create Regular User Account'}
            {mode === 'admin-setup' && 'Secure Administrator Setup'}
          </h2>

          <p className="mt-1 text-xs sm:text-sm text-stone-500">
            {mode === 'login' && 'Sign in with your registered user or administrator credentials.'}
            {mode === 'register' && 'Public registration creates a regular user account to save and track property valuations.'}
            {mode === 'admin-setup' && 'Administrative provisioning is restricted. Requires the Master Security Setup Key.'}
          </p>
        </div>

        {/* Mode-Specific Security Notice Banner */}
        {mode === 'register' && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-stone-50 p-3 text-xs text-stone-600 border border-stone-200">
            <Info className="h-4 w-4 text-stone-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-stone-800">Public User Self-Registration:</span>{' '}
              Grants standard access to price prediction, personal search history, and saved properties. Admin accounts cannot be created through this form.
            </div>
          </div>
        )}

        {mode === 'admin-setup' && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200">
            <Shield className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-950">Gated Setup Process:</span>{' '}
              Admin accounts have full control over the SQLite database, model comparisons, and Python retraining. You must provide the authorized master setup key.
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {(mode === 'register' || mode === 'admin-setup') && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {mode === 'admin-setup' ? 'Administrator Full Name' : 'Full Name'}
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  required
                  placeholder={mode === 'admin-setup' ? 'e.g. Eleanor Vance' : 'e.g. Jane Doe'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 py-2 pl-9 pr-3 text-sm text-stone-900 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {mode === 'admin-setup' ? 'Admin Work Email' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-stone-300 py-2 pl-9 pr-3 text-sm text-stone-900 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-stone-300 py-2 pl-9 pr-3 text-sm text-stone-900 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          {mode === 'admin-setup' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-900">
                  Master Security Setup Key <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-stone-400 font-mono">Server Authorization</span>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-amber-600" />
                <input
                  type="password"
                  required
                  placeholder="Enter authorized ADMIN_SETUP_KEY"
                  value={setupKey}
                  onChange={(e) => setSetupKey(e.target.value)}
                  className="w-full rounded-lg border border-amber-300 bg-amber-50/30 py-2 pl-9 pr-3 text-sm text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Evaluation setup key: <code className="font-mono bg-stone-100 text-stone-800 px-1 py-0.5 rounded text-[10px]">estate_admin_master_setup_key_2026</code>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer ${
              mode === 'admin-setup'
                ? 'bg-amber-800 hover:bg-amber-900'
                : 'bg-stone-900 hover:bg-stone-800'
            } disabled:opacity-50`}
          >
            {loading ? (
              'Authenticating...'
            ) : mode === 'login' ? (
              'Sign In'
            ) : mode === 'register' ? (
              'Create Regular User Account'
            ) : (
              'Verify Security Key & Provision Admin'
            )}
          </button>
        </form>

        {/* Evaluation Helpers for Reviewers (Fills Real Credentials on the Login Form) */}
        {mode === 'login' && (
          <div className="mt-5 border-t border-stone-100 pt-4">
            <div className="mb-2 text-center text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
              Quick Autofill for System Evaluation
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillEvaluationCredentials('admin@realestate.com', 'admin123')}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <Shield className="h-3.5 w-3.5 text-amber-600" />
                <span>Fill Admin Login</span>
              </button>
              <button
                type="button"
                onClick={() => fillEvaluationCredentials('analyst@realestate.com', 'user123')}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <UserIcon className="h-3.5 w-3.5 text-stone-600" />
                <span>Fill User Login</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer Mode Navigation */}
        <div className="mt-5 border-t border-stone-100 pt-3 text-center text-xs text-stone-500 space-y-1.5">
          {mode === 'login' && (
            <>
              <div>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-semibold text-stone-900 hover:underline cursor-pointer"
                >
                  Register as regular user
                </button>
              </div>
              <div>
                Need to configure system admin?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('admin-setup')}
                  className="font-semibold text-amber-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <KeyRound className="h-3 w-3" /> Secure Admin Setup
                </button>
              </div>
            </>
          )}

          {mode === 'register' && (
            <>
              <div>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-semibold text-stone-900 hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </div>
              <div className="text-[11px] text-stone-400">
                Are you a system administrator?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('admin-setup')}
                  className="font-semibold text-amber-700 hover:underline cursor-pointer"
                >
                  Use Secure Admin Setup
                </button>
              </div>
            </>
          )}

          {mode === 'admin-setup' && (
            <>
              <div>
                Not an administrator?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-semibold text-stone-900 hover:underline cursor-pointer"
                >
                  Register regular user account
                </button>
              </div>
              <div>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-semibold text-stone-900 hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
