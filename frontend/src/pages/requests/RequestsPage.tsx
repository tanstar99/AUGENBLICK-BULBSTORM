// Requests Page
import React from "react";
import { FileText } from "lucide-react";
import { DashboardLayout } from "@/layouts";
import { PagePlaceholder } from "@/components/PagePlaceholder";

const RequestsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <PagePlaceholder
        title="Requests"
        description="Manage incoming and outgoing material requests. Accept, negotiate, or decline requests."
        icon={FileText}
      />
    </DashboardLayout>
  );
};

export default RequestsPage;
