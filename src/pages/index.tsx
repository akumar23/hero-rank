import { trpc } from "../utils/trpc";
import { getForVote } from "../utils/getRandomHero";
import { useState } from "react";
import { inferQueryResponse } from "./api/trpc/[trpc]";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import { RatingChangeToast, RatingChangeData } from "../components/RatingChangeToast";

export default function Home() {
  const [ids, updateId] = useState(() => getForVote());
  const [toastData, setToastData] = useState<RatingChangeData | null>(null);

  const [id1, id2] = ids;

  const firstHeroQuery = trpc.useQuery(["get-hero-by-id", { id: id1 }]);
  const secondHeroQuery = trpc.useQuery(["get-hero-by-id", { id: id2 }]);

  const hero1Name = firstHeroQuery.data?.name || "";
  const hero2Name = secondHeroQuery.data?.name || "";

  const hero1Url = id1 ? `/api/hero-image/${id1}` : "";
  const hero2Url = id2 ? `/api/hero-image/${id2}` : "";

  const voteMutate = trpc.useMutation(["cast-vote"]);

  const vote = (select: number) => {
    const winnerName = select === id1 ? hero1Name : hero2Name;
    const loserName = select === id1 ? hero2Name : hero1Name;

    const voteData =
      select === id1
        ? { votedFor: id1, votedAgainst: id2 }
        : { votedFor: id2, votedAgainst: id1 };

    voteMutate.mutate(voteData, {
      onSuccess: (data) => {
        if (data.success && data.winnerRatingChange !== undefined) {
          setToastData({
            winnerName,
            loserName,
            winnerChange: data.winnerRatingChange,
            loserChange: data.loserRatingChange,
            winnerNewRating: data.winnerNewRating,
            loserNewRating: data.loserNewRating,
          });
        }
      },
    });

    updateId(getForVote());
  };

  const HeroCard: React.FC<{
    heroUrl: string;
    heroName: string;
    heroId: number;
    isLoading: boolean;
  }> = ({ heroUrl, heroName, heroId, isLoading }) => (
    <div
      className="relative border border-gray-700 rounded-lg p-6 bg-gray-800/50 hover:bg-gray-800/80 transition-colors cursor-pointer"
      onClick={() => vote(heroId)}
    >
      <div className="flex justify-center mb-4">
        {isLoading ? (
          <div className="w-32 h-44 bg-gray-700 animate-pulse rounded" />
        ) : heroUrl ? (
          <Image
            src={heroUrl}
            alt={heroName}
            width={128}
            height={176}
            className="object-cover rounded shadow-lg"
          />
        ) : (
          <div className="w-32 h-44 bg-gray-700 rounded flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}
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
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <Head>
          <title>Hero Rank - Vote for Your Favorite</title>
        </Head>

        <RatingChangeToast data={toastData} onClose={() => setToastData(null)} />

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Hero Rank</h1>
          <p className="text-gray-400">
            Which hero do you like more? Click to vote!
          </p>
        </div>

        {/* Voting Area */}
        <div className="flex flex-col items-center">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 mb-8">
            <HeroCard
              heroUrl={hero1Url}
              heroName={hero1Name}
              heroId={id1}
              isLoading={firstHeroQuery.isLoading}
            />

            <div className="text-2xl font-bold text-gray-500">VS</div>

            <HeroCard
              heroUrl={hero2Url}
              heroName={hero2Name}
              heroId={id2}
              isLoading={secondHeroQuery.isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => updateId(getForVote())}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded transition-colors"
            >
              Skip / New Heroes
            </button>

            <Link href="/results">
              <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded transition-colors">
                View Rankings
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}