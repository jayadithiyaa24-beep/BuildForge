const { getDriver, closeDriver } = require('../config/neo4j');
require('dotenv').config();

async function resetDatabase() {
  console.log('====================================================');
  console.log('  BUILDFORGE DA3 - DATABASE RESET SCRIPT            ');
  console.log('====================================================');

  const driver = getDriver();
  const session = driver.session({ database: process.env.NEO4J_DATABASE || 'neo4j' });

  try {
    console.log('Executing: MATCH (n) DETACH DELETE n...');
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('Database reset completed successfully! Graph is now clean.');
  } catch (err) {
    console.error('Reset failed:', err.message);
    process.exit(1);
  } finally {
    await session.close();
    await closeDriver();
  }
}

if (require.main === module) {
  resetDatabase();
}

module.exports = resetDatabase;
