/**
 * Elo Rating System Utilities for Hero Rank
 *
 * The Elo rating system is a method for calculating the relative skill levels
 * of players (or in our case, heroes) in zero-sum games. Originally devised
 * for chess, it works by:
 *
 * 1. Predicting the expected outcome based on rating difference
 * 2. Comparing actual result to expected result
 * 3. Adjusting ratings proportionally to the surprise of the outcome
 *
 * Key concepts:
 * - Initial rating: 1500 (standard starting point)
 * - K-factor: Determines how much a single game affects ratings
 *   - Higher K = more volatile ratings (used for new players)
 *   - Lower K = more stable ratings (used for established players)
 */

/**
 * Configuration for Elo calculations
 */
export interface EloConfig {
  /** Base K-factor for established heroes (default: 32) */
  kFactor: number;
  /** K-factor for provisional heroes with few games (default: 48) */
  provisionalKFactor: number;
  /** Number of games before a hero is no longer provisional (default: 10) */
  provisionalThreshold: number;
  /** Initial rating for new heroes (default: 1500) */
  initialRating: number;
  /** Number of games before isProvisional flag turns false (default: 20) */
  provisionalFlagThreshold: number;
}

/**
 * Default Elo configuration
 */
export const DEFAULT_ELO_CONFIG: EloConfig = {
  kFactor: 32,
  provisionalKFactor: 48,
  provisionalThreshold: 10,
  initialRating: 1500,
  provisionalFlagThreshold: 20,
};

/**
 * Calculates the expected score (probability of winning) for player A against player B.
 *
 * The formula is: E_A = 1 / (1 + 10^((R_B - R_A) / 400))
 *
 * This uses the logistic curve, where:
 * - A 400 point rating difference gives ~90% win probability to the higher-rated player
 * - Equal ratings give 50% win probability to each
 *
 * @param ratingA - Rating of player A
 * @param ratingB - Rating of player B
 * @returns Expected score for player A (between 0 and 1)
 *
 * @example
 * expectedScore(1500, 1500) // Returns 0.5 (equal chance)
 * expectedScore(1700, 1500) // Returns ~0.76 (A is favored)
 * expectedScore(1500, 1700) // Returns ~0.24 (B is favored)
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  const exponent = (ratingB - ratingA) / 400;
  return 1 / (1 + Math.pow(10, exponent));
}

/**
 * Result of an Elo rating calculation
 */
export interface EloResult {
  /** New rating for the winner */
  newWinnerRating: number;
  /** New rating for the loser */
  newLoserRating: number;
  /** Rating change for the winner (always positive) */
  winnerChange: number;
  /** Rating change for the loser (always negative) */
  loserChange: number;
}

/**
 * Calculates new Elo ratings after a match.
 *
 * The formula for rating change is: R'_A = R_A + K * (S_A - E_A)
 * Where:
 * - R_A is the current rating
 * - K is the K-factor
 * - S_A is the actual score (1 for win, 0 for loss)
 * - E_A is the expected score
 *
 * The K-factor determines rating volatility:
 * - We use a higher K-factor (48) for heroes with fewer than 10 games
 * - This allows new heroes to quickly find their "true" rating
 * - Established heroes use standard K-factor (32) for stability
 *
 * @param winnerRating - Current rating of the winner
 * @param loserRating - Current rating of the loser
 * @param winnerGames - Number of games the winner has played (for K-factor selection)
 * @param loserGames - Number of games the loser has played (for K-factor selection)
 * @param config - Optional Elo configuration overrides
 * @returns Object containing new ratings and rating changes
 *
 * @example
 * // Two equally-rated heroes, winner gains ~16 points
 * calculateNewRatings(1500, 1500, 5, 5)
 * // Returns { newWinnerRating: 1524, newLoserRating: 1476, ... }
 *
 * // Upset: lower-rated hero beats higher-rated
 * calculateNewRatings(1400, 1600, 10, 10)
 * // Winner gains more points due to the upset
 */
export function calculateNewRatings(
  winnerRating: number,
  loserRating: number,
  winnerGames: number,
  loserGames: number,
  config: Partial<EloConfig> = {}
): EloResult {
  const fullConfig: EloConfig = { ...DEFAULT_ELO_CONFIG, ...config };

  // Determine K-factors based on number of games played
  // Provisional players (fewer games) have higher K-factor for faster rating adjustment
  const winnerK = winnerGames < fullConfig.provisionalThreshold
    ? fullConfig.provisionalKFactor
    : fullConfig.kFactor;

  const loserK = loserGames < fullConfig.provisionalThreshold
    ? fullConfig.provisionalKFactor
    : fullConfig.kFactor;

  // Calculate expected scores
  const winnerExpected = expectedScore(winnerRating, loserRating);
  const loserExpected = expectedScore(loserRating, winnerRating);

  // Calculate rating changes
  // Winner: actual score is 1, so change = K * (1 - expected)
  // Loser: actual score is 0, so change = K * (0 - expected)
  const winnerChange = Math.round(winnerK * (1 - winnerExpected));
  const loserChange = Math.round(loserK * (0 - loserExpected));

  return {
    newWinnerRating: winnerRating + winnerChange,
    newLoserRating: loserRating + loserChange,
    winnerChange,
    loserChange,
  };
}

/**
 * Gets the appropriate K-factor for a hero based on their game count.
 *
 * @param games - Number of games the hero has played
 * @param config - Optional Elo configuration overrides
 * @returns The K-factor to use for this hero
 */
export function getKFactor(games: number, config: Partial<EloConfig> = {}): number {
  const fullConfig: EloConfig = { ...DEFAULT_ELO_CONFIG, ...config };
  return games < fullConfig.provisionalThreshold
    ? fullConfig.provisionalKFactor
    : fullConfig.kFactor;
}

/**
 * Determines if a hero should be considered provisional (rating not yet stable).
 *
 * @param games - Number of games the hero has played
 * @param config - Optional Elo configuration overrides
 * @returns True if the hero is still in provisional period
 */
export function isProvisional(games: number, config: Partial<EloConfig> = {}): boolean {
  const fullConfig: EloConfig = { ...DEFAULT_ELO_CONFIG, ...config };
  return games < fullConfig.provisionalFlagThreshold;
}
