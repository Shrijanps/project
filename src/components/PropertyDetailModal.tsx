import React, { useState, useEffect } from 'react';
import { X, Home, MapPin, Calendar, Layers, Car, Check, ShieldCheck, Calculator } from 'lucide-react';
import { Property } from '../types';
import { api } from '../api';

interface PropertyDetailModalProps {
  propertyId: number | null;
  onClose: () => void;
  onRunValuationWithSpecs?: (property: Property) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  propertyId,
  onClose,
  onRunValuationWithSpecs
}) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propertyId) {
      setLoading(true);
      setError(null);
      api.getPropertyById(propertyId)
        .then((res) => setProperty(res.property))
        .catch((err) => setError(err.message || 'Property not found'))
        .finally(() => setLoading(false));
    }
  }, [propertyId]);

  if (!propertyId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-stone-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="py-12 text-center text-xs text-stone-500">
            Loading property details from SQLite database...
          </div>
        ) : error || !property ? (
          <div className="py-8 text-center text-xs text-red-600">
            {error || 'Property details unavailable'}
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                  Property #{property.id}
                </span>
                <h2 className="text-2xl font-bold text-stone-900 mt-2">
                  ${property.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Est. ${(property.price / Math.max(property.square_feet, 1)).toFixed(2)} / sq ft
                </p>
              </div>

              {property.creator_name && (
                <div className="text-right">
                  <span className="text-[11px] text-stone-400">Added by</span>
                  <div className="text-xs font-semibold text-stone-800">{property.creator_name}</div>
                </div>
              )}
            </div>

            {/* Specifications Matrix */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3">
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <Home className="h-3.5 w-3.5 text-stone-400" />
                  <span>Total Area</span>
                </div>
                <div className="mt-1 text-sm font-bold text-stone-900">{property.square_feet} sq ft</div>
              </div>

              <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3">
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <Layers className="h-3.5 w-3.5 text-stone-400" />
                  <span>Bed / Bath</span>
                </div>
                <div className="mt-1 text-sm font-bold text-stone-900">
                  {property.num_bedrooms} Bed / {property.num_bathrooms} Bath
                </div>
              </div>

              <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3">
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <Calendar className="h-3.5 w-3.5 text-stone-400" />
                  <span>Construction</span>
                </div>
                <div className="mt-1 text-sm font-bold text-stone-900">Built in {property.year_built}</div>
              </div>

              <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3">
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <MapPin className="h-3.5 w-3.5 text-stone-400" />
                  <span>Location Score</span>
                </div>
                <div className="mt-1 text-sm font-bold text-amber-900">{property.location_score} / 10</div>
              </div>

              <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3">
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <MapPin className="h-3.5 w-3.5 text-stone-400" />
                  <span>Center Distance</span>
                </div>
                <div className="mt-1 text-sm font-bold text-stone-900">{property.distance_to_center} km</div>
              </div>

              <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3">
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <Car className="h-3.5 w-3.5 text-stone-400" />
                  <span>Garage Size</span>
                </div>
                <div className="mt-1 text-sm font-bold text-stone-900">{property.garage_size} sq ft</div>
              </div>
            </div>

            {/* Amenities */}
            <div className="mt-4 flex items-center gap-4 text-xs font-medium text-stone-700">
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border ${
                property.has_garden ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-stone-50 text-stone-400 border-stone-200 line-through'
              }`}>
                <Check className="h-3.5 w-3.5" /> Private Garden
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border ${
                property.has_pool ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-stone-50 text-stone-400 border-stone-200 line-through'
              }`}>
                <Check className="h-3.5 w-3.5" /> Swimming Pool
              </span>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Close
              </button>
              {onRunValuationWithSpecs && (
                <button
                  type="button"
                  onClick={() => {
                    onRunValuationWithSpecs(property);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800"
                >
                  <Calculator className="h-3.5 w-3.5 text-amber-400" />
                  <span>Evaluate with These Specs</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
