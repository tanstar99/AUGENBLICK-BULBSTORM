import React from "react";
import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Menu, X } from "lucide-react";
import { ROUTES } from "@/config/constants";

interface PublicLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

/**
 * PublicLayout - Layout for public pages (landing, about, etc.)
 * Features transparent navbar that can scroll with content
 */
export const PublicLayout: React.FC<PublicLayoutProps> = ({ 
  children, 
  showNav = true 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  // Handle scroll effect for navbar
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "How It Works", path: "/#how-it-works" },
    { name: "Marketplace", path: ROUTES.MARKETPLACE },
    { name: "Impact", path: "/#impact" },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Navigation */}
      {showNav && (
        <nav
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled
              ? "bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800/50 shadow-lg"
              : "bg-transparent"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:h-20">
              {/* Logo */}
              <Link to={ROUTES.HOME} className="flex-shrink-0 flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center p-1.5 group-hover:shadow-[0_0_24px_rgba(52,211,153,0.5)] transition-all duration-300">
                  <Leaf className="w-full h-full text-neutral-950" />
                </div>
                <span className="font-bold text-xl lg:text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-100 to-teal-100">
                  Augenblick
                </span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-8">
                <div className="flex items-baseline gap-6">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.name}
                      to={link.path}
                      className="text-neutral-400 hover:text-neutral-100 text-sm font-medium transition-colors duration-200"
                    >
                      {link.name}
                    </NavLink>
                  ))}
                </div>

                {/* Auth Buttons */}
                <div className="flex items-center gap-3">
                  <Link
                    to={ROUTES.LOGIN}
                    className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to={ROUTES.SIGNUP}
                    className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 rounded-lg hover:from-emerald-400 hover:to-teal-400 transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                  >
                    Get Started
                  </Link>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 focus:outline-none"
              >
                <span className="sr-only">Toggle menu</span>
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800"
            >
              <div className="px-4 py-4 space-y-2">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    className="block px-4 py-3 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </NavLink>
                ))}
                <div className="pt-4 flex flex-col gap-3">
                  <Link
                    to={ROUTES.LOGIN}
                    className="px-4 py-3 text-center text-neutral-300 hover:text-white font-medium rounded-lg hover:bg-neutral-800/50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to={ROUTES.SIGNUP}
                    className="px-4 py-3 text-center font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link to={ROUTES.HOME} className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center p-1">
                  <Leaf className="w-full h-full text-neutral-950" />
                </div>
                <span className="font-bold text-lg text-white">Augenblick</span>
              </Link>
              <p className="text-sm text-neutral-400">
                Building a circular economy, one material at a time.
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><Link to={ROUTES.MARKETPLACE} className="text-sm text-neutral-400 hover:text-emerald-400">Marketplace</Link></li>
                <li><Link to="/#how-it-works" className="text-sm text-neutral-400 hover:text-emerald-400">How It Works</Link></li>
                <li><Link to="/#impact" className="text-sm text-neutral-400 hover:text-emerald-400">Impact</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-neutral-400 hover:text-emerald-400">Documentation</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-emerald-400">API</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-emerald-400">Support</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-neutral-400 hover:text-emerald-400">Privacy</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-emerald-400">Terms</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-emerald-400">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-neutral-500">
              © {new Date().getFullYear()} Augenblick. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-600">Built for a sustainable future</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
