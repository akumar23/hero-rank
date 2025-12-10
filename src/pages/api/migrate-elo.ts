/**
 * Migration Script: Populate Hero Ratings from Existing Votes
 *
 * This API route processes all existing votes chronologically and calculates
 * Elo ratings for each hero. The results are stored in the `heroRatings` collection.
 *
 * USAGE:
 * POST /api/migrate-elo
 *
 * OPTIONS (query params):
 * - dryRun=true : Preview changes without writing to Firestore
 * - force=true  : Re-run migration even if heroRatings already exist
 *
 * This script is IDEMPOTENT:
 * - It clears the heroRatings collection before writing new data
 * - Can be safely re-run to recalculate ratings from scratch
 *
 * IMPORTANT: This should be run as a one-time migration or when you need
 * to recalculate all ratings (e.g., after changing Elo parameters).
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore, serverTimestamp } from '../../utils/firebase';
import {
  calculateNewRatings,
  isProvisional,
} from '../../utils/elo';
import {
  HeroRatingState,
  createDefaultHeroRating,
  VoteDocument,
} from '../../types/heroRating';

const BATCH_SIZE = 500; // Firestore batch write limit

/**
 * Gets the Firestore database instance.
 * Throws an error if Firebase is not configured.
 */
function getDb() {
  if (!firestore) {
    throw new Error("Firebase Firestore is not configured. Check your environment variables.");
  }
  return firestore;
}

/**
 * Response type for the migration endpoint
 */
interface MigrationResponse {
  success: boolean;
  message: string;
  stats?: {
    totalVotes: number;
    uniqueHeroes: number;
    heroesProcessed: number;
    timeMs: number;
  };
  topHeroes?: Array<{
    heroId: number;
    rating: number;
    games: number;
    winRate: number;
  }>;
  error?: string;
}

/**
 * In-memory map of hero ratings during migration.
 * Key: heroId (as string for Map compatibility)
 * Value: HeroRatingState
 */
type RatingsMap = Map<number, HeroRatingState>;

/**
 * Gets or creates a hero rating in the ratings map.
 *
 * @param ratings - The ratings map
 * @param heroId - The hero ID to get/create
 * @returns The hero's rating state
 */
function getOrCreateRating(ratings: RatingsMap, heroId: number): HeroRatingState {
  let rating = ratings.get(heroId);
  if (!rating) {
    rating = createDefaultHeroRating(heroId);
    ratings.set(heroId, rating);
  }
  return rating;
}

/**
 * Processes a single vote and updates both heroes' ratings.
 *
 * @param ratings - The ratings map to update
 * @param winnerId - The hero ID that won
 * @param loserId - The hero ID that lost
 */
function processVote(ratings: RatingsMap, winnerId: number, loserId: number): void {
  const winner = getOrCreateRating(ratings, winnerId);
  const loser = getOrCreateRating(ratings, loserId);

  // Calculate new ratings
  const result = calculateNewRatings(
    winner.rating,
    loser.rating,
    winner.games,
    loser.games
  );

  // Update winner
  winner.rating = result.newWinnerRating;
  winner.games += 1;
  winner.wins += 1;
  winner.peakRating = Math.max(winner.peakRating, winner.rating);
  winner.lowestRating = Math.min(winner.lowestRating, winner.rating);
  winner.currentStreak = winner.currentStreak >= 0 ? winner.currentStreak + 1 : 1;

  // Update loser
  loser.rating = result.newLoserRating;
  loser.games += 1;
  loser.losses += 1;
  loser.peakRating = Math.max(loser.peakRating, loser.rating);
  loser.lowestRating = Math.min(loser.lowestRating, loser.rating);
  loser.currentStreak = loser.currentStreak <= 0 ? loser.currentStreak - 1 : -1;
}

/**
 * Fetches all votes from Firestore, sorted chronologically.
 *
 * @returns Array of vote documents with metadata
 */
async function fetchAllVotes(): Promise<Array<VoteDocument & { createTime?: Date }>> {
  const db = getDb();
  const votesSnapshot = await db.collection('votes').get();
  const votes: Array<VoteDocument & { createTime?: Date }> = [];

  votesSnapshot.forEach((doc) => {
    const data = doc.data() as VoteDocument;
    votes.push({
      ...data,
      // Firestore compat SDK doesn't expose createTime directly,
      // but we can try to get it from the document's metadata if available
      // For now, we'll use createdAt field if it exists
      createTime: data.createdAt?.toDate(),
    });
  });

  // Sort by creation time (oldest first) to process votes in chronological order
  // This is important for accurate Elo calculations
  votes.sort((a, b) => {
    const timeA = a.createTime?.getTime() ?? 0;
    const timeB = b.createTime?.getTime() ?? 0;
    return timeA - timeB;
  });

  return votes;
}

/**
 * Writes hero ratings to Firestore using batch writes for efficiency.
 *
 * @param ratings - The ratings map to write
 */
async function writeRatingsToFirestore(ratings: RatingsMap): Promise<void> {
  const db = getDb();
  // First, delete all existing heroRatings documents
  const existingDocs = await db.collection('heroRatings').get();
  if (!existingDocs.empty) {
    // Delete in batches
    let deleteBatch = db.batch();
    let deleteCount = 0;

    for (const doc of existingDocs.docs) {
      deleteBatch.delete(doc.ref);
      deleteCount++;

      if (deleteCount >= BATCH_SIZE) {
        await deleteBatch.commit();
        deleteBatch = db.batch();
        deleteCount = 0;
      }
    }

    if (deleteCount > 0) {
      await deleteBatch.commit();
    }
  }

  // Now write new ratings in batches
  const ratingsArray = Array.from(ratings.values());
  let batch = db.batch();
  let count = 0;

  for (const rating of ratingsArray) {
    const docRef = db.collection('heroRatings').doc(String(rating.heroId));
    const winRate = rating.games > 0 ? (rating.wins / rating.games) * 100 : 0;

    batch.set(docRef, {
      heroId: rating.heroId,
      rating: rating.rating,
      games: rating.games,
      wins: rating.wins,
      losses: rating.losses,
      isProvisional: isProvisional(rating.games),
      peakRating: rating.peakRating,
      lowestRating: rating.lowestRating,
      winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
      currentStreak: rating.currentStreak,
      lastUpdated: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    count++;

    // Commit batch when reaching the limit
    if (count >= BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }

  // Commit any remaining documents
  if (count > 0) {
    await batch.commit();
  }
}

/**
 * Main migration handler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MigrationResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.',
    });
  }

  const startTime = Date.now();
  const dryRun = req.query.dryRun === 'true';
  const force = req.query.force === 'true';

  try {
    const db = getDb();

    // Check if heroRatings already exist (unless force=true)
    if (!force) {
      const existingRatings = await db.collection('heroRatings').limit(1).get();
      if (!existingRatings.empty) {
        return res.status(400).json({
          success: false,
          message:
            'heroRatings collection already has data. Use ?force=true to re-run migration.',
        });
      }
    }

    // Fetch all votes
    console.log('Fetching votes from Firestore...');
    const votes = await fetchAllVotes();

    if (votes.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No votes found to migrate.',
        stats: {
          totalVotes: 0,
          uniqueHeroes: 0,
          heroesProcessed: 0,
          timeMs: Date.now() - startTime,
        },
      });
    }

    console.log(`Processing ${votes.length} votes...`);

    // Process all votes and build ratings map
    const ratings: RatingsMap = new Map();

    for (const vote of votes) {
      // Skip invalid votes
      if (
        typeof vote.votedFor !== 'number' ||
        typeof vote.votedAgainst !== 'number' ||
        vote.votedFor === vote.votedAgainst
      ) {
        console.warn('Skipping invalid vote:', vote);
        continue;
      }

      processVote(ratings, vote.votedFor, vote.votedAgainst);
    }

    // Write to Firestore (unless dry run)
    if (!dryRun) {
      console.log(`Writing ${ratings.size} hero ratings to Firestore...`);
      await writeRatingsToFirestore(ratings);
    }

    // Calculate statistics
    const ratingsArray = Array.from(ratings.values());
    const topHeroes = ratingsArray
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10)
      .map((r) => ({
        heroId: r.heroId,
        rating: r.rating,
        games: r.games,
        winRate: r.games > 0 ? Math.round((r.wins / r.games) * 100 * 100) / 100 : 0,
      }));

    const timeMs = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      message: dryRun
        ? `DRY RUN: Would have migrated ${votes.length} votes for ${ratings.size} heroes.`
        : `Successfully migrated ${votes.length} votes for ${ratings.size} heroes.`,
      stats: {
        totalVotes: votes.length,
        uniqueHeroes: ratings.size,
        heroesProcessed: ratings.size,
        timeMs,
      },
      topHeroes,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
