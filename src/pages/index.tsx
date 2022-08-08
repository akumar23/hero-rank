import type { NextPage } from "next";
import Head from "next/head";
import { trpc } from "../utils/trpc";
import { getForVote } from "../utils/getRandomHero";
import {useEffect, useMemo, useState} from 'react';

export default function Home () {
  
  const [ids, updateId] = useState(() => getForVote());
  
  const[id1, id2] = ids;

  return (
    <>

      <div className="h-screen w-screen flex flex-col justify-center">
        <div className="text-2xl text-center"> Which Hero do you Like More? </div>
        
        <div className="p-3" />
        
        <div className="border rounded p-8 flex justify-between"> 
          <div className="w-16 h-16 bg-red-200"> {id1} </div>
          <div className="p-8"> vs </div>
          <div className= "w-16 h-16 bg-red-200"> {id2} </div>
        </div>
      </div>
      
    </>
  );
}