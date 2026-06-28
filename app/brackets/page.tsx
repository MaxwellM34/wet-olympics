import BracketsDashboard from "@/components/BracketsDashboard";

export default function BracketsPage({ searchParams }: { searchParams: { game?: string } }) {
  return <BracketsDashboard initialGame={searchParams.game ?? null} />;
}
