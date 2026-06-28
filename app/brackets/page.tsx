import BracketsDashboard from "@/components/BracketsDashboard";

export default function BracketsPage({
  searchParams,
}: {
  searchParams: { game?: string; event?: string };
}) {
  return (
    <BracketsDashboard
      initialGame={searchParams.game ?? null}
      event={searchParams.event ?? null}
    />
  );
}
