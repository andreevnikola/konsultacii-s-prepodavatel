import { redirect } from "next/navigation";
import { getSessionFromStore } from "@/lib/session";
import DashboardNav from "./nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionFromStore();
  if (!session) {
    redirect("/login");
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNav />
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
