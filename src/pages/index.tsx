import type { NextPage } from "next";
import Head from "next/head";
import { trpc } from "../utils/trpc";
import { getForVote } from "../utils/getRandomHero";
import {useEffect, useMemo, useState} from 'react';
import axios from "axios";

export default function Home () {
  
  var [id1, id2]:number[] = [0, 0];
  
  const [ids, updateId] = useState(() => getForVote());

  [id1, id2] = ids;

  if (id1 !== undefined && id2 !== undefined) {
    const firstHero = trpc.useQuery(["get-hero-by-id", {id: id1}]);
    const secondHero = trpc.useQuery(["get-hero-by-id", {id: id2}]); 

    var data1 = firstHero.data;
    var data2 = secondHero.data;

    console.log(data1);
    console.log(data2);

    /*
    if (data1 !== undefined && data2 !== undefined) {
      var hero1 = JSON.parse(JSON.stringify(data1));
      var hero2 = JSON.parse(data2);
    
      console.log(hero1.name);
      console.log(hero2.image);
    }
    */

  }

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