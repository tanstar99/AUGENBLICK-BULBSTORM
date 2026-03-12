// Admin Page
import React from "react";
import { Shield } from "lucide-react";
import { DashboardLayout } from "@/layouts";
import { PagePlaceholder } from "@/components/PagePlaceholder";

const AdminPage: React.FC = () => {
  return (
    <DashboardLayout>
      <PagePlaceholder
        title="Admin Dashboard"
        description="System administration, user management, and platform analytics."
        icon={Shield}
      />
    </DashboardLayout>
  );
};

export default AdminPage;
