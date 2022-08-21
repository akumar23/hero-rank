import type { GetServerSideProps } from "next"
import { prisma } from "../backend/utils/prisma";
import { AsyncReturnType } from "../utils/ts-bs";
import { trpc } from "../utils/trpc";
import Image from "next/image";
import Head from "next/head";

const getVotes = async () => {
    const votesOrdered = await prisma.vote.findMany();
    
    votesOrdered.sort(function(a,b) {
        return a.votedFor-b.votedFor;
    });
    
    return votesOrdered;
    
};

type VoteRes = AsyncReturnType<typeof getVotes>;

const Listing: React.FC< { vote: VoteRes[number] }> = (props) => {

    const hero = trpc.useQuery(["get-hero-by-id", {id: props.vote.votedFor}]);
    const heroUrl = hero.data?.image.url;

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
    return (
        <div className="flex flex-col">
            <h1> Results </h1>
            <br></br>
            {props.votes.map((currentVote, index) => {
                return <Listing vote={currentVote} key={index} />;
            })}
        </div>

    );
};

export default Results;

export const getStaticProps: GetServerSideProps = async () => {
    
    const votesOrdered = await getVotes();

    console.log("votes:", votesOrdered)
    return {props: {votes: JSON.parse(JSON.stringify(votesOrdered))}, revalidate: 60};
};