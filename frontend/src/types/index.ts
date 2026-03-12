// ============================================
// User Types
// ============================================
export type UserRole = "buyer" | "seller" | "ngo" | "logistics_partner" | "admin";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  company?: string;
  location?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  preferences?: {
    categories?: string[];
    maxDistance?: number;
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
  };
  stats?: {
    materialsSaved: number;
    co2Prevented: number;
    totalTransactions: number;
    rating: number;
    reviewCount: number;
  };
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Auth Types
// ============================================
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  company?: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ============================================
// Material Types
// ============================================
export type MaterialCategory =
  | "construction"
  | "electronics"
  | "textiles"
  | "packaging"
  | "metals"
  | "plastics"
  | "wood"
  | "glass"
  | "organic"
  | "chemicals"
  | "furniture"
  | "automotive"
  | "other";

export type MaterialCondition = "new" | "like_new" | "good" | "fair" | "salvage";

export type ListingStatus = "draft" | "active" | "reserved" | "completed" | "expired" | "cancelled";

export interface Material {
  _id: string;
  title: string;
  description: string;
  category: MaterialCategory | { _id: string; name: string; impactFactors?: ImpactFactors };
  condition: MaterialCondition;
  quantity: number;
  unit: string;
  images: Array<{ url: string; publicId?: string; isPrimary?: boolean }>;
  location: {
    type: "Point";
    coordinates: [number, number];
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  pricing: {
    type: "free" | "fixed" | "negotiable" | "auction";
    amount?: number;
    currency: string;
    minBid?: number;
  };
  listedBy: User | string;
  status: ListingStatus;
  availability: {
    startDate: string;
    endDate?: string;
    pickupInstructions?: string;
  };
  specifications?: Record<string, string | number>;
  certifications?: string[];
  tags?: string[];
  views: number;
  favoriteCount: number;
  sustainability?: {
    co2Savings: number;
    waterSavings: number;
    energySavings: number;
    landfillDiversion: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ImpactFactors {
  co2PerKg: number;
  waterPerKg: number;
  energyPerKg: number;
  landfillDiversionRate: number;
}

// ============================================
// Request Types
// ============================================
export type RequestStatus = "pending" | "accepted" | "rejected" | "withdrawn" | "expired";

export interface MaterialRequest {
  _id: string;
  material: Material | string;
  requester: User | string;
  message: string;
  requestedQuantity: number;
  proposedPrice?: number;
  status: RequestStatus;
  respondedAt?: string;
  responseMessage?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Transaction Types
// ============================================
export type TransactionStatus =
  | "initiated"
  | "awaiting_pickup"
  | "in_transit"
  | "delivered"
  | "confirmed"
  | "disputed"
  | "cancelled"
  | "completed";

export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded";

export interface Transaction {
  _id: string;
  request: MaterialRequest | string;
  material: Material | string;
  seller: User | string;
  buyer: User | string;
  quantity: number;
  agreedPrice: number;
  currency: string;
  status: TransactionStatus;
  payment: {
    status: PaymentStatus;
    method?: string;
    transactionId?: string;
    paidAt?: string;
  };
  logistics?: {
    provider?: string;
    trackingId?: string;
    scheduledPickup?: string;
    actualPickup?: string;
    scheduledDelivery?: string;
    actualDelivery?: string;
    currentLocation?: {
      type: "Point";
      coordinates: [number, number];
    };
  };
  impact: {
    co2Saved: number;
    waterSaved: number;
    energySaved: number;
    landfillDiverted: number;
  };
  timeline: Array<{
    status: TransactionStatus;
    timestamp: string;
    note?: string;
    updatedBy?: string;
  }>;
  review?: {
    rating: number;
    comment: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Logistics Types
// ============================================
export type PickupStatus =
  | "scheduled"
  | "confirmed"
  | "en_route"
  | "arrived"
  | "loading"
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface LogisticsEvent {
  _id: string;
  transaction: Transaction | string;
  partner?: User | string;
  status: PickupStatus;
  scheduledDate: string;
  pickupLocation: {
    type: "Point";
    coordinates: [number, number];
    address: string;
  };
  deliveryLocation: {
    type: "Point";
    coordinates: [number, number];
    address: string;
  };
  trackingUpdates: Array<{
    status: PickupStatus;
    location?: {
      type: "Point";
      coordinates: [number, number];
    };
    timestamp: string;
    note?: string;
  }>;
  estimatedArrival?: string;
  actualArrival?: string;
  vehicleInfo?: {
    type: string;
    plateNumber: string;
    driverName: string;
    driverPhone: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Analytics Types
// ============================================
export interface DashboardStats {
  totalMaterials: number;
  activeMaterials: number;
  totalTransactions: number;
  pendingRequests: number;
  totalCo2Saved: number;
  totalWaterSaved: number;
  totalEnergySaved: number;
  totalLandfillDiverted: number;
  recentActivity: Array<{
    type: "material" | "request" | "transaction";
    action: string;
    timestamp: string;
    details: Record<string, unknown>;
  }>;
}

export interface ImpactMetrics {
  co2Saved: number;
  waterSaved: number;
  energySaved: number;
  landfillDiverted: number;
  treesEquivalent: number;
  carsOffRoad: number;
  homesPowered: number;
  period: "day" | "week" | "month" | "year" | "all";
}

export interface LeaderboardEntry {
  rank: number;
  user: Pick<User, "_id" | "name" | "avatar" | "company">;
  score: number;
  metric: "co2" | "materials" | "transactions";
}

// ============================================
// AI Assistant Types
// ============================================
export type ConversationType =
  | "reuse_suggestion"
  | "categorization"
  | "matching"
  | "general_assistant"
  | "impact_analysis"
  | "price_suggestion"
  | "description_generation";

export interface AiMessage {
  role: "user" | "assistant" | "system";
  content: string;
  structuredData?: Record<string, unknown>;
  timestamp: string;
}

export interface AiConversation {
  _id: string;
  user: User | string;
  type: ConversationType;
  title: string;
  material?: Material | string;
  messages: AiMessage[];
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface MaterialAnalysis {
  category: string;
  confidence: number;
  description: string;
  reusePotential: {
    score: number;
    applications: string[];
  };
  environmentalImpact: {
    co2Savings: number;
    waterSavings: number;
    energySavings: number;
  };
  pricingRecommendation: {
    min: number;
    max: number;
    currency: string;
    reasoning: string;
  };
  suggestions: string[];
}

// ============================================
// Notification Types
// ============================================
export type NotificationType =
  | "request_received"
  | "request_accepted"
  | "request_rejected"
  | "transaction_update"
  | "pickup_scheduled"
  | "pickup_completed"
  | "delivery_completed"
  | "review_received"
  | "system";

export interface Notification {
  _id: string;
  user: User | string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

// ============================================
// API Response Types
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
}

// ============================================
// Form Types
// ============================================
export interface CreateMaterialForm {
  title: string;
  description: string;
  category: MaterialCategory;
  condition: MaterialCondition;
  quantity: number;
  unit: string;
  images: File[];
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates?: [number, number];
  };
  pricing: {
    type: "free" | "fixed" | "negotiable" | "auction";
    amount?: number;
    currency: string;
  };
  availability: {
    startDate: string;
    endDate?: string;
    pickupInstructions?: string;
  };
  specifications?: Record<string, string | number>;
  tags?: string[];
}

export interface CreateRequestForm {
  materialId: string;
  message: string;
  requestedQuantity: number;
  proposedPrice?: number;
}

// ============================================
// Filter & Search Types
// ============================================
export interface MaterialFilters {
  category?: MaterialCategory[];
  condition?: MaterialCondition[];
  status?: ListingStatus[];
  priceType?: ("free" | "fixed" | "negotiable" | "auction")[];
  minPrice?: number;
  maxPrice?: number;
  minQuantity?: number;
  maxQuantity?: number;
  location?: {
    lat: number;
    lng: number;
    radius: number; // in km
  };
  sortBy?: "createdAt" | "price" | "quantity" | "distance" | "views";
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface Pagination {
  page: number;
  limit: number;
}
