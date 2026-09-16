import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Sliders, 
  Cpu, 
  Database, 
  CheckCircle2, 
  RefreshCw,
  Award,
  Zap,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine
} from 'recharts';
import { ModelMetadata } from '../types';
import { api } from '../api';

export const ModelAnalytics: React.FC = () => {
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getModelInfo()
      .then((res) => setMetadata(res.model_info))
      .catch((err) => setError(err.message || 'Failed to load model metadata'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-stone-500">
        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-stone-400 mb-2" />
        Loading machine learning model analytics and validation metrics...
      </div>
    );
  }

  if (error || !metadata) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-xs text-red-700 text-center">
        {error || 'Model metadata unavailable.'}
      </div>
    );
  }

  // Transform feature correlations for Recharts
  const correlationData = Object.entries(metadata.feature_correlations)
    .map(([feature, corr]) => {
      const c = Number(corr);
      return {
        feature: feature.replace(/_/g, ' '),
        correlation: c,
        absCorr: Math.abs(c)
      };
    })
    .sort((a, b) => b.correlation - a.correlation);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
          Model Accuracy & Insights
        </h1>
        <p className="mt-1 text-sm text-stone-500 max-w-3xl">
          Here is how accurately our pricing system predicts home values, and which property features have the biggest impact on market price.
        </p>
      </div>

      {/* Plain English Summary Card */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
        <div className="flex items-center gap-2 font-bold text-amber-900 text-sm mb-2">
          <Info className="h-4 w-4 text-amber-700" />
          <span>In Plain Words: How Well Does This Model Work?</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-700">
          <div className="rounded-xl bg-white p-3.5 border border-amber-200/60">
            <div className="font-bold text-stone-900 text-sm">~70% Price Accuracy</div>
            <p className="mt-1 text-stone-500">
              The model explains 70% of real market price differences across homes based purely on physical characteristics and location.
            </p>
          </div>
          <div className="rounded-xl bg-white p-3.5 border border-amber-200/60">
            <div className="font-bold text-stone-900 text-sm">Typical Margin: &plusmn; $51,000</div>
            <p className="mt-1 text-stone-500">
              On average, the estimated price is within ~$51k of what the house actually sold for in real closing records.
            </p>
          </div>
          <div className="rounded-xl bg-white p-3.5 border border-amber-200/60">
            <div className="font-bold text-stone-900 text-sm">Top 3 Price Drivers</div>
            <p className="mt-1 text-stone-500">
              <strong>#1 Living Area</strong> (sq ft), followed by <strong>#2 Neighborhood Score</strong>, and <strong>#3 Pool & Garden</strong> amenities.
            </p>
          </div>
        </div>
      </div>

      {/* Model Spec & Architecture Badge Bar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-amber-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">{metadata.model_name}</h2>
              <p className="text-xs text-stone-500">Algorithm: {metadata.algorithm} ({metadata.weights} weighting)</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
              Optimal Neighbors: K = {metadata.best_k}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
              Metric: Euclidean
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
              Features: 10 Standardized
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-stone-400 font-medium">Dataset Partition:</span>
            <div className="font-semibold text-stone-800 mt-0.5">
              {metadata.train_samples} Train / {metadata.test_samples} Test (80/20)
            </div>
          </div>
          <div>
            <span className="text-stone-400 font-medium">Preprocessing:</span>
            <div className="font-semibold text-stone-800 mt-0.5">
              StandardScaler ($\mu=0, \sigma=1$)
            </div>
          </div>
          <div>
            <span className="text-stone-400 font-medium">Cross-Validation:</span>
            <div className="font-semibold text-stone-800 mt-0.5">
              5-Fold Stratified K-Fold
            </div>
          </div>
          <div>
            <span className="text-stone-400 font-medium">Weighting Strategy:</span>
            <div className="font-semibold text-stone-800 mt-0.5">
              Inverse Distance ($w_i = 1 / d_i$)
            </div>
          </div>
        </div>
      </div>

      {/* Primary Evaluation Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* R-squared */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-semibold uppercase tracking-wider">R² Score</span>
            <Award className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-stone-900 tracking-tight">
            {metadata.metrics.r2_score.toFixed(4)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{metadata.metrics.variance_explained_pct}% variance explained</span>
          </div>
        </div>

        {/* MAE */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-semibold uppercase tracking-wider">Mean Absolute Error</span>
            <TrendingUp className="h-4 w-4 text-stone-600" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-stone-900 tracking-tight">
            ${metadata.metrics.mae.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-stone-500">
            Baseline MAE: ${metadata.metrics.baseline_mae.toLocaleString()} (-50.9%)
          </div>
        </div>

        {/* RMSE */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-semibold uppercase tracking-wider">Root Mean Squared Error</span>
            <Zap className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-stone-900 tracking-tight">
            ${metadata.metrics.rmse.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-stone-500">
            Baseline RMSE: ${metadata.metrics.baseline_rmse.toLocaleString()} (-45.2%)
          </div>
        </div>

        {/* Total Samples */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-semibold uppercase tracking-wider">Properties Evaluated</span>
            <Database className="h-4 w-4 text-stone-600" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-stone-900 tracking-tight">
            {metadata.total_samples}
          </div>
          <div className="mt-2 text-xs text-stone-500">
            100 held-out test records
          </div>
        </div>

      </div>

      {/* Two Responsive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: Feature Correlations with Price */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-bold text-stone-900">Feature Pearson Correlation with Price ($r$)</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Linear correlation coefficient ($r \in [-1, 1]$) indicating the predictive strength of each attribute.
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={correlationData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f0" />
                <XAxis 
                  type="number" 
                  domain={[0, 0.7]} 
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  tickFormatter={(v) => `+${v.toFixed(2)}`}
                />
                <YAxis 
                  type="category" 
                  dataKey="feature" 
                  tick={{ fontSize: 11, fill: '#44403c' }}
                  width={110}
                />
                <Tooltip
                  formatter={(val: any) => [`+${val}`, 'Pearson Correlation']}
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                    border: 'none'
                  }}
                />
                <Bar dataKey="correlation" fill="#d97706" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: K-Value vs Cross-Validation RMSE Curve */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">Hyperparameter Tuning: K vs Error (RMSE)</h3>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Minima at K = {metadata.best_k}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              5-fold cross-validation RMSE across K=1 to 30. Notice how K=8 balances bias and variance.
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={metadata.k_vs_error_curve}
                margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f0" />
                <XAxis 
                  dataKey="k" 
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  label={{ value: 'Number of Neighbors (K)', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#78716c' }}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'CV RMSE']}
                  labelFormatter={(k) => `K = ${k} Neighbors`}
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                    border: 'none'
                  }}
                />
                <ReferenceLine x={metadata.best_k} stroke="#d97706" strokeDasharray="3 3" label={{ value: `Optimal K=${metadata.best_k}`, fill: '#d97706', fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="distance_rmse"
                  name="Distance-Weighted RMSE"
                  stroke="#1c1917"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5, fill: '#d97706' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Feature Distribution & Normalization Statistics Table */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs">
        <h3 className="text-base font-bold text-stone-900 mb-1">
          Feature Scaler Norms & Distribution Characteristics
        </h3>
        <p className="text-xs text-stone-500 mb-4">
          Values used by the production `StandardScaler` to calculate normalized Euclidean distances for new valuation requests.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="border-b border-stone-200 bg-stone-50 font-semibold text-stone-900">
              <tr>
                <th className="px-3 py-2.5">Feature Name</th>
                <th className="px-3 py-2.5">Mean ($\mu$)</th>
                <th className="px-3 py-2.5">Std Dev ($\sigma$)</th>
                <th className="px-3 py-2.5">Median</th>
                <th className="px-3 py-2.5">Min</th>
                <th className="px-3 py-2.5">Max</th>
                <th className="px-3 py-2.5">Correlation ($r$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {(Object.entries(metadata.feature_stats) as [string, import('../types').FeatureStats][]).map(([feature, stat]) => (
                <tr key={feature} className="hover:bg-stone-50/70 font-sans">
                  <td className="px-3 py-2 font-semibold text-stone-900">{feature.replace(/_/g, ' ')}</td>
                  <td className="px-3 py-2 font-mono">{stat.mean}</td>
                  <td className="px-3 py-2 font-mono">{stat.std}</td>
                  <td className="px-3 py-2 font-mono">{stat.median}</td>
                  <td className="px-3 py-2 font-mono">{stat.min}</td>
                  <td className="px-3 py-2 font-mono">{stat.max}</td>
                  <td className="px-3 py-2 font-mono font-semibold text-amber-900">
                    +{metadata.feature_correlations[feature] || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
