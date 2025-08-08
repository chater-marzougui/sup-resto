import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";

export const onlineRouter = createTRPCRouter({
    healthCheck: publicProcedure.query(async () => {
        try {
            // Set a timeout for the DB query
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database timeout')), 3000)
            );

            const dbPromise = db.execute("SELECT 1 as health_check");
            
            // Race between DB query and timeout
            await Promise.race([dbPromise, timeoutPromise]);
            
            return { 
                status: 'ok' as const, 
                timestamp: new Date(),
                database: 'connected'
            };
            
        } catch (error) {
            // Log the error for debugging
            console.error('Health check failed:', error);
            
            // Return error details for better debugging
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Server health check failed',
                cause: error,
            });
        }
    }),

    // Alternative lightweight endpoint that doesn't hit the database
    ping: publicProcedure.query(() => {
        return { 
            status: 'ok' as const, 
            timestamp: new Date(),
            uptime: process.uptime()
        };
    }),
});