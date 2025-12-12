import { trpc } from "../utils/trpc";
import { getForVote } from "../utils/getRandomHero";
import { useState, useEffect } from "react";
import { inferQueryResponse } from "./api/trpc/[trpc]";
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
  DiscoveryData
} from "../components/DiscoveryTracker";
import { useQueryClient } from "react-query";
import { HeroCard } from "../components/HeroCard";

export default function Home() {
  const queryClient = useQueryClient();
  const [ids, updateId] = useState(() => getForVote());
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

  // Load vote count, streak data, and discovery data from localStorage on mount
  useEffect(() => {
    setVoteCount(getVoteCount());
    setStreakData(getStreakData());
    setDiscoveredCount(getDiscoveredHeroes().size);
  }, []);

  const [id1, id2] = ids;

  const firstHeroQuery = trpc.useQuery(["get-hero-by-id", { id: id1 }]);
  const secondHeroQuery = trpc.useQuery(["get-hero-by-id", { id: id2 }]);

  // Track discovered heroes whenever new heroes appear
  useEffect(() => {
    if (id1 && id2) {
      const discoveryData = addDiscoveredHeroes([id1, id2]);
      setDiscoveredCount(discoveryData.totalDiscovered);

      // Show new discovery animation if new heroes were found
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
        // Invalidate hero queries to ensure fresh data on results page
        queryClient.invalidateQueries(["get-hero-by-id"]);

        // Track previous unlocked badges count
        const previousBadges = getUnlockedBadges(voteCount);
        const previousBadgeCount = previousBadges.length;

        // Increment vote count and check for new badge
        const newVoteCount = incrementVoteCount();
        setVoteCount(newVoteCount);

        // Update streak data
        const newStreakData = updateStreak();
        setStreakData(newStreakData);

        const currentBadges = getUnlockedBadges(newVoteCount);
        const currentBadgeCount = currentBadges.length;

        // Check if a new badge was unlocked
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

        // Update IDs after toast
        updateId(getForVote());
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <Head>
          <title>Hero Rank - Vote for Your Favorite</title>
        </Head>

        <RatingChangeToast data={toastData} onClose={() => setToastData(null)} />
        <AchievementUnlockToast
          badge={unlockedBadge}
          onClose={() => setUnlockedBadge(null)}
        />

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Hero Rank</h1>
          <p className="text-gray-400">
            Which hero do you like more? Click to vote!
          </p>
        </div>

        {/* Voting Area */}
        <div className="flex flex-col items-center">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 mb-8">
            <div key={id1} className="hero-entrance hero-entrance-left">
              <HeroCard
                heroUrl={hero1Url}
                heroName={hero1Name}
                heroId={id1}
                isLoading={firstHeroQuery.isLoading}
                onClick={() => vote(id1)}
              />
            </div>

            <div
              key={`vs-${id1}-${id2}`}
              className="vs-text text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-red-500"
              style={{
                filter: "drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))"
              }}
            >
              VS
            </div>

            <div key={id2} className="hero-entrance hero-entrance-right">
              <HeroCard
                heroUrl={hero2Url}
                heroName={hero2Name}
                heroId={id2}
                isLoading={secondHeroQuery.isLoading}
                onClick={() => vote(id2)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => updateId(getForVote())}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded transition-colors"
            >
              Skip / New Heroes
            </button>

            <Link href="/results">
              <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded transition-colors">
                View Rankings
              </button>
            </Link>
          </div>
        </div>

        {/* Discovery Tracker Section */}
        <DiscoveryTracker
          discoveredCount={discoveredCount}
          newDiscovery={newDiscovery}
        />

        {/* Voting Streak Section */}
        <VotingStreak streakData={streakData} />

        {/* Achievement Badges Section */}
        <AchievementBadges voteCount={voteCount} />
      </div>
    </div>
  );
}