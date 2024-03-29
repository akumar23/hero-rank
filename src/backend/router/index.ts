// src/server/router/index.ts
import * as trpc from "@trpc/server";
import {z} from "zod";
import { prisma } from "../utils/prisma";
import { firestore } from "../../lib/firebase";

const db = firestore

export const appRouter = trpc.router().query("get-hero-by-id", {
  input: z.object({id: z.number()}),
  async resolve ({input}) {
    
    const res = await fetch(`https://www.superheroapi.com/api.php/2422583714549928/${input.id}`)
    return res.json();
  }
}).mutation("cast-vote", {
  input: z.object({
    votedFor: z.number(),
    votedAgainst: z.number(),
  }),
  async resolve({ input }) {
    try {
      const voteRef = await db.collection('votes').add(input);
      const voteDocument = await voteRef.get();
      return { success: true, vote: voteDocument.data() };
    } catch (error: any) {
      console.error("Error casting vote:", error);
      return { success: false, error: error.message };
    }
  },
});

// export type definition of API
export type AppRouter = typeof appRouter;
