import { trpc } from "../utils/trpc";
import { getForVote } from "../utils/getRandomHero";
import {useState} from 'react';
import { inferQueryResponse } from "./api/trpc/[trpc]";
import Image from "next/image";
import Link from "next/link";
import { BackgroundBeams } from "../components/ui/background-beams";

function refreshPage(){
  window.location.reload();
} 

export default function Home () {
  
  var [id1, id2]:number[] = [0, 0];
  const btn = "hover:bg-blue-700 text-white font-bold py-2 px-4 rounded align-center font-sans";

  const [ids, updateId] = useState(() => getForVote());

  [id1, id2] = ids;

  var hero1Url = "test";
  var hero2Url = "test2";

  var first = 0;
  var second = 0;

  var hero1Name = " ";
  var hero2Name = " ";

  if (id1 !== undefined && id2 !== undefined) {
    const firstHero = trpc.useQuery(["get-hero-by-id", {id: id1}]);
    const secondHero = trpc.useQuery(["get-hero-by-id", {id: id2}]); 

    hero1Url = firstHero.data?.image.url;
    hero2Url = secondHero.data?.image.url;

    hero1Name = firstHero.data?.name;
    hero2Name = secondHero.data?.name;

    first = id1;
    second = id2;

  }

  const voteMutate = trpc.useMutation(["cast-vote"]);

  const vote = (select: number) => {
    if (select == first) {
      voteMutate.mutate({votedFor: first, votedAgainst: second});
    } else {
      voteMutate.mutate({votedFor: second, votedAgainst: first})    
    }
    updateId(getForVote());
  }

  return (
    <>
      <BackgroundBeams />
      <div className="h-screen w-screen flex flex-col justify-center items-center">
        {/* <div className="text-2xl text-center"> Which Character do you Like More? </div>        */}
        <div className="p-2" />
        <div className="p-8 flex items-center rounded-[9999px] shadow-[0_0_0_1px_#ffffff10]"> 
          <div className="w-55 h-50"> 
            <img src={hero1Url} />
            <button className={btn} onClick={() => vote(first)}> {hero1Name} </button>
          </div>
          <div className="p-20"> vs </div>
          <div className= "w-55 h-50">
            <img src={hero2Url} />
            <button className={btn} onClick={() => vote(second)}> {hero2Name} </button>
          </div>
        </div>

        <br></br>
        
        <button className={btn} onClick={()=> {refreshPage();}}> Get New Characters</button>
        
        <br></br>

        <Link href="/results">
          <button className={btn}> View Results</button>
        </Link>
        
      </div>

    </>
  );
}