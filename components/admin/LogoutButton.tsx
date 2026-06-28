"use client";

/**
 * Logout button for the admin nav.
 * Calls DELETE /api/admin/login then redirects to /admin/login.
 */
export default function LogoutButton() {
  async function logout() {
    try {
      await fetch("/api/admin/login", { method: "DELETE" });
    } finally {
      window.location.href = "/admin/login";
    }
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="btn-ghost !py-1 !px-3 text-xs"
    >
      Log out
    </button>
  );
}
