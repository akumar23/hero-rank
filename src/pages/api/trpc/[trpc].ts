// src/pages/api/trpc/[trpc].ts
import { createNextApiHandler } from "@trpc/server/adapters/next";
import { appRouter, AppRouter } from "../../../backend/router";
import * as trpcNext from "@trpc/server/adapters/next"
import { inferProcedureOutput } from "@trpc/server";
// export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext: () => null,
});

export type inferQueryResponse<
  TRouteKey extends keyof AppRouter["_def"]["queries"]
> = inferProcedureOutput<AppRouter["_def"]["queries"][TRouteKey]>;
