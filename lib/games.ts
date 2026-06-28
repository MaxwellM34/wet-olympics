export type GameSlug =
  | "pool-volleyball"
  | "beer-pong"
  | "billiards"
  | "table-tennis"
  | "basketball";

export interface GameDef {
  slug: GameSlug;
  order: number;
  name: string;
  emoji: string;
  startTime: string; // local 24h "HH:MM"
  endTime: string;
  minPlayers: number;
  maxPlayers: number;
  format: string; // short blurb for the card
  rules: string[]; // bullet list shown on signup page
  prizes: string[];
}

export const GAMES: GameDef[] = [
  {
    slug: "pool-volleyball",
    order: 1,
    name: "Pool Volleyball",
    emoji: "🏐",
    startTime: "15:30",
    endTime: "17:00",
    minPlayers: 3,
    maxPlayers: 4,
    format: "Team vs team in the pool. 3–4 players per side.",
    rules: [
      "Played in the hostel pool over a net. 3 or 4 players per team.",
      "Standard volleyball scoring: rally point, first team to 15 wins the set (win by 2).",
      "Best of 1 set per match — single elimination bracket.",
      "100 ฿ entry per player — includes a free beer at the bar.",
      "Underwater serves and creative trick shots are encouraged.",
      "Ball touching the water on your side = point to the other team.",
      "No carries, no double hits on the first touch. Otherwise: have fun.",
    ],
    prizes: [
      "1st place: Free bucket of liquor",
      "2nd place: Free beer",
    ],
  },
  {
    slug: "beer-pong",
    order: 2,
    name: "Beer Pong",
    emoji: "🍺",
    startTime: "20:35",
    endTime: "21:05",
    minPlayers: 1,
    maxPlayers: 2,
    format: "1 or 2 players per team. Classic rules, single elimination.",
    rules: [
      "10 cups per side in a triangle, filled with water (drink is given separately by the bar).",
      "Each team alternates throwing 2 balls per turn (one per player on doubles).",
      "Sink a cup, the other team drinks one of theirs and removes the cup.",
      "Re-rack at 6 cups and 3 cups (call it on your turn).",
      "If you sink both balls in one turn, you get the balls back.",
      "Last cup: defending team gets one redemption shot. Miss = match over.",
    ],
    prizes: [
      "1st place: Free bucket of liquor",
      "2nd place: Small beer",
      "3rd place: Wet Pussy shot",
    ],
  },
  {
    slug: "billiards",
    order: 3,
    name: "Billiards",
    emoji: "🎱",
    startTime: "21:10",
    endTime: "21:40",
    minPlayers: 1,
    maxPlayers: 2,
    format: "1 or 2 players per team. 8-ball pool, single elimination.",
    rules: [
      "Standard 8-ball pool rules.",
      "Break: at least 4 balls hit a cushion or one ball is pocketed, otherwise re-rack.",
      "First team to pocket a ball after the break gets that group (solids or stripes).",
      "Scratch (cue ball pocketed) = ball in hand for the opposing team.",
      "Pocket the 8-ball before clearing your group = automatic loss.",
      "Call your pocket on the 8-ball. Wrong pocket = loss.",
    ],
    prizes: [
      "1st place: Free bucket of liquor",
      "2nd place: Small beer",
      "3rd place: Wet Pussy shot",
    ],
  },
  {
    slug: "table-tennis",
    order: 4,
    name: "Table Tennis",
    emoji: "🏓",
    startTime: "21:45",
    endTime: "22:15",
    minPlayers: 1,
    maxPlayers: 1,
    format: "1 vs 1. Single elimination bracket.",
    rules: [
      "Single elimination, 1 vs 1.",
      "First to 11 points wins the game. Win by 2.",
      "Serve alternates every 2 points.",
      "Best of 1 game per match.",
      "Standard serve: ball tossed at least 16cm vertically before contact.",
      "Lose a point: ball doesn't clear the net, lands off the table, or you touch the table with your free hand.",
    ],
    prizes: [
      "1st place: Free bucket of liquor",
      "2nd place: Small beer",
      "3rd place: Wet Pussy shot",
    ],
  },
  {
    slug: "basketball",
    order: 5,
    name: "Basketball",
    emoji: "🏀",
    startTime: "22:20",
    endTime: "23:00",
    minPlayers: 2,
    maxPlayers: 2,
    format: "2 vs 2 half-court. Single elimination.",
    rules: [
      "Half-court 2 vs 2.",
      "Inside the arc = 1 point. Outside the arc = 2 points.",
      "First to 11 points wins (win by 2, cap at 15).",
      "Make it, take it: scoring team keeps possession.",
      "Defensive rebound must be cleared past the 3-point line.",
      "Call your own fouls. Don't be that person.",
    ],
    prizes: [
      "1st place: Free bucket of liquor",
      "2nd place: Small beer",
      "3rd place: Wet Pussy shot",
    ],
  },
];

export function getGame(slug: string): GameDef | undefined {
  return GAMES.find((g) => g.slug === slug);
}

export function teamSizeLabel(g: GameDef): string {
  if (g.minPlayers === g.maxPlayers) return `${g.minPlayers} player${g.minPlayers > 1 ? "s" : ""}`;
  return `${g.minPlayers}–${g.maxPlayers} players`;
}

export function timeLabel(g: GameDef): string {
  return `${formatTime(g.startTime)}–${formatTime(g.endTime)}`;
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/**
 * Compares now (HH:MM) against the schedule and returns:
 *   - "upcoming" — game hasn't started yet
 *   - "live" — currently in its window
 *   - "done" — finished
 */
export function gameStatus(
  g: GameDef,
  now: Date = new Date(),
): "upcoming" | "live" | "done" {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(g.startTime);
  const end = toMinutes(g.endTime);
  if (minutes < start) return "upcoming";
  if (minutes > end) return "done";
  return "live";
}

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
