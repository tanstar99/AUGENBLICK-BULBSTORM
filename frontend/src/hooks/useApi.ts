// Custom hooks for API data fetching
import { useState, useEffect, useCallback } from "react";
import {
  getDashboardAnalytics,
  getUserImpact,
  getMyListings,
  getRequests,
  getTransactions,
  getTransactionStats,
  getLogisticsJobs,
  getNearbyMaterials,
  getMaterials,
  getLogisticsStats,
  getCategories,
  type MaterialFilters,
  type RequestFilters,
  type TransactionFilters,
  type LogisticsFilters,
} from "@/api/services";

// Generic fetch hook
interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useFetch<T>(
  fetchFn: () => Promise<{ data: T }>,
  dependencies: unknown[] = []
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchFn();
      setData(response.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// =============================================
// Dashboard Hooks
// =============================================

interface DashboardData {
  user: {
    reuseCount: number;
    wasteDiverted: { kg: number };
    co2Saved: { kg: number };
    treesEquivalent: number;
    activeListings: number;
    pendingRequests: number;
  };
  platform: {
    totalUsers: number;
    totalMaterials: number;
    totalTransactions: number;
    totalCO2Saved: number;
    totalWasteDiverted: number;
  };
  categoryBreakdown: Array<{
    category: string;
    count: number;
    weight: number;
    co2Saved: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export function useDashboardAnalytics(period: string = "month") {
  return useFetch<DashboardData>(() => getDashboardAnalytics(period), [period]);
}

interface ImpactData {
  summary: {
    totalTransactions: number;
    wasteDiverted: { kg: number; tons: number };
    co2Saved: { kg: number; tons: number };
    waterSaved: { liters: number };
    energySaved: { kwh: number };
  };
  ranking: {
    position: number;
    total: number;
    percentile: number;
  };
  monthlyBreakdown: Array<{
    month: string;
    transactions: number;
    wasteDiverted: number;
    co2Saved: number;
  }>;
  equivalents: {
    treesPlanted: number;
    carsOffRoad: number;
    flightsAvoided: number;
  };
}

export function useUserImpact() {
  return useFetch<ImpactData>(() => getUserImpact(), []);
}

// =============================================
// Materials Hooks
// =============================================

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

interface CategoriesData {
  categories: Category[];
}

export function useCategories() {
  return useFetch<CategoriesData>(() => getCategories(), []);
}

interface MaterialsData {
  materials: Array<{
    _id: string;
    title: string;
    description: string;
    category: { name: string; _id: string };
    subcategory?: string;
    quantity: number;
    unit: string;
    condition: string;
    priceType: string;
    price?: number;
    images: string[];
    location: {
      address: string;
      city: string;
      coordinates: { lat: number; lng: number };
    };
    status: string;
    views: number;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export function useMyListings(filters: MaterialFilters = {}) {
  return useFetch<MaterialsData>(() => getMyListings(filters), [JSON.stringify(filters)]);
}

export function useMaterials(filters: MaterialFilters = {}) {
  return useFetch<MaterialsData>(() => getMaterials(filters), [JSON.stringify(filters)]);
}

interface NearbyMaterialsData {
  materials: Array<{
    _id: string;
    title: string;
    category: { name: string };
    distance: number;
    location: {
      city: string;
      coordinates: { lat: number; lng: number };
    };
    quantity: number;
    unit: string;
    priceType: string;
    price?: number;
  }>;
}

export function useNearbyMaterials(
  latitude: number,
  longitude: number,
  radius: number = 10,
  limit: number = 20
) {
  return useFetch<NearbyMaterialsData>(
    () => getNearbyMaterials(latitude, longitude, radius, limit),
    [latitude, longitude, radius, limit]
  );
}

// =============================================
// Requests Hooks
// =============================================

interface RequestsData {
  requests: Array<{
    _id: string;
    material: {
      _id: string;
      title: string;
      category: { name: string };
      images: string[];
    };
    requester: {
      _id: string;
      name: string;
      avatar?: string;
    };
    supplier: {
      _id: string;
      name: string;
      avatar?: string;
    };
    status: string;
    message?: string;
    requestedQuantity?: number;
    proposedPrice?: number;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export function useRequests(filters: RequestFilters = {}) {
  return useFetch<RequestsData>(() => getRequests(filters), [JSON.stringify(filters)]);
}

// =============================================
// Transactions Hooks
// =============================================

interface TransactionsData {
  transactions: Array<{
    _id: string;
    material: {
      _id: string;
      title: string;
      category: { name: string };
      images: string[];
    };
    supplier: {
      _id: string;
      name: string;
    };
    receiver: {
      _id: string;
      name: string;
    };
    status: string;
    quantity: number;
    unit: string;
    agreedPrice?: number;
    priceType: string;
    impact: {
      weightKg: number;
      co2SavedKg: number;
    };
    scheduledDate?: string;
    completedAt?: string;
    createdAt: string;
  }>;
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useFetch<TransactionsData>(() => getTransactions(filters), [JSON.stringify(filters)]);
}

interface TransactionStatsData {
  overview: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    cancelled: number;
  };
  asSupplier: {
    total: number;
    completed: number;
  };
  asReceiver: {
    total: number;
    completed: number;
  };
  impact: {
    totalWeightKg: number;
    totalCO2SavedKg: number;
  };
  recentTransactions: Array<{
    _id: string;
    material: { title: string };
    status: string;
    createdAt: string;
  }>;
}

export function useTransactionStats() {
  return useFetch<TransactionStatsData>(() => getTransactionStats(), []);
}

// =============================================
// Logistics Hooks
// =============================================

interface LogisticsData {
  jobs: Array<{
    _id: string;
    transaction: {
      _id: string;
      material: { title: string };
    };
    jobType: string;
    status: string;
    scheduledDate: string;
    scheduledTimeSlot: string;
    pickupAddress: {
      address: string;
      city: string;
    };
    deliveryAddress?: {
      address: string;
      city: string;
    };
    partner?: {
      _id: string;
      name: string;
    };
    vehicleType?: string;
    createdAt: string;
  }>;
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export function useLogisticsJobs(filters: LogisticsFilters = {}) {
  return useFetch<LogisticsData>(() => getLogisticsJobs(filters), [JSON.stringify(filters)]);
}

interface LogisticsStatsData {
  overview: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
  };
  asSupplier: {
    total: number;
    pending: number;
    completed: number;
  };
  asReceiver: {
    total: number;
    pending: number;
    completed: number;
  };
  upcomingPickups: Array<{
    _id: string;
    scheduledDate: string;
    scheduledTimeSlot: string;
    material: { title: string };
  }>;
}

export function useLogisticsStats() {
  return useFetch<LogisticsStatsData>(() => getLogisticsStats(), []);
}
