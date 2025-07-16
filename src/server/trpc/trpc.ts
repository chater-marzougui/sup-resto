import { initTRPC, TRPCError } from '@trpc/server';
import { type Context } from './context';
import { ZodError } from 'zod';
import superjson from 'superjson';

type User = {
  id: string;
  role: 'admin' | 'paymentStaff' | 'verificationStaff' | 'user';
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Middleware for role-based access
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  // Add authentication logic here
  // This is a placeholder - implement actual auth check
  const user = null as unknown as User; // Get user from session/token

  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});

// Role-specific procedures
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next();
});

export const staffProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const allowedRoles = ['admin', 'paymentStaff', 'verificationStaff'];
  if (!allowedRoles.includes(ctx.user.role)) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next();
});