// server/trpc/context.ts
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import jwt from 'jsonwebtoken';

export async function createTRPCContext({ req, res }: CreateNextContextOptions) {
  let user = null;

  // Extract token from Authorization header
  const authorization = req.headers.authorization;
  if (authorization && authorization.startsWith('Bearer ')) {
    const token = authorization.slice(7); // Remove 'Bearer ' prefix
    
    try {
      // Verify and decode the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      user = decoded; // or fetch user from database using decoded.userId
    } catch (error) {
      console.error('Token verification failed:', error);
      // user remains null
    }
  }

  return {
    req,
    res,
    user,
    session: null, // If you're using sessions instead of JWT
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;