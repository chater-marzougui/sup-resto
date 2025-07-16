// server.ts
import { Context } from './context';
import { appRouter } from './root';
import { initTRPC } from '@trpc/server';

const t = initTRPC.context<Context>().create();
export const trpc = t.router({
  app: appRouter,
});
export type AppRouter = typeof appRouter;