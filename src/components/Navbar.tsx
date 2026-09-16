import React from 'react';
import { 
  Home, 
  Calculator, 
  Database, 
  BarChart3, 
  UserCircle, 
  ShieldCheck, 
  Shield,
  LogOut, 
  LogIn, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { AuthMode } from './AuthModal';

interface NavbarProps {
  activeTab: 'predict' | 'properties' | 'analytics' | 'dashboard';
  setActiveTab: (tab: 'predict' | 'properties' | 'analytics' | 'dashboard') => void;
  onOpenAuth: (mode: AuthMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        
        {/* Brand Logo & Title */}
        <div 
          onClick={() => setActiveTab('predict')}
          className="flex items-center gap-3 cursor-pointer group"
          id="nav-logo"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-amber-400 shadow-sm group-hover:bg-stone-800 transition-colors">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-900 tracking-tight text-base sm:text-lg">
                EstateValuate
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-200/60">
                <Sparkles className="h-3 w-3 text-amber-600" />
                KNN ML
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden md:block">Smart House Price Analysis & Prediction</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            id="nav-tab-predict"
            onClick={() => setActiveTab('predict')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeTab === 'predict'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            <Calculator className="h-4 w-4" />
            <span>Predict Price</span>
          </button>

          <button
            id="nav-tab-properties"
            onClick={() => setActiveTab('properties')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeTab === 'properties'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>Browse Properties</span>
          </button>

          <button
            id="nav-tab-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeTab === 'analytics'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Market Analysis</span>
          </button>

          {user && (
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {user.role === 'admin' ? (
                <>
                  <ShieldCheck className="h-4 w-4 text-amber-500" />
                  <span>Admin & ML Center</span>
                </>
              ) : (
                <>
                  <UserCircle className="h-4 w-4" />
                  <span>My Predictions</span>
                </>
              )}
            </button>
          )}
        </nav>

        {/* User Account / Auth Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-stone-900">{user.name}</span>
                <span className="text-[11px] text-stone-500 capitalize">{user.role}</span>
              </div>
              
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${
                user.role === 'admin' ? 'bg-amber-600' : 'bg-stone-800'
              }`}>
                {user.name.charAt(0).toUpperCase()}
              </div>

              <button
                id="btn-logout"
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="btn-nav-admin-setup"
                onClick={() => onOpenAuth('admin-setup')}
                title="Authorized system administrator provisioning"
                className="hidden md:inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50/60 px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
              >
                <Shield className="h-3.5 w-3.5 text-amber-700" />
                <span>Admin Setup</span>
              </button>
              <button
                id="btn-nav-login"
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>
              <button
                id="btn-nav-register"
                onClick={() => onOpenAuth('register')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
              >
                <span>Register</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
