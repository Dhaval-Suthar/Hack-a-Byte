import { notFound } from "next/navigation";
import { getGameBySlug } from "@/lib/games/registry";
import GameLoader from "@/components/games/GameLoader";

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const def = getGameBySlug(slug);
  if (!def || !def.componentPath) return notFound();

  return (
    <div className="p-4">
  <h1 className="text-xl font-semibold mb-4">{def.title}</h1>
  {/* Render the game component standalone via client loader */}
  <GameLoader gameId={def.id} />
    </div>
  );
}
