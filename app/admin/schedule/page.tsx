import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import ScheduleEditor from "@/components/admin/ScheduleEditor";

export const dynamic = "force-dynamic";

export default async function AdminSchedule() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <ScheduleEditor />;
}
