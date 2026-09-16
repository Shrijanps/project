import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  SlidersHorizontal, 
  Grid, 
  List as ListIcon, 
  Home, 
  Eye, 
  Edit3, 
  Trash2, 
  MapPin, 
  Calendar, 
  Layers, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Property, PropertyStats } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { PropertyModal } from './PropertyModal';
import { PropertyDetailModal } from './PropertyDetailModal';
import { AuthMode } from './AuthModal';

interface PropertyCatalogProps {
  onRunValuationWithSpecs?: (property: Property) => void;
  onOpenAuth?: (mode: AuthMode) => void;
}

export const PropertyCatalog: React.FC<PropertyCatalogProps> = ({
  onRunValuationWithSpecs,
  onOpenAuth
}) => {
  const { user } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit, setLimit] = useState<number>(12);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter States
  const [search, setSearch] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [bedrooms, setBedrooms] = useState<string>('');
  const [bathrooms, setBathrooms] = useState<string>('');
  const [hasGarden, setHasGarden] = useState<string>('');
  const [hasPool, setHasPool] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await api.getProperties({
        page,
        limit,
        search,
        min_price: minPrice,
        max_price: maxPrice,
        bedrooms,
        bathrooms,
        has_garden: hasGarden,
        has_pool: hasPool,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      setProperties(res.properties);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to load properties', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.getPropertyStats();
      setStats(res.stats);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [page, limit, sortBy, sortOrder]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProperties();
  };

  const handleResetFilters = () => {
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setBedrooms('');
    setBathrooms('');
    setHasGarden('');
    setHasPool('');
    setSortBy('id');
    setSortOrder('ASC');
    setPage(1);
    setTimeout(() => {
      fetchProperties();
    }, 50);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Are you sure you want to delete Property #${id}?`)) return;
    try {
      await api.deleteProperty(id);
      fetchProperties();
      fetchStats();
    } catch (err: any) {
      alert(err.message || 'Failed to delete property');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Stats Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            Property Database Catalog
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Browse and query historical property records stored in SQLite, filter by criteria, or add custom properties to expand the valuation model's training space.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!user) {
                if (onOpenAuth) onOpenAuth('login');
              } else {
                setPropertyToEdit(null);
                setIsCreateModalOpen(true);
              }
            }}
            id="btn-add-property"
            className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4 text-amber-400" />
            <span>Add Property</span>
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
            <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Total Records</div>
            <div className="mt-1 text-2xl font-bold text-stone-900">{stats.total_properties.toLocaleString()}</div>
            <div className="text-[11px] text-stone-500 mt-0.5">Stored in SQLite</div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
            <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Average Price</div>
            <div className="mt-1 text-2xl font-bold text-stone-900">${stats.avg_price.toLocaleString()}</div>
            <div className="text-[11px] text-stone-500 mt-0.5">Median: ${stats.median_price?.toLocaleString()}</div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
            <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Average Area</div>
            <div className="mt-1 text-2xl font-bold text-stone-900">{stats.avg_square_feet} sq ft</div>
            <div className="text-[11px] text-stone-500 mt-0.5">{stats.avg_bedrooms} bed / {stats.avg_bathrooms} bath</div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
            <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Price Range</div>
            <div className="mt-1 text-2xl font-bold text-stone-900">
              ${(stats.min_price / 1000).toFixed(0)}k - ${(stats.max_price / 1000).toFixed(0)}k
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">Avg Score: {stats.avg_location_score}/10</div>
          </div>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs">
        <form onSubmit={handleApplyFilter} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            
            {/* Search Input */}
            <div className="sm:col-span-5 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search by ID, price, or creator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-stone-300 py-2 pl-9 pr-3 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
              />
            </div>

            {/* Bedrooms Filter */}
            <div className="sm:col-span-2">
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full rounded-lg border border-stone-300 py-2 px-3 text-xs sm:text-sm text-stone-700 focus:border-stone-900 focus:outline-none"
              >
                <option value="">All Bedrooms</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3 Bedrooms</option>
                <option value="4">4 Bedrooms</option>
                <option value="5">5+ Bedrooms</option>
              </select>
            </div>

            {/* Bathrooms Filter */}
            <div className="sm:col-span-2">
              <select
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full rounded-lg border border-stone-300 py-2 px-3 text-xs sm:text-sm text-stone-700 focus:border-stone-900 focus:outline-none"
              >
                <option value="">All Bathrooms</option>
                <option value="1">1 Bathroom</option>
                <option value="2">2 Bathrooms</option>
                <option value="3">3 Bathrooms</option>
                <option value="4">4+ Bathrooms</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="sm:col-span-3">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [col, ord] = e.target.value.split('-');
                  setSortBy(col);
                  setSortOrder(ord as 'ASC' | 'DESC');
                }}
                className="w-full rounded-lg border border-stone-300 py-2 px-3 text-xs sm:text-sm text-stone-700 focus:border-stone-900 focus:outline-none"
              >
                <option value="id-ASC">Sort: ID (Ascending)</option>
                <option value="id-DESC">Sort: ID (Descending)</option>
                <option value="price-ASC">Price: Low to High</option>
                <option value="price-DESC">Price: High to Low</option>
                <option value="square_feet-DESC">Area: Largest First</option>
                <option value="square_feet-ASC">Area: Smallest First</option>
                <option value="year_built-DESC">Year: Newest First</option>
                <option value="location_score-DESC">Location Score</option>
              </select>
            </div>

          </div>

          {/* Secondary Filter Row: Min/Max Price + Amenities */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="number"
                placeholder="Min Price ($)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-28 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none"
              />
              <span className="text-stone-400">-</span>
              <input
                type="number"
                placeholder="Max Price ($)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-28 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none"
              />

              <select
                value={hasGarden}
                onChange={(e) => setHasGarden(e.target.value)}
                className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs text-stone-700 focus:outline-none"
              >
                <option value="">Garden (Any)</option>
                <option value="1">With Garden</option>
                <option value="0">No Garden</option>
              </select>

              <select
                value={hasPool}
                onChange={(e) => setHasPool(e.target.value)}
                className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs text-stone-700 focus:outline-none"
              >
                <option value="">Pool (Any)</option>
                <option value="1">With Pool</option>
                <option value="0">No Pool</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
              >
                Reset
              </button>
              <button
                type="submit"
                className="rounded-lg bg-stone-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-stone-800"
              >
                Filter Properties
              </button>

              <div className="ml-2 flex items-center border border-stone-200 rounded-lg p-0.5 bg-stone-50">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-400'}`}
                  title="Grid View"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1 rounded ${viewMode === 'table' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-400'}`}
                  title="Table View"
                >
                  <ListIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Property Results List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-stone-500">
          <RefreshCw className="mx-auto h-5 w-5 animate-spin text-stone-400 mb-2" />
          Querying SQLite database properties...
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
          <Home className="mx-auto h-8 w-8 text-stone-300 mb-2" />
          <h3 className="text-sm font-semibold text-stone-900">No properties found</h3>
          <p className="text-xs text-stone-500 mt-1">Try relaxing your filter parameters or search term.</p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {properties.map((property) => (
            <div
              key={property.id}
              className="group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-4 shadow-2xs hover:border-stone-300 hover:shadow-xs transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-mono text-stone-700">
                    ID #{property.id}
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-stone-900">
                      ${property.price.toLocaleString()}
                    </span>
                    <div className="text-[10px] text-stone-400">
                      ${(property.price / Math.max(property.square_feet, 1)).toFixed(0)}/sq ft
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-y-1 text-xs text-stone-600">
                  <div>
                    <span className="text-stone-400">Area:</span> <span className="font-semibold text-stone-800">{property.square_feet} sq ft</span>
                  </div>
                  <div>
                    <span className="text-stone-400">Layout:</span> <span className="font-semibold text-stone-800">{property.num_bedrooms}b / {property.num_bathrooms}ba</span>
                  </div>
                  <div>
                    <span className="text-stone-400">Year:</span> <span className="font-semibold text-stone-800">{property.year_built}</span>
                  </div>
                  <div>
                    <span className="text-stone-400">Score:</span> <span className="font-semibold text-amber-900">{property.location_score}/10</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-500">
                  {property.has_garden === 1 && (
                    <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">
                      Garden
                    </span>
                  )}
                  {property.has_pool === 1 && (
                    <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">
                      Pool
                    </span>
                  )}
                  <span className="text-[10px] text-stone-400">
                    {property.distance_to_center}km to center
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedPropertyId(property.id)}
                  className="flex items-center gap-1 font-medium text-stone-700 hover:text-stone-900"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Details</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {onRunValuationWithSpecs && (
                    <button
                      type="button"
                      onClick={() => onRunValuationWithSpecs(property)}
                      title="Run Valuation on These Specs"
                      className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {(user?.role === 'admin' || (user && property.created_by === user.id)) && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setPropertyToEdit(property);
                          setIsCreateModalOpen(true);
                        }}
                        title="Edit Property"
                        className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(property.id)}
                        title="Delete Property"
                        className="p-1 text-red-400 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-2xs">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="border-b border-stone-200 bg-stone-50 font-semibold text-stone-900">
              <tr>
                <th className="px-3 py-2.5">ID</th>
                <th className="px-3 py-2.5">Price</th>
                <th className="px-3 py-2.5">Area (sq ft)</th>
                <th className="px-3 py-2.5">Bed / Bath</th>
                <th className="px-3 py-2.5">Floors</th>
                <th className="px-3 py-2.5">Built</th>
                <th className="px-3 py-2.5">Amenities</th>
                <th className="px-3 py-2.5">Score</th>
                <th className="px-3 py-2.5">Distance</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {properties.map((property) => (
                <tr key={property.id} className="hover:bg-stone-50/70">
                  <td className="px-3 py-2 font-mono font-medium">#{property.id}</td>
                  <td className="px-3 py-2 font-bold text-stone-900">${property.price.toLocaleString()}</td>
                  <td className="px-3 py-2">{property.square_feet}</td>
                  <td className="px-3 py-2">{property.num_bedrooms}b / {property.num_bathrooms}ba</td>
                  <td className="px-3 py-2">{property.num_floors}</td>
                  <td className="px-3 py-2">{property.year_built}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 text-[10px]">
                      {property.has_garden === 1 && <span className="bg-emerald-50 text-emerald-800 px-1 rounded">Garden</span>}
                      {property.has_pool === 1 && <span className="bg-emerald-50 text-emerald-800 px-1 rounded">Pool</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-amber-900 font-semibold">{property.location_score}</td>
                  <td className="px-3 py-2">{property.distance_to_center}km</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedPropertyId(property.id)}
                        className="p-1 text-stone-500 hover:text-stone-900"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {(user?.role === 'admin' || (user && property.created_by === user.id)) && (
                        <>
                          <button
                            onClick={() => {
                              setPropertyToEdit(property);
                              setIsCreateModalOpen(true);
                            }}
                            className="p-1 text-stone-500 hover:text-stone-900"
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(property.id)}
                            className="p-1 text-red-500 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-stone-200 pt-4">
          <div className="text-xs text-stone-500">
            Showing <span className="font-semibold text-stone-900">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-stone-900">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-semibold text-stone-900">{total}</span> properties
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-semibold text-stone-800 px-2">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <PropertyModal
        isOpen={isCreateModalOpen}
        propertyToEdit={propertyToEdit}
        onClose={() => {
          setIsCreateModalOpen(false);
          setPropertyToEdit(null);
        }}
        onSuccess={() => {
          fetchProperties();
          fetchStats();
        }}
      />

      <PropertyDetailModal
        propertyId={selectedPropertyId}
        onClose={() => setSelectedPropertyId(null)}
        onRunValuationWithSpecs={onRunValuationWithSpecs}
      />
    </div>
  );
};
