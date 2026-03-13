// Landing Page - Motion + Glassmorphism Showcase
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
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
  Clock,
  ShoppingBag,
  Heart,
  Sparkles,
  Activity,
  Bot,
  Truck,
  BarChart3,
  ShieldCheck,
  MessageCircle,
  Layers3,
} from "lucide-react";
import { PublicLayout } from "@/layouts";
import { ROUTES } from "@/config/constants";
import { getPlatformStats } from "@/api/services";

const productsBuilt = [
  { icon: MessageCircle, title: "WhatsApp Commands", desc: "Add listing, view listings, view transactions via WHAPI." },
  { icon: BarChart3, title: "Impact Analytics", desc: "Monthly sustainability trends with environmental equivalents." },
  { icon: Package, title: "Materials Marketplace", desc: "Listing, browsing, search, and nearby geolocation discovery." },
  { icon: Truck, title: "Logistics Layer", desc: "Pickup and delivery orchestration across transactions." },
  { icon: Bot, title: "AI Workflows", desc: "AI assistant and image studio integration for reuse workflows." },
  { icon: ShieldCheck, title: "Secure API", desc: "JWT auth, role-safe routes, and webhook validation pipeline." },
];

const glassPanel =
  "bg-white/[0.06] border border-white/15 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]";

const floatingNodes = [
  { id: "n1", x: 8, y: 14, size: 3.8, delay: 0.0 },
  { id: "n2", x: 18, y: 28, size: 3.0, delay: 0.08 },
  { id: "n3", x: 12, y: 50, size: 2.8, delay: 0.16 },
  { id: "n4", x: 20, y: 67, size: 3.4, delay: 0.24 },
  { id: "n5", x: 30, y: 18, size: 2.4, delay: 0.32 },
  { id: "n6", x: 38, y: 76, size: 2.7, delay: 0.4 },
  { id: "n7", x: 50, y: 10, size: 4.2, delay: 0.48 },
  { id: "n8", x: 62, y: 24, size: 2.9, delay: 0.56 },
  { id: "n9", x: 72, y: 64, size: 3.2, delay: 0.64 },
  { id: "n10", x: 80, y: 44, size: 2.6, delay: 0.72 },
  { id: "n11", x: 90, y: 18, size: 3.6, delay: 0.8 },
  { id: "n12", x: 86, y: 72, size: 3.1, delay: 0.88 },
  { id: "n13", x: 58, y: 84, size: 2.5, delay: 0.96 },
  { id: "n14", x: 42, y: 8, size: 2.2, delay: 1.04 },
];

const getAngleToCenter = (x: number, y: number) => {
  const dx = 50 - x;
  const dy = 50 - y;
  const vectorAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return vectorAngle + 90;
};

interface LandingPlatformStats {
  impact?: {
    reuseCount?: number;
    wasteDivertedKg?: number;
    co2SavedKg?: number;
  };
  platform?: {
    totalUsers?: number;
    activeListings?: number;
    categories?: number;
  };
  equivalents?: {
    treesPlanted?: number;
    carsOffRoad?: number;
  };
}

const formatCompact = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
};

const formatNumber = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return value.toLocaleString();
};

const LandingPage: React.FC = () => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [platformStats, setPlatformStats] = useState<LandingPlatformStats | null>(null);

  const { scrollYProgress } = useScroll({
    target: pageRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 22,
    mass: 0.35,
  });

  const depthRotateX = useTransform(smoothProgress, [0, 1], [0, -16]);
  const depthRotateY = useTransform(smoothProgress, [0, 1], [0, 14]);
  const depthTranslateY = useTransform(smoothProgress, [0, 1], [0, -120]);
  const depthScale = useTransform(smoothProgress, [0, 1], [1, 1.16]);

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        const response = await getPlatformStats();
        const payload = response?.data || response;

        if (mounted) {
          setPlatformStats(payload || null);
        }
      } catch {
        if (mounted) {
          setPlatformStats(null);
        }
      }
    };

    fetchStats();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PublicLayout>
      <div ref={pageRef} className="relative overflow-hidden bg-[#030712] text-white">
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            animate={{ x: [0, 40, -30, 0], y: [0, -30, 15, 0] }}
            transition={{ duration: 18, repeat: Infinity }}
            className="absolute left-[-10%] top-[-20%] h-[32rem] w-[32rem] rounded-full bg-cyan-500/20 blur-[140px]"
          />
          <motion.div
            animate={{ x: [0, -20, 30, 0], y: [0, 20, -25, 0] }}
            transition={{ duration: 16, repeat: Infinity }}
            className="absolute right-[-8%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-emerald-500/20 blur-[120px]"
          />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />

          <motion.div
            style={{
              rotateX: depthRotateX,
              rotateY: depthRotateY,
              y: depthTranslateY,
              scale: depthScale,
              transformPerspective: 1200,
            }}
            className="absolute inset-0"
          >
            {floatingNodes.map((node) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: node.delay, duration: 0.6 }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  width: `${node.size}rem`,
                  height: `${node.size * 1.6}rem`,
                  transformStyle: "preserve-3d",
                  transform: `translate(-50%, -50%) rotate(${getAngleToCenter(node.x, node.y)}deg)`,
                }}
              >
                <motion.div
                  animate={{ y: [0, -12, 0], rotate: [0, 6, -4, 0] }}
                  transition={{ duration: 8, delay: node.delay, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 border border-cyan-200/30 bg-gradient-to-b from-cyan-200/18 via-white/6 to-emerald-200/18 backdrop-blur-sm"
                  style={{
                    clipPath: "polygon(50% 0%, 100% 62%, 75% 100%, 25% 100%, 0% 62%)",
                  }}
                >
                  <div
                    className="absolute left-1/2 top-[10%] h-[78%] w-[1px] -translate-x-1/2 bg-white/35"
                    style={{ filter: "blur(0.2px)" }}
                  />
                </motion.div>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 6.5, delay: node.delay, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-[20%] border border-white/25"
                  style={{
                    clipPath: "polygon(50% 0%, 96% 60%, 72% 100%, 28% 100%, 4% 60%)",
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>

        <section className="relative mx-auto max-w-7xl px-4 pb-24 pt-24 sm:px-6 lg:px-8 lg:pt-28">
          <div className="grid items-center gap-10 lg:grid-cols-1">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${glassPanel}`}>
                <Sparkles className="h-4 w-4 text-cyan-300" />
                <span className="text-xs font-semibold tracking-[0.22em] text-cyan-200">MOTION GLASS EXPERIENCE</span>
              </div>

              <h1 className="mt-7 text-5xl font-black leading-[0.95] sm:text-6xl lg:text-7xl">
                Circular Economy
                <span className="block bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                  Built For Speed
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
                Trade reusable materials, automate operations through WhatsApp, and track measurable impact in one platform. This experience is rebuilt with motion-first UI and layered glassmorphism.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to={ROUTES.MARKETPLACE}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-6 py-3 font-bold text-slate-950 shadow-[0_8px_40px_rgba(45,212,191,0.35)] transition hover:scale-[1.03]"
                >
                  <Search className="h-5 w-5" />
                  Explore Marketplace
                </Link>
                <Link
                  to={ROUTES.SIGNUP}
                  className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition hover:scale-[1.03] ${glassPanel}`}
                >
                  Join Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={ROUTES.LOGIN}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-semibold text-white/90 transition hover:bg-white/10"
                >
                  Login
                </Link>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Activity, value: "LIVE", label: "Real-time platform" },
                  {
                    icon: Recycle,
                    value: formatCompact(platformStats?.impact?.reuseCount),
                    label: "Successful reuses",
                  },
                  {
                    icon: Globe2,
                    value: formatCompact(platformStats?.platform?.totalUsers),
                    label: "Active users",
                  },
                ].map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.12 }}
                    className={`rounded-2xl p-4 ${glassPanel}`}
                  >
                    <item.icon className="h-5 w-5 text-cyan-300" />
                    <p className="mt-3 text-2xl font-black">{item.value}</p>
                    <p className="text-xs uppercase tracking-widest text-white/60">{item.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`rounded-[2rem] p-6 sm:p-8 ${glassPanel}`}
          >
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.22em] text-cyan-200/80">WHAT WE BUILT</p>
                <h2 className="mt-2 text-3xl font-black sm:text-4xl">Platform Capability Stack</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/75">
                <Layers3 className="h-4 w-4 text-cyan-300" />
                Full-stack marketplace + automation
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {productsBuilt.map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.07 }}
                  className="rounded-2xl border border-white/15 bg-black/25 p-5 transition hover:border-cyan-300/40 hover:bg-black/35"
                >
                  <item.icon className="h-6 w-6 text-cyan-200" />
                  <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-200/80">HOW IT FLOWS</p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">Three-Step Circular Loop</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                icon: Package,
                title: "List Materials",
                desc: "Publish inventory with quantity, condition, price and location.",
                tag: "STEP 01",
              },
              {
                icon: Search,
                title: "Match Demand",
                desc: "Discovery, requests, transactions, and logistics coordination.",
                tag: "STEP 02",
              },
              {
                icon: TreeDeciduous,
                title: "Measure Impact",
                desc: "CO2, waste diverted, trendline analytics and leaderboard ranking.",
                tag: "STEP 03",
              },
            ].map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className={`group rounded-3xl p-6 transition hover:-translate-y-1 ${glassPanel}`}
              >
                <p className="text-xs font-semibold tracking-widest text-cyan-200/70">{step.tag}</p>
                <step.icon className="mt-4 h-8 w-8 text-emerald-200" />
                <h3 className="mt-4 text-2xl font-black">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/65">{step.desc}</p>
                <div className="mt-5 h-1 w-full rounded-full bg-white/10">
                  <motion.div
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 + idx * 0.2 }}
                    className="h-full w-0 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Droplets,
                value: `${formatNumber(platformStats?.impact?.wasteDivertedKg)} kg`,
                label: "Waste Diverted",
              },
              {
                icon: Factory,
                value: `${formatNumber(platformStats?.impact?.co2SavedKg)} kg`,
                label: "CO2 Saved",
              },
              {
                icon: Leaf,
                value: formatNumber(platformStats?.equivalents?.treesPlanted),
                label: "Trees Equivalent",
              },
            ].map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.12 }}
                className={`rounded-2xl p-5 ${glassPanel}`}
              >
                <item.icon className="h-6 w-6 text-cyan-200" />
                <p className="mt-4 text-3xl font-black">{item.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/60">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-28 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`relative overflow-hidden rounded-[2.2rem] p-8 text-center sm:p-12 ${glassPanel}`}
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-12 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />

            <h2 className="relative text-3xl font-black sm:text-5xl">Ready To Activate Circular Trade?</h2>
            <p className="relative mx-auto mt-4 max-w-2xl text-white/70">
              Sign up as buyer, seller, or NGO and start exchanging materials with logistics, analytics, AI workflows, and WhatsApp commands integrated from day one.
            </p>

            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to={`${ROUTES.SIGNUP}?role=buyer`}
                className="rounded-xl border border-cyan-200/30 bg-cyan-200/15 px-5 py-3 font-semibold text-cyan-100 transition hover:bg-cyan-200/25"
              >
                Buyer
              </Link>
              <Link
                to={`${ROUTES.SIGNUP}?role=seller`}
                className="rounded-xl border border-emerald-200/30 bg-emerald-200/15 px-5 py-3 font-semibold text-emerald-100 transition hover:bg-emerald-200/25"
              >
                Seller
              </Link>
              <Link
                to={`${ROUTES.SIGNUP}?role=ngo`}
                className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15"
              >
                NGO
              </Link>
            </div>

            <div className="relative mt-7 flex flex-wrap items-center justify-center gap-5 text-xs uppercase tracking-[0.17em] text-white/55">
              <span className="inline-flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Live in minutes</span>
              <span className="inline-flex items-center gap-2"><ShoppingBag className="h-3.5 w-3.5" /> No hidden fees</span>
              <span className="inline-flex items-center gap-2"><Heart className="h-3.5 w-3.5" /> Community-first</span>
            </div>
          </motion.div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default LandingPage;
