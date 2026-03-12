import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  LayoutDashboard,
  Store,
  Package,
  Plus,
  FileText,
  ArrowLeftRight,
  Truck,
  TrendingUp,
  MessageSquare,
  User,
  Bell,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  Shield,
  ShoppingBag,
  Briefcase,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { logout } from "@/store/authSlice";
import { ROUTES, USER_ROLES } from "@/config/constants";
import type { UserRole } from "@/types";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

// Navigation items with role-based access
const getNavItems = (role: UserRole): NavItem[] => {
  const items: NavItem[] = [
    { name: "Dashboard", path: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: "Marketplace", path: ROUTES.MARKETPLACE, icon: Store },
  ];

  // Buyer Hub - Available to all users (buyers can discover materials)
  items.push({
    name: "Buyer Hub",
    path: ROUTES.BUYER_DASHBOARD,
    icon: ShoppingBag,
  });

  // Seller Hub & Listings - Available to all users (anyone can list materials)
  items.push(
    {
      name: "Seller Hub",
      path: ROUTES.SELLER_DASHBOARD,
      icon: Briefcase,
    },
    { name: "My Listings", path: ROUTES.LISTINGS, icon: Package },
    { name: "Create Listing", path: ROUTES.CREATE_LISTING, icon: Plus }
  );

  // Common transaction items
  items.push(
    { name: "Requests", path: ROUTES.REQUESTS, icon: FileText },
    { name: "Transactions", path: ROUTES.TRANSACTIONS, icon: ArrowLeftRight }
  );

  // Logistics partner specific
  if (role === USER_ROLES.LOGISTICS_PARTNER || role === USER_ROLES.ADMIN) {
    items.push({ name: "Logistics", path: ROUTES.LOGISTICS, icon: Truck });
  }

  // Impact & AI for all
  items.push(
    { name: "Impact", path: ROUTES.IMPACT, icon: TrendingUp },
    { name: "AI Assistant", path: ROUTES.AI_ASSISTANT, icon: MessageSquare }
  );

  // Admin specific
  if (role === USER_ROLES.ADMIN) {
    items.push({ name: "Admin", path: ROUTES.ADMIN, icon: Shield });
  }

  return items;
};

/**
 * DashboardLayout - Layout for authenticated dashboard pages
 * Features collapsible sidebar with role-based navigation
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const navItems = React.useMemo(
    () => getNavItems(user?.role || USER_ROLES.BUYER),
    [user?.role]
  );

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    dispatch(logout());
    navigate(ROUTES.HOME);
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-neutral-800/50">
        <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center p-1 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-shadow">
            <Leaf className="w-full h-full text-neutral-950" />
          </div>
          {(isSidebarOpen || isMobileSidebarOpen) && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-lg text-white"
            >
              Augenblick
            </motion.span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={() => setIsMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {(isSidebarOpen || isMobileSidebarOpen) && (
                  <span className="truncate">{item.name}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-neutral-800/50">
        <div className="space-y-1">
          <NavLink
            to={ROUTES.PROFILE}
            onClick={() => setIsMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
              }`
            }
          >
            <User className="w-5 h-5" />
            {(isSidebarOpen || isMobileSidebarOpen) && <span>Profile</span>}
          </NavLink>
          <NavLink
            to={ROUTES.NOTIFICATIONS}
            onClick={() => setIsMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
              }`
            }
          >
            <Bell className="w-5 h-5" />
            {(isSidebarOpen || isMobileSidebarOpen) && <span>Notifications</span>}
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            {(isSidebarOpen || isMobileSidebarOpen) && <span>Logout</span>}
          </button>
        </div>

        {/* User Info */}
        {(isSidebarOpen || isMobileSidebarOpen) && user && (
          <div className="mt-4 p-3 rounded-lg bg-neutral-900/50 border border-neutral-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-neutral-950 font-semibold">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-neutral-500 capitalize">
                  {user.role?.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-neutral-950 flex font-sans selection:bg-emerald-500/30">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-neutral-900/50 border-r border-neutral-800/50 transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <SidebarContent />
        {/* Collapse Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute bottom-24 -right-3 w-6 h-6 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors z-10"
          style={{ left: isSidebarOpen ? "252px" : "68px" }}
        >
          <ChevronRight
            className={`w-4 h-4 transition-transform ${isSidebarOpen ? "rotate-180" : ""}`}
          />
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-neutral-900 border-r border-neutral-800 z-50 flex flex-col"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/50 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Breadcrumb / Page Title placeholder */}
          <div className="hidden lg:block" />

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
            </button>
            <button className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-neutral-950 font-semibold text-sm cursor-pointer hover:shadow-lg hover:shadow-emerald-500/25 transition-shadow">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/10 via-neutral-950 to-neutral-950 -z-10 pointer-events-none" />
          
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
