const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  console.log("🔍 Checking connection to Supabase...");
  const prisma = new PrismaClient({
    log: ['error'],
  });

  try {
    // Attempt to run a simple query
    await prisma.$queryRaw`SELECT 1 as result`;
    console.log("✅ SUCCESS! Your database is LIVE and accepting connections.");
    
    // Check if the User table has data
    const userCount = await prisma.user.count();
    console.log(`📊 Found ${userCount} users in the database.`);
    
    if (userCount === 0) {
      console.log("⚠️ WARNING: The database is empty. You need to run 'npm run prisma:seed' to populate it.");
    } else {
      console.log("🎉 Database is seeded and ready to go!");
    }
  } catch (error) {
    console.log("❌ ERROR: Could not connect to the database.");
    console.log("Reason:", error.message);
    console.log("\nIf you are using Supabase free tier, your project might be paused. Please visit https://supabase.com/dashboard to wake it up.");
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
