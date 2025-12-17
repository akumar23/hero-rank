import React from "react";
import Image from "next/image";

export interface HeroCardProps {
  heroUrl: string;
  heroName: string;
  heroId: number;
  isLoading: boolean;
  onClick?: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  heroUrl,
  heroName,
  heroId,
  isLoading,
  onClick,
}) => {
  return (
    <button
      className="hero-card w-56 text-left cursor-pointer group"
      onClick={onClick}
      type="button"
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
      <div className="border-2 border-ink bg-paper p-2">
        {/* Hero ID Badge */}
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-xs text-smoke">#{heroId}</span>
        </div>

        {/* Hero Name */}
        <h3 className="text-display text-lg truncate mb-2" title={heroName}>
          {isLoading ? (
            <span className="skeleton inline-block w-32 h-5" />
          ) : (
            heroName
          )}
        </h3>

        {/* Vote Button */}
        <div className="btn-brutal-signal w-full text-center text-sm group-hover:shadow-brutal-lg group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
          VOTE
        </div>
      </div>
    </button>
  );
};
