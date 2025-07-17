import { pg } from "./database";
import { rmSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import logger from "../../config/logger";

const MIGRATIONS_FOLDER = join(__dirname, "..", "..", "drizzle");

async function resetSchema() {
  try {
    logger.info("Resetting public schema...");
    await pg`DROP SCHEMA public CASCADE;`;
    await pg`CREATE SCHEMA public;`;
    logger.info("✅ Schema reset successfully.");
  } catch (error) {
    logger.error("❌ Failed to reset schema:", error);
    process.exit(1);
  }
}

function deleteMigrationFiles() {
  try {
    rmSync(MIGRATIONS_FOLDER, { recursive: true, force: true });
    logger.info("✅ Deleted migration files.");
  } catch (error) {
    logger.error("❌ Failed to delete migrations folder:", error);
    process.exit(1);
  }
}

function run(command: string) {
  try {
    logger.info(`Running command: ${command}`);
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    logger.error(`❌ Failed to run "${command}"`, error);
    process.exit(1);
  }
}

async function main() {
  await resetSchema();
  deleteMigrationFiles();
  run("npm run db:generate");
  run("npm run db:migrate");
  await pg.end();
}

main();
