import { useEffect, useState } from "react";

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastVoteDate: string | null;
  votedToday: boolean;
}

const STREAK_KEY = "heroRankStreak";

const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split("T")[0] as string;
};

const getYesterdayDate = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0] as string;
};

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

  if (currentData.lastVoteDate === today) {
    return currentData;
  }

  let newStreakData: StreakData;

  if (currentData.lastVoteDate === yesterday) {
    const newStreak = currentData.currentStreak + 1;
    newStreakData = {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, currentData.longestStreak),
      lastVoteDate: today,
      votedToday: true,
    };
  } else {
    newStreakData = {
      currentStreak: 1,
      longestStreak: Math.max(1, currentData.longestStreak),
      lastVoteDate: today,
      votedToday: true,
    };
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STREAK_KEY, JSON.stringify(newStreakData));
  }

  return newStreakData;
};

interface VotingStreakProps {
  streakData: StreakData;
}

export const VotingStreak: React.FC<VotingStreakProps> = ({ streakData }) => {
  const { currentStreak, longestStreak, votedToday } = streakData;

  return (
    <div className="card-brutal p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-label">STREAK</span>
        {votedToday && (
          <span className="stat-badge bg-green-900/30 text-green-400 border-green-500 text-[10px]">
            VOTED
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-baseline gap-1 mb-2">
        <span className="font-mono text-3xl font-bold text-signal">
          {currentStreak}
        </span>
        <span className="font-mono text-sm text-smoke">
          day{currentStreak !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Best */}
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="text-smoke">BEST:</span>
        <span className="font-bold text-champion">{longestStreak}</span>
      </div>

      {/* Message */}
      {!votedToday && currentStreak > 0 && (
        <div className="mt-2 pt-2 border-t border-ink">
          <p className="font-mono text-xs text-signal">
            Vote today to keep streak!
          </p>
        </div>
      )}
    </div>
  );
};
