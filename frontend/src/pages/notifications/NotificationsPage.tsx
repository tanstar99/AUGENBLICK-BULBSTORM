// Notifications Page
import React from "react";
import { Bell } from "lucide-react";
import { DashboardLayout } from "@/layouts";
import { PagePlaceholder } from "@/components/PagePlaceholder";

const NotificationsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <PagePlaceholder
        title="Notifications"
        description="View all your notifications about requests, transactions, and system updates."
        icon={Bell}
      />
    </DashboardLayout>
  );
};

export default NotificationsPage;
