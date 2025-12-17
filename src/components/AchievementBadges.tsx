import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredVotes: number;
}

const BADGES: Badge[] = [
  {
    id: "origin-story",
    name: "ORIGIN",
    description: "Cast your first vote",
    icon: "1",
    requiredVotes: 1,
  },
  {
    id: "sidekick",
    name: "SIDEKICK",
    description: "Cast 10 votes",
    icon: "10",
    requiredVotes: 10,
  },
  {
    id: "hero",
    name: "HERO",
    description: "Cast 100 votes",
    icon: "100",
    requiredVotes: 100,
  },
  {
    id: "legend",
    name: "LEGEND",
    description: "Cast 1000 votes",
    icon: "1K",
    requiredVotes: 1000,
  },
];

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
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
        >
          <div className="border-2 border-ink bg-paper shadow-brutal-lg">
            {/* Header */}
            <div className="bg-signal text-paper px-4 py-1 flex items-center justify-between">
              <span className="font-display text-sm font-bold uppercase">
                ACHIEVEMENT UNLOCKED
              </span>
              <button
                onClick={onClose}
                className="text-paper/80 hover:text-paper text-lg leading-none font-bold ml-4"
                aria-label="Close"
              >
                X
              </button>
            </div>

            {/* Content */}
            <div className="p-4 flex items-center gap-4">
              {/* Badge Icon */}
              <div className="w-14 h-14 border-2 border-ink bg-champion flex items-center justify-center">
                <span className="font-mono text-xl font-bold text-ink">
                  {badge.icon}
                </span>
              </div>

              {/* Badge Info */}
              <div>
                <h4 className="text-display text-lg">{badge.name}</h4>
                <p className="font-mono text-xs text-smoke">
                  {badge.description}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 3, ease: "linear" }}
              className="h-1 bg-signal origin-left"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface AchievementBadgesProps {
  voteCount: number;
}

export const AchievementBadges: React.FC<AchievementBadgesProps> = ({
  voteCount,
}) => {
  const unlockedBadges = getUnlockedBadges(voteCount);
  const nextBadge = getNextBadge(voteCount);

  return (
    <div className="card-brutal p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-label">ACHIEVEMENTS</span>
        <span className="font-mono text-xs text-smoke">
          {voteCount} votes
        </span>
      </div>

      {/* Badges Row */}
      <div className="flex gap-1 mb-2">
        {BADGES.map((badge) => {
          const isUnlocked = voteCount >= badge.requiredVotes;
          return (
            <div
              key={badge.id}
              className={`w-10 h-10 border-2 border-ink flex items-center justify-center font-mono text-xs font-bold transition-colors ${
                isUnlocked
                  ? "bg-champion text-ink"
                  : "bg-concrete text-smoke"
              }`}
              title={isUnlocked ? badge.name : `${badge.requiredVotes} votes`}
            >
              {isUnlocked ? badge.icon : "?"}
            </div>
          );
        })}
      </div>

      {/* Next Badge Progress */}
      {nextBadge && (
        <div className="font-mono text-xs">
          <span className="text-smoke">NEXT: </span>
          <span className="text-charcoal font-bold">{nextBadge.name}</span>
          <span className="text-smoke"> ({nextBadge.requiredVotes - voteCount} more)</span>
        </div>
      )}

      {!nextBadge && (
        <div className="font-mono text-xs text-champion font-bold">
          ALL UNLOCKED!
        </div>
      )}
    </div>
  );
};
