import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect } from "react";

// Hooks
import { useAppDispatch, useAppSelector } from "./hooks/useRedux";
import { sessionRestored } from "./store/authSlice";

// Config
import { ROUTES, USER_ROLES } from "./config/constants";
import apiClient from "./api/client";

// Route Guards
import { ProtectedRoute, PublicOnlyRoute } from "./routes/ProtectedRoute";

// Pages
import {
  LandingPage,
  LoginPage,
  SignupPage,
  DashboardPage,
  BuyerDashboardPage,
  SellerDashboardPage,
  MarketplacePage,
  MaterialDetailsPage,
  MapDiscoveryPage,
  ListingsPage,
  CreateListingPage,
  ListingDetailsPage,
  RequestsPage,
  TransactionsPage,
  LogisticsPage,
  ImpactPage,
  AiAssistantPage,
  ProfilePage,
  NotificationsPage,
  AdminPage,
  NotFoundPage,
} from "./pages";

const App = () => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        dispatch(sessionRestored(null));
        return;
      }

      try {
        const response = await apiClient.get("/api/auth/me");
        dispatch(sessionRestored(response.data.data.user));
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        dispatch(sessionRestored(null));
      }
    };

    checkSession();
  }, [dispatch]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          <p className="text-neutral-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        hideProgressBar={false}
        autoClose={3000}
        theme="dark"
        toastStyle={{
          background: "#171717",
          color: "#fafafa",
          borderRadius: "12px",
          border: "1px solid #262626",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        }}
      />

      <Routes>
        {/* ==================== PUBLIC ROUTES ==================== */}
        
        {/* Landing Page */}
        <Route path={ROUTES.HOME} element={<LandingPage />} />
        
        {/* Auth Routes - Only accessible when NOT logged in */}
        <Route
          path={ROUTES.LOGIN}
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path={ROUTES.SIGNUP}
          element={
            <PublicOnlyRoute>
              <SignupPage />
            </PublicOnlyRoute>
          }
        />
        
        {/* Public Marketplace (can view without auth) */}
        <Route path="/browse" element={<MarketplacePage />} />

        {/* ==================== PROTECTED ROUTES ==================== */}
        
        {/* Dashboard - All authenticated users */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Buyer Dashboard - All authenticated users */}
        <Route
          path={ROUTES.BUYER_DASHBOARD}
          element={
            <ProtectedRoute>
              <BuyerDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Seller Dashboard - All authenticated users */}
        <Route
          path={ROUTES.SELLER_DASHBOARD}
          element={
            <ProtectedRoute>
              <SellerDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Marketplace - All authenticated users */}
        <Route
          path={ROUTES.MARKETPLACE}
          element={
            <ProtectedRoute>
              <MarketplacePage />
            </ProtectedRoute>
          }
        />

        {/* Material Details - View single material */}
        <Route
          path={ROUTES.MATERIAL_DETAILS}
          element={
            <ProtectedRoute>
              <MaterialDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Map Discovery - Map-based material discovery */}
        <Route
          path={ROUTES.MARKETPLACE_MAP}
          element={
            <ProtectedRoute>
              <MapDiscoveryPage />
            </ProtectedRoute>
          }
        />

        {/* Listings - All authenticated users */}
        <Route
          path={ROUTES.LISTINGS}
          element={
            <ProtectedRoute>
              <ListingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CREATE_LISTING}
          element={
            <ProtectedRoute>
              <CreateListingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.LISTING_DETAILS}
          element={
            <ProtectedRoute>
              <ListingDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Requests - All authenticated users */}
        <Route
          path={ROUTES.REQUESTS}
          element={
            <ProtectedRoute>
              <RequestsPage />
            </ProtectedRoute>
          }
        />

        {/* Transactions - All authenticated users */}
        <Route
          path={ROUTES.TRANSACTIONS}
          element={
            <ProtectedRoute>
              <TransactionsPage />
            </ProtectedRoute>
          }
        />

        {/* Logistics - Logistics Partners and Admins */}
        <Route
          path={ROUTES.LOGISTICS}
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.LOGISTICS_PARTNER, USER_ROLES.ADMIN]}>
              <LogisticsPage />
            </ProtectedRoute>
          }
        />

        {/* Impact - All authenticated users */}
        <Route
          path={ROUTES.IMPACT}
          element={
            <ProtectedRoute>
              <ImpactPage />
            </ProtectedRoute>
          }
        />

        {/* AI Assistant - All authenticated users */}
        <Route
          path={ROUTES.AI_ASSISTANT}
          element={
            <ProtectedRoute>
              <AiAssistantPage />
            </ProtectedRoute>
          }
        />

        {/* Profile - All authenticated users */}
        <Route
          path={ROUTES.PROFILE}
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Notifications - All authenticated users */}
        <Route
          path={ROUTES.NOTIFICATIONS}
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin - Admin only */}
        <Route
          path={ROUTES.ADMIN}
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* ==================== 404 ROUTE ==================== */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};

export default App;
