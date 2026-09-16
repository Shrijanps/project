import React, { useState } from 'react';
import { 
  Calculator, 
  Home, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  Eye, 
  Check, 
  X,
  FileText
} from 'lucide-react';
import { PredictionResult } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { AuthMode } from './AuthModal';

interface ValuationPredictorProps {
  onSelectPropertyForInspection?: (propertyId: number) => void;
  onOpenAuth?: (mode: AuthMode) => void;
}

const DEFAULT_FEATURES = {
  Square_Feet: 210,
  Num_Bedrooms: 3,
  Num_Bathrooms: 2,
  Num_Floors: 2,
  Year_Built: 2005,
  Has_Garden: 1,
  Has_Pool: 0,
  Garage_Size: 24,
  Location_Score: 7.5,
  Distance_to_Center: 5.0
};

export const ValuationPredictor: React.FC<ValuationPredictorProps> = ({ 
  onSelectPropertyForInspection,
  onOpenAuth
}) => {
  const { user } = useAuth();

  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);

  const handleFeatureChange = (name: string, value: number) => {
    setFeatures((prev) => ({ ...prev, [name]: value }));
  };

  const handlePredict = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Backend automatically sets optimal K=8 and engine
      const res = await api.predict(features);
      setResult(res);
      setHasCalculated(true);
      // Smoothly scroll to results if on mobile
      setTimeout(() => {
        const el = document.getElementById('valuation-result-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Valuation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetToExample = () => {
    setFeatures(DEFAULT_FEATURES);
    setResult(null);
    setHasCalculated(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Simple Header */}
      <div className="text-center pt-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          House Price Prediction
        </h1>
        <p className="mt-2 text-base text-stone-500">
          Enter your property details to estimate the fair market price.
        </p>
      </div>

      {/* Main Prediction Form */}
      <form onSubmit={handlePredict} className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs space-y-8">
        
        {/* Section 1: Property Details */}
        <div>
          <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-5">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Home className="h-4 w-4 text-stone-700" />
              <span>Property Details</span>
            </h2>
            <button
              type="button"
              onClick={handleResetToExample}
              className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="h-3 w-3" /> Load Example
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Total Area */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-stone-700 mb-1.5">
                <label htmlFor="input-square-feet">Total Area</label>
                <span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-900 font-bold">
                  {features.Square_Feet} sq ft
                </span>
              </div>
              <input
                id="input-square-feet"
                type="number"
                min="50"
                max="600"
                value={features.Square_Feet}
                onChange={(e) => handleFeatureChange('Square_Feet', Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
                required
              />
            </div>

            {/* Bedrooms */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-stone-700 mb-1.5">
                <label>Bedrooms</label>
                <span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-900 font-bold">
                  {features.Num_Bedrooms}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleFeatureChange('Num_Bedrooms', num)}
                    className={`rounded-lg py-2 text-xs font-bold border transition-all ${
                      features.Num_Bedrooms === num
                        ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {num}{num === 5 ? '+' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Bathrooms */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-stone-700 mb-1.5">
                <label>Bathrooms</label>
                <span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-900 font-bold">
                  {features.Num_Bathrooms}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleFeatureChange('Num_Bathrooms', num)}
                    className={`rounded-lg py-2 text-xs font-bold border transition-all ${
                      features.Num_Bathrooms === num
                        ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Floors */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-stone-700 mb-1.5">
                <label>Floors</label>
                <span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-900 font-bold">
                  {features.Num_Floors}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleFeatureChange('Num_Floors', num)}
                    className={`rounded-lg py-2 text-xs font-bold border transition-all ${
                      features.Num_Floors === num
                        ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {num} {num === 1 ? 'Floor' : 'Floors'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Other Features */}
        <div>
          <div className="border-b border-stone-100 pb-3 mb-5">
            <h2 className="text-base font-bold text-stone-900">
              Other Features
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Year Built */}
            <div>
              <label htmlFor="input-year-built" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Year Built
              </label>
              <input
                id="input-year-built"
                type="number"
                min="1900"
                max="2030"
                value={features.Year_Built}
                onChange={(e) => handleFeatureChange('Year_Built', Number(e.target.value))}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
                required
              />
            </div>

            {/* Garage Size */}
            <div>
              <label htmlFor="input-garage-size" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Garage Size (sq ft)
              </label>
              <input
                id="input-garage-size"
                type="number"
                min="0"
                max="100"
                value={features.Garage_Size}
                onChange={(e) => handleFeatureChange('Garage_Size', Number(e.target.value))}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
              />
            </div>

            {/* Location Score (1 to 10) */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1.5">
                <label>Location Score (1 to 10)</label>
                <span className="font-bold text-stone-900">{features.Location_Score.toFixed(1)} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.1"
                value={features.Location_Score}
                onChange={(e) => handleFeatureChange('Location_Score', Number(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-0.5">
                <span>1.0 (Basic)</span>
                <span>5.0 (Average)</span>
                <span>10.0 (Prime)</span>
              </div>
            </div>

            {/* Distance to Center (km) */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1.5">
                <label>Distance to Center (km)</label>
                <span className="font-bold text-stone-900">{features.Distance_to_Center.toFixed(1)} km</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="20"
                step="0.5"
                value={features.Distance_to_Center}
                onChange={(e) => handleFeatureChange('Distance_to_Center', Number(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-0.5">
                <span>0.5 km (Downtown)</span>
                <span>10 km</span>
                <span>20 km (Outskirts)</span>
              </div>
            </div>

            {/* Garden: Yes / No */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Garden
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleFeatureChange('Has_Garden', 1)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold border transition-all ${
                    features.Has_Garden === 1
                      ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" /> Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleFeatureChange('Has_Garden', 0)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold border transition-all ${
                    features.Has_Garden === 0
                      ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <X className="h-3.5 w-3.5" /> No
                </button>
              </div>
            </div>

            {/* Swimming Pool: Yes / No */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Swimming Pool
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleFeatureChange('Has_Pool', 1)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold border transition-all ${
                    features.Has_Pool === 1
                      ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" /> Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleFeatureChange('Has_Pool', 0)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold border transition-all ${
                    features.Has_Pool === 0
                      ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <X className="h-3.5 w-3.5" /> No
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-stone-900 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-stone-800 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <span>Calculating Price Valuation...</span>
            ) : (
              <>
                <Calculator className="h-4 w-4 text-amber-400" />
                <span>Predict House Price</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Message if any */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Result Section (Visible once estimated) */}
      {result && (
        <div id="valuation-result-section" className="space-y-6 pt-4">
          
          {/* Main Price Card */}
          <div className="rounded-2xl border-2 border-stone-900 bg-white p-6 sm:p-8 shadow-sm text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Estimated Property Price
            </span>
            
            <div className="my-3 text-4xl sm:text-5xl font-black tracking-tight text-stone-900">
              ${result.predicted_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <p className="text-xs text-stone-500">
              Estimated using the trained machine-learning model.
            </p>

            {/* Property Details Summary Line */}
            <div className="mt-6 pt-5 border-t border-stone-100 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-stone-600 font-medium">
              <span><strong>Area:</strong> {features.Square_Feet} sq ft</span>
              <span>•</span>
              <span><strong>Bedrooms:</strong> {features.Num_Bedrooms}</span>
              <span>•</span>
              <span><strong>Bathrooms:</strong> {features.Num_Bathrooms}</span>
              <span>•</span>
              <span><strong>Floors:</strong> {features.Num_Floors}</span>
              <span>•</span>
              <span><strong>Year Built:</strong> {features.Year_Built}</span>
              <span>•</span>
              <span><strong>Garden:</strong> {features.Has_Garden ? 'Yes' : 'No'}</span>
              <span>•</span>
              <span><strong>Pool:</strong> {features.Has_Pool ? 'Yes' : 'No'}</span>
            </div>

            {/* Save notice if logged in */}
            {user ? (
              <div className="mt-5 inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Saved to your personal account history</span>
              </div>
            ) : onOpenAuth && (
              <div className="mt-5 text-xs text-stone-500">
                <span>Want to keep a history of your valuations? </span>
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="font-bold text-stone-900 hover:underline"
                >
                  Sign in
                </button>
              </div>
            )}
          </div>

          {/* Similar Properties Section */}
          {result.nearest_neighbors && result.nearest_neighbors.length > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-5">
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Similar Properties
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Closest matching homes from the database used to compute this price estimate:
                  </p>
                </div>
              </div>

              {/* Clean cards list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {result.nearest_neighbors.slice(0, 4).map((prop, idx) => (
                  <div 
                    key={prop.property_id}
                    className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 flex flex-col justify-between hover:border-stone-400 hover:bg-white transition-all shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-stone-500">Property #{prop.property_id}</span>
                        <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full text-[11px]">
                          {prop.similarity_pct}% Match
                        </span>
                      </div>

                      <div className="text-lg font-black text-stone-900 my-1">
                        ${prop.actual_price.toLocaleString()}
                      </div>

                      <div className="space-y-1 text-xs text-stone-600 pt-2 border-t border-stone-200/60 mt-2">
                        <div className="flex justify-between">
                          <span className="text-stone-400">Area:</span>
                          <span className="font-medium text-stone-800">{prop.square_feet} sq ft</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Bed / Bath:</span>
                          <span className="font-medium text-stone-800">{prop.num_bedrooms}b / {prop.num_bathrooms}ba</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Year Built:</span>
                          <span className="font-medium text-stone-800">{prop.year_built}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Garden/Pool:</span>
                          <span className="font-medium text-stone-800">
                            {prop.has_pool ? 'Pool & Garden' : prop.has_garden ? 'Garden' : 'None'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {onSelectPropertyForInspection && (
                      <button
                        type="button"
                        onClick={() => onSelectPropertyForInspection(prop.property_id)}
                        className="mt-4 w-full flex items-center justify-center gap-1 rounded-lg bg-stone-200/70 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-300 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Property
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Make Another Prediction action */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-all shadow-2xs"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Make Another Prediction
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
