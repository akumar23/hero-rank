import React, { useRef, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';

/**
 * Tier configuration for holographic effects
 * Each tier has unique foil colors and animation intensities
 */
interface TierConfig {
  name: string;
  foilGradient: string;
  borderColor: string;
  glowColor: string;
  sparkleIntensity: number;
  icon: string;
}

type TierName = 'Diamond' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze';

const TIER_CONFIGS: Record<TierName, TierConfig> = {
  Diamond: {
    name: 'Diamond',
    foilGradient: 'linear-gradient(135deg, #a855f7 0%, #06b6d4 25%, #ec4899 50%, #8b5cf6 75%, #06b6d4 100%)',
    borderColor: 'rgba(168, 85, 247, 0.8)',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    sparkleIntensity: 1.0,
    icon: '👑'
  },
  Platinum: {
    name: 'Platinum',
    foilGradient: 'linear-gradient(135deg, #06b6d4 0%, #a5f3fc 25%, #67e8f9 50%, #22d3ee 75%, #0891b2 100%)',
    borderColor: 'rgba(6, 182, 212, 0.8)',
    glowColor: 'rgba(6, 182, 212, 0.5)',
    sparkleIntensity: 0.8,
    icon: '💎'
  },
  Gold: {
    name: 'Gold',
    foilGradient: 'linear-gradient(135deg, #fbbf24 0%, #fef3c7 25%, #fcd34d 50%, #f59e0b 75%, #d97706 100%)',
    borderColor: 'rgba(251, 191, 36, 0.8)',
    glowColor: 'rgba(251, 191, 36, 0.5)',
    sparkleIntensity: 0.6,
    icon: '🥇'
  },
  Silver: {
    name: 'Silver',
    foilGradient: 'linear-gradient(135deg, #9ca3af 0%, #f3f4f6 25%, #d1d5db 50%, #9ca3af 75%, #6b7280 100%)',
    borderColor: 'rgba(156, 163, 175, 0.8)',
    glowColor: 'rgba(156, 163, 175, 0.4)',
    sparkleIntensity: 0.4,
    icon: '🥈'
  },
  Bronze: {
    name: 'Bronze',
    foilGradient: 'linear-gradient(135deg, #d97706 0%, #fcd34d 25%, #b45309 50%, #92400e 75%, #78350f 100%)',
    borderColor: 'rgba(217, 119, 6, 0.7)',
    glowColor: 'rgba(217, 119, 6, 0.3)',
    sparkleIntensity: 0.2,
    icon: '🥉'
  }
};

/**
 * Get tier from rating
 */
const getTierFromRating = (rating: number): TierName => {
  if (rating >= 1850) return 'Diamond';
  if (rating >= 1700) return 'Platinum';
  if (rating >= 1550) return 'Gold';
  if (rating >= 1400) return 'Silver';
  return 'Bronze';
};

interface HolographicHeroCardProps {
  heroId: number;
  heroName: string;
  rating: number;
  rank: number;
  wins: number;
  losses: number;
  winRate: number;
  games: number;
  currentStreak: number;
  isProvisional: boolean;
  wilsonScore: number;
}

/**
 * HolographicHeroCard - A premium trading card component with
 * prismatic foil effects, 3D tilt tracking, and tier-based treatments
 */
export const HolographicHeroCard: React.FC<HolographicHeroCardProps> = ({
  heroId,
  heroName,
  rating,
  rank,
  wins,
  losses,
  winRate,
  games,
  currentStreak,
  isProvisional,
  wilsonScore
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  const tier = getTierFromRating(rating);
  const tierConfig = TIER_CONFIGS[tier];
  const isTopTen = rank <= 10;
  const isTopThree = rank <= 3;

  // Memoize hero image URL
  const heroUrl = useMemo(() => `/api/hero-image/${heroId}`, [heroId]);

  // Handle mouse movement for 3D tilt and glare effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate tilt (max 15 degrees)
    const tiltX = ((y - centerY) / centerY) * -15;
    const tiltY = ((x - centerX) / centerX) * 15;

    setTilt({ x: tiltX, y: tiltY });

    // Calculate glare position (0-100%)
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlarePosition({ x: glareX, y: glareY });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setTilt({ x: 0, y: 0 });
    setGlarePosition({ x: 50, y: 50 });
  }, []);

  // Rank badge styling
  const getRankBadgeStyle = () => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 text-black shadow-[0_0_20px_rgba(251,191,36,0.8)]';
    if (rank === 2) return 'bg-gradient-to-br from-gray-200 via-gray-400 to-gray-500 text-black shadow-[0_0_15px_rgba(156,163,175,0.6)]';
    if (rank === 3) return 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 text-white shadow-[0_0_15px_rgba(217,119,6,0.6)]';
    return 'bg-gray-800 text-white';
  };

  // Streak display
  const streakDisplay = currentStreak > 0
    ? <span className="text-emerald-400 font-bold">W{currentStreak}</span>
    : currentStreak < 0
      ? <span className="text-red-400 font-bold">L{Math.abs(currentStreak)}</span>
      : <span className="text-gray-500">—</span>;

  return (
    <div
      ref={cardRef}
      className="group relative cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Main Card Container */}
      <div
        className="relative rounded-xl overflow-hidden transition-transform duration-200 ease-out"
        style={{
          transform: isHovering
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)`
            : 'rotateX(0deg) rotateY(0deg) scale(1)',
          transformStyle: 'preserve-3d',
          boxShadow: isHovering
            ? `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px ${tierConfig.glowColor}`
            : '0 10px 40px -15px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Card Border - Tier Based */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            padding: isTopThree ? '3px' : '2px',
            background: isTopThree
              ? tierConfig.foilGradient
              : `linear-gradient(135deg, ${tierConfig.borderColor}, transparent 50%, ${tierConfig.borderColor})`,
            backgroundSize: '200% 200%',
            animation: isTopTen ? 'holographic-shift 3s ease infinite' : 'none'
          }}
        >
          <div className="absolute inset-0 rounded-xl bg-gray-900" style={{ margin: isTopThree ? '3px' : '2px' }} />
        </div>

        {/* Card Content */}
        <div className="relative z-10 p-4 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-xl m-[2px]">
          {/* Holographic Overlay - Only for Top 10 */}
          {isTopTen && (
            <>
              {/* Rainbow Prismatic Layer */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `
                    linear-gradient(
                      ${45 + glarePosition.x * 0.5}deg,
                      transparent 0%,
                      rgba(255, 0, 0, 0.3) 10%,
                      rgba(255, 154, 0, 0.3) 20%,
                      rgba(208, 222, 33, 0.3) 30%,
                      rgba(79, 220, 74, 0.3) 40%,
                      rgba(63, 218, 216, 0.3) 50%,
                      rgba(47, 201, 226, 0.3) 60%,
                      rgba(28, 127, 238, 0.3) 70%,
                      rgba(95, 21, 242, 0.3) 80%,
                      rgba(186, 12, 248, 0.3) 90%,
                      transparent 100%
                    )
                  `,
                  backgroundPosition: `${glarePosition.x}% ${glarePosition.y}%`,
                  mixBlendMode: 'color-dodge'
                }}
              />

              {/* Glare/Shine Effect */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(
                    circle at ${glarePosition.x}% ${glarePosition.y}%,
                    rgba(255, 255, 255, 0.4) 0%,
                    rgba(255, 255, 255, 0.1) 20%,
                    transparent 60%
                  )`,
                  mixBlendMode: 'overlay'
                }}
              />
            </>
          )}

          {/* Sparkles - Only for Top 3 */}
          {isTopThree && isHovering && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full animate-sparkle"
                  style={{
                    left: `${10 + (i * 7) % 80}%`,
                    top: `${15 + (i * 11) % 70}%`,
                    animationDelay: `${i * 0.15}s`,
                    opacity: tierConfig.sparkleIntensity
                  }}
                />
              ))}
            </div>
          )}

          {/* Rank Badge */}
          <div
            className={`absolute -top-1 -left-1 z-20 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${getRankBadgeStyle()}`}
            style={{
              fontFamily: "'Bebas Neue', 'Impact', sans-serif",
              letterSpacing: '-0.5px'
            }}
          >
            {rank === 1 ? '👑' : `#${rank}`}
          </div>

          {/* Tier Icon - Top Right */}
          <div className="absolute -top-1 -right-1 z-20 w-8 h-8 flex items-center justify-center text-lg">
            {tierConfig.icon}
          </div>

          {/* Hero Image Container */}
          <div className="relative mx-auto mb-3 w-24 h-32 overflow-hidden rounded-lg">
            {/* Image Glow Effect for Top 10 */}
            {isTopTen && (
              <div
                className="absolute -inset-1 rounded-lg opacity-50 blur-md"
                style={{ background: tierConfig.foilGradient }}
              />
            )}
            <div className="relative w-full h-full">
              <Image
                src={heroUrl}
                alt={heroName}
                width={96}
                height={128}
                className="object-cover rounded-lg shadow-2xl relative z-10"
                loading="lazy"
              />
            </div>
          </div>

          {/* Hero Name */}
          <h3
            className="text-center font-bold text-lg mb-2 truncate px-2"
            style={{
              fontFamily: "'Oswald', 'Bebas Neue', sans-serif",
              letterSpacing: '0.5px',
              textShadow: isTopThree ? `0 0 10px ${tierConfig.glowColor}` : 'none'
            }}
            title={heroName}
          >
            {heroName}
          </h3>

          {/* Tier Badge */}
          <div className="flex justify-center mb-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{
                background: `${tierConfig.foilGradient}`,
                backgroundSize: '200% 200%',
                animation: 'holographic-shift 4s ease infinite',
                color: tier === 'Silver' || tier === 'Gold' ? '#1a1a2e' : '#fff',
                textShadow: tier === 'Silver' || tier === 'Gold' ? 'none' : '0 1px 2px rgba(0,0,0,0.5)'
              }}
            >
              {tierConfig.icon} {tier}
            </span>
          </div>

          {/* Rating Display */}
          <div className="text-center mb-3">
            <span
              className="text-3xl font-black tabular-nums"
              style={{
                fontFamily: "'Bebas Neue', 'Impact', sans-serif",
                background: isTopTen ? tierConfig.foilGradient : 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                backgroundSize: '200% 200%',
                animation: isTopTen ? 'holographic-shift 3s ease infinite' : 'none'
              }}
            >
              {rating}
            </span>
            {isProvisional && (
              <span className="ml-1 px-1.5 py-0.5 bg-amber-500/80 text-black text-xs font-bold rounded">
                ?
              </span>
            )}
          </div>

          {/* Wilson Score Bar */}
          <div className="mb-3 px-2">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 text-center">
              Wilson Score
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${wilsonScore * 100}%`,
                  background: tierConfig.foilGradient,
                  backgroundSize: '200% 200%',
                  animation: 'holographic-shift 4s ease infinite'
                }}
              />
            </div>
            <div className="text-xs text-center mt-1 text-blue-400 font-medium">
              {(wilsonScore * 100).toFixed(1)}%
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-1.5 bg-gray-800/50 rounded">
              <div className="text-gray-500 uppercase tracking-wider text-[10px]">Record</div>
              <div>
                <span className="text-emerald-400 font-bold">{wins}</span>
                <span className="text-gray-600 mx-0.5">-</span>
                <span className="text-red-400 font-bold">{losses}</span>
              </div>
            </div>
            <div className="text-center p-1.5 bg-gray-800/50 rounded">
              <div className="text-gray-500 uppercase tracking-wider text-[10px]">Win %</div>
              <div className={winRate >= 50 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {winRate.toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-1.5 bg-gray-800/50 rounded">
              <div className="text-gray-500 uppercase tracking-wider text-[10px]">Games</div>
              <div className="text-white font-bold">{games}</div>
            </div>
            <div className="text-center p-1.5 bg-gray-800/50 rounded">
              <div className="text-gray-500 uppercase tracking-wider text-[10px]">Streak</div>
              <div>{streakDisplay}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Shadow/Reflection */}
      <div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-4 rounded-full blur-xl transition-opacity duration-300"
        style={{
          background: tierConfig.glowColor,
          opacity: isHovering ? 0.6 : 0.2
        }}
      />
    </div>
  );
};

export default HolographicHeroCard;
