import type { GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import { turso } from "../utils/turso";
import { HeroRating } from "../types/heroRating";
import { useState } from "react";
import { StatsDashboard, DashboardStats } from "../components/StatsDashboard";
import {
  getConfidenceLevel,
  getConfidenceColorClass,
  getConfidenceDescription,
  wilsonScore,
  formatWilsonScore
} from "../utils/wilsonScore";

/**
 * Serializable hero rating data for SSR/ISR.
 * Timestamps are converted to ISO strings for JSON serialization.
 */
interface SerializedHeroRating {
  heroId: number;
  rating: number;
  games: number;
  wins: number;
  losses: number;
  isProvisional: boolean;
  peakRating: number;
  lowestRating: number;
  winRate: number;
  currentStreak: number;
  lastUpdated: string | null;
  createdAt: string | null;
  wilsonScore: number;
  heroName: string;
}

/**
 * Tier information based on Elo rating.
 */
interface TierInfo {
  name: string;
  color: string;
  icon: string;
  minRating: number;
}

/**
 * Get tier information based on Elo rating.
 * Tiers: Bronze (<1400), Silver (1400-1549), Gold (1550-1699), Platinum (1700-1849), Diamond (1850+)
 */
const getTierInfo = (rating: number): TierInfo => {
  if (rating >= 1850) {
    return {
      name: 'Diamond',
      color: 'text-purple-400 bg-purple-400/20',
      icon: '👑',
      minRating: 1850
    };
  }
  if (rating >= 1700) {
    return {
      name: 'Platinum',
      color: 'text-cyan-400 bg-cyan-400/20',
      icon: '💎',
      minRating: 1700
    };
  }
  if (rating >= 1550) {
    return {
      name: 'Gold',
      color: 'text-yellow-400 bg-yellow-400/20',
      icon: '🥇',
      minRating: 1550
    };
  }
  if (rating >= 1400) {
    return {
      name: 'Silver',
      color: 'text-gray-300 bg-gray-300/20',
      icon: '🥈',
      minRating: 1400
    };
  }
  return {
    name: 'Bronze',
    color: 'text-amber-600 bg-amber-600/20',
    icon: '🥉',
    minRating: 0
  };
};

/**
 * TierBadge component displays a hero's tier badge based on their Elo rating.
 */
const TierBadge: React.FC<{ rating: number }> = ({ rating }) => {
  const tier = getTierInfo(rating);
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${tier.color}`}>
      <span>{tier.icon}</span>
      <span>{tier.name}</span>
    </div>
  );
};

/**
 * Fetches all hero ratings from Turso, ordered by rating descending.
 * Returns empty array if there's an error.
 */
const getHeroRatings = async (): Promise<SerializedHeroRating[]> => {
  try {
    const result = await turso.execute({
      sql: "SELECT * FROM heroRatings ORDER BY rating DESC",
      args: []
    });

    const ratings: SerializedHeroRating[] = [];

    for (const row of result.rows) {
      const data: any = row;
      const wilsonScoreValue = wilsonScore(Number(data.wins), Number(data.games));
      ratings.push({
        heroId: Number(data.hero_id),
        rating: Number(data.rating),
        games: Number(data.games),
        wins: Number(data.wins),
        losses: Number(data.losses),
        isProvisional: Boolean(data.is_provisional),
        peakRating: Number(data.peak_rating),
        lowestRating: Number(data.lowest_rating),
        winRate: Number(data.win_rate),
        currentStreak: Number(data.current_streak),
        lastUpdated: data.last_updated || null,
        createdAt: data.created_at || null,
        wilsonScore: wilsonScoreValue,
        heroName: "", // Will be populated below
      });
    }

    // Fetch all hero names in parallel
    const heroNamePromises = ratings.map(async (rating) => {
      try {
        const res = await fetch(
          `https://www.superheroapi.com/api.php/2422583714549928/${rating.heroId}`
        );
        const data = await res.json();
        return { heroId: rating.heroId, name: data.name || `Hero #${rating.heroId}` };
      } catch (error) {
        console.error(`Error fetching hero name for ${rating.heroId}:`, error);
        return { heroId: rating.heroId, name: `Hero #${rating.heroId}` };
      }
    });

    const heroNames = await Promise.allSettled(heroNamePromises);

    // Populate hero names
    heroNames.forEach((result, index) => {
      if (result.status === 'fulfilled' && ratings[index]) {
        ratings[index]!.heroName = result.value.name;
      } else if (ratings[index]) {
        ratings[index]!.heroName = `Hero #${ratings[index]!.heroId}`;
      }
    });

    return ratings;
  } catch (error) {
    console.error("Error fetching hero ratings:", error);
    return [];
  }
};

/**
 * Individual hero listing card component.
 * Displays hero image, name, Elo rating, and statistics.
 */
const HeroListing: React.FC<{
  heroRating: SerializedHeroRating;
  rank: number;
}> = ({ heroRating, rank }) => {
  // Use the API proxy route to bypass Cloudflare's hotlinking protection
  const heroUrl = `/api/hero-image/${heroRating.heroId}`;
  const heroName = heroRating.heroName;

  // Format win rate to 1 decimal place
  const winRateFormatted = heroRating.winRate.toFixed(1);

  // Calculate confidence level
  const confidenceLevel = getConfidenceLevel(heroRating.games, heroRating.wins, heroRating.losses);
  const confidenceColor = getConfidenceColorClass(confidenceLevel);
  const confidenceDesc = getConfidenceDescription(confidenceLevel);

  // Determine streak display
  const getStreakDisplay = () => {
    if (heroRating.currentStreak > 0) {
      return (
        <span className="text-green-400">
          W{heroRating.currentStreak}
        </span>
      );
    } else if (heroRating.currentStreak < 0) {
      return (
        <span className="text-red-400">
          L{Math.abs(heroRating.currentStreak)}
        </span>
      );
    }
    return <span className="text-gray-400">-</span>;
  };

  // Determine rank badge color based on position
  const getRankBadgeClass = () => {
    switch (rank) {
      case 1:
        return "bg-yellow-500 text-black"; // Gold
      case 2:
        return "bg-gray-300 text-black"; // Silver
      case 3:
        return "bg-amber-600 text-white"; // Bronze
      default:
        return "bg-gray-700 text-white";
    }
  };

  // Get rank-specific border styling for top 3 heroes
  const getRankBorderClass = () => {
    switch (rank) {
      case 1:
        return "ring-2 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)] animate-gold-pulse";
      case 2:
        return "ring-2 ring-gray-300 shadow-[0_0_15px_rgba(209,213,219,0.3)]";
      case 3:
        return "ring-2 ring-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.3)]";
      default:
        return "";
    }
  };

  return (
    <div className={`relative border border-gray-700 rounded-lg p-4 bg-gray-800/50 hover:bg-gray-800/80 transition-colors ${getRankBorderClass()}`}>
      {/* Rank Badge */}
      <div
        className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getRankBadgeClass()}`}
      >
        {rank}
      </div>

      {/* Hero Image */}
      <div className="flex justify-center mb-3">
        <Image
          src={heroUrl}
          alt={heroName}
          width={96}
          height={128}
          className="object-cover rounded shadow-lg"
        />
      </div>

      {/* Hero Name */}
      <div className="text-center mb-2">
        <h3 className="font-bold text-lg truncate" title={heroName}>
          {heroName}
        </h3>
      </div>

      {/* Tier Badge */}
      <div className="flex justify-center mb-3">
        <TierBadge rating={heroRating.rating} />
      </div>

      {/* Elo Rating - Prominent Display */}
      <div className="text-center mb-3">
        <span className="text-3xl font-bold text-blue-400">
          {heroRating.rating}
        </span>
        {heroRating.isProvisional && (
          <span
            className="ml-1 text-xs bg-yellow-600 text-white px-1.5 py-0.5 rounded"
            title="Provisional rating - fewer than 20 games played"
          >
            ?
          </span>
        )}
      </div>

      {/* Confidence Level Badge */}
      <div className="text-center mb-3">
        <span
          className={`text-xs font-semibold px-2 py-1 rounded ${confidenceColor} bg-gray-900/50`}
          title={confidenceDesc}
        >
          {confidenceLevel} Confidence
        </span>
      </div>

      {/* Wilson Score Display */}
      <div className="text-center mb-3">
        <div className="text-gray-400 text-xs uppercase mb-1" title="Statistical confidence-adjusted win rate that accounts for sample size">
          Wilson Score
        </div>
        <div className="relative w-full bg-gray-700 rounded-full h-2 mb-1">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${heroRating.wilsonScore * 100}%` }}
          />
        </div>
        <div className="text-sm font-medium text-blue-300">
          {formatWilsonScore(heroRating.wilsonScore)}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        {/* Win/Loss Record */}
        <div className="text-center">
          <div className="text-gray-400 text-xs uppercase">Record</div>
          <div>
            <span className="text-green-400">{heroRating.wins}</span>
            <span className="text-gray-500"> - </span>
            <span className="text-red-400">{heroRating.losses}</span>
          </div>
        </div>

        {/* Win Rate */}
        <div className="text-center">
          <div className="text-gray-400 text-xs uppercase">Win %</div>
          <div
            className={
              heroRating.winRate >= 50 ? "text-green-400" : "text-red-400"
            }
          >
            {winRateFormatted}%
          </div>
        </div>

        {/* Games Played */}
        <div className="text-center">
          <div className="text-gray-400 text-xs uppercase">Games</div>
          <div className="text-white">{heroRating.games}</div>
        </div>

        {/* Current Streak */}
        <div className="text-center">
          <div className="text-gray-400 text-xs uppercase">Streak</div>
          <div>{getStreakDisplay()}</div>
        </div>
      </div>
    </div>
  );
};

type SortOption = 'rating' | 'winRate' | 'games' | 'wilsonScore';

/**
 * Results page component.
 * Displays all heroes ranked by Elo rating in a responsive grid.
 */
const Results: React.FC<{
  heroRatings: SerializedHeroRating[];
  stats: DashboardStats;
}> = ({ heroRatings, stats }) => {
  const [showProvisional, setShowProvisional] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('rating');

  // Filter heroes based on provisional status
  const filteredHeroes = showProvisional
    ? heroRatings
    : heroRatings.filter(hero => !hero.isProvisional);

  // Sort heroes based on selected option
  const sortedHeroes = [...filteredHeroes].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'winRate':
        return b.winRate - a.winRate;
      case 'games':
        return b.games - a.games;
      case 'wilsonScore':
        return b.wilsonScore - a.wilsonScore;
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <Head>
          <title>Hero Rankings - Elo Ratings</title>
        </Head>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Hero Rankings</h1>
          <p className="text-gray-400">
            Ranked by Elo rating system based on {heroRatings.length} heroes
          </p>
        </div>

        {/* Statistics Dashboard */}
        <StatsDashboard stats={stats} />

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-800 p-4 rounded-lg">
          {/* Sort Options */}
          <div className="flex items-center gap-3">
            <label className="text-gray-400 text-sm font-medium">Sort by:</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSortBy('rating')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  sortBy === 'rating'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Rating
              </button>
              <button
                onClick={() => setSortBy('wilsonScore')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  sortBy === 'wilsonScore'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Sort by confidence-adjusted win rate (accounts for sample size)"
              >
                Wilson Score
              </button>
              <button
                onClick={() => setSortBy('winRate')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  sortBy === 'winRate'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Win Rate
              </button>
              <button
                onClick={() => setSortBy('games')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  sortBy === 'games'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Games Played
              </button>
            </div>
          </div>

          {/* Provisional Filter */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showProvisional}
                onChange={(e) => setShowProvisional(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
              />
              <span className="text-sm text-gray-300">Show provisional heroes</span>
            </label>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6 space-y-4">
          {/* Confidence Legend */}
          <div className="flex justify-center gap-4 text-sm text-gray-400 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="bg-yellow-600 text-white px-1.5 py-0.5 rounded text-xs">
                ?
              </span>
              <span>Provisional (less than 20 games)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-400">●</span>
              <span>High Confidence (30+ games)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">●</span>
              <span>Medium Confidence (10-29 games)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-red-400">●</span>
              <span>Low Confidence (less than 10 games)</span>
            </div>
          </div>

          {/* Wilson Score Explanation */}
          <div className="bg-gray-800/50 rounded-lg p-4 max-w-4xl mx-auto">
            <h3 className="text-sm font-semibold text-blue-300 mb-2">What is Wilson Score?</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              The Wilson Score is a statistical method that provides a confidence-adjusted win rate. Unlike simple win percentages, it accounts for sample size uncertainty.
              For example, a hero with 5-0 record (100% win rate) will have a lower Wilson Score than a hero with 95-5 record (95% win rate), because we have much more confidence in the latter.
              This prevents heroes with lucky early wins from dominating the rankings. It is the same algorithm used by Reddit for comment ranking.
            </p>
          </div>

          {/* Tier System Legend */}
          <div className="bg-gray-800/50 rounded-lg p-4 max-w-4xl mx-auto">
            <h3 className="text-sm font-semibold text-blue-300 mb-3">Ranking Tiers</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <div className="flex flex-col items-center gap-1">
                <TierBadge rating={1900} />
                <span className="text-xs text-gray-400">1850+</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <TierBadge rating={1750} />
                <span className="text-xs text-gray-400">1700-1849</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <TierBadge rating={1600} />
                <span className="text-xs text-gray-400">1550-1699</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <TierBadge rating={1450} />
                <span className="text-xs text-gray-400">1400-1549</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <TierBadge rating={1300} />
                <span className="text-xs text-gray-400">&lt;1400</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        {sortedHeroes.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-xl">
              {heroRatings.length === 0
                ? 'No heroes have been rated yet.'
                : 'No heroes match the current filters.'}
            </p>
            <p className="mt-2">
              {heroRatings.length === 0
                ? 'Start voting to see rankings appear here!'
                : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {sortedHeroes.map((heroRating, index) => (
              <HeroListing
                heroRating={heroRating}
                rank={index + 1}
                key={heroRating.heroId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;

/**
 * Calculates dashboard statistics from hero ratings.
 */
const calculateStats = async (
  heroRatings: SerializedHeroRating[]
): Promise<DashboardStats> => {
  // Total votes calculation - sum of all games divided by 2 (since each vote involves 2 heroes)
  const totalVotes = Math.floor(
    heroRatings.reduce((sum, hero) => sum + hero.games, 0) / 2
  );

  // Find highest rated hero
  const highestRated = heroRatings.length > 0 ? heroRatings[0] : null;

  // Find most games played hero
  const mostGames = heroRatings.reduce<SerializedHeroRating | null>(
    (max, hero) => (!max || hero.games > max.games ? hero : max),
    null
  );

  // Calculate average rating
  const averageRating =
    heroRatings.length > 0
      ? heroRatings.reduce((sum, hero) => sum + hero.rating, 0) / heroRatings.length
      : 1500;

  // Fetch hero names for top heroes in parallel when they're different
  let highestRatedHero = null;
  let mostGamesHero = null;

  // Determine which heroes need to be fetched
  const isSameHero = mostGames && mostGames.heroId === highestRated?.heroId;

  if (highestRated && mostGames && !isSameHero) {
    // Fetch both heroes in parallel
    const [highestRatedResult, mostGamesResult] = await Promise.allSettled([
      fetch(`https://www.superheroapi.com/api.php/2422583714549928/${highestRated.heroId}`)
        .then(res => res.json()),
      fetch(`https://www.superheroapi.com/api.php/2422583714549928/${mostGames.heroId}`)
        .then(res => res.json())
    ]);

    // Process highest rated hero
    if (highestRatedResult.status === 'fulfilled') {
      highestRatedHero = {
        name: highestRatedResult.value.name || `Hero #${highestRated.heroId}`,
        rating: highestRated.rating,
        heroId: highestRated.heroId,
      };
    } else {
      console.error("Error fetching highest rated hero name:", highestRatedResult.reason);
      highestRatedHero = {
        name: `Hero #${highestRated.heroId}`,
        rating: highestRated.rating,
        heroId: highestRated.heroId,
      };
    }

    // Process most games hero
    if (mostGamesResult.status === 'fulfilled') {
      mostGamesHero = {
        name: mostGamesResult.value.name || `Hero #${mostGames.heroId}`,
        games: mostGames.games,
        heroId: mostGames.heroId,
      };
    } else {
      console.error("Error fetching most games hero name:", mostGamesResult.reason);
      mostGamesHero = {
        name: `Hero #${mostGames.heroId}`,
        games: mostGames.games,
        heroId: mostGames.heroId,
      };
    }
  } else if (highestRated) {
    // Fetch only one hero (either they're the same or mostGames doesn't exist)
    try {
      const res = await fetch(
        `https://www.superheroapi.com/api.php/2422583714549928/${highestRated.heroId}`
      );
      const data = await res.json();
      const heroName = data.name || `Hero #${highestRated.heroId}`;

      highestRatedHero = {
        name: heroName,
        rating: highestRated.rating,
        heroId: highestRated.heroId,
      };

      // Reuse the same name if they're the same hero
      if (mostGames && isSameHero) {
        mostGamesHero = {
          name: heroName,
          games: mostGames.games,
          heroId: mostGames.heroId,
        };
      }
    } catch (error) {
      console.error("Error fetching highest rated hero name:", error);
      highestRatedHero = {
        name: `Hero #${highestRated.heroId}`,
        rating: highestRated.rating,
        heroId: highestRated.heroId,
      };

      if (mostGames && isSameHero) {
        mostGamesHero = {
          name: `Hero #${mostGames.heroId}`,
          games: mostGames.games,
          heroId: mostGames.heroId,
        };
      }
    }
  }

  return {
    totalVotes,
    totalHeroes: heroRatings.length,
    highestRatedHero,
    mostGamesHero,
    averageRating,
  };
};

/**
 * Fetch hero ratings at build time with ISR revalidation.
 * Revalidates every 60 seconds to pick up new votes.
 */
export const getStaticProps: GetStaticProps = async () => {
  const heroRatings = await getHeroRatings();
  const stats = await calculateStats(heroRatings);

  return {
    props: {
      heroRatings,
      stats,
    },
    revalidate: 60, // Revalidate every 60 seconds
  };
};