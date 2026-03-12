// API Services - Central API functions for all backend endpoints
import apiClient from "./client";
import { API_ENDPOINTS } from "@/config/constants";

// =============================================
// Analytics API
// =============================================

/**
 * Get dashboard analytics (user + platform metrics)
 * @param period - week | month | year | all
 */
export const getDashboardAnalytics = async (period: string = "month") => {
  const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS.DASHBOARD}?period=${period}`);
  return response.data;
};

/**
 * Get user's sustainability impact
 */
export const getUserImpact = async () => {
  const response = await apiClient.get(API_ENDPOINTS.ANALYTICS.IMPACT);
  return response.data;
};

/**
 * Get platform-wide statistics (public)
 */
export const getPlatformStats = async () => {
  const response = await apiClient.get("/api/analytics/stats");
  return response.data;
};

/**
 * Get sustainability leaderboard
 * @param metric - co2Saved | weightDiverted | totalTransactions
 * @param limit - number of entries
 */
export const getLeaderboard = async (metric: string = "co2Saved", limit: number = 10) => {
  const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS.LEADERBOARD}?metric=${metric}&limit=${limit}`);
  return response.data;
};

/**
 * Get logistics statistics for current user
 */
export const getLogisticsStats = async () => {
  const response = await apiClient.get("/api/analytics/logistics");
  return response.data;
};

// =============================================
// Materials API
// =============================================

export interface MaterialFilters {
  page?: number;
  limit?: number;
  category?: string;
  condition?: string;
  priceType?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

/**
 * Get all materials with filtering
 */
export const getMaterials = async (filters: MaterialFilters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.append(key, String(value));
    }
  });
  const response = await apiClient.get(`${API_ENDPOINTS.MATERIALS.BASE}?${params.toString()}`);
  return response.data;
};

/**
 * Get current user's listings
 */
export const getMyListings = async (filters: MaterialFilters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.append(key, String(value));
    }
  });
  const response = await apiClient.get(`${API_ENDPOINTS.MATERIALS.MY_LISTINGS}?${params.toString()}`);
  return response.data;
};

/**
 * Get nearby materials
 */
export const getNearbyMaterials = async (
  latitude: number,
  longitude: number,
  radius: number = 10,
  limit: number = 20
) => {
  const response = await apiClient.get(
    `${API_ENDPOINTS.MATERIALS.NEARBY}?latitude=${latitude}&longitude=${longitude}&radius=${radius}&limit=${limit}`
  );
  return response.data;
};

/**
 * Search materials
 */
export const searchMaterials = async (query: string, filters: MaterialFilters = {}) => {
  const params = new URLSearchParams({ q: query });
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.append(key, String(value));
    }
  });
  const response = await apiClient.get(`${API_ENDPOINTS.MATERIALS.SEARCH}?${params.toString()}`);
  return response.data;
};

/**
 * Get single material by ID
 */
export const getMaterial = async (id: string) => {
  const response = await apiClient.get(`${API_ENDPOINTS.MATERIALS.BASE}/${id}`);
  return response.data;
};

/**
 * Get material categories
 */
export const getCategories = async () => {
  const response = await apiClient.get("/api/materials/categories");
  return response.data;
};

/**
 * Create a new material listing
 */
export const createMaterial = async (data: Record<string, unknown>) => {
  const response = await apiClient.post(API_ENDPOINTS.MATERIALS.BASE, data);
  return response.data;
};

/**
 * Update a material listing
 */
export const updateMaterial = async (id: string, data: Record<string, unknown>) => {
  const response = await apiClient.patch(`${API_ENDPOINTS.MATERIALS.BASE}/${id}`, data);
  return response.data;
};

/**
 * Delete a material listing
 */
export const deleteMaterial = async (id: string) => {
  const response = await apiClient.delete(`${API_ENDPOINTS.MATERIALS.BASE}/${id}`);
  return response.data;
};

/**
 * Update current user's profile
 */
export const updateProfile = async (data: Record<string, unknown>) => {
  const response = await apiClient.patch(API_ENDPOINTS.AUTH.ME, data);
  return response.data;
};

// =============================================
// Requests API
// =============================================

export interface RequestFilters {
  type?: "sent" | "received" | "all";
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Get requests (sent, received, or all)
 */
export const getRequests = async (filters: RequestFilters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.append(key, String(value));
    }
  });
  const response = await apiClient.get(`${API_ENDPOINTS.REQUESTS.BASE}?${params.toString()}`);
  return response.data;
};

/**
 * Get single request by ID
 */
export const getRequest = async (id: string) => {
  const response = await apiClient.get(`${API_ENDPOINTS.REQUESTS.BASE}/${id}`);
  return response.data;
};

/**
 * Create a new request
 */
export const createRequest = async (data: {
  materialId: string;
  message?: string;
  purpose?: string;
  requestedQuantity?: number;
  proposedPrice?: number;
  logisticsPreference?: "self_pickup" | "delivery" | "flexible";
  proposedSchedule?: {
    date: string;
    timeSlot: string;
  };
}) => {
  // Map frontend field names to backend field names
  const payload = {
    materialId: data.materialId,
    message: data.message,
    purpose: data.purpose,
    quantityRequested: data.requestedQuantity,
    offeredPrice: data.proposedPrice,
    logisticsPreference: data.logisticsPreference,
    proposedPickupDate: data.proposedSchedule?.date,
    proposedPickupTimeSlot: data.proposedSchedule?.timeSlot,
  };
  const response = await apiClient.post(API_ENDPOINTS.REQUESTS.BASE, payload);
  return response.data;
};

/**
 * Update request status (approve, reject, cancel)
 */
export const updateRequestStatus = async (
  id: string,
  action: "approve" | "reject" | "cancel",
  message?: string
) => {
  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
    cancel: "cancelled",
  };
  const response = await apiClient.patch(`${API_ENDPOINTS.REQUESTS.BASE}/${id}/status`, {
    status: statusMap[action],
    responseMessage: message,
  });
  return response.data;
};

/**
 * Add message to request
 */
export const addRequestMessage = async (id: string, message: string) => {
  const response = await apiClient.post(`${API_ENDPOINTS.REQUESTS.BASE}/${id}/messages`, {
    message,
  });
  return response.data;
};

// =============================================
// Transactions API
// =============================================

export interface TransactionFilters {
  role?: "supplier" | "receiver" | "all";
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Get user's transactions
 */
export const getTransactions = async (filters: TransactionFilters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.append(key, String(value));
    }
  });
  const response = await apiClient.get(`${API_ENDPOINTS.TRANSACTIONS.BASE}?${params.toString()}`);
  return response.data;
};

/**
 * Get transaction statistics
 */
export const getTransactionStats = async () => {
  const response = await apiClient.get(API_ENDPOINTS.TRANSACTIONS.STATS);
  return response.data;
};

/**
 * Get single transaction
 */
export const getTransaction = async (id: string) => {
  const response = await apiClient.get(`${API_ENDPOINTS.TRANSACTIONS.BASE}/${id}`);
  return response.data;
};

/**
 * Update transaction (various actions)
 */
export const updateTransaction = async (
  id: string,
  action: string,
  data?: Record<string, unknown>
) => {
  const response = await apiClient.patch(`${API_ENDPOINTS.TRANSACTIONS.BASE}/${id}`, {
    action,
    ...data,
  });
  return response.data;
};

// =============================================
// Logistics API
// =============================================

export interface LogisticsFilters {
  role?: "supplier" | "receiver" | "partner" | "all";
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * Get logistics jobs
 */
export const getLogisticsJobs = async (filters: LogisticsFilters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.append(key, String(value));
    }
  });
  const response = await apiClient.get(`${API_ENDPOINTS.LOGISTICS.BASE}?${params.toString()}`);
  return response.data;
};

/**
 * Get single logistics job
 */
export const getLogisticsJob = async (id: string) => {
  const response = await apiClient.get(`${API_ENDPOINTS.LOGISTICS.BASE}/${id}`);
  return response.data;
};

/**
 * Schedule a pickup
 */
export const schedulePickup = async (data: {
  transactionId: string;
  scheduledDate: string;
  scheduledTimeSlot: string;
  jobType?: "pickup" | "delivery" | "pickup_and_delivery";
  pickupNotes?: string;
  deliveryNotes?: string;
  vehicleType?: string;
}) => {
  const response = await apiClient.post(API_ENDPOINTS.LOGISTICS.SCHEDULE_PICKUP, data);
  return response.data;
};

/**
 * Update logistics job status
 */
export const updateLogisticsJob = async (id: string, action: string) => {
  const response = await apiClient.patch(`${API_ENDPOINTS.LOGISTICS.BASE}/${id}`, { action });
  return response.data;
};

// =============================================
// AI API
// =============================================

/**
 * Chat with AI assistant
 */
export const chatWithAI = async (message: string, conversationId?: string, type?: string) => {
  const response = await apiClient.post(API_ENDPOINTS.AI.CHAT, { message, conversationId, type });
  return response.data;
};

/**
 * Get AI conversations
 */
export const getAIConversations = async (page = 1, limit = 20) => {
  const response = await apiClient.get(`${API_ENDPOINTS.AI.CONVERSATIONS}?page=${page}&limit=${limit}`);
  return response.data;
};

/**
 * Get single AI conversation
 */
export const getAIConversation = async (id: string) => {
  const response = await apiClient.get(`${API_ENDPOINTS.AI.CONVERSATIONS}/${id}`);
  return response.data;
};

/**
 * Delete AI conversation
 */
export const deleteAIConversation = async (id: string) => {
  const response = await apiClient.delete(`${API_ENDPOINTS.AI.CONVERSATIONS}/${id}`);
  return response.data;
};

/**
 * Analyze material using AI
 */
export const analyzeMaterial = async (materialId: string) => {
  const response = await apiClient.post(API_ENDPOINTS.AI.ANALYZE, { materialId });
  return response.data;
};

// =============================================
// Export all services
// =============================================
export const analyticsService = {
  getDashboard: getDashboardAnalytics,
  getImpact: getUserImpact,
  getPlatformStats,
  getLeaderboard,
  getLogisticsStats,
};

export const materialsService = {
  getAll: getMaterials,
  getMyListings,
  getNearby: getNearbyMaterials,
  search: searchMaterials,
  getOne: getMaterial,
  getCategories,
  create: createMaterial,
  update: updateMaterial,
  delete: deleteMaterial,
};

export const requestsService = {
  getAll: getRequests,
  getOne: getRequest,
  create: createRequest,
  updateStatus: updateRequestStatus,
  addMessage: addRequestMessage,
  counterOffer: async (id: string, data: { amount: number; message?: string }) => {
    const response = await apiClient.post(`/api/requests/${id}/counter-offer`, data);
    return response.data;
  },
};

export const transactionsService = {
  getAll: getTransactions,
  getStats: getTransactionStats,
  getOne: getTransaction,
  update: updateTransaction,
};

export const authService = {
  updateProfile,
};

export const aiService = {
  chat: chatWithAI,
  getConversations: getAIConversations,
  getOne: getAIConversation,
  delete: deleteAIConversation,
  analyze: analyzeMaterial,
};

export const logisticsService = {
  getJobs: getLogisticsJobs,
  getOne: getLogisticsJob,
  schedulePickup,
  updateJob: updateLogisticsJob,
};
