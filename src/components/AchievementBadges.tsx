import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

// Badge type definition
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredVotes: number;
  color: string;
}

// Badge definitions
const BADGES: Badge[] = [
  {
    id: "origin-story",
    name: "Origin Story",
    description: "Cast your first vote",
    icon: "⭐",
    requiredVotes: 1,
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  },
  {
    id: "sidekick",
    name: "Sidekick",
    description: "Cast 10 votes",
    icon: "🦸",
    requiredVotes: 10,
    color: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  },
  {
    id: "hero",
    name: "Hero",
    description: "Cast 100 votes",
    icon: "🦸‍♂️",
    requiredVotes: 100,
    color: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  },
  {
    id: "legend",
    name: "Legend",
    description: "Cast 1000 votes",
    icon: "👑",
    requiredVotes: 1000,
    color: "bg-amber-500/20 text-amber-400 border-amber-500/50",
  },
];

// LocalStorage helpers
const VOTE_COUNT_KEY = "heroRankVoteCount";

export const getVoteCount = (): number => {
  if (typeof window === "undefined") return 0;
  const stored = localStorage.getItem(VOTE_COUNT_KEY);
  return stored ? parseInt(stored, 10) : 0;
};

export const incrementVoteCount = (): number => {
  const current = getVoteCount();
  const newCount = current + 1;
  localStorage.setItem(VOTE_COUNT_KEY, newCount.toString());
  return newCount;
};

export const getUnlockedBadges = (voteCount: number): Badge[] => {
  return BADGES.filter((badge) => voteCount >= badge.requiredVotes);
};

export const getNextBadge = (voteCount: number): Badge | null => {
  return BADGES.find((badge) => voteCount < badge.requiredVotes) || null;
};

// Achievement Unlock Toast Component
interface AchievementUnlockToastProps {
  badge: Badge | null;
  onClose: () => void;
}

export const AchievementUnlockToast: React.FC<AchievementUnlockToastProps> = ({
  badge,
  onClose,
}) => {
  useEffect(() => {
    if (badge) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [badge, onClose]);

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
        >
          <div className="bg-gray-800/95 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl overflow-hidden min-w-[320px] max-w-md">
            {/* Celebration Header */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 px-6 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">
                  🎉 Achievement Unlocked!
                </h3>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors text-xl leading-none"
                  aria-label="Close notification"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Badge Content */}
            <div className="p-6 flex items-center gap-4">
              {/* Badge Icon */}
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2,
                }}
                className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-3xl ${badge.color}`}
                style={{
                  boxShadow: "0 0 20px rgba(168, 85, 247, 0.4)",
                }}
              >
                {badge.icon}
              </motion.div>

              {/* Badge Info */}
              <div className="flex-1">
                <motion.h4
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-white font-bold text-xl mb-1"
                >
                  {badge.name}
                </motion.h4>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-400 text-sm"
                >
                  {badge.description}
                </motion.p>
              </div>
            </div>

            {/* Progress bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 3, ease: "linear" }}
              className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 origin-left"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Main Achievement Badges Component
interface AchievementBadgesProps {
  voteCount: number;
}

export const AchievementBadges: React.FC<AchievementBadgesProps> = ({
  voteCount,
}) => {
  const unlockedBadges = getUnlockedBadges(voteCount);
  const nextBadge = getNextBadge(voteCount);
  const progressToNext = nextBadge
    ? ((voteCount % nextBadge.requiredVotes) / nextBadge.requiredVotes) * 100
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto mb-8"
    >
      <div className="border border-white/10 rounded-2xl p-6 bg-white/5 backdrop-blur-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🏆</span> Achievements
          </h2>
          <div className="text-right">
            <div className="text-sm text-gray-400">Total Votes</div>
            <div className="text-2xl font-bold text-white">{voteCount}</div>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {BADGES.map((badge) => {
            const isUnlocked = voteCount >= badge.requiredVotes;
            return (
              <motion.div
                key={badge.id}
                whileHover={isUnlocked ? { scale: 1.05 } : {}}
                className={`relative border-2 rounded-xl p-4 transition-all ${
                  isUnlocked
                    ? `${badge.color} cursor-pointer`
                    : "bg-gray-800/50 border-gray-700 text-gray-600"
                }`}
                style={
                  isUnlocked
                    ? {
                        boxShadow: "0 0 15px rgba(168, 85, 247, 0.2)",
                      }
                    : {}
                }
              >
                {/* Lock icon for locked badges */}
                {!isUnlocked && (
                  <div className="absolute top-2 right-2 text-gray-600 text-sm">
                    🔒
                  </div>
                )}

                {/* Badge Icon */}
                <div className="text-4xl mb-2 text-center">
                  {isUnlocked ? badge.icon : "❓"}
                </div>

                {/* Badge Info */}
                <div className="text-center">
                  <div className="font-bold text-sm mb-1">
                    {isUnlocked ? badge.name : "???"}
                  </div>
                  <div className="text-xs opacity-80">
                    {badge.requiredVotes} vote{badge.requiredVotes !== 1 ? "s" : ""}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Progress to Next Badge */}
        {nextBadge && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                Next: <span className="text-white font-medium">{nextBadge.name}</span>
              </span>
              <span className="text-gray-400">
                {voteCount} / {nextBadge.requiredVotes}
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              />
            </div>
          </div>
        )}

        {/* All badges unlocked message */}
        {!nextBadge && voteCount >= BADGES[BADGES.length - 1]!.requiredVotes && (
          <div className="text-center py-2">
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 font-bold text-lg">
              ✨ All achievements unlocked! You are a true legend! ✨
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
