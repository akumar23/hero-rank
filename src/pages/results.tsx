import type { GetServerSideProps } from "next"
import { prisma } from "../backend/utils/prisma";
import { AsyncReturnType } from "../utils/ts-bs";
import { trpc } from "../utils/trpc";
import Image from "next/image";
import Head from "next/head";
import thumbLoad from '../../public/loading.png'

const getVotes = async () => {
    const votesOrdered = await prisma.vote.findMany();

    votesOrdered.sort(function(a,b) {
        return a.votedFor-b.votedFor;
    });
    

    return votesOrdered;
    
};

type VoteRes = AsyncReturnType<typeof getVotes>;

const generateCountPercent = (vote: VoteRes[number]) => {
    
    const VoteFor = vote.votedFor;
    const VoteAgainst = vote.votedAgainst;

    if (VoteFor + VoteAgainst === 0) {
      return 0;
    }
    return (VoteFor / (VoteFor + VoteAgainst)) * 100;
  };

const Listing: React.FC<{ vote: VoteRes[number] }> = (props) => {

    const hero = trpc.useQuery(["get-hero-by-id", {id: props.vote.votedFor}]);

    var heroUrl;
    if (hero.data != undefined && hero.data?.image.url != undefined) {
        heroUrl = hero.data?.image.url;
    }

    return (
        <>
            <div> {hero.data?.name} </div>
            <div className="flex border-b p-2">
                <img src={heroUrl} />
            </div>
        </>
    );
}

const Results: React.FC<{
    votes: VoteRes
}> = (props) => {

    const rankedVotes = props.votes
    .sort((a, b) => {
        const diff = generateCountPercent(b) - generateCountPercent(a);

        if (diff === 0) {
            return b.votedFor - a.votedFor;
        }

        return diff;
    })
    .map((vote, index) => ({
        ...vote,
        rank: index + 1,
    }));

    return (
        <div className="flex flex-col items-center">
            <Head>
                <title> Results </title>
            </Head>

            <h2 className="text-2xl p-4"> Results </h2>
            <div className="flex flex-col w-full max-w-2xl border">
                <br></br>
                {rankedVotes.map((currentVote) => (
                    <Listing vote={currentVote} key={currentVote.rank} />
                ))}
            </div>
        </div>

    );
};

export default Results;

export const getStaticProps: GetServerSideProps = async () => {
    
    const votesOrdered = await getVotes();

    return {props: {votes: JSON.parse(JSON.stringify(votesOrdered))}, revalidate: 60};
};