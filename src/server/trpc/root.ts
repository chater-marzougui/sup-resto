// root.ts

import { createTRPCRouter } from '@/server/trpc/trpc';
import { userRouter } from './routers/user.router';
import { authRouter } from '@/server/trpc/routers/auth.router';
import { mealRouter } from './routers/meal.router';
import { transactionRouter } from './routers/transactions.router';

export const appRouter = createTRPCRouter({
  user: userRouter,
  auth: authRouter,
  meal: mealRouter,
  transaction: transactionRouter,
});

export type AppRouter = typeof appRouter;
