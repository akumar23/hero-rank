import type { NextPage } from "next";
import Head from "next/head";
import { trpc } from "../utils/trpc";
import { getForVote } from "../utils/getRandomHero";
import {useEffect, useMemo, useState} from 'react';

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

      <div className="h-screen w-screen flex flex-col justify-center">
        <div className="text-2xl text-center"> Which Character do you Like More? </div>
        
        <div className="p-3" />
        
        <div className="border rounded p-20 flex justify-between"> 
          <div className="w-16 h-16 bg-red-200"> 
            <img src={hero1Url} />
            <div> {hero1Name} </div>
          </div>
          <div className="p-8"> vs </div>
          <div className= "w-16 h-16 bg-red-200">
            <img src={hero2Url} />
            <div> {hero2Name} </div>
          </div>
        </div>
      </div>
      
    </>
  );
}