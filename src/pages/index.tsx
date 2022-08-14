import { trpc } from "../utils/trpc";
import { getForVote } from "../utils/getRandomHero";
import {useState} from 'react';

export default function Home () {
  
  var [id1, id2]:number[] = [0, 0];
  
  const [ids, updateId] = useState(() => getForVote());

  [id1, id2] = ids;

  var hero1Url = "test";
  var hero2Url = "test2";

  var hero1Name = " ";
  var hero2Name = " ";

  if (id1 !== undefined && id2 !== undefined) {
    const firstHero = trpc.useQuery(["get-hero-by-id", {id: id1}]);
    const secondHero = trpc.useQuery(["get-hero-by-id", {id: id2}]); 

    hero1Url = firstHero.data?.image.url;
    hero2Url = secondHero.data?.image.url;

    hero1Name = firstHero.data?.name;
    hero2Name = secondHero.data?.name;

  }

  return (
    <>

      <div className="h-screen w-screen flex flex-col justify-center items-center">
        <div className="text-2xl text-center"> Which Character do you Like More? </div>       
        <div className="p-2" />
        <div className="border rounded p-8 flex items-center"> 
          <div className="w-25 h-30"> 
            <img src={hero1Url} />
            <div className="text-xl text-center capitalize"> 
              {hero1Name} 
            </div>
          </div>
          <div className="p-20"> vs </div>
          <div className= "w-25 h-30">
            <img src={hero2Url} />
            <div className="text-xl text-center capitalize"> 
              {hero2Name} 
            </div>
          </div>
        </div>
      </div>
      
    </>
  );
}