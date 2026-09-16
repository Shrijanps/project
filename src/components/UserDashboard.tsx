import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Trash2, 
  Clock, 
  TrendingUp, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Home
} from 'lucide-react';
import { PredictionHistoryItem } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

interface UserDashboardProps {
  onLoadValuationToPredictor?: (features: Record<string, number>, k: number) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onLoadValuationToPredictor }) => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<PredictionHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPredictions();
      setPredictions(res.predictions);
    } catch (err: any) {
      setError(err.message || 'Failed to load prediction history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this prediction from your history?')) return;
    try {
      await api.deletePrediction(id);
      setPredictions((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const avgValuation = predictions.length > 0
    ? predictions.reduce((acc, curr) => acc + curr.predicted_price, 0) / predictions.length
    : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Welcome back, {user?.name}
            </h1>
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-800 capitalize">
              {user?.role} Account
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-stone-500">
            {user?.email} • Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchHistory}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh History</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Total Valuations Performed
          </div>
          <div className="mt-2 text-3xl font-extrabold text-stone-900">
            {predictions.length}
          </div>
          <div className="text-xs text-stone-500 mt-1">Saved in SQLite predictions log</div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Average Estimated Price
          </div>
          <div className="mt-2 text-3xl font-extrabold text-stone-900">
            ${avgValuation.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-stone-500 mt-1">Across all historical sessions</div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            KNN Inference Engine
          </div>
          <div className="mt-2 text-2xl font-extrabold text-stone-900">
            Scikit-Learn Ready
          </div>
          <div className="text-xs text-emerald-700 mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Optimal K=8 Standardized
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900">Personal Valuation History</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Review previously computed property values, inspect input feature vectors, and re-run valuations.
            </p>
          </div>
          <span className="text-xs font-mono text-stone-400">
            {predictions.length} records
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-stone-500">
            <RefreshCw className="mx-auto h-5 w-5 animate-spin text-stone-400 mb-2" />
            Loading historical valuations...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-xs text-red-600">
            {error}
          </div>
        ) : predictions.length === 0 ? (
          <div className="py-12 text-center">
            <Calculator className="mx-auto h-8 w-8 text-stone-300 mb-2" />
            <h3 className="text-sm font-semibold text-stone-900">No valuations logged yet</h3>
            <p className="text-xs text-stone-500 mt-1">
              Switch to the "Price Valuation" tab to evaluate your first property.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="border-b border-stone-200 bg-stone-50 font-semibold text-stone-900">
                <tr>
                  <th className="px-3 py-2.5">ID</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Estimated Price</th>
                  <th className="px-3 py-2.5">Area</th>
                  <th className="px-3 py-2.5">Bed / Bath</th>
                  <th className="px-3 py-2.5">Year</th>
                  <th className="px-3 py-2.5">Model / K</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {predictions.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/70">
                    <td className="px-3 py-2 font-mono font-medium">#{p.id}</td>
                    <td className="px-3 py-2 text-stone-500">
                      {new Date(p.created_at).toLocaleDateString()} {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-2 font-bold text-stone-900">
                      ${p.predicted_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2">{p.input_features?.Square_Feet} sq ft</td>
                    <td className="px-3 py-2">
                      {p.input_features?.Num_Bedrooms}b / {p.input_features?.Num_Bathrooms}ba
                    </td>
                    <td className="px-3 py-2">{p.input_features?.Year_Built}</td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[11px] font-medium text-stone-700">
                        KNN (K={p.k_value})
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onLoadValuationToPredictor && (
                          <button
                            type="button"
                            onClick={() => onLoadValuationToPredictor(p.input_features, p.k_value)}
                            className="text-amber-700 hover:text-amber-900 font-medium"
                            title="Load in Predictor"
                          >
                            Re-evaluate
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
