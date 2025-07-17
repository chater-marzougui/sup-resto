import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '@/server/trpc/root';
import { createTRPCContext } from '@/server/trpc/context';
import { AuthContext } from '@/server/middleware/auth-middleware';

const handler = createNextApiHandler({
  router: appRouter,
  createContext: async (opts) => {
    return createTRPCContext({ req: opts.req as unknown as Request }) as AuthContext;
  },
});

export { handler as GET, handler as POST }
