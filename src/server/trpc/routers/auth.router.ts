import { z } from "zod";
import { publicProcedure, protectedProcedure, createTRPCRouter } from "@/server/trpc/trpc";
import { AuthService } from "@/server/trpc/services/auth-service";
import { TRPCError } from "@trpc/server";

// Validation schemas
const loginSchema = z.object({
  cin: z.string().min(8, "CIN must be at least 8 characters").max(12, "CIN must be at most 12 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  cin: z.string().min(8, "CIN must be at least 8 characters").max(12, "CIN must be at most 12 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name must be at most 50 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name must be at most 50 characters"),
  email: z.string().email("Invalid email format").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").max(128, "Password must be at most 128 characters"),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").max(128, "New password must be at most 128 characters"),
});

const resetPasswordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").max(128, "New password must be at most 128 characters"),
});

const userIdSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

const cinSchema = z.object({
  cin: z.string().min(8, "CIN must be at least 8 characters").max(12, "CIN must be at most 12 characters"),
});

export const authRouter = createTRPCRouter({
  /**
   * Login user with CIN and password
   */
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await AuthService.login(input);
        
        // Set session if using session-based auth
        if (ctx.session) {
          ctx.session.user = result.user;
        }
        
        return result;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Login failed',
        });
      }
    }),

  /**
   * Register new user
   */
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await AuthService.register(input);
        
        // Set session if using session-based auth
        if (ctx.session) {
          ctx.session.user = result.user;
        }
        
        return result;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Registration failed',
        });
      }
    }),

  /**
   * Verify JWT token and get current user
   */
  verifyToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        return await AuthService.verifyToken(input.token);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Token verification failed',
        });
      }
    }),

  /**
   * Get current user (requires authentication)
   */
  me: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Assuming ctx.user is set by your authentication middleware
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }
        
        return await AuthService.getUserById(ctx.user.id);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get user info',
        });
      }
    }),

  /**
   * Get user by CIN (admin only)
   */
  getUserByCin: protectedProcedure
    .input(cinSchema)
    .query(async ({ input, ctx }) => {
      try {
        // Check if user has admin privileges (role 1 or 2)
        if (!ctx.user || (ctx.user.role !== 1 && ctx.user.role !== 2)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
          });
        }
        
        return await AuthService.getUserByCin(input.cin);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get user',
        });
      }
    }),

  /**
   * Change user password (requires authentication)
   */
  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }
        
        await AuthService.changePassword(ctx.user.id, input.oldPassword, input.newPassword);
        
        return { success: true, message: 'Password changed successfully' };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Password change failed',
        });
      }
    }),

  /**
   * Reset user password (admin only)
   */
  resetPassword: protectedProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if user has admin privileges (role 1 or 2)
        if (!ctx.user || (ctx.user.role !== 1 && ctx.user.role !== 2)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
          });
        }
        
        await AuthService.resetPassword(input.userId, input.newPassword);
        
        return { success: true, message: 'Password reset successfully' };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Password reset failed',
        });
      }
    }),

  /**
   * Deactivate user account (admin only)
   */
  deactivateUser: protectedProcedure
    .input(userIdSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if user has admin privileges (role 1 or 2)
        if (!ctx.user || (ctx.user.role !== 1 && ctx.user.role !== 2)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
          });
        }
        
        // Prevent self-deactivation
        if (ctx.user.id === input.userId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot deactivate your own account',
          });
        }
        
        await AuthService.deactivateUser(input.userId);
        
        return { success: true, message: 'User deactivated successfully' };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'User deactivation failed',
        });
      }
    }),

  /**
   * Reactivate user account (admin only)
   */
  reactivateUser: protectedProcedure
    .input(userIdSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if user has admin privileges (role 1 or 2)
        if (!ctx.user || (ctx.user.role !== 1 && ctx.user.role !== 2)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
          });
        }
        
        await AuthService.reactivateUser(input.userId);
        
        return { success: true, message: 'User reactivated successfully' };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'User reactivation failed',
        });
      }
    }),

  /**
   * Logout user (clears session)
   */
  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        // Clear session if using session-based auth
        if (ctx.session) {
          ctx.session.user = null;
        }
        
        return { success: true, message: 'Logged out successfully' };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Logout failed',
        });
      }
    }),
});