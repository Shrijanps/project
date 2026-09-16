import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Property } from '../types';
import { api } from '../api';

interface PropertyModalProps {
  isOpen: boolean;
  propertyToEdit?: Property | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({
  isOpen,
  propertyToEdit,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<Partial<Property>>({
    square_feet: 200,
    num_bedrooms: 3,
    num_bathrooms: 2,
    num_floors: 2,
    year_built: 2010,
    has_garden: 1,
    has_pool: 0,
    garage_size: 25,
    location_score: 7.5,
    distance_to_center: 5.0,
    price: 550000
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propertyToEdit) {
      setFormData({ ...propertyToEdit });
    } else {
      setFormData({
        square_feet: 200,
        num_bedrooms: 3,
        num_bathrooms: 2,
        num_floors: 2,
        year_built: 2010,
        has_garden: 1,
        has_pool: 0,
        garage_size: 25,
        location_score: 7.5,
        distance_to_center: 5.0,
        price: 550000
      });
    }
    setError(null);
  }, [propertyToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Property, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (propertyToEdit) {
        await api.updateProperty(propertyToEdit.id, formData);
      } else {
        await api.createProperty(formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save property.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-stone-200 my-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-stone-900">
            {propertyToEdit ? `Edit Property #${propertyToEdit.id}` : 'Add New Property Record'}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Persists to the SQLite database and becomes part of the training & nearest-neighbor search space.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Price */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Property Price (USD $) *
              </label>
              <input
                type="number"
                required
                min="10000"
                step="1000"
                value={formData.price || ''}
                onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 font-semibold focus:border-stone-900 focus:outline-none"
              />
            </div>

            {/* Square Feet */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Square Feet (Total Area) *
              </label>
              <input
                type="number"
                required
                min="50"
                max="1000"
                step="1"
                value={formData.square_feet || ''}
                onChange={(e) => handleChange('square_feet', parseFloat(e.target.value))}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
              />
            </div>

            {/* Year Built */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Year Built *
              </label>
              <input
                type="number"
                required
                min="1900"
                max="2030"
                value={formData.year_built || ''}
                onChange={(e) => handleChange('year_built', parseInt(e.target.value, 10))}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
              />
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Bedrooms (1 - 10) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="10"
                value={formData.num_bedrooms || ''}
                onChange={(e) => handleChange('num_bedrooms', parseInt(e.target.value, 10))}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
              />
            </div>

            {/* Bathrooms */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Bathrooms (1 - 10) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="10"
                value={formData.num_bathrooms || ''}
                onChange={(e) => handleChange('num_bathrooms', parseInt(e.target.value, 10))}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
              />
            </div>

            {/* Floors */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Floors (1 - 5) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="5"
                value={formData.num_floors || ''}
                onChange={(e) => handleChange('num_floors', parseInt(e.target.value, 10))}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
              />
            </div>

            {/* Garage Size */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Garage Size (sq ft)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.garage_size !== undefined ? formData.garage_size : 0}
                onChange={(e) => handleChange('garage_size', parseInt(e.target.value, 10))}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
              />
            </div>

            {/* Location Score */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Location Score (1.0 - 10.0)
              </label>
              <input
                type="number"
                min="1.0"
                max="10.0"
                step="0.1"
                value={formData.location_score !== undefined ? formData.location_score : 5.0}
                onChange={(e) => handleChange('location_score', parseFloat(e.target.value))}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
              />
            </div>

            {/* Distance to Center */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Distance to Center (km)
              </label>
              <input
                type="number"
                min="0.1"
                max="50.0"
                step="0.1"
                value={formData.distance_to_center !== undefined ? formData.distance_to_center : 5.0}
                onChange={(e) => handleChange('distance_to_center', parseFloat(e.target.value))}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
              />
            </div>

          </div>

          {/* Toggles */}
          <div className="pt-2 grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-stone-200 p-2.5 bg-stone-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.has_garden === 1}
                onChange={(e) => handleChange('has_garden', e.target.checked ? 1 : 0)}
                className="h-4 w-4 rounded accent-stone-900"
              />
              <span className="text-xs font-medium text-stone-800">Has Private Garden</span>
            </label>

            <label className="flex items-center gap-2 rounded-lg border border-stone-200 p-2.5 bg-stone-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.has_pool === 1}
                onChange={(e) => handleChange('has_pool', e.target.checked ? 1 : 0)}
                className="h-4 w-4 rounded accent-stone-900"
              />
              <span className="text-xs font-medium text-stone-800">Has Swimming Pool</span>
            </label>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{loading ? 'Saving...' : propertyToEdit ? 'Save Changes' : 'Create Property'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
