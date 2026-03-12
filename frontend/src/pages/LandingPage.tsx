// Landing Page - Circular Economy Marketplace
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Recycle,
  Search,
  Leaf,
  Package,
  TreeDeciduous,
  Droplets,
  Factory,
  Globe2,
  MapPin,
  Clock,
  ShoppingBag,
  Heart,
  ChevronRight,
  Sparkles,
  Activity,
} from "lucide-react";
import { PublicLayout } from "@/layouts";
import { ROUTES } from "@/config/constants";

// Sample marketplace listings for preview
const sampleListings = [
  {
    id: 1,
    title: "Industrial Wood Pallets",
    category: "Wood",
    quantity: "150 units",
    condition: "Good",
    location: "Brooklyn, NY",
    price: "Free",
    image: "🪵",
    posted: "2 hours ago",
  },
  {
    id: 2,
    title: "Office Furniture Set",
    category: "Furniture",
    quantity: "25 pieces",
    condition: "Like New",
    location: "Manhattan, NY",
    price: "$200",
    image: "🪑",
    posted: "5 hours ago",
  },
  {
    id: 3,
    title: "Construction Steel Beams",
    category: "Metals",
    quantity: "500 kg",
    condition: "Good",
    location: "Queens, NY",
    price: "Negotiable",
    image: "🔩",
    posted: "1 day ago",
  },
  {
    id: 4,
    title: "Textile Fabric Rolls",
    category: "Textiles",
    quantity: "200 meters",
    condition: "New",
    location: "Newark, NJ",
    price: "$150",
    image: "🧵",
    posted: "3 hours ago",
  },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          {/* Gradient orbs */}
          <div className="absolute top-20 left-[10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-20 right-[10%] w-[400px] h-[400px] bg-teal-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px]" />
          
          {/* Grid pattern overlay */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(to right, white 1px, transparent 1px),
                                linear-gradient(to bottom, white 1px, transparent 1px)`,
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">
                Join the Circular Economy Revolution
              </span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
            >
              Reuse Materials.
              <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300">
                Reduce Waste.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Connect with businesses and communities to reuse valuable materials 
              instead of sending them to landfills. Build a sustainable future together.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Link
                to="/browse"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02]"
              >
                <Search className="w-5 h-5" />
                Browse Marketplace
              </Link>
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white bg-neutral-800/60 border border-neutral-700 rounded-xl hover:bg-neutral-800 hover:border-neutral-600 transition-all backdrop-blur-sm"
              >
                Login
              </Link>
              <Link
                to={ROUTES.SIGNUP}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all backdrop-blur-sm"
              >
                Sign Up Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            {/* Live Stats Ticker */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-wrap justify-center gap-8 md:gap-12"
            >
              {[
                { icon: Activity, value: "Live", label: "Platform Status", color: "emerald" },
                { icon: Package, value: "12,847", label: "Materials Listed", color: "teal" },
                { icon: Recycle, value: "8,543", label: "Items Reused", color: "emerald" },
                { icon: Globe2, value: "432", label: "Active Communities", color: "teal" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-neutral-500">{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-neutral-500">
            <span className="text-xs tracking-wider">SCROLL TO EXPLORE</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-6 h-10 rounded-full border-2 border-neutral-700 flex items-start justify-center p-2"
            >
              <div className="w-1 h-2 bg-emerald-400 rounded-full" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-gradient-to-b from-neutral-950 to-neutral-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Recycle className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Simple Process</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Start contributing to the circular economy in three simple steps
            </p>
          </motion.div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: "01",
                icon: Package,
                title: "List Materials",
                description: "Post your reusable materials with photos, quantities, and location. Set your price or offer them for free.",
                color: "emerald",
              },
              {
                step: "02",
                icon: Search,
                title: "Discover Materials",
                description: "Browse available materials nearby. Filter by category, condition, and distance. Connect with sellers directly.",
                color: "teal",
              },
              {
                step: "03",
                icon: Recycle,
                title: "Reuse & Reduce Waste",
                description: "Complete the exchange, arrange pickup or delivery, and track your environmental impact in real-time.",
                color: "emerald",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative group"
              >
                {/* Connection line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-full h-px bg-gradient-to-r from-emerald-500/50 to-transparent" />
                )}
                
                <div className="relative p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 hover:border-emerald-500/30 transition-all duration-300 group-hover:bg-neutral-900/80">
                  {/* Step number */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <span className="text-lg font-bold text-emerald-400">{item.step}</span>
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-${item.color}-500/10 border border-${item.color}-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className={`w-8 h-8 text-${item.color}-400`} />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-neutral-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SUSTAINABILITY IMPACT ==================== */}
      <section id="impact" className="py-24 lg:py-32 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[150px]" />
          <div className="absolute top-1/4 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <TreeDeciduous className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Environmental Impact</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Sustainability Impact
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Together, we're making a measurable difference for our planet
            </p>
          </motion.div>

          {/* Impact Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: TreeDeciduous,
                value: "850",
                unit: "tons",
                label: "CO₂ Saved",
                description: "Carbon emissions prevented",
                color: "emerald",
              },
              {
                icon: Recycle,
                value: "12,000+",
                unit: "",
                label: "Materials Reused",
                description: "Items diverted from landfill",
                color: "teal",
              },
              {
                icon: Globe2,
                value: "432",
                unit: "",
                label: "Circular Nodes",
                description: "Active exchange points",
                color: "emerald",
              },
              {
                icon: Package,
                value: "8,500+",
                unit: "",
                label: "Active Listings",
                description: "Materials available now",
                color: "teal",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative group"
              >
                <div className="p-6 lg:p-8 rounded-2xl bg-neutral-900/60 border border-neutral-800/50 hover:border-emerald-500/30 transition-all duration-300 backdrop-blur-sm h-full">
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center mb-4`}>
                      <stat.icon className={`w-7 h-7 text-${stat.color}-400`} />
                    </div>
                    
                    <div className="text-3xl lg:text-4xl font-bold text-white mb-1">
                      {stat.value}
                      {stat.unit && <span className="text-lg text-neutral-500 ml-1">{stat.unit}</span>}
                    </div>
                    
                    <div className="text-lg font-medium text-emerald-400 mb-1">
                      {stat.label}
                    </div>
                    
                    <p className="text-sm text-neutral-500">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Additional Impact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 grid md:grid-cols-3 gap-6"
          >
            {[
              { icon: Droplets, value: "2.4M liters", label: "Water conserved" },
              { icon: Factory, value: "1,200 MWh", label: "Energy saved" },
              { icon: Leaf, value: "45,000+", label: "Trees equivalent saved" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 p-4 rounded-xl bg-neutral-900/30 border border-neutral-800/30">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{item.value}</div>
                  <div className="text-sm text-neutral-500">{item.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==================== MARKETPLACE PREVIEW ==================== */}
      <section className="py-24 lg:py-32 bg-gradient-to-b from-neutral-900/50 to-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between mb-12"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Live Marketplace</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                Marketplace Preview
              </h2>
              <p className="text-lg text-neutral-400 max-w-xl">
                Browse available materials from businesses in your area
              </p>
            </div>
            <Link
              to="/browse"
              className="mt-6 md:mt-0 inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              View All Listings
              <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>

          {/* Listings Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sampleListings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => navigate(ROUTES.LOGIN)}
              >
                <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/50 hover:border-emerald-500/30 transition-all duration-300 h-full">
                  {/* Image placeholder */}
                  <div className="aspect-square rounded-xl bg-neutral-800/50 flex items-center justify-center mb-4 group-hover:bg-neutral-800 transition-colors">
                    <span className="text-6xl">{listing.image}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {listing.category}
                      </span>
                      <span className="text-xs text-neutral-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {listing.posted}
                      </span>
                    </div>
                    
                    <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {listing.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{listing.location}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-800/50">
                      <span className="text-sm text-neutral-400">{listing.quantity}</span>
                      <span className="text-lg font-bold text-emerald-400">{listing.price}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CALL TO ACTION ==================== */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[200px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-neutral-900/80 to-neutral-900 p-8 md:p-12 lg:p-16 text-center overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-teal-500/15 rounded-full blur-[100px]" />
            
            <div className="relative">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, type: "spring" }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/30"
              >
                <Leaf className="w-10 h-10 text-neutral-950" />
              </motion.div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                Start Reusing Today
              </h2>
              <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-10">
                Join thousands of businesses and communities making a real difference. 
                Choose your role and start contributing to the circular economy.
              </p>

              {/* Role-based signup buttons */}
              <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                <Link
                  to={`${ROUTES.SIGNUP}?role=buyer`}
                  className="group p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <ShoppingBag className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">Sign up as Buyer</h3>
                  <p className="text-sm text-neutral-500">Find reusable materials</p>
                </Link>

                <Link
                  to={`${ROUTES.SIGNUP}?role=seller`}
                  className="group p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Package className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">Sign up as Seller</h3>
                  <p className="text-sm text-neutral-500">List your materials</p>
                </Link>

                <Link
                  to={`${ROUTES.SIGNUP}?role=ngo`}
                  className="group p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Heart className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">Sign up as NGO</h3>
                  <p className="text-sm text-neutral-500">Support communities</p>
                </Link>
              </div>

              {/* Additional info */}
              <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-neutral-500">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Free to join</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>No hidden fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Verified businesses</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default LandingPage;
