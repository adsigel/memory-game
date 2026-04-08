"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { generatePuzzle, getTodayString, type Card } from "../lib/puzzle";
import { initAmplitude, track } from "../lib/amplitude";

// Joyful messages for match / mismatch / completion
const MATCH_MESSAGES = [
  "You got it! 🎉 Keep going — find the next pair!",
  "Great match! ⭐ Can you find another?",
  "Wonderful! 💛 Keep flipping to find more!",
  "That's a pair! 🌟 See if you can match them all!",
  "Nicely done! 🥳 Keep going — you're on a roll!",
];

const MISMATCH_MESSAGES = [
  "Not quite — try again! 💪",
  "So close! Give it another go 😊",
  "Keep going, you've got this! 🌈",
];

const TRY_AGAIN_MESSAGES = [
  "Give it another try — tap two cards!",
  "Your turn! Flip two cards to find a match.",
  "Keep going — tap two cards!",
];

const VICTORY_MESSAGES = [
  "You did it! Amazing! 🎊",
  "All matched — you're a star! ⭐",
  "Wonderful job today! 🌻",
];

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function puzzleId(dateStr: string, difficulty: "easy" | "medium"): string {
  return `${dateStr}-${difficulty}`;
}

export default function MemoryGame() {
  const [dateStr] = useState(getTodayString);
  useEffect(() => {
    initAmplitude();
  }, []);

  // Which puzzle is actively being played
  const [difficulty, setDifficulty] = useState<"easy" | "medium">("easy");
  // When true, display the completed easy puzzle in read-only mode
  const [viewingEasy, setViewingEasy] = useState(false);

  // Saved state for the completed easy puzzle
  const [easyComplete, setEasyComplete] = useState(false);
  const [easySavedCards, setEasySavedCards] = useState<Card[]>([]);
  const [easySavedMoves, setEasySavedMoves] = useState(0);

  // Active game state (tracks whichever puzzle is currently being played)
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState("Tap a card to begin!");
  const [isChecking, setIsChecking] = useState(false);
  const [moves, setMoves] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Initialize easy puzzle whenever the date changes
  useEffect(() => {
    const puzzle = generatePuzzle(dateStr, "easy");
    setCards(puzzle);
    setFlippedIds([]);
    setMatchedPairIds(new Set());
    setMoves(0);
    setIsComplete(false);
    setMessage("Tap a card to begin!");
    setDifficulty("easy");
    setViewingEasy(false);
    setEasyComplete(false);
    setEasySavedCards([]);
    setEasySavedMoves(0);
    track("puzzle_viewed", { puzzle_id: puzzleId(dateStr, "easy"), difficulty: "easy" });
  }, [dateStr]);

  const startMedium = useCallback(() => {
    const puzzle = generatePuzzle(dateStr, "medium");
    setCards(puzzle);
    setFlippedIds([]);
    setMatchedPairIds(new Set());
    setMoves(0);
    setIsComplete(false);
    setMessage("Tap a card to begin!");
    setDifficulty("medium");
    setViewingEasy(false);
    track("puzzle_viewed", { puzzle_id: puzzleId(dateStr, "medium"), difficulty: "medium" });
  }, [dateStr]);

  const handleCardTap = useCallback(
    (card: Card) => {
      if (isChecking || matchedPairIds.has(card.pairId) || flippedIds.includes(card.id)) {
        return;
      }

      const newFlipped = [...flippedIds, card.id];
      setFlippedIds(newFlipped);

      if (newFlipped.length === 2) {
        setIsChecking(true);
        setMoves((m) => m + 1);

        const [firstId, secondId] = newFlipped;
        const firstCard = cards.find((c) => c.id === firstId)!;
        const secondCard = cards.find((c) => c.id === secondId)!;

        if (firstCard.pairId === secondCard.pairId) {
          track("guess_made", { puzzle_id: puzzleId(dateStr, difficulty), difficulty, correct: true });

          const newMatched = new Set(matchedPairIds);
          newMatched.add(firstCard.pairId);
          setMatchedPairIds(newMatched);
          setFlippedIds([]);
          setIsChecking(false);

          const totalPairs = cards.length / 2;
          if (newMatched.size === totalPairs) {
            setIsComplete(true);
            setMessage(pickRandom(VICTORY_MESSAGES));
            if (difficulty === "easy") {
              setEasyComplete(true);
              setEasySavedCards([...cards]);
              setEasySavedMoves(moves + 1);
            }
            track("puzzle_completed", {
              puzzle_id: puzzleId(dateStr, difficulty),
              difficulty,
              guesses_needed: moves + 1,
            });
          } else {
            setMessage(pickRandom(MATCH_MESSAGES));
          }
        } else {
          track("guess_made", { puzzle_id: puzzleId(dateStr, difficulty), difficulty, correct: false });
          setMessage(pickRandom(MISMATCH_MESSAGES));
          setTimeout(() => {
            setFlippedIds([]);
            setIsChecking(false);
            setMessage(pickRandom(TRY_AGAIN_MESSAGES));
          }, 1600);
        }
      }
    },
    [cards, flippedIds, matchedPairIds, isChecking, moves, dateStr, difficulty]
  );


  // Derive what to display — easy recap shows all cards revealed
  const displayCards = viewingEasy ? easySavedCards : cards;
  const displayMatchedPairIds = viewingEasy
    ? new Set(easySavedCards.map((c) => c.pairId))
    : matchedPairIds;
  const displayMessage = viewingEasy
    ? `You finished Easy in ${easySavedMoves} ${easySavedMoves === 1 ? "move" : "moves"}! 🎉`
    : message;
  const displayDifficulty = viewingEasy ? "easy" : difficulty;
  const displayMoves = viewingEasy ? easySavedMoves : moves;
  const displayIsComplete = viewingEasy || isComplete;

  const isCardRevealed = (card: Card) =>
    displayMatchedPairIds.has(card.pairId) || (!viewingEasy && flippedIds.includes(card.id));

  // Grid layout: easy = 2 cols (2×2), medium = 3 cols (3×4)
  const isMediumGrid = displayDifficulty === "medium";

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4">
      {/* Header */}
      <h1 className="text-3xl font-bold text-purple-700 mt-3 mb-1">
        Photo Match
      </h1>
      <p className="text-gray-500 text-sm mb-2">
        {dateStr} · {displayDifficulty === "easy" ? "Easy" : "Harder"} · {displayMoves}{" "}
        {displayMoves === 1 ? "guess" : "guesses"}
      </p>

      {/* Message banner — fixed minimum height so the card grid never shifts */}
      <div
        className={`w-full flex items-center justify-center min-h-[64px] text-center px-4 rounded-xl mb-3 text-lg font-semibold transition-all duration-300 ${
          displayIsComplete
            ? "bg-green-100 text-green-700"
            : "bg-purple-50 text-purple-700"
        }`}
      >
        {displayMessage}
      </div>

      {/* Card grid — 2×2 for easy, 3×4 for harder */}
      <div
        className={`grid w-full ${isMediumGrid ? "grid-cols-3 gap-1.5" : "grid-cols-2 gap-3"}`}
        style={{ maxWidth: isMediumGrid ? 300 : 320 }}
      >
        {displayCards.map((card) => {
          const revealed = isCardRevealed(card);
          const matched = displayMatchedPairIds.has(card.pairId);

          return (
            <button
              key={card.id}
              onClick={() => !viewingEasy && handleCardTap(card)}
              disabled={viewingEasy}
              className={`relative aspect-square rounded-2xl overflow-hidden transition-transform duration-200 ${
                !viewingEasy ? "active:scale-95" : "cursor-default"
              } ${matched ? "ring-4 ring-green-400 ring-offset-2" : "ring-1 ring-purple-200"}`}
              style={{ perspective: 600 }}
              aria-label={revealed ? "Revealed card" : "Hidden card"}
            >
              <div
                className="absolute inset-0 transition-transform duration-500"
                style={{
                  transformStyle: "preserve-3d",
                  transform: revealed ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Card back */}
                <div
                  className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className={isMediumGrid ? "text-4xl" : "text-5xl"}>📸</span>
                </div>

                {/* Card front (image) */}
                <div
                  className="absolute inset-0 rounded-2xl overflow-hidden"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <Image
                    src={card.imageUrl}
                    alt="A grandkid photo"
                    fill
                    sizes={isMediumGrid ? "25vw" : "(max-width: 320px) 50vw, 160px"}
                    className="object-cover"
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Post-completion actions for easy */}
      {isComplete && difficulty === "easy" && !viewingEasy && (
        <div className="mt-5 text-center space-y-3">
          <p className="text-gray-600">
            You finished Easy in {moves} {moves === 1 ? "move" : "moves"} — wonderful!
          </p>
          <button
            onClick={startMedium}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
          >
            Try Harder Puzzle →
          </button>
        </div>
      )}

      {/* Post-completion message for harder */}
      {isComplete && difficulty === "medium" && !viewingEasy && (
        <div className="mt-5 text-center">
          <p className="text-gray-600">
            You finished Harder in {moves} {moves === 1 ? "move" : "moves"} — amazing!
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Come back tomorrow for a new puzzle! 🌻
          </p>
        </div>
      )}

      {/* Toggle link — same position whether in medium or viewing easy recap */}
      {difficulty === "medium" && easyComplete && (
        <button
          onClick={() => setViewingEasy((v) => !v)}
          className="mt-4 text-sm text-purple-500 underline hover:text-purple-700 transition-colors"
        >
          {viewingEasy ? "← Back to Harder" : "View completed Easy puzzle"}
        </button>
      )}

    </div>
  );
}
