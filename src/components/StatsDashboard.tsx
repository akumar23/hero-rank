import React from "react";
import { motion } from "framer-motion";

export interface DashboardStats {
  totalVotes: number;
  totalHeroes: number;
  highestRatedHero: {
    name: string;
    rating: number;
    heroId: number;
  } | null;
  mostGamesHero: {
    name: string;
    games: number;
    heroId: number;
  } | null;
  averageRating: number;
}

interface StatsDashboardProps {
  stats: DashboardStats;
}

/**
 * Statistics dashboard component for the results page.
 * Displays aggregate stats about the hero ranking system.
 */
export const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats }) => {
  const statCards = [
    {
      label: "Total Votes",
      value: stats.totalVotes.toLocaleString(),
      icon: "🗳️",
      color: "from-blue-600 to-blue-700",
    },
    {
      label: "Heroes Rated",
      value: stats.totalHeroes.toLocaleString(),
      icon: "🦸",
      color: "from-purple-600 to-purple-700",
    },
    {
      label: "Highest Rated",
      value: stats.highestRatedHero
        ? `${stats.highestRatedHero.name} (${stats.highestRatedHero.rating})`
        : "N/A",
      icon: "👑",
      color: "from-yellow-600 to-yellow-700",
      compact: true,
    },
    {
      label: "Most Active",
      value: stats.mostGamesHero
        ? `${stats.mostGamesHero.name} (${stats.mostGamesHero.games} games)`
        : "N/A",
      icon: "🔥",
      color: "from-red-600 to-red-700",
      compact: true,
    },
    {
      label: "Average Rating",
      value: stats.averageRating.toFixed(0),
      icon: "📊",
      color: "from-green-600 to-green-700",
    },
  ];

  return (
    <div className="mb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Statistics</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: index * 0.1,
                duration: 0.3,
                type: "spring",
                stiffness: 200,
              }}
              className={`
                relative overflow-hidden rounded-lg p-4 text-white
                bg-gradient-to-br ${stat.color}
                shadow-lg hover:shadow-xl transition-shadow
                ${stat.compact ? 'sm:col-span-2 lg:col-span-1' : ''}
              `}
            >
              {/* Icon */}
              <div className="text-3xl mb-2">{stat.icon}</div>

              {/* Label */}
              <div className="text-xs uppercase tracking-wider opacity-90 mb-1">
                {stat.label}
              </div>

              {/* Value */}
              <div className={`font-bold ${stat.compact ? 'text-sm' : 'text-2xl'} truncate`} title={stat.value.toString()}>
                {stat.value}
              </div>

              {/* Decorative element */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
