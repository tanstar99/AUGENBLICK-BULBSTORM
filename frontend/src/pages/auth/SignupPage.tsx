// Signup Page
import React, { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Building2, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { AuthLayout } from "@/layouts";
import { ROUTES } from "@/config/constants";
import { useAppDispatch } from "@/hooks/useRedux";
import { loginSuccess } from "@/store/authSlice";
import apiClient, { parseApiError } from "@/api/client";
import type { UserRole } from "@/types";

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: "buyer", label: "Buyer", description: "Looking to acquire materials" },
  { value: "seller", label: "Seller", description: "Have materials to list" },
  { value: "ngo", label: "NGO", description: "Non-profit organization" },
  { value: "logistics_partner", label: "Logistics", description: "Provide transport" },
];

const SignupPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("buyer");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post("/api/auth/register", {
        name,
        email,
        password,
        role,
        company: company || undefined,
      });
      
      const { user, accessToken, refreshToken } = response.data.data;
      
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      dispatch(loginSuccess(user));
      
      toast.success("Account created successfully!");
      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      const apiError = parseApiError(error);
      toast.error(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Join the circular economy today"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          {/* Name */}
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  role === option.value
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"
                }`}
              >
                <div className={`text-sm font-medium ${role === option.value ? "text-emerald-400" : "text-white"}`}>
                  {option.label}
                </div>
                <div className="text-xs text-neutral-500">{option.description}</div>
              </button>
            ))}
          </div>

          {/* Company (optional) */}
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              placeholder="Company name (optional)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 font-semibold rounded-xl hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>

        <p className="text-center text-sm text-neutral-400">
          Already have an account?{" "}
          <Link
            to={ROUTES.LOGIN}
            className="text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-neutral-500">
          By creating an account, you agree to our{" "}
          <a href="#" className="text-neutral-400 hover:text-white">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-neutral-400 hover:text-white">
            Privacy Policy
          </a>
        </p>
      </form>
    </AuthLayout>
  );
};

export default SignupPage;
