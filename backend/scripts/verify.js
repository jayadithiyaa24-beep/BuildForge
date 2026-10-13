const { getDriver, closeDriver, toNative } = require('../config/neo4j');
require('dotenv').config();

async function verifyDatabase() {
  console.log('====================================================');
  console.log('  BUILDFORGE DA3 - DATABASE VERIFICATION SCRIPT     ');
  console.log('====================================================');

  const driver = getDriver();
  const session = driver.session({ database: process.env.NEO4J_DATABASE || 'neo4j' });

  try {
    // 1. Verify Connectivity
    const serverInfo = await driver.getServerInfo();
    console.log(`Connected to: ${serverInfo.address} (${serverInfo.agent})`);

    // 2. Count Nodes by Label
    console.log('\n--- Node Label Breakdown ---');
    const labelRes = await session.run(`
      MATCH (n)
      UNWIND labels(n) AS label
      RETURN label, count(n) AS count
      ORDER BY count DESC
    `);

    labelRes.records.forEach(r => {
      console.log(`  ${r.get('label').padEnd(18)}: ${toNative(r.get('count'))}`);
    });

    // 3. Count Relationships by Type
    console.log('\n--- Relationship Type Breakdown ---');
    const relRes = await session.run(`
      MATCH ()-[r]->()
      RETURN type(r) AS relType, count(r) AS count
      ORDER BY count DESC
    `);
    relRes.records.forEach(r => {
      console.log(`  [:${r.get('relType').padEnd(18)}]: ${toNative(r.get('count'))}`);
    });

    // 4. Test Compatibility Query
    console.log('\n--- Testing CPU-Motherboard Socket Match Verification ---');
    const compRes = await session.run(`
      MATCH (cpu:CPU)-[r:COMPATIBLE_WITH]->(mobo:Motherboard)
      RETURN cpu.model AS cpu, mobo.model AS mobo, r.socketType AS socket
      LIMIT 3
    `);
    compRes.records.forEach(r => {
      console.log(`  [OK] ${r.get('cpu')} <--> ${r.get('mobo')} (Socket: ${r.get('socket')})`);
    });

    console.log('\nAll database verification checks completed successfully!');
  } catch (err) {
    console.error('Verification failed:', err.message);
  } finally {
    await session.close();
    await closeDriver();
  }
}

if (require.main === module) {
  verifyDatabase();
}

module.exports = verifyDatabase;
