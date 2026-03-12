// 404 Not Found Page
import React from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { ROUTES } from "@/config/constants";

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-emerald-500/20 mb-4">404</div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3">
          Page Not Found
        </h1>
        <p className="text-neutral-400 max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 font-semibold rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-neutral-700 text-white font-medium rounded-xl hover:bg-neutral-800 hover:border-neutral-600 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
