import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "@/server/db";

export const onlineRouter = createTRPCRouter({
    check: publicProcedure.query(async () => {
        await db.execute("SELECT 1");
        return { online: true };
    }),
})