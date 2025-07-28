import { z } from 'zod';
import { createTRPCRouter, publicProcedure, adminProcedure, protectedProcedure } from '@/server/trpc/trpc';
import { UserService } from '@/server/trpc/services/user-service';
import { TRPCError } from '@trpc/server';
import {
  cinValidator,
  userIdValidator,
  emailValidator,
  createUserValidator,
  updateUserValidator,
  userFiltersValidator,
  userPaginationValidator,
} from '../validators/user-validator';
export const userRouter = createTRPCRouter({
  /**
   * Get user by CIN (admin only)
   */
  getByCin: adminProcedure
    .input(cinValidator)
    .query(async ({ input }) => {
      try {
        const user = await UserService.getByCin(input.cin);
        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }
        return user;
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
   * Get user by ID (admin only)
   */
  getById: adminProcedure
    .input(userIdValidator)
    .query(async ({ input }) => {
      try {
        const user = await UserService.getById(input.id);
        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }
        return user;
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
   * Get user by email (admin only)
   */
  getByEmail: adminProcedure
    .input(emailValidator)
    .query(async ({ input }) => {
      try {
        const user = await UserService.getByEmail(input.email);
        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }
        return user;
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
   * Create new user (admin only)
   */
  create: adminProcedure
    .input(createUserValidator)
    .mutation(async ({ input }) => {
      try {
        return await UserService.create(input);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user',
        });
      }
    }),

  /**
   * Update user (admin only)
   */
  update: adminProcedure
    .input(updateUserValidator)
    .mutation(async ({ input }) => {
      try {
        return await UserService.update(input);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user',
        });
      }
    }),

  /**
   * Delete user (soft delete - admin only)
   */
  delete: adminProcedure
    .input(userIdValidator)
    .mutation(async ({ input }) => {
      try {
        await UserService.delete(input.id);
        return { success: true, message: 'User deleted successfully' };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete user',
        });
      }
    }),

  /**
   * Hard delete user (permanently remove - admin only)
   */
  hardDelete: adminProcedure
    .input(userIdValidator)
    .mutation(async ({ input }) => {
      try {
        await UserService.hardDelete(input.id);
        return { success: true, message: 'User permanently deleted' };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to permanently delete user',
        });
      }
    }),

  /**
   * Get all users with pagination and filtering (admin only)
   */
  getAll: adminProcedure
    .input(z.object({
      filters: userFiltersValidator,
      pagination: userPaginationValidator.optional(),
    })
    )
    .query(async ({ input }) => {
      try {
        const { filters, pagination } = input;

        return await UserService.getAll(filters, pagination);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get users',
        });
      }
    }),

  /**
   * Get users by role (admin only)
   */
  getByRole: adminProcedure
    .input(z.object({ role: z.number().int().min(1).max(5) }))
    .query(async ({ input }) => {
      try {
        return await UserService.getByRole(input.role);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get users by role',
        });
      }
    }),

  /**
   * Get user statistics (admin only)
   */
  getStats: adminProcedure
    .query(async () => {
      try {
        return await UserService.getStats();
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get user statistics',
        });
      }
    }),

  /**
   * Get current user profile (authenticated users)
   */
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        if (!ctx.user) {
          return;
        }
        return await UserService.getById(ctx.user.id);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get user profile',
        });
      }
    }),

  /**
   * Update current user profile (authenticated users)
   */
  updateProfile: protectedProcedure
    .input(z.object({
      firstName: z.string().min(2).max(50).optional(),
      lastName: z.string().min(2).max(50).optional(),
      email: z.email().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        if(!ctx.user) {
          return;
        }
        return await UserService.update({ id: ctx.user.id, ...input });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
        });
      }
    }),
});