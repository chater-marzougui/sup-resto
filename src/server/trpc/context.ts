import { db } from '@/server/db';

export const createTRPCContext = (opts: {
  req?: Request;
}) => {
  return {
    db,
    req: opts.req,
  };
};

export type Context = ReturnType<typeof createTRPCContext>;