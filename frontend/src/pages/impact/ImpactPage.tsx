// Impact Page
import React from "react";
import { TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/layouts";
import { PagePlaceholder } from "@/components/PagePlaceholder";

const ImpactPage: React.FC = () => {
  return (
    <DashboardLayout>
      <PagePlaceholder
        title="Environmental Impact"
        description="Track your sustainability metrics. View CO₂ savings, water conservation, and landfill diversion."
        icon={TrendingUp}
      />
    </DashboardLayout>
  );
};

export default ImpactPage;
