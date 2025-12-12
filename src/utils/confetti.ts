import confetti from "canvas-confetti";

/**
 * Check if user has reduced motion preference enabled
 */
const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Confetti configuration for different achievement tiers
 */
interface ConfettiTierConfig {
  particleCount: number;
  spread: number;
  startVelocity: number;
  decay: number;
  scalar: number;
  colors?: string[];
  shapes?: confetti.Shape[];
}

const CONFETTI_TIERS: Record<number, ConfettiTierConfig> = {
  // Tier 1: First vote (Origin Story) - Simple celebration
  1: {
    particleCount: 50,
    spread: 60,
    startVelocity: 25,
    decay: 0.91,
    scalar: 0.8,
    colors: ["#fbbf24", "#f59e0b", "#d97706"], // Yellow tones
  },
  // Tier 2: 10 votes (Sidekick) - Moderate celebration
  10: {
    particleCount: 80,
    spread: 70,
    startVelocity: 30,
    decay: 0.9,
    scalar: 1.0,
    colors: ["#60a5fa", "#3b82f6", "#2563eb"], // Blue tones
  },
  // Tier 3: 100 votes (Hero) - Impressive celebration
  100: {
    particleCount: 120,
    spread: 90,
    startVelocity: 35,
    decay: 0.88,
    scalar: 1.2,
    colors: ["#a78bfa", "#8b5cf6", "#7c3aed"], // Purple tones
    shapes: ["star", "circle"],
  },
  // Tier 4: 1000 votes (Legend) - Epic celebration
  1000: {
    particleCount: 150,
    spread: 120,
    startVelocity: 45,
    decay: 0.85,
    scalar: 1.5,
    colors: ["#fbbf24", "#f59e0b", "#d97706", "#b45309"], // Gold tones
    shapes: ["star", "circle"],
  },
};

/**
 * Fire confetti from a specific origin point
 */
const fireConfetti = (
  config: ConfettiTierConfig,
  origin: { x: number; y: number }
): void => {
  confetti({
    particleCount: config.particleCount,
    spread: config.spread,
    startVelocity: config.startVelocity,
    decay: config.decay,
    scalar: config.scalar,
    origin,
    colors: config.colors,
    shapes: config.shapes,
    ticks: 200,
    gravity: 1,
  });
};

/**
 * Trigger confetti celebration for achievement unlock
 * @param requiredVotes - The vote threshold for the unlocked badge
 */
export const celebrateAchievement = (requiredVotes: number): void => {
  // Respect accessibility preferences
  if (prefersReducedMotion()) {
    return;
  }

  // Get the appropriate tier configuration
  const config = CONFETTI_TIERS[requiredVotes];
  if (!config) {
    // Fallback to tier 1 config for unknown tiers
    const fallbackConfig = CONFETTI_TIERS[1];
    if (fallbackConfig) {
      fireConfetti(fallbackConfig, { x: 0.5, y: 0.6 });
    }
    return;
  }

  // For legendary achievement (1000 votes), create a spectacular multi-burst effect
  if (requiredVotes === 1000) {
    // Center burst
    fireConfetti(config, { x: 0.5, y: 0.5 });

    // Left burst
    setTimeout(() => {
      fireConfetti(config, { x: 0.25, y: 0.6 });
    }, 150);

    // Right burst
    setTimeout(() => {
      fireConfetti(config, { x: 0.75, y: 0.6 });
    }, 300);

    return;
  }

  // For hero achievement (100 votes), create a double burst
  if (requiredVotes === 100) {
    fireConfetti(config, { x: 0.4, y: 0.6 });
    setTimeout(() => {
      fireConfetti(config, { x: 0.6, y: 0.6 });
    }, 150);
    return;
  }

  // For other achievements, single burst from center
  fireConfetti(config, { x: 0.5, y: 0.6 });
};

/**
 * Test confetti effect (useful for development/debugging)
 */
export const testConfetti = (): void => {
  if (prefersReducedMotion()) {
    console.log("Confetti disabled due to reduced motion preference");
    return;
  }

  fireConfetti(CONFETTI_TIERS[1]!, { x: 0.5, y: 0.5 });
};
