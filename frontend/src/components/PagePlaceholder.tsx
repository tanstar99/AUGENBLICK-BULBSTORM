// Page placeholder component for development
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import { ROUTES } from "@/config/constants";

interface PagePlaceholderProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
}

export const PagePlaceholder: React.FC<PagePlaceholderProps> = ({
  title,
  description = "This page is under construction.",
  icon: Icon = Construction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-emerald-400" />
      </div>
      <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3">{title}</h1>
      <p className="text-neutral-400 max-w-md mb-8">{description}</p>
      <Link
        to={ROUTES.DASHBOARD}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>
    </div>
  );
};

export default PagePlaceholder;
