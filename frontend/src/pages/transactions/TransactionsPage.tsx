// Transactions Page
import React from "react";
import { ArrowLeftRight } from "lucide-react";
import { DashboardLayout } from "@/layouts";
import { PagePlaceholder } from "@/components/PagePlaceholder";

const TransactionsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <PagePlaceholder
        title="Transactions"
        description="Track all your material exchange transactions. View status, history, and completion details."
        icon={ArrowLeftRight}
      />
    </DashboardLayout>
  );
};

export default TransactionsPage;
