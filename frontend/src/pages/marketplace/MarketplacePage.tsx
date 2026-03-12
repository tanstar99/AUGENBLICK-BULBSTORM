// Marketplace Page - Main discovery interface for reusable materials
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  MapPin,
  SlidersHorizontal,
  ChevronDown,
  X,
  Map,
  Grid3X3,
  Package,
  AlertCircle,
  RefreshCw,
  ArrowUpDown,
} from "lucide-react";
import { DashboardLayout } from "@/layouts";
import { MaterialCard } from "@/components/marketplace/MaterialCard";
import { useMaterials, useCategories } from "@/hooks";
import { ROUTES } from "@/config/constants";
import type { MaterialFilters } from "@/api/services";

// Price type options
const PRICE_TYPES = [
  { value: "", label: "All Prices" },
  { value: "free", label: "Free" },
  { value: "negotiable", label: "Negotiable" },
  { value: "fixed", label: "Fixed Price" },
];

// Condition options
const CONDITIONS = [
  { value: "", label: "All Conditions" },
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "salvage", label: "Salvage" },
];

// Sort options
const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest First" },
  { value: "createdAt:asc", label: "Oldest First" },
  { value: "price:asc", label: "Price: Low to High" },
  { value: "price:desc", label: "Price: High to Low" },
  { value: "views:desc", label: "Most Popular" },
];

// Filter dropdown component
interface FilterDropdownProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  value,
  options,
  onChange,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800/60 border border-neutral-700 rounded-xl hover:bg-neutral-800 hover:border-neutral-600 transition-all text-sm"
      >
        {icon}
        <span className="text-neutral-300">{selectedOption?.label || label}</span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl overflow-hidden"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    value === option.value
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Loading skeleton
const MaterialSkeleton: React.FC = () => (
  <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-2xl overflow-hidden animate-pulse">
    <div className="aspect-[4/3] bg-neutral-800/50" />
    <div className="p-4 space-y-3">
      <div className="h-3 w-20 bg-neutral-800 rounded" />
      <div className="h-5 w-3/4 bg-neutral-800 rounded" />
      <div className="h-4 w-full bg-neutral-800 rounded" />
      <div className="flex gap-3">
        <div className="h-4 w-24 bg-neutral-800 rounded" />
        <div className="h-4 w-20 bg-neutral-800 rounded" />
      </div>
    </div>
  </div>
);

const MarketplacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter states (from URL params)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [condition, setCondition] = useState(searchParams.get("condition") || "");
  const [priceType, setPriceType] = useState(searchParams.get("priceType") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "createdAt:desc");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [showFilters, setShowFilters] = useState(false);

  // Build filters object
  const filters: MaterialFilters = useMemo(() => {
    const [sortField, sortOrder] = sortBy.split(":");
    return {
      page,
      limit: 12,
      category: category || undefined,
      condition: condition || undefined,
      priceType: priceType || undefined,
      city: city || undefined,
      search: searchQuery || undefined,
      sortBy: sortField,
      sortOrder: sortOrder as "asc" | "desc",
      status: "available",
    };
  }, [page, category, condition, priceType, city, searchQuery, sortBy]);

  // Fetch data
  const { data, loading, error, refetch } = useMaterials(filters);
  const { data: categoriesData } = useCategories();

  // Category options
  const categoryOptions = useMemo(() => {
    const categories = categoriesData?.categories || [];
    return [
      { value: "", label: "All Categories" },
      ...categories.map((cat) => ({
        value: cat._id,
        label: cat.name,
      })),
    ];
  }, [categoriesData]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (category) params.set("category", category);
    if (condition) params.set("condition", condition);
    if (priceType) params.set("priceType", priceType);
    if (city) params.set("city", city);
    if (sortBy !== "createdAt:desc") params.set("sort", sortBy);
    if (page > 1) params.set("page", String(page));
    setSearchParams(params, { replace: true });
  }, [searchQuery, category, condition, priceType, city, sortBy, page, setSearchParams]);

  // Debounced search handler
  const [searchInput, setSearchInput] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Handle filter changes (reset to page 1)
  const handleFilterChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string>>) => (value: string) => {
      setter(value);
      setPage(1);
    },
    []
  );

  // Clear all filters
  const clearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setCategory("");
    setCondition("");
    setPriceType("");
    setCity("");
    setSortBy("createdAt:desc");
    setPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || category || condition || priceType || city;

  // Materials and pagination
  const materials = data?.materials || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.pages || 1;
  const totalItems = pagination?.total || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Marketplace</h1>
            <p className="text-neutral-400 mt-1">
              Discover reusable materials from businesses near you
            </p>
          </div>

          {/* Map View Button */}
          <Link
            to={ROUTES.MARKETPLACE_MAP}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20 shrink-0"
          >
            <Map className="w-4 h-4" />
            View Map
          </Link>
        </div>

        {/* Search and Filters Bar */}
        <div className="space-y-4">
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search materials, categories, locations..."
                className="w-full pl-12 pr-4 py-3 bg-neutral-800/60 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800/60 border border-neutral-700 rounded-xl text-neutral-300 hover:bg-neutral-800 transition-all"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>

            {/* Sort Dropdown */}
            <FilterDropdown
              label="Sort"
              value={sortBy}
              options={SORT_OPTIONS}
              onChange={setSortBy}
              icon={<ArrowUpDown className="w-4 h-4 text-neutral-500" />}
            />
          </div>

          {/* Filters Row (Desktop always visible, Mobile toggleable) */}
          <motion.div
            initial={false}
            animate={{
              height: showFilters || window.innerWidth >= 640 ? "auto" : 0,
              opacity: showFilters || window.innerWidth >= 640 ? 1 : 0,
            }}
            className="overflow-hidden sm:!h-auto sm:!opacity-100"
          >
            <div className="flex flex-wrap gap-3">
              {/* Category Filter */}
              <FilterDropdown
                label="Category"
                value={category}
                options={categoryOptions}
                onChange={handleFilterChange(setCategory)}
                icon={<Grid3X3 className="w-4 h-4 text-neutral-500" />}
              />

              {/* Condition Filter */}
              <FilterDropdown
                label="Condition"
                value={condition}
                options={CONDITIONS}
                onChange={handleFilterChange(setCondition)}
                icon={<Package className="w-4 h-4 text-neutral-500" />}
              />

              {/* Price Type Filter */}
              <FilterDropdown
                label="Price"
                value={priceType}
                options={PRICE_TYPES}
                onChange={handleFilterChange(setPriceType)}
                icon={<Filter className="w-4 h-4 text-neutral-500" />}
              />

              {/* City Input */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setPage(1);
                  }}
                  placeholder="City"
                  className="pl-9 pr-8 py-2.5 w-36 bg-neutral-800/60 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                />
                {city && (
                  <button
                    onClick={() => {
                      setCity("");
                      setPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm">
          <p className="text-neutral-400">
            {loading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              <>
                Showing{" "}
                <span className="text-white font-medium">
                  {materials.length}
                </span>{" "}
                of{" "}
                <span className="text-white font-medium">
                  {totalItems.toLocaleString()}
                </span>{" "}
                materials
              </>
            )}
          </p>
          {!loading && (
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-300">{error}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Materials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 8 }).map((_, i) => (
              <MaterialSkeleton key={i} />
            ))
          ) : materials.length > 0 ? (
            // Material cards
            materials.map((material, index) => (
              <MaterialCard key={material._id} material={material} index={index} />
            ))
          ) : (
            // Empty state
            <div className="col-span-full py-20 text-center">
              <Package className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                No materials found
              </h3>
              <p className="text-neutral-400 mb-6 max-w-md mx-auto">
                {hasActiveFilters
                  ? "Try adjusting your filters or search query to find more materials."
                  : "There are no materials listed yet. Check back later or be the first to list!"}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-neutral-400 bg-neutral-800/60 border border-neutral-700 rounded-xl hover:bg-neutral-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {/* Show first page */}
              {page > 3 && (
                <>
                  <button
                    onClick={() => setPage(1)}
                    className="w-10 h-10 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    1
                  </button>
                  {page > 4 && (
                    <span className="w-10 text-center text-neutral-600">...</span>
                  )}
                </>
              )}

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p >= page - 2 && p <= page + 2)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                      p === page
                        ? "bg-emerald-500 text-neutral-950"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                    }`}
                  >
                    {p}
                  </button>
                ))}

              {/* Show last page */}
              {page < totalPages - 2 && (
                <>
                  {page < totalPages - 3 && (
                    <span className="w-10 text-center text-neutral-600">...</span>
                  )}
                  <button
                    onClick={() => setPage(totalPages)}
                    className="w-10 h-10 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium text-neutral-400 bg-neutral-800/60 border border-neutral-700 rounded-xl hover:bg-neutral-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MarketplacePage;
