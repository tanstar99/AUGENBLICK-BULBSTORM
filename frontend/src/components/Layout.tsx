import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Activity, Globe2, Menu, X, Box } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const TickerItem = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="flex items-center gap-2 px-6">
    <Icon className="w-4 h-4 text-emerald-400" />
    <span className="text-sm font-medium text-emerald-50 whitespace-nowrap">{text}</span>
  </div>
);

const Ticker = () => {
  return (
    <div className="w-full bg-emerald-950/90 backdrop-blur border-b border-emerald-900/50 overflow-hidden py-2 relative z-50">
      <div className="flex z-0 relative">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
          className="flex flex-nowrap shrink-0"
        >
          <TickerItem icon={Activity} text="ECO-System Status: Optimal" />
          <TickerItem icon={Leaf} text="Global CO2 Saved: 145,230 kg" />
          <TickerItem icon={Box} text="Active Material Passports: 8,492" />
          <TickerItem icon={Globe2} text="Active Circular Nodes: 432" />
          
          {/* Duplicate for seamless loop */}
          <TickerItem icon={Activity} text="ECO-System Status: Optimal" />
          <TickerItem icon={Leaf} text="Global CO2 Saved: 145,230 kg" />
          <TickerItem icon={Box} text="Active Material Passports: 8,492" />
          <TickerItem icon={Globe2} text="Active Circular Nodes: 432" />
        </motion.div>
      </div>
    </div>
  );
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Passports', path: '/passports' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col font-sans selection:bg-emerald-500/30">
      <div className="sticky top-0 z-50 w-full flex flex-col">
        <Ticker />
        <nav className="w-full bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800 shadow-sm relative z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center p-1 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-shadow duration-300">
                  <Leaf className="w-full h-full text-neutral-950" />
                </div>
                <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-100 to-teal-100">
                  Circula
                </span>
              </div>

              {/* Desktop Nav */}
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-6">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.name}
                      to={link.path}
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50'
                        }`
                      }
                    >
                      {link.name}
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* Profile / Mobile button */}
              <div className="flex items-center gap-4">
                <button className="hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-emerald-900 to-neutral-900 border border-emerald-800 shadow-sm hover:ring-2 ring-emerald-500/50 transition-all">
                  <span className="text-sm font-medium text-emerald-100">AB</span>
                </button>
                <div className="-mr-2 flex md:hidden">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    type="button"
                    className="inline-flex items-center justify-center p-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 focus:outline-none"
                  >
                    <span className="sr-only">Open main menu</span>
                    {isMobileMenuOpen ? (
                      <X className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Menu className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-neutral-900 border-b border-neutral-800"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-md text-base font-medium ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </NavLink>
                ))}
              </div>
            </motion.div>
          )}
        </nav>
      </div>

      <main className="flex-1 w-full relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-neutral-950 to-neutral-950 -z-10" />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};
