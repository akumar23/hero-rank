import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { HeroBiography } from "../types/heroBiography";
import { TruncatedText } from "./TruncatedText";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

export interface HeroCardProps {
  heroUrl: string;
  heroName: string;
  heroId: number;
  biography: HeroBiography | null;
  isLoading: boolean;
  onVote: () => void;
}

// Hover delay constant
const HOVER_DELAY = 1000; // 1 second

/**
 * Hero card component with hover-triggered name slide-up animation.
 * When hovered for 1 second, the hero name slides up to reveal biography information.
 */
export const HeroCard: React.FC<HeroCardProps> = ({
  heroUrl,
  heroName,
  heroId,
  biography,
  isLoading,
  onVote,
}) => {
  const [showBiography, setShowBiography] = useState(false);
  const [isHoverDevice, setIsHoverDevice] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(true); // Skip animation on initial render and hero change
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
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

  // Reset biography visibility when hero changes (no animation)
  useEffect(() => {
    setSkipAnimation(true);
    setShowBiography(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    // Re-enable animations after a brief moment
    const timer = setTimeout(() => setSkipAnimation(false), 50);
    return () => clearTimeout(timer);
  }, [heroId]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  // WCAG 1.4.13 Compliance: Escape key dismisses biography
  useEffect(() => {
    if (!showBiography) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current);
          hoverTimerRef.current = null;
        }
        setShowBiography(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showBiography]);

  // Desktop hover handlers
  const handleMouseEnter = () => {
    if (!isHoverDevice) return;
    hoverTimerRef.current = setTimeout(() => {
      setShowBiography(true);
      hoverTimerRef.current = null;
    }, HOVER_DELAY);
  };

  const handleMouseLeave = () => {
    if (!isHoverDevice) return;
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setShowBiography(false);
  };

  // Card click handler - handles voting and biography toggle
  const handleCardClick = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    
    // Don't do anything if clicking on interactive elements
    if (
      target.tagName === "BUTTON" ||
      target.closest("button") ||
      target.tagName === "A" ||
      target.closest("a")
    ) {
      return;
    }

    // On mobile (non-hover devices), tap toggles biography
    if (!isHoverDevice) {
      e.preventDefault();
      e.stopPropagation();
      setShowBiography((prev) => !prev);
    } else {
      // On desktop (hover devices), clicking the card triggers vote
      e.preventDefault();
      e.stopPropagation();
      onVote();
    }
  };

  // Keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      // Toggle biography on all devices
      setShowBiography((prev) => !prev);
    } else if (e.key === "Escape" && showBiography) {
      setShowBiography(false);
    }
  };

  // Format biography field
  const formatField = (
    label: string,
    value: string | string[] | null | undefined
  ): React.ReactNode => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return null;
    }

    const displayValue = Array.isArray(value) ? value.join(", ") : value;

    // Skip if value is empty or placeholder text
    if (
      typeof displayValue === "string" &&
      (displayValue.trim() === "" ||
        displayValue.toLowerCase().includes("no ") ||
        displayValue.toLowerCase().includes("not found") ||
        displayValue === "-")
    ) {
      return null;
    }

    return (
      <div className="mb-1">
        <span className="font-mono text-xs text-smoke uppercase tracking-wide">
          {label}:
        </span>
        <span className="font-mono text-xs text-charcoal ml-1.5 break-words">
          <TruncatedText text={displayValue} maxLines={2} />
        </span>
      </div>
    );
  };

  const getAlignmentColor = (alignment: string): string => {
    const align = alignment.toLowerCase();
    if (align === "good") return "text-green-400";
    if (align === "bad" || align === "evil") return "text-signal";
    return "text-smoke";
  };

  // Animation configuration - skip animation on hero change or if user prefers reduced motion
  const animationTransition = (prefersReducedMotion || skipAnimation)
    ? { duration: 0 }
    : { duration: 0.4, ease: "easeInOut" as const };

  return (
    <div
      className="hero-card w-72 text-left cursor-pointer group flex flex-col relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      onTouchStart={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-expanded={showBiography}
      aria-label={showBiography ? "Hide biography" : "Show biography"}
    >
      {/* Hero Image */}
      <div className="border-2 border-ink border-b-0 bg-concrete flex-shrink-0 relative">
        <div className="w-full aspect-[3/4] relative">
          {isLoading ? (
            <div className="w-full h-full skeleton" />
          ) : heroUrl ? (
            <Image
              src={heroUrl}
              alt={heroName}
              fill
              className="object-cover"
              priority
              sizes="288px"
            />
          ) : (
            <div className="w-full h-full bg-concrete flex items-center justify-center">
              <span className="font-mono text-smoke text-xs">NO IMAGE</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Name and Biography Container - Expands upward from bottom */}
      <motion.div
        className="absolute left-0 right-0 bg-paper border-2 border-ink z-10 overflow-hidden shadow-lg"
        animate={{
          height: showBiography ? "220px" : "60px", // Expands upward into image when bio shows
        }}
        transition={animationTransition}
        style={{ willChange: "height", bottom: "0px" }}
      >
        {/* Hero Name */}
        <h3
          className="text-display text-lg px-3 pt-2 pb-3 truncate border-b border-ink/20"
          title={heroName}
        >
          {isLoading ? (
            <span className="skeleton inline-block w-32 h-5" />
          ) : (
            heroName
          )}
        </h3>

        {/* Biography Content - Scrollable */}
        <div
          className="px-3 pt-2 pb-4 overflow-y-auto overscroll-contain"
          style={{ height: "156px" }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {isLoading ? (
            <div className="space-y-2">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-3/4" />
              <div className="mt-2">
                <span className="font-mono text-xs text-smoke" aria-live="polite">
                  Loading...
                </span>
              </div>
            </div>
          ) : !biography ? (
            <p className="font-mono text-xs text-smoke">
              No biography data available
            </p>
          ) : (
            <div className="space-y-1 font-mono text-xs">
              {formatField("Full Name", biography["full-name"])}
              {biography.aliases &&
                biography.aliases.length > 0 &&
                formatField("Aliases", biography.aliases)}
              {formatField("Publisher", biography.publisher)}
              {formatField("First Appearance", biography["first-appearance"])}
              {biography.alignment && (
                <div className="mb-1.5">
                  <span className="font-mono text-xs text-smoke uppercase tracking-wide">
                    Alignment:
                  </span>
                  <span
                    className={`font-mono text-xs font-bold ml-2 ${getAlignmentColor(
                      biography.alignment
                    )}`}
                  >
                    {biography.alignment.toUpperCase()}
                  </span>
                </div>
              )}
              {formatField("Place of Birth", biography["place-of-birth"])}
            </div>
          )}
        </div>
      </motion.div>

      {/* Info Section - Just enough height for name bar */}
      <div className="border-2 border-ink bg-paper" style={{ height: "60px" }} />

      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        {showBiography ? "Biography displayed" : "Hero image displayed"}
      </div>
    </div>
  );
};
