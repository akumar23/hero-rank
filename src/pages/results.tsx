import type { GetServerSideProps } from "next"
import { prisma } from "../backend/utils/prisma";

export default function ResultsPage() {
    return (
        <div> Results </div>
    );
}

export const getStaticProps: GetServerSideProps = async () => {
    
    return {props: {}};
}