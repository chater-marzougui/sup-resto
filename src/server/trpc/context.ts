import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { db } from '@/server/db';

export const createTRPCContext = (opts: CreateNextContextOptions) => {
  return {
    db,
    req: opts.req,
    res: opts.res,
  };
};

export type Context = ReturnType<typeof createTRPCContext>;