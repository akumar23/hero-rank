export const TOTAL_HEROES = 731;

const DISCOVERY_KEY = "heroRankDiscoveredHeroes";

export interface DiscoveryData {
  totalDiscovered: number;
  newlyDiscovered: number[];
}

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

interface DiscoveryTrackerProps {
  discoveredCount: number;
  newDiscovery: boolean;
}

export const DiscoveryTracker: React.FC<DiscoveryTrackerProps> = ({
  discoveredCount,
  newDiscovery,
}) => {
  const percentage = Math.round((discoveredCount / TOTAL_HEROES) * 100);

  return (
    <div className="card-brutal p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-label">DISCOVERED</span>
        {newDiscovery && (
          <span className="stat-badge stat-badge-champion text-[10px]">
            NEW!
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-baseline gap-1 mb-2">
        <span className="font-mono text-3xl font-bold text-navy">
          {discoveredCount}
        </span>
        <span className="font-mono text-sm text-smoke">
          / {TOTAL_HEROES}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="rating-bar mb-2">
        <div
          className="rating-bar-fill-navy transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Percentage */}
      <div className="font-mono text-xs text-smoke text-right">
        {percentage}% complete
      </div>
    </div>
  );
};
