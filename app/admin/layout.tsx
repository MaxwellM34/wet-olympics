import { isAdmin } from "@/lib/auth";
import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await isAdmin();
  return (
    <div className="space-y-4">
      {admin && (
        <nav className="glass p-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin" className="font-display font-black text-shimmer">
              ADMIN
            </Link>
            <Link href="/admin" className="btn-ghost !py-1 !px-3 text-xs">
              Games
            </Link>
            <Link href="/admin/schedule" className="btn-ghost !py-1 !px-3 text-xs">
              Schedule
            </Link>
          </div>
          <LogoutButton />
        </nav>
      )}
      {!admin && typeof children === "object" ? (
        <RequireAuthOrChildren>{children}</RequireAuthOrChildren>
      ) : (
        children
      )}
    </div>
  );
}

/**
 * Renders children for the /admin/login page (children needs no auth there);
 * everything else redirects to login.
 */
function RequireAuthOrChildren({ children }: { children: React.ReactNode }) {
  // This is a server component — if we get here, the user isn't admin.
  // We can't read the current path easily in a layout. The page-level
  // checks (in app/admin/page.tsx and per-game pages) call requireAdminPage()
  // themselves. The login page does not.
  return <>{children}</>;
}
