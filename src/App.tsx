/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ValuationPredictor } from './components/ValuationPredictor';
import { PropertyCatalog } from './components/PropertyCatalog';
import { ModelAnalytics } from './components/ModelAnalytics';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal, AuthMode } from './components/AuthModal';
import { RoleAndProjectExplainer } from './components/RoleAndProjectExplainer';
import { Property } from './types';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'predict' | 'properties' | 'analytics' | 'dashboard'>('predict');
  const [authModalState, setAuthModalState] = useState<{ isOpen: boolean; mode: AuthMode }>({
    isOpen: false,
    mode: 'login'
  });

  const openAuth = (mode: AuthMode) => {
    setAuthModalState({ isOpen: true, mode });
  };

  const closeAuth = () => {
    setAuthModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleRunValuationWithSpecs = (prop: Property) => {
    setActiveTab('predict');
    // We can dispatch or pass to predictor
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={openAuth}
      />

      {/* Main Page Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* User / Admin Mode Indicator & Simple Project Guide */}
        <RoleAndProjectExplainer 
          onOpenAuth={openAuth}
          onNavigateTab={setActiveTab}
        />

        {activeTab === 'predict' && (
          <ValuationPredictor
            onSelectPropertyForInspection={(id) => {
              setActiveTab('properties');
            }}
            onOpenAuth={openAuth}
          />
        )}

        {activeTab === 'properties' && (
          <PropertyCatalog
            onRunValuationWithSpecs={handleRunValuationWithSpecs}
            onOpenAuth={openAuth}
          />
        )}

        {activeTab === 'analytics' && <ModelAnalytics />}

        {activeTab === 'dashboard' && (
          user?.role === 'admin' ? (
            <AdminDashboard onNavigateToProperties={() => setActiveTab('properties')} />
          ) : (
            <UserDashboard
              onLoadValuationToPredictor={(features, k) => {
                setActiveTab('predict');
              }}
            />
          )
        )}
      </main>

      {/* Persistent Global Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-6 text-xs text-stone-500">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">EstateValuate ML Platform</span>
            <span>•</span>
            <span>KNN Regression Engine (K=8, Euclidean, Distance-Weighted)</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-stone-400">
            <span>SQLite WAL Database</span>
            <span>•</span>
            <span>Scikit-Learn ML Pipeline</span>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalState.isOpen}
        initialMode={authModalState.mode}
        onClose={closeAuth}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
