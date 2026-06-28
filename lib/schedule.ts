import { GAMES, type GameDef, type GameSlug } from "./games";
import type { EventRecord } from "./api";

/**
 * Returns the effective game list + per-game start/end for an event.
 * Honors event.order_override (filters + reorders) and event.schedule_override
 * (custom times per slug). Falls back to defaults from lib/games.ts.
 */
export function effectiveGames(event?: EventRecord | null): GameDef[] {
  const order = event?.order_override ?? null;
  const sched = event?.schedule_override ?? null;

  const baseBySlug = new Map<string, GameDef>(GAMES.map((g) => [g.slug, g]));
  const slugs: string[] = order && order.length > 0 ? order : GAMES.map((g) => g.slug);

  return slugs
    .filter((slug): slug is GameSlug => baseBySlug.has(slug))
    .map((slug, idx) => {
      const def = baseBySlug.get(slug)!;
      const ov = sched?.[slug];
      return {
        ...def,
        order: idx + 1,
        startTime: ov?.start ?? def.startTime,
        endTime: ov?.end ?? def.endTime,
      };
    });
}
