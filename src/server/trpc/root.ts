// root.ts

import { createTRPCRouter } from '@/server/trpc/trpc';
import { userRouter } from './routers/user';
import { authRouter } from '@/server/trpc/routers/auth.router';
// import { mealRouter } from './routers/meal';
// import { transactionRouter } from './routers/transaction';

export const appRouter = createTRPCRouter({
  user: userRouter,
  auth: authRouter,
//   meal: mealRouter,
//   transaction: transactionRouter,
});

export type AppRouter = typeof appRouter;
