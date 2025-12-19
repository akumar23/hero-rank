import type { GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { turso } from "../utils/turso";
import { useState, useRef, useCallback, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  wilsonScore,
  formatWilsonScore
} from "../utils/wilsonScore";
import { trpc } from "../utils/trpc";
import { HeroDescription } from "../components/HeroDescription";
import { motion, AnimatePresence } from "framer-motion";

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

/**
 * Hero biography data extracted from SuperHero API response.
 * The API returns nested objects (biography, work, connections),
 * but we'll store a flattened version for easier access.
 */
export interface HeroBiography {
  "full-name": string;
  "alter-egos": string;
  aliases: string[];
  "place-of-birth": string;
  "first-appearance": string;
  publisher: string;
  alignment: string;
  occupation: string;
  "base-of-operations": string;
  "group-affiliation": string;
  relatives: string;
}

/**
 * Full SuperHero API response structure.
 * Used for type safety when fetching hero data.
 */
interface SuperHeroApiResponse {
  response: string;
  id?: string;
  name?: string;
  error?: string;
  powerstats?: Record<string, string>;
  biography?: {
    "full-name": string;
    "alter-egos": string;
    aliases: string[];
    "place-of-birth": string;
    "first-appearance": string;
    publisher: string;
    alignment: string;
  };
  appearance?: Record<string, unknown>;
  work?: {
    occupation: string;
    base: string; // This is "base-of-operations"
  };
  connections?: {
    "group-affiliation": string;
    relatives: string;
  };
  image?: {
    url: string;
  };
}

/**
 * Extracts biography data from SuperHero API response and converts to HeroBiography format.
 */
function extractBiographyData(apiResponse: SuperHeroApiResponse): HeroBiography {
  // Handle missing biography data gracefully
  const biography = apiResponse.biography || {
    "full-name": "",
    "alter-egos": "",
    aliases: [],
    "place-of-birth": "",
    "first-appearance": "",
    publisher: "",
    alignment: "",
  };
  const work = apiResponse.work || { occupation: "", base: "" };
  const connections = apiResponse.connections || { "group-affiliation": "", relatives: "" };
  
  return {
    "full-name": biography["full-name"] || "",
    "alter-egos": biography["alter-egos"] || "",
    aliases: biography.aliases || [],
    "place-of-birth": biography["place-of-birth"] || "",
    "first-appearance": biography["first-appearance"] || "",
    publisher: biography.publisher || "",
    alignment: biography.alignment || "",
    occupation: work.occupation || "",
    "base-of-operations": work.base || "",
    "group-affiliation": connections["group-affiliation"] || "",
    relatives: connections.relatives || "",
  };
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

const getTierExpandedBg = (tier: TierName): string => {
  switch (tier) {
    case "DIAMOND": return "tier-expanded-diamond";
    case "PLATINUM": return "tier-expanded-platinum";
    case "GOLD": return "tier-expanded-gold";
    case "SILVER": return "tier-expanded-silver";
    case "BRONZE": return "tier-expanded-bronze";
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
  isExpanded: boolean;
  onClick: () => void;
  biography: HeroBiography | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  expandedBioHeight: number;
}> = ({ hero, rank, isExpanded, onClick, biography, isLoading, error, onRetry, expandedBioHeight }) => {
  const heroUrl = `/api/hero-image/${hero.heroId}`;
  const tier = getTier(hero.rating);
  const tierClass = getTierClass(tier.name);
  const tierExpandedBg = getTierExpandedBg(tier.name);

  const getRankStyle = () => {
    if (rank === 1) return "bg-champion text-ink font-bold";
    if (rank === 2) return "bg-silver text-paper font-bold";
    if (rank === 3) return "bg-bronze text-paper font-bold";
    return "bg-paper text-charcoal";
  };

  const getRankAccent = () => {
    if (rank === 1) return "border-l-4 border-l-champion";
    if (rank === 2) return "border-l-4 border-l-silver";
    if (rank === 3) return "border-l-4 border-l-bronze";
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
    <div
      className={`floating-card my-2 mx-1 sm:mx-2 overflow-hidden ${getRankAccent()} ${
        isExpanded ? `floating-card-expanded ${tierExpandedBg}` : ""
      }`}
    >
      <div
        onClick={onClick}
        className="flex items-center gap-2 sm:gap-3 py-3 px-3 sm:px-4 cursor-pointer hover:bg-concrete/30 transition-colors"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        aria-expanded={isExpanded}
      >
        {/* Expand/Collapse Indicator */}
        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          <svg
            className={`w-3 h-3 text-charcoal transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
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
      
      {/* Expanded Description with Animation */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: expandedBioHeight, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: 0.25,
              ease: [0.16, 1, 0.3, 1], // Custom easing for smooth animation
            }}
            style={{ overflow: "hidden", height: expandedBioHeight }}
          >
            <div 
              className="scroll-brutal"
              style={{ height: expandedBioHeight, overflowY: "auto" }}
            >
              <HeroDescription
                biography={biography}
                isLoading={isLoading}
                error={error}
                onRetry={onRetry}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  const [expandedHeroIds, setExpandedHeroIds] = useState<Set<number>>(new Set());
  const [heroDataCache, setHeroDataCache] = useState<Record<number, HeroBiography | null>>({});
  const [loadingHeroes, setLoadingHeroes] = useState<Set<number>>(new Set());
  const [errorHeroes, setErrorHeroes] = useState<Record<number, string>>({});
  const parentRef = useRef<HTMLDivElement>(null);
  // Track ongoing fetches to prevent duplicate requests
  const fetchingHeroesRef = useRef<Set<number>>(new Set());
  // Fixed height for expanded bio section (prevents jitter from dynamic measurement)
  const EXPANDED_BIO_HEIGHT = 300; // Fixed height in pixels
  
  // Helper function to fetch hero data via tRPC endpoint
  const fetchHeroData = useCallback(async (heroId: number): Promise<SuperHeroApiResponse> => {
    // tRPC v9 endpoint format: /api/trpc/[procedure]?input=...
    const input = JSON.stringify({ id: heroId });
    const response = await fetch(`/api/trpc/get-hero-by-id?input=${encodeURIComponent(input)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // tRPC v9 response format: { result: { data: ... } }
    return data.result?.data || data;
  }, []);

  const handleHeroClick = useCallback(async (heroId: number) => {
    setExpandedHeroIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(heroId)) {
        // Collapsing - remove from expanded set
        newSet.delete(heroId);
        return newSet;
      } else {
        // Expanding - add to expanded set
        newSet.add(heroId);
        
        // If data not cached and not already fetching, trigger fetch
        if (!(heroId in heroDataCache) && !fetchingHeroesRef.current.has(heroId)) {
          // Mark as fetching to prevent duplicate requests
          fetchingHeroesRef.current.add(heroId);
          
          // Set loading state
          setLoadingHeroes((prevLoading) => {
            const newLoading = new Set(prevLoading);
            newLoading.add(heroId);
            return newLoading;
          });
          
          // Clear any previous error for this hero
          setErrorHeroes((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors[heroId];
            return newErrors;
          });
          
          // Fetch hero data using tRPC endpoint
          fetchHeroData(heroId)
            .then((apiResponse) => {
              // Handle API error responses
              if (apiResponse.response === "error") {
                throw new Error(apiResponse.error || "Hero not found");
              }
              
              // Extract biography data and cache it
              const biographyData = extractBiographyData(apiResponse);
              setHeroDataCache((prevCache) => ({
                ...prevCache,
                [heroId]: biographyData,
              }));
            })
            .catch((error: unknown) => {
              // Handle error - check for network errors, API errors, etc.
              let errorMessage = "Failed to fetch hero data";
              
              if (error instanceof Error) {
                errorMessage = error.message;
              } else if (typeof error === "string") {
                errorMessage = error;
              }
              
              // Provide user-friendly error messages
              if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
                errorMessage = "Network error. Please check your connection.";
              } else if (errorMessage.includes("not found") || errorMessage.includes("404")) {
                errorMessage = "Hero data not available.";
              }
              
              setErrorHeroes((prevErrors) => ({
                ...prevErrors,
                [heroId]: errorMessage,
              }));
            })
            .finally(() => {
              // Clear fetching flag
              fetchingHeroesRef.current.delete(heroId);
              
              // Clear loading state
              setLoadingHeroes((prevLoading) => {
                const newLoading = new Set(prevLoading);
                newLoading.delete(heroId);
                return newLoading;
              });
            });
        }
        
        return newSet;
      }
    });
  }, [heroDataCache, fetchHeroData]);

  const retryHeroFetch = useCallback(async (heroId: number) => {
    // Prevent duplicate retry requests
    if (fetchingHeroesRef.current.has(heroId)) {
      return;
    }
    
    // Mark as fetching
    fetchingHeroesRef.current.add(heroId);
    
    // Clear error state
    setErrorHeroes((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[heroId];
      return newErrors;
    });

    // Set loading state
    setLoadingHeroes((prevLoading) => {
      const newLoading = new Set(prevLoading);
      newLoading.add(heroId);
      return newLoading;
    });

    try {
      // Fetch hero data using tRPC endpoint
      const apiResponse = await fetchHeroData(heroId);
      
      // Check if API response is valid
      if (apiResponse.response === "error") {
        throw new Error(apiResponse.error || "Hero not found");
      }
      
      const biographyData = extractBiographyData(apiResponse);
      
      // Cache the data
      setHeroDataCache((prevCache) => ({
        ...prevCache,
        [heroId]: biographyData,
      }));
    } catch (error: unknown) {
      // Handle error with user-friendly messages
      let errorMessage = "Failed to fetch hero data";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      
      // Provide user-friendly error messages
      if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
        errorMessage = "Network error. Please check your connection.";
      } else if (errorMessage.includes("not found") || errorMessage.includes("404")) {
        errorMessage = "Hero data not available.";
      }
      
      setErrorHeroes((prevErrors) => ({
        ...prevErrors,
        [heroId]: errorMessage,
      }));
    } finally {
      // Clear fetching flag
      fetchingHeroesRef.current.delete(heroId);
      
      // Clear loading state
      setLoadingHeroes((prevLoading) => {
        const newLoading = new Set(prevLoading);
        newLoading.delete(heroId);
        return newLoading;
      });
    }
  }, [fetchHeroData]);

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

  // Fixed row height estimation based on expansion state
  // Floating cards have margin (my-2 = 16px total) so base height is ~88px
  // Expanded height is fixed to prevent jitter from dynamic measurement
  const estimateSize = useCallback((index: number) => {
    const hero = sortedHeroes[index];
    if (!hero) return 88;

    // If hero is expanded, return fixed expanded height (collapsed height + bio height)
    // Otherwise return collapsed height with margins (~88px)
    return expandedHeroIds.has(hero.heroId) ? 88 + EXPANDED_BIO_HEIGHT : 88;
  }, [sortedHeroes, expandedHeroIds]);

  const rowVirtualizer = useVirtualizer({
    count: sortedHeroes.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 10,
    // No measureElement needed - we use fixed heights for predictable performance
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

      {/* Rankings List */}
      <main className="max-w-6xl mx-auto px-2 sm:px-4 py-4">
        {sortedHeroes.length === 0 ? (
          <div className="text-center py-12 floating-card">
            <p className="font-display text-xl text-charcoal">NO HEROES FOUND</p>
            <p className="font-mono text-sm text-smoke mt-2">
              {heroRatings.length === 0 ? "Start voting to see rankings" : "Try adjusting filters"}
            </p>
          </div>
        ) : (
          <div
            ref={parentRef}
            className="scroll-brutal overflow-auto"
            style={{ height: "calc(100vh - 300px)", minHeight: "400px" }}
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

                const isRowExpanded = expandedHeroIds.has(hero.heroId);
                
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={(element) => {
                      // No measurement needed - we use fixed heights for predictable performance
                    }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                      zIndex: isRowExpanded ? 10 : 1, // Higher z-index when expanded to appear above other rows
                    }}
                  >
                    <RankingRow
                      hero={hero}
                      rank={virtualRow.index + 1}
                      isExpanded={expandedHeroIds.has(hero.heroId)}
                      onClick={() => handleHeroClick(hero.heroId)}
                      biography={heroDataCache[hero.heroId] ?? null}
                      isLoading={loadingHeroes.has(hero.heroId)}
                      error={errorHeroes[hero.heroId] ?? null}
                      onRetry={() => retryHeroFetch(hero.heroId)}
                      expandedBioHeight={EXPANDED_BIO_HEIGHT}
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
