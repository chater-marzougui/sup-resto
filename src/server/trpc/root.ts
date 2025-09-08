// root.ts

import { createTRPCRouter } from '@/server/trpc/trpc';
import { userRouter } from './routers/user.router';
import { authRouter } from '@/server/trpc/routers/auth.router';
import { mealRouter } from './routers/meal.router';
import { transactionRouter } from './routers/transactions.router';
import { analyticsRouter } from './routers/analytics.router';
import { paymentRouter } from './routers/payment-staff.router';
import { onlineRouter } from './routers/online.router';
import { verificationRouter } from './routers/verification-staff.router';

export const appRouter = createTRPCRouter({
  user: userRouter,
  auth: authRouter,
  meal: mealRouter,
  payment: paymentRouter,
  analytics: analyticsRouter,
  transaction: transactionRouter,
  online: onlineRouter,
  verification: verificationRouter,
});

export type AppRouter = typeof appRouter;
