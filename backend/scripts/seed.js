const fs = require('fs');
const path = require('path');
const { getDriver, closeDriver } = require('../config/neo4j');
require('dotenv').config();

async function seedDatabase() {
  console.log('====================================================');
  console.log('  BUILDFORGE DA3 - NEO4J SEEDING SCRIPT             ');
  console.log('====================================================');

  const seedPath = path.resolve(__dirname, '../../database/seed.cypher');
  const content = fs.readFileSync(seedPath, 'utf8');

  // Split on semicolon at line endings
  const rawStatements = content.split(/;\s*[\r\n]+/);
  const statements = rawStatements
    .map(s => s.trim())
    .filter(s => {
      const withoutComments = s.replace(/^\s*\/\/.*$/gm, '').trim();
      return withoutComments.length > 5;
    });

  console.log(`Found ${statements.length} idempotent Cypher seed blocks.`);

  const driver = getDriver();
  const session = driver.session({ database: process.env.NEO4J_DATABASE || 'neo4j' });

  try {
    for (let i = 0; i < statements.length; i++) {
      const cleanStmt = statements[i].replace(/^\s*\/\/.*$/gm, '').trim();
      const firstLine = cleanStmt.split('\n')[0].substring(0, 70);
      console.log(`[Block ${i + 1}/${statements.length}] Running: ${firstLine}...`);
      await session.run(cleanStmt);
    }
    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  } finally {
    await session.close();
    await closeDriver();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
