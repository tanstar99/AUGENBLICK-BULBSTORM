// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
    GOOGLE: "/api/auth/google",
    ME: "/api/auth/me",
  },
  // Materials
  MATERIALS: {
    BASE: "/api/materials",
    MY_LISTINGS: "/api/materials/my-listings",
    NEARBY: "/api/materials/nearby",
    SEARCH: "/api/materials/search",
  },
  // Requests
  REQUESTS: {
    BASE: "/api/requests",
    INCOMING: "/api/requests/incoming",
    OUTGOING: "/api/requests/outgoing",
  },
  // Transactions
  TRANSACTIONS: {
    BASE: "/api/transactions",
    STATS: "/api/transactions/stats",
  },
  // Logistics
  LOGISTICS: {
    BASE: "/api/logistics",
    SCHEDULE_PICKUP: "/api/logistics/schedule",
    UPDATE_STATUS: "/api/logistics/update-status",
  },
  // Analytics
  ANALYTICS: {
    DASHBOARD: "/api/analytics/dashboard",
    IMPACT: "/api/analytics/impact",
    LEADERBOARD: "/api/analytics/leaderboard",
  },
  // AI Assistant
  AI: {
    STATUS: "/api/ai/status",
    CHAT: "/api/ai/chat",
    ANALYZE: "/api/ai/analyze-material",
    SUGGESTIONS: "/api/ai/reuse-suggestions",
    CONVERSATIONS: "/api/ai/conversations",
  },
} as const;

// User Roles
export const USER_ROLES = {
  BUYER: "buyer",
  SELLER: "seller",
  NGO: "ngo",
  LOGISTICS_PARTNER: "logistics_partner",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Route Paths
export const ROUTES = {
  // Public
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  
  // Protected - Common
  DASHBOARD: "/dashboard",
  BUYER_DASHBOARD: "/dashboard/buyer",
  SELLER_DASHBOARD: "/dashboard/seller",
  MARKETPLACE: "/marketplace",
  MARKETPLACE_MAP: "/marketplace-map",
  MATERIAL_DETAILS: "/material/:id",
  PROFILE: "/profile",
  NOTIFICATIONS: "/notifications",
  
  // Protected - Materials
  LISTINGS: "/listings",
  CREATE_LISTING: "/create-listing",
  LISTING_DETAILS: "/listings/:id",
  EDIT_LISTING: "/listings/:id/edit",
  
  // Protected - Transactions
  REQUESTS: "/requests",
  CREATE_REQUEST: "/requests/create",
  TRANSACTIONS: "/transactions",
  
  // Protected - Logistics
  LOGISTICS: "/logistics",
  
  // Protected - Analytics
  IMPACT: "/impact",
  
  // Protected - AI
  AI_ASSISTANT: "/ai-assistant",
  AI_IMAGE_STUDIO: "/ai-image-studio",
  
  // Admin
  ADMIN: "/admin",
} as const;

// Material Categories
export const MATERIAL_CATEGORIES = [
  "construction",
  "electronics",
  "textiles",
  "packaging",
  "metals",
  "plastics",
  "wood",
  "glass",
  "organic",
  "chemicals",
  "furniture",
  "automotive",
  "other",
] as const;

// Material Conditions
export const MATERIAL_CONDITIONS = [
  "new",
  "like_new",
  "good",
  "fair",
  "salvage",
] as const;

// Request Statuses
export const REQUEST_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "withdrawn",
  "expired",
] as const;

// Transaction Statuses
export const TRANSACTION_STATUSES = [
  "initiated",
  "awaiting_pickup",
  "in_transit",
  "delivered",
  "confirmed",
  "disputed",
  "cancelled",
  "completed",
] as const;

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 40.7128, lng: -74.006 }, // NYC
  DEFAULT_ZOOM: 12,
  TILE_URL: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
} as const;

// UI Constants
export const UI = {
  TOAST_DURATION: 3000,
  DEBOUNCE_DELAY: 300,
  ITEMS_PER_PAGE: 12,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
} as const;
