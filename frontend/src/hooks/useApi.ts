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
  getLeaderboard,
  getAIConversations,
  getAIConversation,
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
      setError(null);
      const response = await fetchFn();

      const payload = response.data as
        | T
        | {
            success?: boolean;
            data?: T;
          };

      if (
        payload &&
        typeof payload === "object" &&
        "data" in payload &&
        Object.prototype.hasOwnProperty.call(payload, "success")
      ) {
        setData((payload as { data?: T }).data ?? null);
      } else {
        setData(payload as T);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  // Only show the loading skeleton when the query itself changes (tab switch,
  // filter change, etc.). Manual refetch() calls — e.g. polling — update data
  // silently without resetting to loading state, so the UI never flickers.
  useEffect(() => {
    setLoading(true);
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// =============================================
// Dashboard Hooks
// =============================================

interface DashboardData {
  period: string;
  user: {
    metrics: {
      reuseCount: number;
      wasteDivertedKg: number;
      co2SavedKg: number;
      weightDivertedKg: number;
    };
    activity: {
      activeListings: number;
      asSupplier: number;
      asReceiver: number;
    };
    recentTransactions: Array<{
      id: string;
      material: string;
      status: string;
      impactMetrics: Record<string, number>;
      date: string;
    }>;
  };
  platform: {
    metrics: {
      reuseCount: number;
      wasteDivertedKg: number;
      co2SavedKg: number;
      weightDivertedKg: number;
    };
    stats: {
      activeListings: number;
      totalUsers: number;
    };
    environmentalEquivalents: {
      treesEquivalent: number;
      carsOffRoadDays: number;
      flightsAvoided: number;
      homeEnergyDays: number;
    };
  };
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    transactionCount: number;
    wasteDivertedKg: number;
    co2SavedKg: number;
  }>;
}

export function useDashboardAnalytics(period: string = "month") {
  return useFetch<DashboardData>(() => getDashboardAnalytics(period), [period]);
}

interface ImpactData {
  summary: {
    totalTransactions: number;
    totalListings: number;
    wasteDivertedKg: number;
    co2SavedKg: number;
    landfillDivertedKg: number;
  };
  ranking: {
    position: number;
    totalUsers: number;
    percentile: number;
  };
  monthlyBreakdown: Array<{
    year: number;
    month: number;
    transactions: number;
    wasteDivertedKg: number;
    co2SavedKg: number;
  }>;
}

export function useUserImpact() {
  return useFetch<ImpactData>(() => getUserImpact(), []);
}

interface LeaderboardData {
  leaderboard: Array<{
    rank: number;
    id: string;
    name: string;
    avatar?: string;
    role?: string;
    metrics: {
      co2SavedKg: number;
      wasteDivertedKg: number;
      totalTransactions: number;
    };
  }>;
  userPosition: number | null;
  totalParticipants: number;
}

export function useLeaderboard(metric: string = "co2Saved", limit: number = 10) {
  return useFetch<LeaderboardData>(() => getLeaderboard(metric, limit), [metric, limit]);
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
      images: string[];
      price?: number;
      priceType?: string;
      unit?: string;
      availableQuantity?: number;
      address?: Record<string, string>;
    };
    requester: {
      _id: string;
      name: string;
      avatar?: string;
      phone?: string;
    };
    supplier: {
      _id: string;
      name: string;
      avatar?: string;
      phone?: string;
    };
    status: string;
    message?: string;
    quantityRequested: number;
    purpose?: string;
    logisticsPreference?: string;
    proposedPickupDate?: string;
    proposedPickupTimeSlot?: string;
    offeredPrice?: number;
    agreedPrice?: number;
    counterOffers?: Array<{
      by: string;
      amount: number;
      message?: string;
      createdAt: string;
    }>;
    messages?: Array<{
      sender: string;
      content: string;
      createdAt: string;
      isRead: boolean;
    }>;
    transaction?: string;
    expiresAt?: string;
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
      images: string[];
      address?: string;
      unit?: string;
    };
    supplier: {
      _id: string;
      name: string;
      avatar?: string;
      rating?: number;
      phone?: string;
    };
    receiver: {
      _id: string;
      name: string;
      avatar?: string;
      rating?: number;
      phone?: string;
    };
    request?: {
      message?: string;
      purpose?: string;
    };
    status: string;
    quantityExchanged: number;
    agreedPrice?: number;
    impactMetrics?: {
      weightDiverted: number;
      co2Saved: number;
      landfillDiverted: number;
      categoryImpactFactor: number;
    };
    userRole?: "supplier" | "receiver";
    canConfirm?: boolean;
    supplierConfirmed?: boolean;
    receiverConfirmed?: boolean;
    scheduledDate?: string;
    completedAt?: string;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useFetch<TransactionsData>(() => getTransactions(filters), [JSON.stringify(filters)]);
}

interface TransactionStatsData {
  overall: {
    total: number;
    completed: number;
    completionRate: number;
  };
  byStatus: Record<string, number>;
  asSupplier: {
    count: number;
    completed: number;
  };
  asReceiver: {
    count: number;
    completed: number;
  };
  impact: {
    totalQuantity: number;
    weightDiverted: number;
    co2Saved: number;
  };
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

// =============================================
// AI Assistant Hooks
// =============================================

interface ConversationsData {
  conversations: Array<{
    _id: string;
    title: string;
    type: string;
    lastMessage: string;
    updatedAt: string;
  }>;
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export function useAIConversations(page: number = 1, limit: number = 20) {
  return useFetch<ConversationsData>(() => getAIConversations(page, limit), [page, limit]);
}

interface ConversationDetailsData {
  conversation: {
    _id: string;
    title: string;
    type: string;
    messages: Array<{
      role: "user" | "assistant" | "system";
      content: string;
      timestamp: string;
    }>;
    material?: {
      _id: string;
      title: string;
    };
    createdAt: string;
  };
}

export function useAIConversation(id: string | null) {
  return useFetch<ConversationDetailsData>(
    () => (id ? getAIConversation(id) : Promise.resolve({ data: null })),
    [id]
  );
}
