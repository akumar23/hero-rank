import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

// Constants
export const TOTAL_HEROES = 731;

// LocalStorage key
const DISCOVERY_KEY = "heroRankDiscoveredHeroes";

// Types
export interface DiscoveryData {
  totalDiscovered: number;
  newlyDiscovered: number[];
}

// LocalStorage helpers
export const getDiscoveredHeroes = (): Set<number> => {
  if (typeof window === "undefined") {
    return new Set<number>();
  }

  const stored = localStorage.getItem(DISCOVERY_KEY);
  if (!stored) {
    return new Set<number>();
  }

  try {
    const parsed = JSON.parse(stored) as number[];
    return new Set(parsed);
  } catch {
    return new Set<number>();
  }
};

export const addDiscoveredHeroes = (heroIds: number[]): DiscoveryData => {
  const currentDiscovered = getDiscoveredHeroes();
  const newlyDiscovered: number[] = [];

  heroIds.forEach((id) => {
    if (!currentDiscovered.has(id)) {
      currentDiscovered.add(id);
      newlyDiscovered.push(id);
    }
  });

  // Save to localStorage
  if (typeof window !== "undefined") {
    const arrayToSave = Array.from(currentDiscovered);
    localStorage.setItem(DISCOVERY_KEY, JSON.stringify(arrayToSave));
  }

  return {
    totalDiscovered: currentDiscovered.size,
    newlyDiscovered,
  };
};

export const getDiscoveryPercentage = (): number => {
  const discovered = getDiscoveredHeroes();
  return Math.round((discovered.size / TOTAL_HEROES) * 100);
};

// Milestone configuration
const MILESTONES = [
  { count: 100, emoji: "🎯", message: "Century Club!" },
  { count: 250, emoji: "🌟", message: "Quarter Master!" },
  { count: 500, emoji: "💎", message: "Half Way There!" },
  { count: 731, emoji: "🏆", message: "Complete Collection!" },
];

// Get next milestone
const getNextMilestone = (current: number): typeof MILESTONES[0] | null => {
  return MILESTONES.find((m) => m.count > current) || null;
};

// Check if just reached a milestone
const checkMilestoneReached = (
  previous: number,
  current: number
): typeof MILESTONES[0] | null => {
  const milestone = MILESTONES.find(
    (m) => current >= m.count && previous < m.count
  );
  return milestone || null;
};

// Main DiscoveryTracker Component
interface DiscoveryTrackerProps {
  discoveredCount: number;
  newDiscovery: boolean;
}

export const DiscoveryTracker: React.FC<DiscoveryTrackerProps> = ({
  discoveredCount,
  newDiscovery,
}) => {
  const [prevCount, setPrevCount] = useState(discoveredCount);
  const [showNewAnimation, setShowNewAnimation] = useState(false);
  const [milestoneReached, setMilestoneReached] = useState<
    typeof MILESTONES[0] | null
  >(null);

  const percentage = Math.round((discoveredCount / TOTAL_HEROES) * 100);
  const nextMilestone = getNextMilestone(discoveredCount);

  // Detect when new heroes are discovered
  useEffect(() => {
    if (newDiscovery && discoveredCount > prevCount) {
      setShowNewAnimation(true);
      const timer = setTimeout(() => setShowNewAnimation(false), 2000);

      // Check if a milestone was reached
      const milestone = checkMilestoneReached(prevCount, discoveredCount);
      if (milestone) {
        setMilestoneReached(milestone);
        setTimeout(() => setMilestoneReached(null), 5000);
      }

      setPrevCount(discoveredCount);
      return () => clearTimeout(timer);
    }
  }, [discoveredCount, newDiscovery, prevCount]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-4xl mx-auto mb-8"
    >
      <div className="border border-white/10 rounded-2xl p-6 bg-white/5 backdrop-blur-lg relative overflow-hidden">
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none rounded-2xl" />

        {/* Header */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>🧭</span> Hero Discovery
            </h2>

            {/* New indicator with sparkle animation */}
            <AnimatePresence>
              {showNewAnimation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-sm"
                >
                  <motion.span
                    animate={{
                      rotate: [0, 20, -20, 0],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                    }}
                  >
                    ✨
                  </motion.span>
                  NEW!
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Main Stats Display */}
          <div className="flex items-center justify-between mb-6">
            {/* Discovery Count */}
            <div className="flex items-center gap-3">
              <motion.div
                animate={showNewAnimation ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.5 }}
                className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"
              >
                {discoveredCount}
              </motion.div>
              <div>
                <div className="text-gray-300 font-medium">
                  / {TOTAL_HEROES}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  Heroes Found
                </div>
              </div>
            </div>

            {/* Percentage Badge */}
            <motion.div
              animate={showNewAnimation ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500/40"
            >
              <div className="text-2xl font-bold text-cyan-400">
                {percentage}%
              </div>
              <div className="text-xs text-gray-400">Complete</div>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-3 bg-gray-800/50 rounded-full overflow-hidden border border-gray-700/50">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 relative overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {/* Animated shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ["-100%", "200%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                />
              </motion.div>
            </div>
          </div>

          {/* Next Milestone or Completion Message */}
          <AnimatePresence mode="wait">
            {milestoneReached ? (
              <motion.div
                key="milestone"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                className="text-center p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50"
              >
                <motion.p
                  className="text-yellow-400 font-bold text-lg"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                  }}
                >
                  <span className="text-2xl mr-2">{milestoneReached.emoji}</span>
                  {milestoneReached.message}
                </motion.p>
              </motion.div>
            ) : discoveredCount === TOTAL_HEROES ? (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20"
              >
                <p className="text-yellow-400 font-medium">
                  🏆 You&apos;ve discovered all {TOTAL_HEROES} heroes! Legendary
                  explorer!
                </p>
              </motion.div>
            ) : nextMilestone ? (
              <motion.div
                key="next-milestone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20"
              >
                <p className="text-cyan-400 font-medium">
                  <span className="mr-2">{nextMilestone.emoji}</span>
                  {nextMilestone.count - discoveredCount} more to unlock{" "}
                  <span className="font-bold">{nextMilestone.message}</span>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="keep-exploring"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20"
              >
                <p className="text-cyan-400 font-medium">
                  🔍 Keep voting to discover more heroes!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
