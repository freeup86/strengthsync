import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function DirectoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
        {children}
      </Suspense>
    </DashboardLayout>
  );
}
