import { z } from 'zod';
import { createTRPCRouter, publicProcedure, adminProcedure, protectedProcedure } from '@/server/trpc/trpc';
import { UserService } from '@/server/trpc/services/user-service';
import { TRPCError } from '@trpc/server';

// Validation schemas
const cinSchema = z.object({
  cin: z.string().min(8, "CIN must be at least 8 characters").max(12, "CIN must be at most 12 characters"),
});

const userIdSchema = z.object({
  id: z.string().min(1, "User ID is required"),
});

const emailSchema = z.object({
  email: z.string().email("Invalid email format"),
});

const createUserSchema = z.object({
  cin: z.string().min(8, "CIN must be at least 8 characters").max(12, "CIN must be at most 12 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name must be at most 50 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name must be at most 50 characters"),
  email: z.string().email("Invalid email format").optional(),
  role: z.number().int().min(1, "Role must be between 1 and 5").max(5, "Role must be between 1 and 5").default(5),
  password: z.string().min(6, "Password must be at least 6 characters").max(128, "Password must be at most 128 characters"),
  balance: z.number().int().min(0, "Balance cannot be negative").default(0),
});

const updateUserSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name must be at most 50 characters").optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name must be at most 50 characters").optional(),
  email: z.string().email("Invalid email format").optional(),
  role: z.number().int().min(1, "Role must be between 1 and 5").max(5, "Role must be between 1 and 5").optional(),
  balance: z.number().int().min(0, "Balance cannot be negative").optional(),
  isActive: z.boolean().optional(),
});

const getUsersSchema = z.object({
  // Filters
  search: z.string().optional(),
  role: z.number().int().min(1).max(5).optional(),
  isActive: z.boolean().optional(),
  
  // Pagination
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'firstName', 'lastName', 'lastLogin']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const updateBalanceSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  balance: z.number().int().min(0, "Balance cannot be negative"),
});

export const userRouter = createTRPCRouter({
  /**
   * Get user by CIN (admin only)
   */
  getByCin: adminProcedure
    .input(cinSchema)
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
    .input(userIdSchema)
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
    .input(emailSchema)
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
    .input(createUserSchema)
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
    .input(updateUserSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;
        return await UserService.update(id, updateData);
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
    .input(userIdSchema)
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
    .input(userIdSchema)
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
    .input(getUsersSchema)
    .query(async ({ input }) => {
      try {
        const { search, role, isActive, page, limit, sortBy, sortOrder } = input;
        
        const filters = { search, role, isActive };
        const pagination = { page, limit, sortBy, sortOrder };
        
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
   * Update user balance (admin only)
   */
  updateBalance: adminProcedure
    .input(updateBalanceSchema)
    .mutation(async ({ input }) => {
      try {
        return await UserService.updateBalance(input.id, input.balance);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user balance',
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
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        if(!ctx.user) {
          return;
        }
        return await UserService.update(ctx.user.id, input);
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