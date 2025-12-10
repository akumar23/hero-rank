// src/server/router/index.ts
import * as trpc from "@trpc/server";
import { z } from "zod";
import { turso } from "../../utils/turso";
import { calculateNewRatings, isProvisional } from "../../utils/elo";
import { HeroRating, createDefaultHeroRating, HeroRatingState } from "../../types/heroRating";

/**
 * Fetches a hero's rating from Turso, or returns default values if not found.
 * @param heroId - The SuperHero API ID
 * @returns The hero's current rating state
 */
async function getHeroRating(heroId: number): Promise<HeroRatingState> {
  try {
    // Fetch hero rating from Turso
    const result = await turso.execute({
      sql: "SELECT * FROM heroRatings WHERE hero_id = ?",
      args: [heroId]
    });
    
    if (result.rows && result.rows.length > 0) {
      const data: any = result.rows[0];
      return {
        heroId: data.hero_id,
        rating: data.rating,
        games: data.games,
        wins: data.wins,
        losses: data.losses,
        peakRating: data.peak_rating,
        lowestRating: data.lowest_rating,
        currentStreak: data.current_streak,
      };
    }
    
    // Return default values for new hero
    return createDefaultHeroRating(heroId);
  } catch (error) {
    console.error("Error fetching hero rating:", error);
    return createDefaultHeroRating(heroId);
  }
}

/**
 * Result of updating hero ratings.
 */
interface RatingUpdateResult {
  winnerRatingChange: number;
  loserRatingChange: number;
  winnerNewRating: number;
  loserNewRating: number;
}

/**
 * Updates hero ratings in Turso after a vote is cast.
 *
 * @param winnerId - The hero ID that won the vote
 * @param loserId - The hero ID that lost the vote
 * @returns Rating changes for both heroes
 */
async function updateHeroRatings(winnerId: number, loserId: number): Promise<RatingUpdateResult> {
  // Fetch current ratings for both heroes
  const [winnerRating, loserRating] = await Promise.all([
    getHeroRating(winnerId),
    getHeroRating(loserId),
  ]);

  // Calculate new Elo ratings
  const eloResult = calculateNewRatings(
    winnerRating.rating,
    loserRating.rating,
    winnerRating.games,
    loserRating.games
  );

  // Calculate new stats for winner
  const winnerNewGames = winnerRating.games + 1;
  const winnerNewWins = winnerRating.wins + 1;
  const winnerNewStreak = winnerRating.currentStreak >= 0
    ? winnerRating.currentStreak + 1
    : 1; // Reset streak on win after losses
  const winnerNewPeak = Math.max(winnerRating.peakRating, eloResult.newWinnerRating);
  const winnerNewLowest = Math.min(winnerRating.lowestRating, eloResult.newWinnerRating);
  const winnerWinRate = (winnerNewWins / winnerNewGames) * 100;

  // Calculate new stats for loser
  const loserNewGames = loserRating.games + 1;
  const loserNewLosses = loserRating.losses + 1;
  const loserNewStreak = loserRating.currentStreak <= 0
    ? loserRating.currentStreak - 1
    : -1; // Reset streak on loss after wins
  const loserNewPeak = Math.max(loserRating.peakRating, eloResult.newLoserRating);
  const loserNewLowest = Math.min(loserRating.lowestRating, eloResult.newLoserRating);
  const loserWinRate = (loserRating.wins / loserNewGames) * 100;

  // Update winner in Turso
  await turso.execute({
    sql: `
      INSERT OR REPLACE INTO heroRatings 
      (hero_id, rating, games, wins, losses, is_provisional, peak_rating, lowest_rating, win_rate, current_streak, last_updated, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
    args: [
      winnerId,
      eloResult.newWinnerRating,
      winnerNewGames,
      winnerNewWins,
      loserNewLosses,
      isProvisional(winnerNewGames) ? 1 : 0,
      winnerNewPeak,
      winnerNewLowest,
      winnerWinRate,
      winnerNewStreak
    ]
  });

  // Update loser in Turso
  await turso.execute({
    sql: `
      INSERT OR REPLACE INTO heroRatings 
      (hero_id, rating, games, wins, losses, is_provisional, peak_rating, lowest_rating, win_rate, current_streak, last_updated, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
    args: [
      loserId,
      eloResult.newLoserRating,
      loserNewGames,
      loserRating.wins,
      loserNewLosses,
      isProvisional(loserNewGames) ? 1 : 0,
      loserNewPeak,
      loserNewLowest,
      loserWinRate,
      loserNewStreak
    ]
  });

  // Return the rating changes
  return {
    winnerRatingChange: eloResult.winnerChange,
    loserRatingChange: eloResult.loserChange,
    winnerNewRating: eloResult.newWinnerRating,
    loserNewRating: eloResult.newLoserRating,
  };
}

export const appRouter = trpc.router().query("get-hero-by-id", {
  input: z.object({ id: z.number() }),
  async resolve({ input }) {
    const res = await fetch(
      `https://www.superheroapi.com/api.php/2422583714549928/${input.id}`
    );
    return res.json();
  },
}).mutation("cast-vote", {
  input: z.object({
    votedFor: z.number(),
    votedAgainst: z.number(),
  }),
  async resolve({ input }) {
    try {
      // Record the vote in the votes table
      await turso.execute({
        sql: "INSERT INTO votes (voted_for, voted_against, created_at) VALUES (?, ?, datetime('now'))",
        args: [input.votedFor, input.votedAgainst]
      });

      // Update Elo ratings for both heroes and get rating changes
      const ratingUpdate = await updateHeroRatings(input.votedFor, input.votedAgainst);

      return {
        success: true,
        winnerRatingChange: ratingUpdate.winnerRatingChange,
        loserRatingChange: ratingUpdate.loserRatingChange,
        winnerNewRating: ratingUpdate.winnerNewRating,
        loserNewRating: ratingUpdate.loserNewRating,
      };
    } catch (error: unknown) {
      console.error("Error casting vote:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      return { success: false, error: errorMessage };
    }
  },
});

// export type definition of API
export type AppRouter = typeof appRouter;
