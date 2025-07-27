import React from "react";
import PageLayout from "@/components/layout/PageLayout";

// This layout applies to all pages in the (pages) group
export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageLayout>
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow">{children}</div>
      </div>
    </PageLayout>
  );
}
