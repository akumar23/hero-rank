import type { GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { turso } from "../utils/turso";
import { useState, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  wilsonScore,
  formatWilsonScore
} from "../utils/wilsonScore";

interface SerializedHeroRating {
  heroId: number;
  rating: number;
  games: number;
  wins: number;
  losses: number;
  isProvisional: boolean;
  winRate: number;
  currentStreak: number;
  wilsonScore: number;
  heroName: string;
}

interface DashboardStats {
  totalVotes: number;
  totalHeroes: number;
  highestRatedHero: { name: string; rating: number; heroId: number } | null;
  averageRating: number;
}

type TierName = "DIAMOND" | "PLATINUM" | "GOLD" | "SILVER" | "BRONZE";

const getTier = (rating: number): { name: TierName; min: number } => {
  if (rating >= 1850) return { name: "DIAMOND", min: 1850 };
  if (rating >= 1700) return { name: "PLATINUM", min: 1700 };
  if (rating >= 1550) return { name: "GOLD", min: 1550 };
  if (rating >= 1400) return { name: "SILVER", min: 1400 };
  return { name: "BRONZE", min: 0 };
};

const getTierClass = (tier: TierName): string => {
  switch (tier) {
    case "DIAMOND": return "tier-diamond";
    case "PLATINUM": return "tier-platinum";
    case "GOLD": return "tier-gold";
    case "SILVER": return "tier-silver";
    case "BRONZE": return "tier-bronze";
  }
};

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
        winRate: Number(data.win_rate),
        currentStreak: Number(data.current_streak),
        wilsonScore: wilsonScoreValue,
        heroName: data.hero_name || `Hero #${data.hero_id}`,
      });
    }

    return ratings;
  } catch (error) {
    console.error("Error fetching hero ratings:", error);
    return [];
  }
};

const RankingRow: React.FC<{
  hero: SerializedHeroRating;
  rank: number;
}> = ({ hero, rank }) => {
  const heroUrl = `/api/hero-image/${hero.heroId}`;
  const tier = getTier(hero.rating);
  const tierClass = getTierClass(tier.name);

  const getRankStyle = () => {
    if (rank === 1) return "bg-champion text-ink font-bold";
    if (rank === 2) return "bg-silver text-paper font-bold";
    if (rank === 3) return "bg-bronze text-paper font-bold";
    return "bg-paper text-charcoal";
  };

  const getRowBorder = () => {
    if (rank === 1) return "border-l-4 border-l-champion bg-champion/5";
    if (rank === 2) return "border-l-4 border-l-silver bg-silver/5";
    if (rank === 3) return "border-l-4 border-l-bronze bg-bronze/5";
    return "";
  };

  const streakDisplay = hero.currentStreak > 0
    ? <span className="text-green-400 font-mono">W{hero.currentStreak}</span>
    : hero.currentStreak < 0
    ? <span className="text-signal font-mono">L{Math.abs(hero.currentStreak)}</span>
    : <span className="text-smoke font-mono">-</span>;

  // Rating bar width (normalized between 1200-2000 range)
  const ratingPercent = Math.min(100, Math.max(0, ((hero.rating - 1200) / 800) * 100));

  return (
    <div className={`border-b-2 border-ink hover:bg-concrete/50 transition-colors ${getRowBorder()}`}>
      <div className="flex items-center gap-2 sm:gap-3 py-2 px-2 sm:px-3">
        {/* Rank */}
        <div className={`w-10 sm:w-12 h-8 flex items-center justify-center border-2 border-ink font-mono text-sm ${getRankStyle()}`}>
          {String(rank).padStart(3, "0")}
        </div>

        {/* Hero Image */}
        <div className="w-10 h-12 sm:w-12 sm:h-14 relative border-2 border-ink bg-concrete flex-shrink-0">
          <Image
            src={heroUrl}
            alt={hero.heroName}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>

        {/* Hero Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-display text-sm sm:text-base truncate" title={hero.heroName}>
              {hero.heroName}
            </h3>
            {hero.isProvisional && (
              <span className="stat-badge text-[10px] bg-champion/20 text-champion border-champion">
                PROVISIONAL
              </span>
            )}
          </div>

          {/* Rating Bar (mobile hidden) */}
          <div className="hidden sm:block mt-1">
            <div className="rating-bar w-32 lg:w-48">
              <div
                className="rating-bar-fill-navy"
                style={{ width: `${ratingPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="text-right">
          <div className="font-mono text-lg sm:text-xl font-bold text-navy">
            {hero.rating}
          </div>
          <div className={`stat-badge text-[10px] ${tierClass}`}>
            {tier.name}
          </div>
        </div>

        {/* Stats (desktop) */}
        <div className="hidden md:flex items-center gap-3 text-xs font-mono">
          <div className="w-16 text-center">
            <div className="text-label">RECORD</div>
            <div>
              <span className="text-green-400">{hero.wins}</span>
              <span className="text-smoke">-</span>
              <span className="text-signal">{hero.losses}</span>
            </div>
          </div>
          <div className="w-14 text-center">
            <div className="text-label">WIN%</div>
            <div className={hero.winRate >= 50 ? "text-green-400" : "text-signal"}>
              {hero.winRate.toFixed(1)}%
            </div>
          </div>
          <div className="w-14 text-center">
            <div className="text-label">GAMES</div>
            <div className="text-charcoal">{hero.games}</div>
          </div>
          <div className="w-12 text-center">
            <div className="text-label">STREAK</div>
            <div>{streakDisplay}</div>
          </div>
          <div className="w-16 text-center">
            <div className="text-label">WILSON</div>
            <div className="text-navy">{formatWilsonScore(hero.wilsonScore)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

type SortOption = "rating" | "winRate" | "games" | "wilsonScore";

const Results: React.FC<{
  heroRatings: SerializedHeroRating[];
  stats: DashboardStats;
}> = ({ heroRatings, stats }) => {
  const [showProvisional, setShowProvisional] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredHeroes = heroRatings.filter((hero) => {
    if (!showProvisional && hero.isProvisional) return false;
    if (searchQuery && !hero.heroName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedTier !== "all") {
      const tier = getTier(hero.rating);
      if (tier.name !== selectedTier) return false;
    }
    return true;
  });

  const sortedHeroes = [...filteredHeroes].sort((a, b) => {
    switch (sortBy) {
      case "rating": return b.rating - a.rating;
      case "winRate": return b.winRate - a.winRate;
      case "games": return b.games - a.games;
      case "wilsonScore": return b.wilsonScore - a.wilsonScore;
      default: return 0;
    }
  });

  const rowVirtualizer = useVirtualizer({
    count: sortedHeroes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  return (
    <div className="min-h-screen">
      <Head>
        <title>HERO RANKINGS — ELO Ratings</title>
      </Head>

      {/* Header */}
      <header className="border-b-3 border-ink">
        <div className="max-w-6xl mx-auto px-3 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-display text-2xl sm:text-3xl">RANKINGS</h1>
              <p className="font-mono text-xs text-smoke mt-0.5">
                {stats.totalHeroes} HEROES · {stats.totalVotes} VOTES
              </p>
            </div>
            <Link href="/">
              <span className="btn-brutal-signal text-xs">
                VOTE NOW
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="border-b-2 border-ink bg-concrete">
        <div className="max-w-6xl mx-auto px-3 py-2">
          <div className="flex flex-wrap gap-4 sm:gap-6 font-mono text-xs">
            <div>
              <span className="text-smoke">TOP HERO: </span>
              <span className="font-bold text-charcoal">
                {stats.highestRatedHero?.name || "-"}
              </span>
              {stats.highestRatedHero && (
                <span className="text-navy ml-1">({stats.highestRatedHero.rating})</span>
              )}
            </div>
            <div>
              <span className="text-smoke">AVG RATING: </span>
              <span className="font-bold text-charcoal">{Math.round(stats.averageRating)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b-2 border-ink">
        <div className="max-w-6xl mx-auto px-3 py-3">
          {/* Search */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search heroes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-brutal w-full sm:w-64 text-sm"
            />
          </div>

          {/* Sort & Filter Controls */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-label">SORT:</span>
              <div className="flex gap-1">
                {(["rating", "wilsonScore", "winRate", "games"] as SortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={`px-2 py-1 font-mono text-xs border-2 border-ink transition-all ${
                      sortBy === option
                        ? "bg-ink text-paper shadow-none"
                        : "bg-paper text-ink hover:bg-concrete"
                    }`}
                  >
                    {option === "wilsonScore" ? "WILSON" : option.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px h-6 bg-ink hidden sm:block" />

            {/* Tier Filter */}
            <div className="flex items-center gap-2">
              <span className="text-label">TIER:</span>
              <div className="flex gap-1">
                {["all", "DIAMOND", "PLATINUM", "GOLD", "SILVER", "BRONZE"].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`px-2 py-1 font-mono text-xs border-2 border-ink transition-all ${
                      selectedTier === tier
                        ? "bg-ink text-paper shadow-none"
                        : "bg-paper text-ink hover:bg-concrete"
                    }`}
                  >
                    {tier === "all" ? "ALL" : tier.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px h-6 bg-ink hidden sm:block" />

            {/* Provisional Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showProvisional}
                onChange={(e) => setShowProvisional(e.target.checked)}
                className="checkbox-brutal"
              />
              <span className="font-mono text-xs text-charcoal">SHOW PROVISIONAL</span>
            </label>

            <span className="font-mono text-xs text-smoke ml-auto">
              {sortedHeroes.length} results
            </span>
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="border-b-2 border-ink bg-ink text-paper">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 py-1 px-2 sm:px-3 font-mono text-xs">
            <div className="w-10 sm:w-12 text-center">#</div>
            <div className="w-10 sm:w-12"></div>
            <div className="flex-1">HERO</div>
            <div className="w-16 text-right">RATING</div>
            <div className="hidden md:block w-16 text-center">RECORD</div>
            <div className="hidden md:block w-14 text-center">WIN%</div>
            <div className="hidden md:block w-14 text-center">GAMES</div>
            <div className="hidden md:block w-12 text-center">STREAK</div>
            <div className="hidden md:block w-16 text-center">WILSON</div>
          </div>
        </div>
      </div>

      {/* Rankings List */}
      <main className="max-w-6xl mx-auto">
        {sortedHeroes.length === 0 ? (
          <div className="text-center py-12 border-b-2 border-ink">
            <p className="font-display text-xl text-charcoal">NO HEROES FOUND</p>
            <p className="font-mono text-sm text-smoke mt-2">
              {heroRatings.length === 0 ? "Start voting to see rankings" : "Try adjusting filters"}
            </p>
          </div>
        ) : (
          <div
            ref={parentRef}
            className="scroll-brutal overflow-auto"
            style={{ height: "calc(100vh - 280px)", minHeight: "400px" }}
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const hero = sortedHeroes[virtualRow.index];
                if (!hero) return null;

                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <RankingRow
                      hero={hero}
                      rank={virtualRow.index + 1}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-ink mt-auto">
        <div className="max-w-6xl mx-auto px-3 py-2">
          <div className="flex flex-wrap justify-between items-center gap-2 font-mono text-xs text-smoke">
            <div className="flex gap-4">
              <span>ELO K=32</span>
              <span>PROVISIONAL &lt;20 GAMES</span>
            </div>
            <div className="flex gap-2">
              <span className="stat-badge tier-diamond text-[10px]">1850+</span>
              <span className="stat-badge tier-platinum text-[10px]">1700+</span>
              <span className="stat-badge tier-gold text-[10px]">1550+</span>
              <span className="stat-badge tier-silver text-[10px]">1400+</span>
              <span className="stat-badge tier-bronze text-[10px]">&lt;1400</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Results;

const calculateStats = (heroRatings: SerializedHeroRating[]): DashboardStats => {
  const totalVotes = Math.floor(
    heroRatings.reduce((sum, hero) => sum + hero.games, 0) / 2
  );

  const highestRated = heroRatings.length > 0 ? heroRatings[0] : null;

  const averageRating =
    heroRatings.length > 0
      ? heroRatings.reduce((sum, hero) => sum + hero.rating, 0) / heroRatings.length
      : 1500;

  const highestRatedHero = highestRated
    ? {
        name: highestRated.heroName,
        rating: highestRated.rating,
        heroId: highestRated.heroId,
      }
    : null;

  return {
    totalVotes,
    totalHeroes: heroRatings.length,
    highestRatedHero,
    averageRating,
  };
};

export const getStaticProps: GetStaticProps = async () => {
  const heroRatings = await getHeroRatings();
  const stats = calculateStats(heroRatings);

  return {
    props: {
      heroRatings,
      stats,
    },
    revalidate: 60,
  };
};
