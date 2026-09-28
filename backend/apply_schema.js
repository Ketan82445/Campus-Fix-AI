const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Generating migration DDL from Prisma schema...');
  const sql = execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', {
    encoding: 'utf-8'
  });

  console.log('Splitting and executing SQL statements...');
  
  // Strip single-line comments first
  const noCommentsSql = sql.replace(/^\s*--.*$/gm, '');
  
  // Split on semicolons
  const statements = noCommentsSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Found ${statements.length} SQL statements to execute.`);

  for (let i = 0; i < statements.length; i++) {
    const cleanStmt = statements[i];
    if (!cleanStmt) continue;
    try {
      console.log(`[${i + 1}/${statements.length}] Executing: ${cleanStmt.substring(0, 50).replace(/\n/g, ' ')}...`);
      await prisma.$executeRawUnsafe(cleanStmt);
    } catch (err) {
      if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate key'))) {
        console.log(`  -> Notice: already exists, skipping.`);
      } else {
        console.error(`  -> Failed:`, err.message);
        throw err;
      }
    }
  }

  console.log(' All tables, enums, indexes, and foreign keys created successfully in Supabase!');
}

main()
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
