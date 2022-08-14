// src/server/router/index.ts
import * as trpc from "@trpc/server";
import {z} from "zod";
import { prisma } from "../utils/prisma";

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
  async resolve({input}) {
    const voteDB = await prisma.vote.create ({
      data: {
        ...input,
      },
    });
    return {sucess: true, vote: voteDB};
  },
});

// export type definition of API
export type AppRouter = typeof appRouter;
