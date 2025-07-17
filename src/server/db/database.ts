import dotenv from "dotenv";
import * as schema from "./schema";
import { PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import logger from "../../config/logger";

dotenv.config();

let db: PostgresJsDatabase<typeof schema>;
let pg: ReturnType<typeof postgres>;

if (process.env.NODE_ENV === "production") {
  pg = postgres(process.env.DATABASE_URL as string);
  db = drizzle(pg, { schema });
} else {
  if (!(global as any).db!) {
    pg = postgres(process.env.DATABASE_URL as string);
    (global as any).db = drizzle(pg, { schema });
  }
  db = (global as any).db;
}

logger.info("Express is connected to Postgres!");

export { db, pg };