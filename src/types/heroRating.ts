/**
 * Hero Rating Types for Elo Rating System
 *
 * These types define the schema for storing hero ratings in Firestore.
 * The HeroRating interface represents the state of a hero's rating at any point in time.
 */

import firebase from 'firebase/compat/app';

/**
 * Firestore schema for hero ratings.
 *
 * Each document in the `heroRatings` collection follows this structure.
 * The document ID should be the heroId (as a string).
 */
export interface HeroRating {
  /** The SuperHero API ID for this hero */
  heroId: number;

  /**
   * Current Elo rating.
   * - Starts at 1500 (standard initial rating)
   * - Increases when the hero wins, decreases when they lose
   * - The magnitude of change depends on the opponent's rating
   */
  rating: number;

  /**
   * Total number of games (matchups) this hero has participated in.
   * games = wins + losses
   */
  games: number;

  /** Number of matchups this hero has won */
  wins: number;

  /** Number of matchups this hero has lost */
  losses: number;

  /**
   * Whether this hero's rating is still provisional.
   * - True if games < 20
   * - Provisional ratings are less reliable and subject to larger swings
   * - Can be used to indicate rating confidence in the UI
   */
  isProvisional: boolean;

  /**
   * The highest rating this hero has ever achieved.
   * Useful for showing "peak performance" statistics.
   */
  peakRating: number;

  /**
   * The lowest rating this hero has ever had.
   * Useful for showing rating range/volatility.
   */
  lowestRating: number;

  /**
   * Timestamp of when this rating was last updated.
   * Used for sorting and debugging.
   */
  lastUpdated: firebase.firestore.Timestamp;

  /**
   * Timestamp of when this hero first received a rating.
   * Used for historical analysis.
   */
  createdAt: firebase.firestore.Timestamp;

  /**
   * Win rate as a percentage (0-100).
   * Calculated as (wins / games) * 100.
   * Stored for efficient querying/sorting.
   */
  winRate: number;

  /**
   * Current win/loss streak.
   * Positive number = win streak, negative = loss streak.
   * e.g., 3 means 3 consecutive wins, -2 means 2 consecutive losses.
   */
  currentStreak: number;
}

/**
 * Input type for creating a new hero rating (without auto-generated fields).
 */
export interface CreateHeroRatingInput {
  heroId: number;
  rating?: number;
  games?: number;
  wins?: number;
  losses?: number;
}

/**
 * Partial update type for modifying existing ratings.
 */
export type UpdateHeroRatingInput = Partial<Omit<HeroRating, 'heroId' | 'createdAt'>>;

/**
 * Vote document structure (existing schema from votes collection).
 * Each vote represents one matchup between two heroes.
 */
export interface VoteDocument {
  /** The hero ID that won this matchup */
  votedFor: number;

  /** The hero ID that lost this matchup */
  votedAgainst: number;

  /**
   * Timestamp when this vote was cast.
   * Note: This may not exist on older documents.
   */
  createdAt?: firebase.firestore.Timestamp;
}

/**
 * Extended vote document with Firestore document metadata.
 * Used during migration to access document creation time.
 */
export interface VoteDocumentWithMeta extends VoteDocument {
  /** Firestore document ID */
  id: string;

  /**
   * Document creation time from Firestore metadata.
   * Available via DocumentSnapshot.createTime
   */
  createTime?: firebase.firestore.Timestamp;
}

/**
 * In-memory representation of hero rating during migration/calculation.
 * This is used before writing to Firestore.
 */
export interface HeroRatingState {
  heroId: number;
  heroName?: string | null;
  rating: number;
  games: number;
  wins: number;
  losses: number;
  peakRating: number;
  lowestRating: number;
  currentStreak: number;
}

/**
 * Default values for a new hero rating.
 */
export const DEFAULT_HERO_RATING: Omit<HeroRatingState, 'heroId'> = {
  rating: 1500,
  games: 0,
  wins: 0,
  losses: 0,
  peakRating: 1500,
  lowestRating: 1500,
  currentStreak: 0,
};

/**
 * Creates a new hero rating state with default values.
 *
 * @param heroId - The SuperHero API ID for this hero
 * @returns A new HeroRatingState with default values
 */
export function createDefaultHeroRating(heroId: number): HeroRatingState {
  return {
    heroId,
    ...DEFAULT_HERO_RATING,
  };
}
