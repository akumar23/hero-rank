// src/server/router/index.ts
import superjson from "superjson";
import * as trpc from "@trpc/server";
import {z} from "zod";

export const appRouter = trpc.router().query("get-hero-by-id", {
  input: z.object({id: z.number()}),
  async resolve ({input}) {
    const response = await fetch("https://superheroapi.com/api/2422583714549928/"+input.id);
    return response.json();
  }
});

// export type definition of API
export type AppRouter = typeof appRouter;
