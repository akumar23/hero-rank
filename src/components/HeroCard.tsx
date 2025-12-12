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
    <div
      className="hero-card relative border border-white/10 rounded-2xl p-6 bg-white/5 backdrop-blur-lg cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 pointer-events-none rounded-2xl" />

      <div className="relative z-10">
        <div className="flex justify-center mb-4">
          {/* Fixed container to prevent layout shift */}
          <div className="w-32 h-44 relative">
            {isLoading ? (
              <div className="w-full h-full bg-gray-700 animate-pulse rounded" />
            ) : heroUrl ? (
              <Image
                src={heroUrl}
                alt={heroName}
                width={128}
                height={176}
                className="object-cover rounded shadow-lg"
                priority
                sizes="128px"
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div className="w-full h-full bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs">
                No Image
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <h3 className="font-bold text-xl truncate mb-3" title={heroName}>
            {isLoading ? (
              <span className="bg-gray-700 animate-pulse inline-block w-24 h-6 rounded" />
            ) : (
              heroName
            )}
          </h3>
          <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors">
            Vote
          </button>
        </div>
      </div>
    </div>
  );
};
