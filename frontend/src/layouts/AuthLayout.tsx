import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Recycle, TreeDeciduous, Droplets } from "lucide-react";
import { ROUTES } from "@/config/constants";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

/**
 * AuthLayout - Layout for authentication pages (login, signup)
 * Split screen design with branding on left, form on right
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen bg-neutral-950 flex font-sans selection:bg-emerald-500/30">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-950 via-neutral-950 to-neutral-950 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-32 right-20 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl" />
        </div>

        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16 w-full">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center p-2 group-hover:shadow-[0_0_32px_rgba(52,211,153,0.5)] transition-all duration-300">
              <Leaf className="w-full h-full text-neutral-950" />
            </div>
            <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-100 to-teal-100">
              Augenblick
            </span>
          </Link>

          {/* Main Content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                Join the
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
                  Circular Economy
                </span>
              </h1>
              <p className="text-lg text-neutral-400 max-w-md">
                Connect with businesses, reduce waste, and create measurable environmental impact.
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-6"
            >
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
                <Recycle className="w-6 h-6 text-emerald-400 mb-2" />
                <div className="text-2xl font-bold text-white">12K+</div>
                <div className="text-xs text-neutral-500">Materials Reused</div>
              </div>
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
                <TreeDeciduous className="w-6 h-6 text-emerald-400 mb-2" />
                <div className="text-2xl font-bold text-white">850</div>
                <div className="text-xs text-neutral-500">Tons CO₂ Saved</div>
              </div>
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
                <Droplets className="w-6 h-6 text-emerald-400 mb-2" />
                <div className="text-2xl font-bold text-white">2.4M</div>
                <div className="text-xs text-neutral-500">Liters Water Saved</div>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="text-sm text-neutral-600">
            © {new Date().getFullYear()} Augenblick. Building a sustainable future.
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Link to={ROUTES.HOME} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center p-1.5">
                <Leaf className="w-full h-full text-neutral-950" />
              </div>
              <span className="font-bold text-xl text-white">Augenblick</span>
            </Link>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              {title}
            </h2>
            {subtitle && (
              <p className="text-neutral-400">{subtitle}</p>
            )}
          </div>

          {/* Form Content */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
