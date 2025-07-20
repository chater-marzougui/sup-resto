import { TRPCError } from "@trpc/server";
import { AuthService } from "@/server/trpc/services/auth-service";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { RoleEnum } from "../db/enums";

export interface AuthContext {
  user?: {
    id: string;
    cin: string;
    firstName: string;
    lastName: string;
    email: string | null;
    role: number;
    balance: number;
    isActive: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  session?: any; // You can type this based on your session structure
}

export const createTRPCContext = async (opts: CreateNextContextOptions): Promise<AuthContext> => {
  const { req, res } = opts;
  
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  let user = null;
  
  if (token) {
    try {
      user = await AuthService.verifyToken(token);
    } catch (error) {
      // Token is invalid or expired, but we don't throw here
      // Let the protected procedures handle this
      user = null;
    }
  }
  
  return {
    user: user || undefined,
    session: null, // You can implement session logic here if needed
  };
};

export const enforceUserIsAuthed = (ctx: AuthContext) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  
  return ctx;
};

export const enforceUserIsAdmin = (ctx: AuthContext) => {
  const authedCtx = enforceUserIsAuthed(ctx);
  
  // Check if user has admin privileges (role 1 or 2)
  if (authedCtx.user?.role === RoleEnum.admin || authedCtx.user?.role === RoleEnum.paymentStaff) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
  
  return authedCtx;
};

export const enforceUserIsSuperAdmin = (ctx: AuthContext) => {
  const authedCtx = enforceUserIsAuthed(ctx);
  
  // Check if user has super admin privileges (role 1)
  if (authedCtx.user?.role !== RoleEnum.admin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Super admin access required',
    });
  }
  
  return authedCtx;
};

export const enforceUserIsActive = (ctx: AuthContext) => {
  const authedCtx = enforceUserIsAuthed(ctx);

  if (!authedCtx.user?.isActive) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Account is deactivated',
    });
  }
  
  return authedCtx;
};

export const enforceUserRole = (allowedRoles: number[]) => {
  return (ctx: AuthContext) => {
    const authedCtx = enforceUserIsAuthed(ctx);

    if (!allowedRoles.includes(authedCtx.user?.role ?? -1)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }
    
    return authedCtx;
  };
};

export const hasRole = (user: AuthContext['user'], role: number): boolean => {
  return user?.role === role;
};

export const hasAnyRole = (user: AuthContext['user'], roles: number[]): boolean => {
  return user ? roles.includes(user.role) : false;
};

export const isAdmin = (user: AuthContext['user']): boolean => {
  return hasAnyRole(user, [1, 2]);
};

export const isSuperAdmin = (user: AuthContext['user']): boolean => {
  return hasRole(user, 1);
};