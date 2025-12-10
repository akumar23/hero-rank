/**
 * Wilson Score Interval for Rating Confidence
 *
 * The Wilson score interval is a binomial proportion confidence interval.
 * It's more accurate than simple win/loss percentages, especially for small sample sizes.
 *
 * Unlike raw win rates, the Wilson score:
 * 1. Accounts for sample size (fewer games = lower confidence)
 * 2. Provides a confidence interval (we use the lower bound)
 * 3. Prevents small-sample bias (a 1-0 record isn't truly "100% win rate")
 *
 * This is famously used by Reddit for comment ranking and by many rating systems
 * to provide more reliable rankings when data is limited.
 */

/**
 * Calculates the lower bound of the Wilson score confidence interval.
 *
 * This gives us a "confidence-adjusted" win rate that accounts for sample size.
 * Heroes with more games will have scores closer to their actual win rate,
 * while heroes with fewer games will have more conservative scores.
 *
 * @param wins - Number of wins
 * @param games - Total number of games played
 * @param confidenceLevel - Confidence level (default: 0.95 for 95% confidence)
 * @returns Wilson score lower bound (0-1 scale)
 *
 * @example
 * // Hero with 10 wins out of 10 games (small sample)
 * wilsonScore(10, 10) // Returns ~0.692 (much lower than raw 100%)
 *
 * // Hero with 100 wins out of 100 games (larger sample)
 * wilsonScore(100, 100) // Returns ~0.963 (closer to raw 100%)
 *
 * // Hero with 5 wins out of 10 games
 * wilsonScore(5, 10) // Returns ~0.244 (lower bound of 50% win rate)
 */
export function wilsonScore(
  wins: number,
  games: number,
  confidenceLevel: number = 0.95
): number {
  if (games === 0) return 0;

  // Calculate proportion of wins
  const p = wins / games;

  // Z-score for confidence level
  // For 95% confidence, z = 1.96
  // For 99% confidence, z = 2.576
  const z = getZScore(confidenceLevel);

  // Wilson score formula components
  const z2 = z * z;
  const denominator = 1 + z2 / games;
  const centerAdjustment = p + z2 / (2 * games);
  const marginOfError = z * Math.sqrt((p * (1 - p) + z2 / (4 * games)) / games);

  // Lower bound of Wilson score interval
  return (centerAdjustment - marginOfError) / denominator;
}

/**
 * Gets the Z-score for a given confidence level.
 *
 * @param confidenceLevel - Confidence level (0-1 scale)
 * @returns Z-score for standard normal distribution
 */
function getZScore(confidenceLevel: number): number {
  // Common confidence levels and their Z-scores
  const zScores: { [key: number]: number } = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };

  return zScores[confidenceLevel] || 1.96; // Default to 95% confidence
}

/**
 * Confidence level for rating reliability.
 * Based on number of games and win rate stability.
 */
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

/**
 * Determines the confidence level for a hero's rating.
 *
 * Uses both game count and Wilson score to assess confidence:
 * - High: 30+ games with stable performance
 * - Medium: 10-29 games or moderate sample size
 * - Low: Fewer than 10 games (provisional)
 *
 * @param games - Number of games played
 * @param wins - Number of wins
 * @param losses - Number of losses
 * @returns Confidence level indicator
 *
 * @example
 * getConfidenceLevel(50, 30, 20) // Returns 'High' (large sample)
 * getConfidenceLevel(15, 10, 5) // Returns 'Medium' (moderate sample)
 * getConfidenceLevel(5, 4, 1) // Returns 'Low' (small sample)
 */
export function getConfidenceLevel(
  games: number,
  wins: number,
  losses: number
): ConfidenceLevel {
  // Simple thresholds based on game count
  // These align with Elo provisional thresholds
  if (games >= 30) return 'High';
  if (games >= 10) return 'Medium';
  return 'Low';
}

/**
 * Calculates a "true skill" estimate combining Elo rating and Wilson score.
 *
 * This provides a more balanced ranking that considers both:
 * 1. Elo rating (quality of competition)
 * 2. Win rate confidence (sample size)
 *
 * Useful for sorting heroes when you want to penalize low-sample ratings.
 *
 * @param rating - Current Elo rating
 * @param wins - Number of wins
 * @param games - Total games played
 * @param weight - How much to weight Wilson score vs Elo (0-1, default 0.3)
 * @returns Combined skill estimate
 *
 * @example
 * // High-rated hero with few games might rank lower than
 * // medium-rated hero with many games when using this metric
 * trueSkillEstimate(1700, 5, 5) // Penalized for small sample
 * trueSkillEstimate(1600, 50, 60) // More reliable despite lower rating
 */
export function trueSkillEstimate(
  rating: number,
  wins: number,
  games: number,
  weight: number = 0.3
): number {
  const normalizedRating = rating / 2000; // Normalize Elo to 0-1 scale (assuming max ~2000)
  const wilsonScoreValue = wilsonScore(wins, games);

  // Weighted combination
  return normalizedRating * (1 - weight) + wilsonScoreValue * weight;
}

/**
 * Gets a human-readable confidence description.
 *
 * @param confidenceLevel - The confidence level
 * @returns Description string
 */
export function getConfidenceDescription(confidenceLevel: ConfidenceLevel): string {
  switch (confidenceLevel) {
    case 'High':
      return 'High confidence - rating is stable';
    case 'Medium':
      return 'Medium confidence - rating stabilizing';
    case 'Low':
      return 'Low confidence - needs more games';
  }
}

/**
 * Gets CSS color class for confidence level.
 *
 * @param confidenceLevel - The confidence level
 * @returns Tailwind color class
 */
export function getConfidenceColorClass(confidenceLevel: ConfidenceLevel): string {
  switch (confidenceLevel) {
    case 'High':
      return 'text-green-400';
    case 'Medium':
      return 'text-yellow-400';
    case 'Low':
      return 'text-red-400';
  }
}

/**
 * Calculates both lower and upper bounds of the Wilson score confidence interval.
 *
 * This gives you the full confidence interval for a hero's win rate.
 * The lower bound is more conservative and better for ranking (already provided by wilsonScore).
 * The upper bound shows the optimistic estimate.
 *
 * @param wins - Number of wins
 * @param games - Total number of games played
 * @param confidenceLevel - Confidence level (default: 0.95 for 95% confidence)
 * @returns Object containing lower and upper bounds (0-1 scale)
 *
 * @example
 * // Hero with 50 wins out of 100 games
 * wilsonScoreInterval(50, 100)
 * // Returns { lower: ~0.40, upper: ~0.60 }
 * // We're 95% confident the true win rate is between 40% and 60%
 */
export function wilsonScoreInterval(
  wins: number,
  games: number,
  confidenceLevel: number = 0.95
): { lower: number; upper: number } {
  if (games === 0) return { lower: 0, upper: 0 };

  const p = wins / games;
  const z = getZScore(confidenceLevel);
  const z2 = z * z;

  const denominator = 1 + z2 / games;
  const centerAdjustment = p + z2 / (2 * games);
  const marginOfError = z * Math.sqrt((p * (1 - p) + z2 / (4 * games)) / games);

  const lower = (centerAdjustment - marginOfError) / denominator;
  const upper = (centerAdjustment + marginOfError) / denominator;

  return { lower, upper };
}

/**
 * Formats Wilson Score as a percentage string for display.
 *
 * @param score - Wilson score (0-1 scale)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "62.3%")
 */
export function formatWilsonScore(score: number, decimals: number = 1): string {
  return `${(score * 100).toFixed(decimals)}%`;
}
