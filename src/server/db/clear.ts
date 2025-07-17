import "dotenv/config";

import { db, pg } from "./database";
import { sql } from "drizzle-orm";

export async function clear() {
    try {
        console.log("🗑️  Emptying the entire database");

        // Drop all custom types (enums) first
        console.log("🧨 Dropping custom types...");
        const dropTypesQuery = sql.raw(`
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e') LOOP
                    EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
                END LOOP;
            END $$;
        `);
        await db.execute(dropTypesQuery);

        // Drop all tables in public schema
        console.log("🧨 Dropping all tables...");
        const dropTablesQuery = sql.raw(`
            DROP SCHEMA IF EXISTS public CASCADE;
            CREATE SCHEMA public;
            GRANT ALL ON SCHEMA public TO public;
            GRANT ALL ON SCHEMA public TO postgres;
        `);
        await db.execute(dropTablesQuery);

        // Drop drizzle schema
        console.log("🧨 Dropping drizzle schema...");
        await db.execute(sql.raw(`DROP SCHEMA IF EXISTS drizzle CASCADE;`));

        console.log("✅ Database cleared successfully");
    } catch (error) {
        console.error("❌ Error clearing database:", error);
        throw error;
    } finally {
        await pg.end();
    }
}

// Alternative method using table schema
export async function clearWithSchema() {
    try {
        const tableSchema = db._.schema;
        if (!tableSchema) {
            throw new Error("No table schema found");
        }

        console.log("🗑️  Emptying the entire database using schema");
        
        // Drop all custom types first
        console.log("🧨 Dropping custom types...");
        await db.execute(sql.raw(`
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e') LOOP
                    EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
                END LOOP;
            END $$;
        `));

        // Drop tables
        const queries = Object.values(tableSchema).map((table) => {
            console.log(`🧨 Preparing delete query for table: ${table.dbName}`);
            return sql.raw(`DROP TABLE IF EXISTS "${table.dbName}" CASCADE;`);
        });

        console.log("📨 Sending delete queries...");

        await db.transaction(async (tx) => {
            await Promise.all(
                queries.map(async (query) => {
                    if (query) await tx.execute(query);
                })
            );
            await tx.execute(sql.raw(`DROP SCHEMA IF EXISTS drizzle CASCADE;`));
        });

        console.log("✅ Database emptied");
    } catch (error) {
        console.error("❌ Error clearing database:", error);
        throw error;
    } finally {
        await pg.end();
    }
}

// Run the clear function
clear();