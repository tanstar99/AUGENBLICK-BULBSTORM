// AI Assistant Page
import React from "react";
import { MessageSquare } from "lucide-react";
import { DashboardLayout } from "@/layouts";
import { PagePlaceholder } from "@/components/PagePlaceholder";

const AiAssistantPage: React.FC = () => {
  return (
    <DashboardLayout>
      <PagePlaceholder
        title="AI Assistant"
        description="Get AI-powered suggestions for material reuse, categorization, and sustainability insights."
        icon={MessageSquare}
      />
    </DashboardLayout>
  );
};

export default AiAssistantPage;
