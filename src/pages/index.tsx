import { trpc } from "../utils/trpc";
import { getForVote } from "../utils/getRandomHero";
import { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import { RatingChangeToast, RatingChangeData } from "../components/RatingChangeToast";
import {
  AchievementBadges,
  AchievementUnlockToast,
  getVoteCount,
  incrementVoteCount,
  getUnlockedBadges,
  Badge
} from "../components/AchievementBadges";
import {
  VotingStreak,
  getStreakData,
  updateStreak,
  StreakData
} from "../components/VotingStreak";
import {
  DiscoveryTracker,
  getDiscoveredHeroes,
  addDiscoveredHeroes,
} from "../components/DiscoveryTracker";
import { useQueryClient } from "react-query";
import { HeroCardContainer } from "../components/HeroCardContainer";
import { extractBiographyData, type SuperHeroApiResponse } from "../types/heroBiography";

export default function Home() {
  const queryClient = useQueryClient();
  // Track if component has mounted on client to avoid hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  // Initialize with placeholder to avoid hydration mismatch - random IDs only generated on client
  const [ids, updateId] = useState<[number, number] | null>(null);
  const [toastData, setToastData] = useState<RatingChangeData | null>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [unlockedBadge, setUnlockedBadge] = useState<Badge | null>(null);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastVoteDate: null,
    votedToday: false,
  });
  const [discoveredCount, setDiscoveredCount] = useState(0);
  const [newDiscovery, setNewDiscovery] = useState(false);

  // Mark as mounted and generate random hero IDs only on client side
  useEffect(() => {
    setIsMounted(true);
    const newIds = getForVote();
    updateId(newIds);
    setVoteCount(getVoteCount());
    setStreakData(getStreakData());
    setDiscoveredCount(getDiscoveredHeroes().size);
  }, []);

  const [id1, id2] = ids || [0, 0];

  const firstHeroQuery = trpc.useQuery(["get-hero-by-id", { id: id1 }], { enabled: isMounted && id1 > 0 });
  const secondHeroQuery = trpc.useQuery(["get-hero-by-id", { id: id2 }], { enabled: isMounted && id2 > 0 });

  useEffect(() => {
    if (id1 && id2) {
      const discoveryData = addDiscoveredHeroes([id1, id2]);
      setDiscoveredCount(discoveryData.totalDiscovered);

      if (discoveryData.newlyDiscovered.length > 0) {
        setNewDiscovery(true);
        const timer = setTimeout(() => setNewDiscovery(false), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [id1, id2]);

  const hero1Name = firstHeroQuery.data?.name || "";
  const hero2Name = secondHeroQuery.data?.name || "";

  const hero1Url = id1 ? `/api/hero-image/${id1}` : "";
  const hero2Url = id2 ? `/api/hero-image/${id2}` : "";

  // Extract biography data from query results
  const hero1Biography = firstHeroQuery.data
    ? extractBiographyData(firstHeroQuery.data as SuperHeroApiResponse)
    : null;
  const hero2Biography = secondHeroQuery.data
    ? extractBiographyData(secondHeroQuery.data as SuperHeroApiResponse)
    : null;

  const voteMutate = trpc.useMutation(["cast-vote"]);

  const vote = (select: number) => {
    const winnerName = select === id1 ? hero1Name : hero2Name;
    const loserName = select === id1 ? hero2Name : hero1Name;

    const voteData =
      select === id1
        ? { votedFor: id1, votedAgainst: id2, votedForName: hero1Name, votedAgainstName: hero2Name }
        : { votedFor: id2, votedAgainst: id1, votedForName: hero2Name, votedAgainstName: hero1Name };

    voteMutate.mutate(voteData, {
      onSuccess: (data) => {
        queryClient.invalidateQueries(["get-hero-by-id"]);

        const previousBadges = getUnlockedBadges(voteCount);
        const previousBadgeCount = previousBadges.length;

        const newVoteCount = incrementVoteCount();
        setVoteCount(newVoteCount);

        const newStreakData = updateStreak();
        setStreakData(newStreakData);

        const currentBadges = getUnlockedBadges(newVoteCount);
        const currentBadgeCount = currentBadges.length;

        if (currentBadgeCount > previousBadgeCount) {
          const newBadge = currentBadges[currentBadgeCount - 1];
          if (newBadge) {
            setUnlockedBadge(newBadge);
          }
        }

        if (data.success && data.winnerRatingChange !== undefined) {
          setToastData({
            winnerName,
            loserName,
            winnerChange: data.winnerRatingChange,
            loserChange: data.loserRatingChange,
            winnerNewRating: data.winnerNewRating,
            loserNewRating: data.loserNewRating,
          });
        }

        updateId(getForVote());
      },
    });
  };

  return (
    <div className="min-h-screen">
      <Head>
        <title>HERO RANK — Vote for Your Favorite</title>
      </Head>

      <RatingChangeToast data={toastData} onClose={() => setToastData(null)} />
      <AchievementUnlockToast
        badge={unlockedBadge}
        onClose={() => setUnlockedBadge(null)}
      />

      {/* Header */}
      <header className="border-b-3 border-ink">
        <div className="max-w-4xl mx-auto px-3 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-display text-2xl sm:text-3xl">HERO RANK</h1>
              <p className="font-mono text-xs text-smoke mt-0.5">
                ELO-BASED SUPERHERO RANKINGS
              </p>
            </div>
            <Link href="/results">
              <span className="btn-brutal-ink text-xs">
                VIEW RANKINGS
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-3 py-6">
        {/* Instruction */}
        <p className="font-display text-center text-lg mb-6 text-charcoal">
          Click the hero you prefer to vote
        </p>

        {/* Battle Arena */}
        {isMounted && ids ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-6">
            {/* Hero 1 */}
            <div key={id1} className="animate-entrance-left">
              <HeroCardContainer
                heroUrl={hero1Url}
                heroName={hero1Name}
                heroId={id1}
                biography={hero1Biography}
                isLoading={firstHeroQuery.isLoading}
                onVote={() => vote(id1)}
              />
            </div>

            {/* VS Badge */}
            <div
              key={`vs-${id1}-${id2}`}
              className="animate-vs"
            >
              <div className="bg-signal text-paper border-2 border-ink shadow-brutal px-3 py-1 text-display text-3xl -rotate-3">
                VS
              </div>
            </div>

            {/* Hero 2 */}
            <div key={id2} className="animate-entrance-right">
              <HeroCardContainer
                heroUrl={hero2Url}
                heroName={hero2Name}
                heroId={id2}
                biography={hero2Biography}
                isLoading={secondHeroQuery.isLoading}
                onVote={() => vote(id2)}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-6">
            <div className="w-56 h-[300px] border-2 border-ink bg-concrete flex items-center justify-center">
              <span className="font-mono text-smoke">Loading...</span>
            </div>
            <div className="bg-signal text-paper border-2 border-ink shadow-brutal px-3 py-1 text-display text-3xl -rotate-3">
              VS
            </div>
            <div className="w-56 h-[300px] border-2 border-ink bg-concrete flex items-center justify-center">
              <span className="font-mono text-smoke">Loading...</span>
            </div>
          </div>
        )}

        {/* Skip Button */}
        <div className="text-center mb-8">
          <button
            onClick={() => updateId(getForVote())}
            className="btn-brutal text-xs"
          >
            SKIP / NEW MATCHUP
          </button>
        </div>

        {/* Stats Section */}
        <div className="border-t-3 border-ink pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Discovery Tracker */}
            <DiscoveryTracker
              discoveredCount={discoveredCount}
              newDiscovery={newDiscovery}
            />

            {/* Voting Streak */}
            <VotingStreak streakData={streakData} />

            {/* Achievement Badges */}
            <AchievementBadges voteCount={voteCount} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-ink mt-8">
        <div className="max-w-4xl mx-auto px-3 py-2">
          <p className="font-mono text-xs text-smoke text-center">
            731 HEROES · ELO RATING SYSTEM · K=32
          </p>
        </div>
      </footer>
    </div>
  );
}
