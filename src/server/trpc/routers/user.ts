import { z } from 'zod';
import { createTRPCRouter, publicProcedure, adminProcedure } from '@/server/trpc/trpc';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export const userRouter = createTRPCRouter({
  getByCin: publicProcedure
    .input(z.object({ cin: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.cin, input.cin),
      });
      return user;
    }),

  create: adminProcedure
    .input(z.object({
      cin: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email().optional(),
      role: z.enum(['student', 'paymentStaff', 'verificationStaff', 'admin', 'normalUser', 'teacher']).default('student'),
      password: z.string().min(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const newUser = await ctx.db.insert(users).values(input).returning();
      return newUser[0];
    }),

  getAll: adminProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.query.users.findMany();
    }),
});