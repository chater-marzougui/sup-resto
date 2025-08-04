import { initTRPC, TRPCError } from '@trpc/server';
import { 
  createTRPCContext, 
  enforceUserIsAuthed, 
  enforceUserIsAdmin,
  enforceUserIsSuperAdmin,
  enforceUserIsActive,
  type AuthContext 
} from '../middleware/auth-middleware';
import superjson from 'superjson';

// Initialize tRPC
const t = initTRPC.context<AuthContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error && error.cause.name === 'ZodError'
            ? error.cause.message
            : null,
      },
    };
  },
});

// Export reusable router and procedure helpers
export const createTRPCRouter = t.router;
export const middleware = t.middleware;

/**
 * Public procedure - no authentication required
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(
  middleware(async ({ ctx, next }) => {
    const authedCtx = enforceUserIsAuthed(ctx);
    const activeCtx = enforceUserIsActive(authedCtx);
    return next({
      ctx: activeCtx,
    });
  })
);

/**
 * Admin procedure - requires admin role (1 or 2)
 */
export const adminProcedure = t.procedure.use(
  middleware(async ({ ctx, next }) => {
    const authedCtx = enforceUserIsAuthed(ctx);
    const activeCtx = enforceUserIsActive(authedCtx);
    const adminCtx = enforceUserIsAdmin(activeCtx);
    return next({
      ctx: adminCtx,
    });
  })
);

/**
 * Super admin procedure - requires super admin role (1)
 */
export const superAdminProcedure = t.procedure.use(
  middleware(async ({ ctx, next }) => {
    const authedCtx = enforceUserIsAuthed(ctx);
    const activeCtx = enforceUserIsActive(authedCtx);
    const superAdminCtx = enforceUserIsSuperAdmin(activeCtx);
    return next({
      ctx: superAdminCtx,
    });
  })
);

/**
 * Custom role-based procedure
 */
export const roleProcedure = (allowedRoles: number | number[]) => {
  return t.procedure.use(
    middleware(async ({ ctx, next }) => {
      const authedCtx = enforceUserIsAuthed(ctx);
      const activeCtx = enforceUserIsActive(authedCtx);
      if (Array.isArray(allowedRoles)) {
        if (!allowedRoles.includes(activeCtx.user?.role ?? -1)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          });
        }
      } else if (typeof allowedRoles === 'number' && activeCtx.user?.role !== allowedRoles) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        });
      }

      if (!activeCtx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }
      
      return next({
        ctx: activeCtx,
      });
    })
  );
};

// Export the context creator
export { createTRPCContext };