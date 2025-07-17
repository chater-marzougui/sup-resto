import { users, mealSchedules, transactions, syncLogs } from '../schema';
import { db, pg } from '../database';
import { createSeedUsers, getFakeElements } from './fakeElements';

// Database connection
async function seed() {
  console.log('🌱 Starting database seed...');
  const usersToSeed = await createSeedUsers();

  try {
    // Clear existing data (in reverse order of dependencies)
    console.log('🧹 Cleaning existing data...');
    await db.delete(syncLogs);
    await db.delete(transactions);
    await db.delete(mealSchedules);
    await db.delete(users);

    // Seed Users
    console.log('👥 Seeding users...');
    

    const seedUsers = await db.insert(users).values(usersToSeed).onConflictDoNothing().returning();

    const { mealScheduleData, transactionData, syncLogData } = await getFakeElements(seedUsers);

    console.log(`✅ Created ${seedUsers.length} users`);

    // Seed Meal Schedules
    console.log('🍽️ Seeding meal schedules...');
    const seedMealSchedules = await db.insert(mealSchedules).values(mealScheduleData).returning();
    console.log(`✅ Created ${seedMealSchedules.length} meal schedules`);

    // Seed Transactions
    console.log('💰 Seeding transactions...');

    const seedTransactions = await db.insert(transactions).values(transactionData).returning();
    console.log(`✅ Created ${seedTransactions.length} transactions`);

    // Seed Sync Logs
    console.log('🔄 Seeding sync logs...');

    const seedSyncLogs = await db.insert(syncLogs).values(syncLogData).returning();
    console.log(`✅ Created ${seedSyncLogs.length} sync logs`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`Users: ${seedUsers.length}`);
    console.log(`Meal Schedules: ${seedMealSchedules.length}`);
    console.log(`Transactions: ${seedTransactions.length}`);
    console.log(`Sync Logs: ${seedSyncLogs.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    // Close the database connection
    await pg.end();
  };
}

// Run the seed function
if (require.main === module) {
  seed().catch(console.error);
}

export default seed;