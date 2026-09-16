import React, { useState } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  UserCheck, 
  Shield, 
  User, 
  Sparkles, 
  Home, 
  Calculator, 
  KeyRound,
  LogIn,
  LogOut,
  ShieldCheck,
  UserPlus,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthMode } from './AuthModal';

interface RoleAndProjectExplainerProps {
  onOpenAuth?: (mode: AuthMode) => void;
  onNavigateTab?: (tab: 'predict' | 'properties' | 'analytics' | 'dashboard') => void;
}

export const RoleAndProjectExplainer: React.FC<RoleAndProjectExplainerProps> = ({ 
  onOpenAuth,
  onNavigateTab
}) => {
  const { user, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs">
      {/* Role & Access Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs ${
            user?.role === 'admin' 
              ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300' 
              : user 
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-stone-100 text-stone-600'
          }`}>
            {user?.role === 'admin' ? (
              <ShieldCheck className="h-5 w-5 text-amber-700" />
            ) : user ? (
              <UserCheck className="h-5 w-5 text-emerald-600" />
            ) : (
              <User className="h-5 w-5 text-stone-500" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Account Status:
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                user?.role === 'admin'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : user
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-stone-100 text-stone-700 border border-stone-200'
              }`}>
                {user?.role === 'admin' ? '🛡️ Administrator' : user ? '👤 Regular User' : '👁️ Guest Visitor'}
              </span>

              {user && (
                <span className="text-xs font-medium text-stone-500">
                  ({user.name} • {user.email})
                </span>
              )}
            </div>

            <p className="text-xs text-stone-500 mt-0.5">
              {user?.role === 'admin'
                ? 'Administrator Privileges: Full access to model comparisons, database management, and retraining pipelines.'
                : user
                ? 'Regular User Account: Price valuations are automatically linked and archived to your personal dashboard.'
                : 'Guest View: Run real-time price valuations freely. Regular users can register an account; admin accounts require secure setup.'}
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
          {user?.role === 'admin' && onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition-colors cursor-pointer"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Admin Center</span>
            </button>
          )}

          {user && user.role === 'user' && onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>My Predictions</span>
            </button>
          )}

          {user ? (
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <>
              {onOpenAuth && (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenAuth('register')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>User Self-Register</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenAuth('admin-setup')}
                    title="Authorized administrator provisioning"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50/70 px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-amber-700" />
                    <span>Secure Admin Setup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenAuth('login')}
                    className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <LogIn className="h-3.5 w-3.5 text-stone-500" />
                    <span>Sign In</span>
                  </button>
                </>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900 px-2 py-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <HelpCircle className="h-3.5 w-3.5 text-stone-400" />
            <span>{isExpanded ? 'Hide Info' : 'BCA Project Scope'}</span>
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Expandable Project & Viva Scope Architecture Info */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-stone-100 space-y-4 text-xs">
          <div className="rounded-xl bg-amber-50/70 p-3.5 border border-amber-200">
            <div className="font-bold text-amber-950 text-sm mb-1 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-700" />
              <span>Project Focus: Real-Estate Management & Machine Learning Valuation System</span>
            </div>
            <p className="text-amber-900 leading-relaxed">
              Designed as a practical, full-featured web application: <strong>House price prediction</strong> and <strong>similar property identification</strong> form the core Machine Learning capability, supported by complete <strong>Property CRUD</strong>, <strong>User Authentication</strong>, <strong>Market Analysis</strong>, and <strong>System Administration</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="rounded-xl bg-stone-50 p-3 border border-stone-200">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-1">
                <Calculator className="h-4 w-4 text-stone-800" />
                <span>1. ML Price Estimation</span>
              </div>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                Predicts house prices and retrieves nearest comparable properties based on 10 housing features using trained regression models.
              </p>
            </div>

            <div className="rounded-xl bg-stone-50 p-3 border border-stone-200">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-1">
                <Home className="h-4 w-4 text-stone-800" />
                <span>2. Property CRUD</span>
              </div>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                Complete database management: browse, search, create, update, and delete property records stored in SQLite.
              </p>
            </div>

            <div className="rounded-xl bg-stone-50 p-3 border border-stone-200">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-1">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <span>3. Authentication</span>
              </div>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                Public self-registration for standard users; secure master-key setup for administrators; secure password hashing & JWT tokens.
              </p>
            </div>

            <div className="rounded-xl bg-stone-50 p-3 border border-stone-200">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-1">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span>4. Market Analysis</span>
              </div>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                Interactive visual charts showing price trends, feature correlations (r values), and model accuracy statistics.
              </p>
            </div>

            <div className="rounded-xl bg-stone-50 p-3 border border-stone-200">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-1">
                <ShieldCheck className="h-4 w-4 text-amber-700" />
                <span>5. Administration</span>
              </div>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                Academic comparison table across 4 algorithms (KNN, Linear Reg, Decision Tree, Random Forest), Python retraining, and audit logs.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
