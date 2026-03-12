// Profile Page
import React from "react";
import { User } from "lucide-react";
import { DashboardLayout } from "@/layouts";
import { PagePlaceholder } from "@/components/PagePlaceholder";

const ProfilePage: React.FC = () => {
  return (
    <DashboardLayout>
      <PagePlaceholder
        title="Profile"
        description="Manage your account settings, preferences, and personal information."
        icon={User}
      />
    </DashboardLayout>
  );
};

export default ProfilePage;
