import type { GetServerSideProps } from "next"
import { AsyncReturnType } from "../utils/ts-bs";
import { trpc } from "../utils/trpc";
import Image from "next/image";
import Head from "next/head";
import thumbLoad from '../../public/loading.png'
import { BackgroundBeams } from "../components/ui/background-beams";
import { firestore } from "../utils/firebase";
import firebase from "firebase/compat";

const db = firestore

const getVotes = async () => {
    const querySnapshot = await db.collection('votes').get();
    const votes: firebase.firestore.DocumentData[] = [];
    querySnapshot.forEach(doc => {
        votes.push(doc.data());
    });
    
    votes.sort((a, b) => a.votedFor - b.votedFor);

    return votes;
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
            <div className="border-b p-2">
                <div className="font-sans font-bold"> {hero.data?.name} </div>
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
        <>
            
            <div className="flex flex-col items-center">
                <Head>
                    <title> Results </title>
                </Head>

                <h2 className="text-2xl p-4"> Results </h2>
                <div className="flex-col border mt-3 grid gap-3 pt-3 md:grid-cols-4 lg:w-4/6">
                    {rankedVotes.map((currentVote) => (
                        <Listing vote={currentVote} key={currentVote.rank} />
                    ))}
                </div>

                {/* {rankedVotes.map((currentVote) => (
                    <Listing vote={currentVote} key={currentVote.rank} />
                ))} */}

            </div>
        </>

    );
};

export default Results;

export const getStaticProps: GetServerSideProps = async () => {
    
    const votesOrdered = await getVotes();

    return {props: {votes: JSON.parse(JSON.stringify(votesOrdered))}, revalidate: 60};
};