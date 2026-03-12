// Listings Page - Manage your material listings
import React from "react";
import { Package } from "lucide-react";
import { DashboardLayout } from "@/layouts";
import { PagePlaceholder } from "@/components/PagePlaceholder";

const ListingsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <PagePlaceholder
        title="My Listings"
        description="View and manage all your material listings. Edit, pause, or remove listings."
        icon={Package}
      />
    </DashboardLayout>
  );
};

export default ListingsPage;
