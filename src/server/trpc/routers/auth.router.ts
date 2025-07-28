import { z } from "zod";
import {
  publicProcedure,
  protectedProcedure,
  createTRPCRouter,
} from "@/server/trpc/trpc";
import { AuthService } from "@/server/trpc/services/auth-service";
import { TRPCError } from "@trpc/server";
import {
  changePasswordValidator,
  cinValidator,
  loginValidator,
  registerUserValidator,
  resetPasswordValidator,
  userIdValidator,
} from "../validators/user-validator";

export const authRouter = createTRPCRouter({
  /**
   * Login user with CIN and password
   */
  login: publicProcedure
    .input(loginValidator)
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
          code: "INTERNAL_SERVER_ERROR",
          message: "Login failed",
        });
      }
    }),

  /**
   * Register new user
   */
  register: publicProcedure
    .input(registerUserValidator)
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
          code: "INTERNAL_SERVER_ERROR",
          message: "Registration failed",
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
          code: "UNAUTHORIZED",
          message: "Token verification failed",
        });
      }
    }),

  /**
   * Get current user (requires authentication)
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Assuming ctx.user is set by your authentication middleware
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      return await AuthService.getUserById(ctx.user.id);
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get user info",
      });
    }
  }),

  /**
   * Get user by CIN (admin only)
   */
  getUserByCin: protectedProcedure
    .input(cinValidator)
    .query(async ({ input, ctx }) => {
      try {
        // Check if user has admin privileges (role 1 or 2)
        if (!ctx.user || (ctx.user.role !== 1 && ctx.user.role !== 2)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin access required",
          });
        }

        return await AuthService.getUserByCin(input.cin);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get user",
        });
      }
    }),

  /**
   * Change user password (requires authentication)
   */
  changePassword: protectedProcedure
    .input(changePasswordValidator)
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          });
        }

        if (input.confirmPassword !== input.newPassword) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "New password and confirmation do not match",
          });
        }

        if (input.currentPassword === input.newPassword) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "New password cannot be the same as current password",
          });
        }

        await AuthService.changePassword(
          ctx.user.id,
          input.currentPassword,
          input.newPassword
        );

        return { success: true, message: "Password changed successfully" };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Password change failed",
        });
      }
    }),

  /**
   * Reset user password (admin only)
   */
  resetPassword: protectedProcedure
    .input(resetPasswordValidator)
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if user has admin privileges (role 1 or 2)
        if (!ctx.user || (ctx.user.role !== 1 && ctx.user.role !== 2)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin access required",
          });
        }

        if (input.confirmPassword !== input.newPassword) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "New password and confirmation do not match",
          });
        }

        await AuthService.resetPassword(input.cin, input.newPassword);

        return { success: true, message: "Password reset successfully" };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Password reset failed",
        });
      }
    }),

  /**
   * Deactivate user account (admin only)
   */
  deactivateUser: protectedProcedure
    .input(userIdValidator)
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if user has admin privileges (role 1 or 2)
        if (!ctx.user || (ctx.user.role !== 1 && ctx.user.role !== 2)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin access required",
          });
        }

        // Prevent self-deactivation
        if (ctx.user.id === input.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot deactivate your own account",
          });
        }

        await AuthService.deactivateUser(input.id);

        return { success: true, message: "User deactivated successfully" };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User deactivation failed",
        });
      }
    }),

  /**
   * Reactivate user account (admin only)
   */
  reactivateUser: protectedProcedure
    .input(userIdValidator)
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if user has admin privileges (role 1 or 2)
        if (!ctx.user || (ctx.user.role !== 1 && ctx.user.role !== 2)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin access required",
          });
        }

        await AuthService.reactivateUser(input.id);

        return { success: true, message: "User reactivated successfully" };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User reactivation failed",
        });
      }
    }),

  /**
   * Logout user (clears session)
   */
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Clear session if using session-based auth
      if (ctx.session) {
        ctx.session.user = null;
      }

      return { success: true, message: "Logged out successfully" };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Logout failed",
      });
    }
  }),
});
