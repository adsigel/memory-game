import { ALL_IMAGES } from "./images";

/**
 * Simple seeded pseudo-random number generator (mulberry32).
 * Given a numeric seed, returns a function that produces deterministic
 * values in [0, 1) on each call.
 */
function seededRandom(seed: number): () => number {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Convert a date string like "2026-04-07" to a numeric seed.
 */
function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Fisher-Yates shuffle using a seeded RNG.
 */
function shuffle<T>(array: T[], rand: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface Card {
  id: number;
  imageUrl: string;
  pairId: number;
}

export type Difficulty = "easy" | "medium";

const PAIR_COUNTS: Record<Difficulty, number> = {
  easy: 2,   // 2x2 grid  =  4 cards = 2 pairs
  medium: 6, // 3x4 grid  = 12 cards = 6 pairs
};

/**
 * Generate the day's puzzle for a given difficulty.
 * Uses the date as a seed so the puzzle is consistent within a day
 * but different across days.
 */
export function generatePuzzle(
  dateStr: string,
  difficulty: Difficulty
): Card[] {
  // Use a different seed offset per difficulty so easy and medium
  // don't share the same first N images
  const difficultyOffset = difficulty === "easy" ? 0 : 7;
  const seed = dateToSeed(dateStr) + difficultyOffset;
  const rand = seededRandom(seed);

  const pairCount = PAIR_COUNTS[difficulty];

  // Shuffle all images, then pick the first `pairCount`
  const shuffledImages = shuffle(ALL_IMAGES, rand);
  const selectedImages = shuffledImages.slice(0, pairCount);

  // Create pairs (each image appears twice)
  const cards: Card[] = [];
  selectedImages.forEach((imageUrl, pairIndex) => {
    cards.push({ id: pairIndex * 2, imageUrl, pairId: pairIndex });
    cards.push({ id: pairIndex * 2 + 1, imageUrl, pairId: pairIndex });
  });

  // Shuffle the card positions
  return shuffle(cards, rand);
}

/**
 * Get today's date string in YYYY-MM-DD format.
 */
export function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
