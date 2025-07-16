import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '@/server/trpc/root';
import { createTRPCContext } from '@/server/trpc/context';

export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
});