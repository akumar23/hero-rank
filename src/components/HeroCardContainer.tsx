import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { HeroCardFront } from "./HeroCardFront";
import { HeroCardBack } from "./HeroCardBack";
import type { HeroBiography } from "../types/heroBiography";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

export interface HeroCardContainerProps {
  heroId: number;
  heroName: string;
  heroUrl: string;
  biography: HeroBiography | null;
  isLoading: boolean;
  onVote: () => void;
}

// Hover delay constants
const HOVER_ENTRY_DELAY = 180; // ms
const HOVER_EXIT_DELAY = 400; // ms

/**
 * Container component for flippable hero cards.
 * Manages flip state, animations, and interaction patterns (hover/tap/keyboard).
 */
export const HeroCardContainer: React.FC<HeroCardContainerProps> = ({
  heroId,
  heroName,
  heroUrl,
  biography,
  isLoading,
  onVote,
}) => {
  // Internal flip state
  const [isFlipped, setIsFlipped] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);
  const [isHoverDevice, setIsHoverDevice] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Timer refs for hover delays
  const entryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reduced motion preference
  const prefersReducedMotion = usePrefersReducedMotion();

  // Detect if device supports hover
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(hover: hover)");
    setIsHoverDevice(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsHoverDevice(e.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, []);

  // Reset flip state when hero changes
  useEffect(() => {
    setIsFlipped(false);
    setBioError(null);
    // Clear any pending timers
    if (entryTimerRef.current) {
      clearTimeout(entryTimerRef.current);
      entryTimerRef.current = null;
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, [heroId]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (entryTimerRef.current) clearTimeout(entryTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  // WCAG 1.4.13 Compliance: Escape key dismisses flipped content
  // This allows users to dismiss hover content without moving pointer
  useEffect(() => {
    if (!isFlipped) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Clear any pending timers
        if (entryTimerRef.current) {
          clearTimeout(entryTimerRef.current);
          entryTimerRef.current = null;
        }
        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current);
          exitTimerRef.current = null;
        }
        setIsFlipped(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isFlipped]);

  const handleRetry = () => {
    setBioError(null);
    // In future phases, this could trigger a refetch
  };

  // Desktop hover handlers
  const handleMouseEnter = () => {
    setIsHovering(true);
    if (!isHoverDevice) return;
    // Clear exit timer if mouse returns
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    // Set entry timer
    entryTimerRef.current = setTimeout(() => {
      setIsFlipped(true);
      entryTimerRef.current = null;
    }, HOVER_ENTRY_DELAY);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (!isHoverDevice) return;
    // Clear entry timer
    if (entryTimerRef.current) {
      clearTimeout(entryTimerRef.current);
      entryTimerRef.current = null;
    }
    // Set exit timer
    exitTimerRef.current = setTimeout(() => {
      setIsFlipped(false);
      exitTimerRef.current = null;
    }, HOVER_EXIT_DELAY);
  };

  // Card click handler - handles both flip (mobile) and vote (desktop)
  const handleCardClick = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    
    // Don't trigger vote/flip if clicking on interactive elements
    if (
      target.tagName === 'BUTTON' ||
      target.closest('button') ||
      target.tagName === 'A' ||
      target.closest('a')
    ) {
      return;
    }
    
    // On mobile (non-hover devices), clicking flips the card
    if (!isHoverDevice) {
      e.preventDefault();
      e.stopPropagation();
      setIsFlipped((prev) => !prev);
    } else {
      // On desktop (hover devices), clicking the card triggers vote
      // (hover already handles the flip)
      e.preventDefault();
      e.stopPropagation();
      onVote();
    }
  };

  // Keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isHoverDevice) {
        // On mobile, toggle flip
        setIsFlipped((prev) => !prev);
      } else {
        // On desktop, trigger vote
        onVote();
      }
    }
  };

  return (
    <motion.div
      className="w-56 relative"
      style={{
        perspective: "1000px",
        touchAction: "manipulation", // Prevent double-tap zoom on mobile
        // Height will be determined by card content
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      onTouchStart={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-pressed={isFlipped}
      aria-label={isFlipped ? "Return to hero image" : "View biography"}
      // Pre-flip hover hint effect
      whileHover={
        !prefersReducedMotion && !isFlipped
          ? {
              scale: 1.03,
              transition: { duration: 0.15 },
            }
          : undefined
      }
      whileTap={
        !prefersReducedMotion
          ? {
              scale: 0.98,
              transition: { duration: 0.1 },
            }
          : undefined
      }
    >
      <motion.div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 } // Instant flip for reduced motion - still conveys state change clearly
            : { duration: 0.5, ease: "easeInOut" }
        }
      >
        <div style={{ backfaceVisibility: "hidden" }} className="h-full">
          <HeroCardFront
            heroUrl={heroUrl}
            heroName={heroName}
            heroId={heroId}
            isLoading={isLoading}
            onClick={onVote}
          />
        </div>
        <div
          className="absolute inset-0 h-full"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <HeroCardBack
            heroId={heroId}
            heroName={heroName}
            heroUrl={heroUrl}
            biography={biography}
            isLoading={isLoading}
            error={bioError}
            onVote={onVote}
            onRetry={handleRetry}
          />
        </div>
      </motion.div>
      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        {isFlipped ? "Biography displayed" : "Hero image displayed"}
      </div>
      {/* Visual hint indicator - shows card is interactive */}
      {isHovering && !isFlipped && !prefersReducedMotion && (
        <div className="absolute top-2 right-2 opacity-60 pointer-events-none">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-ink"
          >
            <path
              d="M8 2L10 6L14 7L10 8L8 12L6 8L2 7L6 6L8 2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </div>
      )}
    </motion.div>
  );
};

