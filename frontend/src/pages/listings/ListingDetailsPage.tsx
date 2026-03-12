// Listing Details Page
import React from "react";
import { Package } from "lucide-react";
import { DashboardLayout } from "@/layouts";
import { PagePlaceholder } from "@/components/PagePlaceholder";

const ListingDetailsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <PagePlaceholder
        title="Listing Details"
        description="View detailed information about this material listing."
        icon={Package}
      />
    </DashboardLayout>
  );
};

export default ListingDetailsPage;
