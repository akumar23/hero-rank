import React from "react";
import Image from "next/image";

export interface HeroCardFrontProps {
  heroUrl: string;
  heroName: string;
  heroId: number;
  isLoading: boolean;
  onClick?: () => void;
  onInteractionHint?: () => void;
}

/**
 * Front face of the hero card displaying the hero image and basic info.
 * Designed to work as part of a flippable card container.
 */
export const HeroCardFront: React.FC<HeroCardFrontProps> = ({
  heroUrl,
  heroName,
  heroId,
  isLoading,
  onClick,
  onInteractionHint,
}) => {
  return (
    <div
      className="hero-card w-56 text-left cursor-pointer group h-full flex flex-col"
      onMouseEnter={onInteractionHint}
    >
      {/* Hero Image */}
      <div className="border-2 border-ink border-b-0 bg-concrete">
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
              sizes="224px"
            />
          ) : (
            <div className="w-full h-full bg-concrete flex items-center justify-center">
              <span className="font-mono text-smoke text-xs">NO IMAGE</span>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="border-2 border-ink bg-paper p-2 flex-shrink-0">
        {/* Hero ID Badge */}
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-xs text-smoke">#{heroId}</span>
        </div>

        {/* Hero Name */}
        <h3 className="text-display text-lg truncate" title={heroName}>
          {isLoading ? (
            <span className="skeleton inline-block w-32 h-5" />
          ) : (
            heroName
          )}
        </h3>
      </div>
    </div>
  );
};

