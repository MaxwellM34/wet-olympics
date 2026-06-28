import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getGame } from "@/lib/games";
import AdminGameEditor from "@/components/admin/AdminGameEditor";

export const dynamic = "force-dynamic";

export default async function AdminGamePage({ params }: { params: { slug: string } }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const game = getGame(params.slug);
  if (!game) return notFound();
  return <AdminGameEditor gameSlug={game.slug} gameName={game.name} emoji={game.emoji} />;
}
