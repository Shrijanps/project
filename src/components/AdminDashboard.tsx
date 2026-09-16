import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Database, 
  RotateCw, 
  Terminal, 
  CheckCircle2, 
  AlertCircle,
  Cpu,
  BarChart2,
  GitCompare,
  Layers,
  History,
  TrendingUp,
  ExternalLink,
  Plus,
  UserPlus,
  Shield,
  KeyRound,
  X
} from 'lucide-react';
import { User, ModelMetadata, PredictionHistoryItem, FeatureStats } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

interface AdminDashboardProps {
  onNavigateToProperties?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToProperties }) => {
  const { user } = useAuth();
  
  // Data states
  const [activeSubTab, setActiveSubTab] = useState<'ml' | 'users' | 'predictions'>('ml');
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [predictions, setPredictions] = useState<PredictionHistoryItem[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [retraining, setRetraining] = useState<boolean>(false);
  const [retrainOutput, setRetrainOutput] = useState<string | null>(null);
  const [retrainSuccess, setRetrainSuccess] = useState<boolean | null>(null);

  // Administrator Provisioning modal state
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState<boolean>(false);
  const [newAdminName, setNewAdminName] = useState<string>('');
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [newAdminPassword, setNewAdminPassword] = useState<string>('');
  const [adminCreationLoading, setAdminCreationLoading] = useState<boolean>(false);
  const [adminCreationError, setAdminCreationError] = useState<string | null>(null);
  const [adminCreationSuccess, setAdminCreationSuccess] = useState<string | null>(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<number | null>(null);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [metaRes, usersRes, predRes] = await Promise.all([
        api.getModelInfo(),
        api.getUsers(),
        api.getPredictions()
      ]);
      setMetadata(metaRes.model_info);
      setUsers(usersRes.users);
      setPredictions(predRes.predictions);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleTriggerRetrain = async () => {
    if (!window.confirm('Trigger Python ML model retraining pipeline on latest SQLite database records?')) {
      return;
    }
    setRetraining(true);
    setRetrainOutput('Executing: python3 ml/train_model.py...\n- Standardizing features\n- Running 5-fold cross-validation\n- Evaluating Linear Regression, Decision Tree, Random Forest & KNN...');
    setRetrainSuccess(null);

    try {
      const res = await api.retrainModel();
      setRetrainOutput(res.output || 'Training completed successfully.');
      setRetrainSuccess(true);
      // Reload metadata
      const updatedMeta = await api.getModelInfo();
      setMetadata(updatedMeta.model_info);
    } catch (err: any) {
      setRetrainOutput(err.message || 'Retraining failed.');
      setRetrainSuccess(false);
    } finally {
      setRetraining(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCreationError(null);
    setAdminCreationSuccess(null);
    setAdminCreationLoading(true);

    try {
      const res = await api.createAdminUser({
        name: newAdminName.trim(),
        email: newAdminEmail.trim(),
        password: newAdminPassword
      });
      setAdminCreationSuccess(res.message || 'New administrator provisioned.');
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      // Reload users list
      const usersRes = await api.getUsers();
      setUsers(usersRes.users);
      setTimeout(() => {
        setIsCreateAdminOpen(false);
        setAdminCreationSuccess(null);
      }, 1500);
    } catch (err: any) {
      setAdminCreationError(err.message || 'Failed to provision administrator.');
    } finally {
      setAdminCreationLoading(false);
    }
  };

  const handleToggleUserRole = async (targetUser: User) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const confirmMessage = targetUser.role === 'admin'
      ? `Demote ${targetUser.name} from Administrator to Regular User?`
      : `Promote ${targetUser.name} to Administrator? This grants full database and ML management privileges.`;

    if (!window.confirm(confirmMessage)) return;

    setUpdatingRoleUserId(targetUser.id);
    try {
      await api.updateUserRole(targetUser.id, newRole);
      // Reload users list
      const usersRes = await api.getUsers();
      setUsers(usersRes.users);
    } catch (err: any) {
      alert(err.message || 'Failed to update user role.');
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Admin Header */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-amber-600" />
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Admin & ML Evaluation Center
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-stone-500">
            Technical machine learning evaluation, model comparison, pipeline retraining, and user management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToProperties && (
            <button
              type="button"
              onClick={onNavigateToProperties}
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
            >
              <Database className="h-3.5 w-3.5" /> Manage Properties
            </button>
          )}
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300">
            Admin Access
          </span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-stone-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('ml')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'ml'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>ML Models & Performance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'users'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Management ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('predictions')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'predictions'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Platform Valuation Logs ({predictions.length})</span>
        </button>
      </div>

      {/* Tab 1: Machine Learning & Performance */}
      {activeSubTab === 'ml' && (
        <div className="space-y-6">
          
          {/* Section 1: Model Comparison (Viva & Evaluation Showcase) */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-1">
              <GitCompare className="h-5 w-5 text-amber-600" />
              <h2 className="text-base font-bold text-stone-900">
                Model Comparison: Regression Algorithms
              </h2>
            </div>
            <p className="text-xs text-stone-500 mb-5">
              Empirical evaluation comparing K-Nearest Neighbors against parametric (Linear Regression), tree-based (Decision Tree), and ensemble (Random Forest) models on the test split.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="border-b border-stone-200 bg-stone-50 font-semibold text-stone-900">
                  <tr>
                    <th className="px-3.5 py-3">Model Name</th>
                    <th className="px-3.5 py-3">Type</th>
                    <th className="px-3.5 py-3 font-mono">MAE ($)</th>
                    <th className="px-3.5 py-3 font-mono">RMSE ($)</th>
                    <th className="px-3.5 py-3 font-mono">R² Score</th>
                    <th className="px-3.5 py-3">Evaluation Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {metadata?.model_comparisons ? (
                    metadata.model_comparisons.map((m, idx) => {
                      const isSelected = m.name.includes('K-Nearest');
                      return (
                        <tr key={idx} className={isSelected ? 'bg-amber-50/50 font-medium' : 'hover:bg-stone-50'}>
                          <td className="px-3.5 py-3 font-bold text-stone-900 flex items-center gap-2">
                            {m.name}
                            {isSelected && (
                              <span className="rounded-full bg-emerald-100 text-emerald-900 px-2 py-0.5 text-[10px] font-bold">
                                Selected Production Model
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-3 text-stone-600">{m.type}</td>
                          <td className="px-3.5 py-3 font-mono font-bold text-stone-900">${m.mae.toLocaleString()}</td>
                          <td className="px-3.5 py-3 font-mono font-bold text-stone-900">${m.rmse.toLocaleString()}</td>
                          <td className="px-3.5 py-3 font-mono">
                            <span className={`px-2 py-0.5 rounded font-bold ${
                              m.r2_score > 0.65 ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-stone-800'
                            }`}>
                              {m.r2_score.toFixed(4)}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-stone-500">{m.notes}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-stone-400">
                        Trigger model retraining below to populate benchmark comparison data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Production Model Specs & Error Metrics */}
          {metadata && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
                <span className="text-xs font-semibold text-stone-400 uppercase">R² Score (Variance Explained)</span>
                <div className="text-2xl font-black text-stone-900 mt-1">
                  {metadata.metrics.r2_score.toFixed(4)}
                </div>
                <div className="text-[11px] text-emerald-700 font-medium mt-1">
                  {metadata.metrics.variance_explained_pct}% of price variance captured
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
                <span className="text-xs font-semibold text-stone-400 uppercase">Mean Absolute Error (MAE)</span>
                <div className="text-2xl font-black text-stone-900 mt-1">
                  ${metadata.metrics.mae.toLocaleString()}
                </div>
                <div className="text-[11px] text-stone-500 mt-1">
                  Baseline: ${metadata.metrics.baseline_mae.toLocaleString()}
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
                <span className="text-xs font-semibold text-stone-400 uppercase">Root Mean Squared Error (RMSE)</span>
                <div className="text-2xl font-black text-stone-900 mt-1">
                  ${metadata.metrics.rmse.toLocaleString()}
                </div>
                <div className="text-[11px] text-stone-500 mt-1">
                  Standard error on test split
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
                <span className="text-xs font-semibold text-stone-400 uppercase">Tuned Neighbors ($K$)</span>
                <div className="text-2xl font-black text-amber-700 mt-1">
                  K = {metadata.best_k}
                </div>
                <div className="text-[11px] text-stone-500 mt-1">
                  Weights: {metadata.weights} | Metric: {metadata.metric}
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Dataset Information */}
          {metadata && (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-1">
                <Database className="h-5 w-5 text-stone-700" />
                <h2 className="text-base font-bold text-stone-900">
                  Dataset Specifications & Feature Normalization
                </h2>
              </div>
              <p className="text-xs text-stone-500 mb-4">
                Total Samples: {metadata.total_samples} SQLite records ({metadata.train_samples} training / {metadata.test_samples} test partition). Features are standardized using StandardScaler ($\mu=0, \sigma=1$).
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="border-b border-stone-200 bg-stone-50 font-semibold text-stone-900">
                    <tr>
                      <th className="px-3 py-2">Feature Name</th>
                      <th className="px-3 py-2 font-mono">Mean ($\mu$)</th>
                      <th className="px-3 py-2 font-mono">Std Dev ($\sigma$)</th>
                      <th className="px-3 py-2 font-mono">Min</th>
                      <th className="px-3 py-2 font-mono">Max</th>
                      <th className="px-3 py-2 font-mono">Price Correlation ($r$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono">
                    {Object.entries(metadata.feature_stats).map(([feature, rawStats]) => {
                      const stats = rawStats as FeatureStats;
                      return (
                        <tr key={feature} className="hover:bg-stone-50">
                          <td className="px-3 py-2 font-sans font-semibold text-stone-900">
                            {feature.replace(/_/g, ' ')}
                          </td>
                          <td className="px-3 py-2">{stats.mean}</td>
                          <td className="px-3 py-2">{stats.std}</td>
                          <td className="px-3 py-2">{stats.min}</td>
                          <td className="px-3 py-2">{stats.max}</td>
                          <td className="px-3 py-2 font-bold text-amber-800">
                            {metadata.feature_correlations[feature] !== undefined
                              ? metadata.feature_correlations[feature].toFixed(4)
                              : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 4: Retraining Console */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-amber-600" />
                  <span>Execute Model Retraining Pipeline</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Runs <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-stone-800">python3 ml/train_model.py</code> to recalculate feature norms, cross-validation tuning, and benchmark evaluations across all current SQLite property records.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTriggerRetrain}
                disabled={retraining}
                className="flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-stone-800 disabled:opacity-50 transition-all cursor-pointer shrink-0"
              >
                <RotateCw className={`h-3.5 w-3.5 text-amber-400 ${retraining ? 'animate-spin' : ''}`} />
                <span>{retraining ? 'Running Pipeline...' : 'Trigger Model Retraining'}</span>
              </button>
            </div>

            {retrainOutput && (
              <div className="rounded-xl bg-stone-950 p-4 font-mono text-xs text-stone-300 border border-stone-800">
                <div className="flex items-center justify-between text-stone-400 border-b border-stone-800 pb-2 mb-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5" />
                    <span>Python Training Subprocess Log</span>
                  </div>
                  {retrainSuccess === true && (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="h-3 w-3" /> Training Complete
                    </span>
                  )}
                  {retrainSuccess === false && (
                    <span className="text-red-400 flex items-center gap-1 font-bold">
                      <AlertCircle className="h-3 w-3" /> Failed
                    </span>
                  )}
                </div>
                <pre className="whitespace-pre-wrap overflow-x-auto max-h-60 text-stone-300">
                  {retrainOutput}
                </pre>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 2: User Management */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-4 mb-4 gap-3">
              <div>
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-stone-700" />
                  <span>User Accounts & Security Governance</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Regular users self-register publicly. Administrator accounts are restricted to secure setup authorization.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateAdminOpen(!isCreateAdminOpen)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 transition-colors cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>+ Provision Administrator</span>
                </button>

                <button
                  type="button"
                  onClick={loadAllAdminData}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Inline Admin Provisioning Form (if open) */}
            {isCreateAdminOpen && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/40 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-700" />
                    <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      Authorized Administrator Provisioning
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateAdminOpen(false)}
                    className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-xs text-amber-900 mb-4">
                  Provision a new administrator directly. The newly created administrator will have full permissions to retrain machine learning models, inspect all records, and manage account privileges.
                </p>

                {adminCreationError && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-100 p-2.5 text-xs text-red-800">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{adminCreationError}</span>
                  </div>
                )}

                {adminCreationSuccess && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-100 p-2.5 text-xs text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{adminCreationSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jordan Miller"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Work Email</label>
                    <input
                      type="email"
                      required
                      placeholder="jordan@realestate.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Temporary Password</label>
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateAdminOpen(false)}
                      className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={adminCreationLoading}
                      className="rounded-lg bg-amber-800 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-900 disabled:opacity-50 cursor-pointer"
                    >
                      {adminCreationLoading ? 'Creating Administrator...' : 'Provision Administrator'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="border-b border-stone-200 bg-stone-50 font-semibold text-stone-900">
                  <tr>
                    <th className="px-3 py-2.5">User ID</th>
                    <th className="px-3 py-2.5">Name</th>
                    <th className="px-3 py-2.5">Email Address</th>
                    <th className="px-3 py-2.5">Role</th>
                    <th className="px-3 py-2.5 text-center">Properties</th>
                    <th className="px-3 py-2.5 text-center">Valuations</th>
                    <th className="px-3 py-2.5">Registered</th>
                    <th className="px-3 py-2.5 text-right">Role Governance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {users.map((u) => {
                    const isSelf = user?.id === u.id;
                    const isUpdating = updatingRoleUserId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-3 py-2.5 font-mono font-medium text-stone-500">#{u.id}</td>
                        <td className="px-3 py-2.5 font-semibold text-stone-900">
                          <div className="flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isSelf && (
                              <span className="rounded bg-stone-100 px-1.5 py-0.2 text-[10px] font-normal text-stone-600">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-stone-600">{u.email}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin' 
                              ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                              : 'bg-stone-100 text-stone-700'
                          }`}>
                            {u.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono">{u.properties_count || 0}</td>
                        <td className="px-3 py-2.5 text-center font-mono">{u.predictions_count || 0}</td>
                        <td className="px-3 py-2.5 text-stone-500">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {isSelf ? (
                            <span className="text-[11px] text-stone-400 italic">Current Session</span>
                          ) : (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleToggleUserRole(u)}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                                u.role === 'admin'
                                  ? 'border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                                  : 'border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
                              } disabled:opacity-50`}
                            >
                              {isUpdating ? 'Updating...' : u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Security Architecture Notice */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <KeyRound className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Security Model & Privilege Separation
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  • <strong>Regular Users:</strong> Can self-register through the public registration interface at any time. Accounts are confined to personal valuation history and property searches.<br />
                  • <strong>Administrators:</strong> Cannot be created through public self-registration. They are strictly provisioned via either the initial Master Setup Key (<code className="font-mono text-[11px] bg-stone-200 px-1 py-0.5 rounded">ADMIN_SETUP_KEY</code>) or directly by an active Administrator in this dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Platform Prediction Logs */}
      {activeSubTab === 'predictions' && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <History className="h-5 w-5 text-stone-700" />
                <span>Historical Price Valuations Log</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Audit trail of price valuations run by registered users and visitors.
              </p>
            </div>
            <button
              type="button"
              onClick={loadAllAdminData}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900"
            >
              <RotateCw className="h-3 w-3" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="border-b border-stone-200 bg-stone-50 font-semibold text-stone-900">
                <tr>
                  <th className="px-3 py-2.5">Log ID</th>
                  <th className="px-3 py-2.5">Evaluated By</th>
                  <th className="px-3 py-2.5">Valuation ($)</th>
                  <th className="px-3 py-2.5">Area</th>
                  <th className="px-3 py-2.5">Bed / Bath</th>
                  <th className="px-3 py-2.5">Garden / Pool</th>
                  <th className="px-3 py-2.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {predictions.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50">
                    <td className="px-3 py-2 font-mono">#{p.id}</td>
                    <td className="px-3 py-2">
                      {p.user_name ? (
                        <span className="font-semibold text-stone-900">{p.user_name}</span>
                      ) : (
                        <span className="text-stone-400 italic">Guest / Visitor</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono font-bold text-stone-900">
                      ${Math.round(p.predicted_price).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-mono">{p.input_features.Square_Feet} sq ft</td>
                    <td className="px-3 py-2 font-mono">{p.input_features.Num_Bedrooms}b / {p.input_features.Num_Bathrooms}ba</td>
                    <td className="px-3 py-2">
                      {p.input_features.Has_Pool ? 'Pool' : ''}
                      {p.input_features.Has_Pool && p.input_features.Has_Garden ? ' + ' : ''}
                      {p.input_features.Has_Garden ? 'Garden' : ''}
                      {!p.input_features.Has_Pool && !p.input_features.Has_Garden ? 'None' : ''}
                    </td>
                    <td className="px-3 py-2 text-stone-500">
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
