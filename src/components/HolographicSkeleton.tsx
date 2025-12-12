import React from 'react';

/**
 * HolographicSkeleton - A premium loading skeleton that matches
 * the HolographicHeroCard aesthetic with shimmer effects and
 * gradient borders for a cohesive loading experience.
 */
export const HolographicSkeleton: React.FC = () => {
  return (
    <div
      className="group relative"
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Main Card Container */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          boxShadow: '0 10px 40px -15px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Animated Gradient Border */}
        <div
          className="absolute inset-0 rounded-xl skeleton-border-shimmer"
          style={{
            padding: '2px',
            background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.6), transparent 50%, rgba(107, 114, 128, 0.6))',
            backgroundSize: '200% 200%'
          }}
        >
          <div className="absolute inset-0 rounded-xl bg-gray-900" style={{ margin: '2px' }} />
        </div>

        {/* Card Content */}
        <div className="relative z-10 p-4 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-xl m-[2px]">

          {/* Shimmer Overlay - Sweeping light effect */}
          <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
            <div className="skeleton-shimmer absolute inset-0" />
          </div>

          {/* Rank Badge Skeleton */}
          <div className="absolute -top-1 -left-1 z-20 w-10 h-10 rounded-full skeleton-pulse bg-gray-800 border border-gray-700" />

          {/* Tier Icon Skeleton - Top Right */}
          <div className="absolute -top-1 -right-1 z-20 w-8 h-8 rounded-full skeleton-pulse bg-gray-800/50" />

          {/* Hero Image Container Skeleton */}
          <div className="relative mx-auto mb-3 w-24 h-32 overflow-hidden rounded-lg">
            <div className="absolute inset-0 skeleton-pulse bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg" />
            {/* Subtle inner glow */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-transparent via-transparent to-white/5" />
          </div>

          {/* Hero Name Skeleton */}
          <div className="flex justify-center mb-2 px-2">
            <div className="h-6 w-3/4 skeleton-pulse bg-gray-700/80 rounded" />
          </div>

          {/* Tier Badge Skeleton */}
          <div className="flex justify-center mb-2">
            <div className="h-6 w-20 skeleton-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-full" />
          </div>

          {/* Rating Display Skeleton */}
          <div className="flex justify-center mb-3">
            <div className="h-9 w-20 skeleton-pulse bg-gray-700/60 rounded-lg" />
          </div>

          {/* Wilson Score Bar Skeleton */}
          <div className="mb-3 px-2">
            <div className="h-3 w-16 mx-auto skeleton-pulse bg-gray-700/50 rounded mb-1" />
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full w-1/2 skeleton-bar-shimmer bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 rounded-full" />
            </div>
            <div className="h-3 w-12 mx-auto mt-1 skeleton-pulse bg-gray-700/50 rounded" />
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="text-center p-1.5 bg-gray-800/50 rounded"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="h-2 w-12 mx-auto skeleton-pulse bg-gray-700/40 rounded mb-1" />
                <div className="h-4 w-10 mx-auto skeleton-pulse bg-gray-700/60 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card Shadow/Reflection Skeleton */}
      <div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-4 rounded-full blur-xl bg-gray-600/20"
      />
    </div>
  );
};

/**
 * HolographicSkeletonGrid - Renders a grid of skeleton cards
 * for initial page load or when data is being fetched
 */
export const HolographicSkeletonGrid: React.FC<{ count?: number }> = ({ count = 10 }) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{ animationDelay: `${i * 0.05}s` }}
          className="skeleton-fade-in"
        >
          <HolographicSkeleton />
        </div>
      ))}
    </div>
  );
};

export default HolographicSkeleton;
