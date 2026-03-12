// Create Listing Page
import React from "react";
import { Plus } from "lucide-react";
import { DashboardLayout } from "@/layouts";
import { PagePlaceholder } from "@/components/PagePlaceholder";

const CreateListingPage: React.FC = () => {
  return (
    <DashboardLayout>
      <PagePlaceholder
        title="Create Listing"
        description="List a new material for exchange. Add photos, set pricing, and specify availability."
        icon={Plus}
      />
    </DashboardLayout>
  );
};

export default CreateListingPage;
