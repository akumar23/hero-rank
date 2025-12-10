import { trpc } from "../utils/trpc";
import { getForVote } from "../utils/getRandomHero";
import { useState, useEffect } from "react";
import { inferQueryResponse } from "./api/trpc/[trpc]";
import Image from "next/image";
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
import { motion } from "framer-motion";

export default function Home() {
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
        ? { votedFor: id1, votedAgainst: id2 }
        : { votedFor: id2, votedAgainst: id1 };

    voteMutate.mutate(voteData, {
      onSuccess: (data) => {
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

  const HeroCard: React.FC<{
    heroUrl: string;
    heroName: string;
    heroId: number;
    isLoading: boolean;
  }> = ({ heroUrl, heroName, heroId, isLoading }) => (
    <motion.div
      className="relative border border-white/10 rounded-2xl p-6 bg-white/5 backdrop-blur-lg hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer overflow-hidden"
      onClick={() => vote(heroId)}
      whileHover={{
        scale: 1.05,
        y: -8,
        boxShadow: "0 0 30px rgba(59, 130, 246, 0.3)",
      }}
      whileTap={{
        scale: 0.98,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
    >
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 pointer-events-none rounded-2xl" />

      <div className="relative z-10">
        <div className="flex justify-center mb-4">
          {isLoading ? (
            <div className="w-32 h-44 bg-gray-700 animate-pulse rounded" />
          ) : heroUrl ? (
            <Image
              src={heroUrl}
              alt={heroName}
              width={128}
              height={176}
              className="object-cover rounded shadow-lg"
            />
          ) : (
            <div className="w-32 h-44 bg-gray-700 rounded flex items-center justify-center text-gray-500">
              No Image
            </div>
          )}
        </div>

        <div className="text-center">
          <h3 className="font-bold text-xl truncate mb-3" title={heroName}>
            {isLoading ? (
              <span className="bg-gray-700 animate-pulse inline-block w-24 h-6 rounded" />
            ) : (
              heroName
            )}
          </h3>
          <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors">
            Vote
          </button>
        </div>
      </div>
    </motion.div>
  );

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

        {/* Achievement Badges Section */}
        <AchievementBadges voteCount={voteCount} />

        {/* Voting Streak Section */}
        <VotingStreak streakData={streakData} />

        {/* Discovery Tracker Section */}
        <DiscoveryTracker
          discoveredCount={discoveredCount}
          newDiscovery={newDiscovery}
        />

        {/* Voting Area */}
        <div className="flex flex-col items-center">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 mb-8">
            <motion.div
              key={id1}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1,
              }}
            >
              <HeroCard
                heroUrl={hero1Url}
                heroName={hero1Name}
                heroId={id1}
                isLoading={firstHeroQuery.isLoading}
              />
            </motion.div>

            <motion.div
              key={`vs-${id1}-${id2}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2,
              }}
              className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-red-500"
              style={{
                filter: "drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))"
              }}
            >
              VS
            </motion.div>

            <motion.div
              key={id2}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.3,
              }}
            >
              <HeroCard
                heroUrl={hero2Url}
                heroName={hero2Name}
                heroId={id2}
                isLoading={secondHeroQuery.isLoading}
              />
            </motion.div>
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
      </div>
    </div>
  );
}