// Logistics Page
import React from "react";
import { Truck } from "lucide-react";
import { DashboardLayout } from "@/layouts";
import { PagePlaceholder } from "@/components/PagePlaceholder";

const LogisticsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <PagePlaceholder
        title="Logistics"
        description="Schedule pickups, track deliveries, and manage transportation for material exchanges."
        icon={Truck}
      />
    </DashboardLayout>
  );
};

export default LogisticsPage;
