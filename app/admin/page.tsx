import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import AdminGamesDashboard from "@/components/admin/AdminGamesDashboard";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <AdminGamesDashboard />;
}
