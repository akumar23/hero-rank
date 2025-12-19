import React from "react";
import type { HeroBiography } from "../pages/results";

export interface HeroDescriptionProps {
  biography: HeroBiography | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

/**
 * Component for displaying hero biography information.
 * Handles loading, error, and success states with neo-brutalist styling.
 */
export const HeroDescription: React.FC<HeroDescriptionProps> = ({
  biography,
  isLoading,
  error,
  onRetry,
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="border-t-2 border-ink bg-concrete/30 px-3 py-4">
        <div className="max-w-4xl">
          <div className="space-y-3">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
          </div>
          <div className="mt-4">
            <span className="font-mono text-xs text-smoke" aria-live="polite">
              Loading biography...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="border-t-2 border-ink bg-signal/10 px-3 py-4">
        <div className="max-w-4xl">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="font-mono text-sm text-signal font-bold mb-2">
                Failed to load biography
              </p>
              <p className="font-mono text-xs text-charcoal mb-3">
                {error}
              </p>
              <button
                onClick={onRetry}
                className="btn-brutal-signal text-xs"
                type="button"
              >
                RETRY
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No biography data
  if (!biography) {
    return (
      <div className="border-t-2 border-ink bg-concrete/30 px-3 py-4">
        <div className="max-w-4xl">
          <p className="font-mono text-xs text-smoke">
            No biography data available
          </p>
        </div>
      </div>
    );
  }

  // Success state - display biography data
  const formatField = (label: string, value: string | string[] | null | undefined): React.ReactNode => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return null;
    }

    const displayValue = Array.isArray(value) ? value.join(", ") : value;
    
    // Skip if value is empty or placeholder text
    if (typeof displayValue === "string" && (
      displayValue.trim() === "" ||
      displayValue.toLowerCase().includes("no ") ||
      displayValue.toLowerCase().includes("not found") ||
      displayValue === "-"
    )) {
      return null;
    }

    return (
      <div className="mb-2 break-words">
        <span className="font-mono text-xs text-smoke uppercase tracking-wide">
          {label}:
        </span>
        <span className="font-mono text-xs text-charcoal ml-2 break-words">
          {displayValue}
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

  return (
    <div className="border-t-2 border-ink bg-concrete/30 px-3 py-4">
      <div className="max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 font-mono text-xs">
          {formatField("Full Name", biography["full-name"])}
          {biography.aliases && biography.aliases.length > 0 && formatField("Aliases", biography.aliases)}
          {formatField("Publisher", biography.publisher)}
          {formatField("First Appearance", biography["first-appearance"])}
          {biography.alignment && (
            <div className="mb-2">
              <span className="font-mono text-xs text-smoke uppercase tracking-wide">
                Alignment:
              </span>
              <span className={`font-mono text-xs font-bold ml-2 ${getAlignmentColor(biography.alignment)}`}>
                {biography.alignment.toUpperCase()}
              </span>
            </div>
          )}
          {formatField("Place of Birth", biography["place-of-birth"])}
          {formatField("Occupation", biography.occupation)}
          {formatField("Base of Operations", biography["base-of-operations"])}
          {formatField("Group Affiliation", biography["group-affiliation"])}
          {formatField("Relatives", biography.relatives)}
        </div>
      </div>
    </div>
  );
};

