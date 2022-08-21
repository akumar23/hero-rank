import type { GetServerSideProps } from "next"
import { json } from "stream/consumers";
import { prisma } from "../backend/utils/prisma";

export default function ResultsPage() {
    return (
        <h1> Results </h1>
    );
}

export const getStaticProps: GetServerSideProps = async () => {
    
    const votesOrdered = await prisma.vote.findMany();
    
    votesOrdered.sort(function(a,b) {
        return a.votedFor-b.votedFor;
    });

    console.log("votes:", votesOrdered)
    return {props: {votes: JSON.parse(JSON.stringify(votesOrdered))}};
}