import Link from "next/link";
import { listGames } from "@/lib/games/registry";

export const dynamic = "force-static";

export default function GamesIndex() {
  const games = listGames();
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Games</h1>
      <p className="text-gray-600">Browse available mini-games. This index is generated from the games registry.</p>
      <ul className="space-y-3">
        {games.map((g) => (
          <li key={g.id} className="border p-4 rounded flex items-center justify-between">
            <div>
              <div className="font-semibold">{g.title}</div>
              <div className="text-xs text-gray-500">Device: {g.deviceType}{g.tags?.length ? ` • ${g.tags.join(", ")}` : ""}</div>
            </div>
            <Link className="text-blue-600 underline" href={`/games/${g.slug}`}>Play</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
 
