import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

// Types
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastVoteDate: string | null; // ISO date string YYYY-MM-DD
  votedToday: boolean;
}

// LocalStorage key
const STREAK_KEY = "heroRankStreak";

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split("T")[0] as string;
};

// Helper to get yesterday's date in YYYY-MM-DD format
const getYesterdayDate = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0] as string;
};

// Get current day of week (0 = Sunday, 6 = Saturday)
const getCurrentDayOfWeek = (): number => {
  return new Date().getDay();
};

// LocalStorage helpers
export const getStreakData = (): StreakData => {
  if (typeof window === "undefined") {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastVoteDate: null,
      votedToday: false,
    };
  }

  const stored = localStorage.getItem(STREAK_KEY);
  if (!stored) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastVoteDate: null,
      votedToday: false,
    };
  }

  try {
    const parsed = JSON.parse(stored) as StreakData;
    // Check if we need to reset votedToday flag
    if (parsed.lastVoteDate !== getTodayDate()) {
      parsed.votedToday = false;
    }
    return parsed;
  } catch {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastVoteDate: null,
      votedToday: false,
    };
  }
};

export const updateStreak = (): StreakData => {
  const currentData = getStreakData();
  const today = getTodayDate();
  const yesterday = getYesterdayDate();

  // If already voted today, just return current data
  if (currentData.lastVoteDate === today) {
    return currentData;
  }

  let newStreakData: StreakData;

  // If last vote was yesterday, increment streak
  if (currentData.lastVoteDate === yesterday) {
    const newStreak = currentData.currentStreak + 1;
    newStreakData = {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, currentData.longestStreak),
      lastVoteDate: today,
      votedToday: true,
    };
  }
  // If last vote was today (edge case) or older/null, reset/start streak
  else {
    newStreakData = {
      currentStreak: 1,
      longestStreak: Math.max(1, currentData.longestStreak),
      lastVoteDate: today,
      votedToday: true,
    };
  }

  // Save to localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem(STREAK_KEY, JSON.stringify(newStreakData));
  }

  return newStreakData;
};

// Main VotingStreak Component
interface VotingStreakProps {
  streakData: StreakData;
}

export const VotingStreak: React.FC<VotingStreakProps> = ({ streakData }) => {
  const [prevStreak, setPrevStreak] = useState(streakData.currentStreak);
  const [showAnimation, setShowAnimation] = useState(false);

  // Detect when streak increases to trigger animation
  useEffect(() => {
    if (streakData.currentStreak > prevStreak && prevStreak > 0) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 1000);
      return () => clearTimeout(timer);
    }
    setPrevStreak(streakData.currentStreak);
  }, [streakData.currentStreak, prevStreak]);

  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const currentDayIndex = getCurrentDayOfWeek();
  const { currentStreak, longestStreak, votedToday } = streakData;

  // Calculate which days should be filled
  const getFilledDays = (): boolean[] => {
    const filled = new Array(7).fill(false);

    // If no streak, return all empty
    if (currentStreak === 0) return filled;

    // Fill days based on current streak (max 7 days visualization)
    const daysToFill = Math.min(currentStreak, 7);

    for (let i = 0; i < daysToFill; i++) {
      const dayIndex = (currentDayIndex - i + 7) % 7;
      filled[dayIndex] = true;
    }

    return filled;
  };

  const filledDays = getFilledDays();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="w-full max-w-4xl mx-auto mb-8"
    >
      <div className="border border-white/10 rounded-2xl p-6 bg-white/5 backdrop-blur-lg relative overflow-hidden">
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5 pointer-events-none rounded-2xl" />

        {/* Header */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>🔥</span> Voting Streak
            </h2>
          </div>

          {/* Main Streak Display */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
            {/* Current Streak - Large Display */}
            <motion.div
              className="flex items-center gap-4"
              animate={showAnimation ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="text-6xl"
                animate={
                  currentStreak > 0 && votedToday
                    ? {
                        rotate: [0, -10, 10, -10, 0],
                        scale: showAnimation ? [1, 1.2, 1] : 1,
                      }
                    : {}
                }
                transition={{
                  duration: 0.5,
                  repeat: votedToday ? Infinity : 0,
                  repeatDelay: 3,
                }}
              >
                🔥
              </motion.div>
              <div>
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-orange-400">
                  {currentStreak}
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wide">
                  Day{currentStreak !== 1 ? "s" : ""} Streak
                </div>
              </div>
            </motion.div>

            {/* Longest Streak Record */}
            <div className="text-center sm:text-right">
              <div className="text-sm text-gray-400 mb-1">Personal Record</div>
              <div className="flex items-center gap-2 justify-center sm:justify-end">
                <span className="text-2xl">👑</span>
                <span className="text-3xl font-bold text-yellow-400">
                  {longestStreak}
                </span>
              </div>
            </div>
          </div>

          {/* 7-Day Visualization */}
          <div className="mb-6">
            <div className="text-sm text-gray-400 mb-3 text-center">
              Weekly Progress
            </div>
            <div className="flex justify-center items-center gap-3">
              {days.map((day, index) => {
                const isFilled = filledDays[index];
                const isToday = index === currentDayIndex;

                return (
                  <motion.div
                    key={`${day}-${index}`}
                    className="flex flex-col items-center gap-2"
                    whileHover={{ scale: 1.1 }}
                  >
                    {/* Day Label */}
                    <div
                      className={`text-xs font-medium ${
                        isToday ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {day}
                    </div>
                    {/* Circle */}
                    <motion.div
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center relative ${
                        isFilled
                          ? isToday && votedToday
                            ? "bg-gradient-to-br from-orange-500 to-red-500 border-orange-400 shadow-lg"
                            : "bg-orange-500/30 border-orange-500/60"
                          : "bg-gray-800/50 border-gray-700"
                      }`}
                      initial={false}
                      animate={
                        isFilled
                          ? {
                              boxShadow: isToday
                                ? [
                                    "0 0 10px rgba(251, 146, 60, 0.5)",
                                    "0 0 20px rgba(251, 146, 60, 0.8)",
                                    "0 0 10px rgba(251, 146, 60, 0.5)",
                                  ]
                                : "0 0 10px rgba(251, 146, 60, 0.3)",
                            }
                          : {}
                      }
                      transition={{
                        duration: 2,
                        repeat: isToday && isFilled ? Infinity : 0,
                      }}
                    >
                      {isFilled && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-xl"
                        >
                          {isToday && votedToday ? "✓" : ""}
                        </motion.span>
                      )}
                      {/* Today indicator ring */}
                      {isToday && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-white/40"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.8, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                        />
                      )}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Motivational Message */}
          <AnimatePresence mode="wait">
            {!votedToday && (
              <motion.div
                key="not-voted"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20"
              >
                <p className="text-orange-400 font-medium">
                  🎯 Vote today to keep your streak alive!
                </p>
              </motion.div>
            )}
            {votedToday && currentStreak === 1 && (
              <motion.div
                key="first-vote"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"
              >
                <p className="text-green-400 font-medium">
                  🎉 Great start! Come back tomorrow to build your streak!
                </p>
              </motion.div>
            )}
            {votedToday && currentStreak > 1 && currentStreak < longestStreak && (
              <motion.div
                key="building-streak"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20"
              >
                <p className="text-blue-400 font-medium">
                  💪 {longestStreak - currentStreak} more day
                  {longestStreak - currentStreak !== 1 ? "s" : ""} to match your
                  record!
                </p>
              </motion.div>
            )}
            {votedToday && currentStreak === longestStreak && currentStreak > 1 && (
              <motion.div
                key="new-record"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20"
              >
                <p className="text-yellow-400 font-medium">
                  🏆 New personal record! Keep the momentum going!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
