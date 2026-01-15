import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SessionProvider } from "@/components/providers/SessionProvider";

export default async function AdminImportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // Check admin permissions
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <SessionProvider session={session}>
      <DashboardLayout>{children}</DashboardLayout>
    </SessionProvider>
  );
}
