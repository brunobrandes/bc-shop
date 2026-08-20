import type { Metadata } from "next";
import { AdminAuthProvider } from "@/components/admin/admin-auth";

export const metadata: Metadata = {
  title: "CallInsights | BC-Shop Admin",
  description: "Operational insights for BC-Shop customer calls.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
