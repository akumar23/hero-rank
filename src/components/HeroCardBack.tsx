import React from "react";
import Image from "next/image";
import type { HeroBiography } from "../types/heroBiography";
import { TruncatedText } from "./TruncatedText";

export interface HeroCardBackProps {
  heroId: number;
  heroName: string;
  heroUrl: string;
  biography: HeroBiography | null;
  isLoading: boolean;
  error: string | null;
  onVote: () => void;
  onRetry?: () => void;
}

/**
 * Back face of the hero card displaying biography information.
 * Matches front card dimensions exactly and includes vote button.
 */
export const HeroCardBack: React.FC<HeroCardBackProps> = ({
  heroId,
  heroName,
  heroUrl,
  biography,
  isLoading,
  error,
  onVote,
  onRetry,
}) => {
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
      <div className="mb-1.5">
        <span className="font-mono text-xs text-smoke uppercase tracking-wide">
          {label}:
        </span>
        <div className="font-mono text-xs text-charcoal mt-0.5 break-words">
          <TruncatedText text={displayValue} maxLines={2} />
        </div>
      </div>
    );
  };

  const getAlignmentColor = (alignment: string): string => {
    const align = alignment.toLowerCase();
    if (align === "good") return "text-green-400";
    if (align === "bad" || align === "evil") return "text-signal";
    return "text-smoke";
  };

  return (
    <div
      className="hero-card w-56 text-left cursor-pointer group h-full flex flex-col"
    >
      {/* Header with thumbnail and name - matches front card image section height */}
      <div className="border-2 border-ink border-b-0 bg-paper p-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 relative flex-shrink-0 border border-ink">
            {heroUrl ? (
              <Image
                src={heroUrl}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <div className="w-full h-full bg-concrete flex items-center justify-center">
                <span className="font-mono text-xs text-smoke">NO IMAGE</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-mono text-xs text-smoke">#{heroId}</span>
            <h3 className="text-display text-sm truncate" title={heroName}>
              {heroName}
            </h3>
          </div>
        </div>
      </div>

      {/* Biography Content - matches front card info section height */}
      <div className="border-2 border-ink bg-paper p-2 overflow-y-auto flex-1 min-h-0">
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
        ) : error ? (
          <div className="space-y-2">
            <p className="font-mono text-xs text-signal font-bold">
              Failed to load
            </p>
            <p className="font-mono text-xs text-charcoal">{error}</p>
            {onRetry && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click from triggering vote
                  onRetry();
                }}
                className="btn-brutal-signal text-xs mt-2"
                type="button"
              >
                RETRY
              </button>
            )}
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
    </div>
  );
};

