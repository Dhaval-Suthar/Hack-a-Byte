# Games SDK (New)

We introduced a tiny, non-breaking Games SDK to make adding new mini-games simple and consistent.

- Types: `lib/games/types.ts`
- Registry: `lib/games/registry.ts`
- Server Actions: `app/actions/games.ts` (submit scores, fetch leaderboard)
- Client helpers: `components/games/*`
- Pages: `/games` to list available games and `/games/[slug]` to render them standalone

## Add a new game
1. Implement a client component for your game (e.g., `components/hackbook-w95/apps/MyNewGame.tsx`).
2. Register it in `lib/games/registry.ts` with an id, title, slug, deviceType, and componentPath.
3. Optionally submit scores from the game via the `submitScore` server action.
4. Your game will automatically appear at `/games` and be playable at `/games/<slug>`.

This change doesn't alter existing device shells. It provides a clean path to grow the catalog.
