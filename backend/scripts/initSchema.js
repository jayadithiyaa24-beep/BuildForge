const fs = require('fs');
const path = require('path');
const { getDriver, closeDriver } = require('../config/neo4j');
require('dotenv').config();

async function initSchema() {
  console.log('--- Initializing Neo4j Schema (Constraints & Indexes) ---');
  const schemaPath = path.resolve(__dirname, '../../database/schema.cypher');
  const content = fs.readFileSync(schemaPath, 'utf8');

  // Split into individual statements with comments stripped
  const statements = content
    .split(';')
    .map(s => s.replace(/\/\/.*$/gm, '').trim())
    .filter(s => s.length > 0);

  const driver = getDriver();
  const session = driver.session({ database: process.env.NEO4J_DATABASE || 'neo4j' });

  let successCount = 0;
  try {
    for (const stmt of statements) {
      const cleanStmt = stmt.replace(/\/\/.*$/gm, '').trim();
      if (!cleanStmt) continue;
      try {
        console.log(`Executing: ${cleanStmt.substring(0, 60)}...`);
        await session.run(cleanStmt);
        successCount++;
      } catch (err) {
        console.warn(`Statement warning: ${err.message}`);
      }
    }
    console.log(`Schema initialization completed successfully! (${successCount} constraints/indexes verified)`);
  } catch (err) {
    console.error('Schema initialization failed:', err);
    process.exit(1);
  } finally {
    await session.close();
    await closeDriver();
  }
}

if (require.main === module) {
  initSchema();
}

module.exports = initSchema;
