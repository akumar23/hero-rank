// src/server/router/index.ts
import superjson from "superjson";
import * as trpc from "@trpc/server";
import {z} from "zod";
import axios from "axios";

export const appRouter = trpc.router().query("get-hero-by-id", {
  input: z.object({id: z.number()}),
  async resolve ({input}) {
    
    const res = await fetch(`https://www.superheroapi.com/api.php/2422583714549928/${input.id}`)
    return res.json();
  }
});

// export type definition of API
export type AppRouter = typeof appRouter;
