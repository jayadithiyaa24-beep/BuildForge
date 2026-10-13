const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USERNAME || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'password';
const database = process.env.NEO4J_DATABASE || 'neo4j';

let driver = null;

function getDriver() {
  if (!driver) {
    try {
      driver = neo4j.driver(
        uri,
        neo4j.auth.basic(user, password),
        {
          maxConnectionPoolSize: 50,
          connectionTimeout: 10000,
          disableLosslessIntegers: false
        }
      );
    } catch (err) {
      console.error('Failed to initialize Neo4j driver:', err.message);
      throw err;
    }
  }
  return driver;
}

/**
 * Recursively converts Neo4j types (Integer, Node, Relationship, Date) to native JS objects.
 */
function toNative(val) {
  if (val === null || val === undefined) return val;

  if (neo4j.isInt(val)) {
    return val.inSafeRange() ? val.toNumber() : val.toString();
  }

  if (Array.isArray(val)) {
    return val.map(toNative);
  }

  if (typeof val === 'object') {
    // Check if it is a Neo4j Node
    if (val.labels && val.properties) {
      return {
        _type: 'node',
        id: val.identity ? toNative(val.identity) : undefined,
        labels: val.labels,
        ...toNative(val.properties)
      };
    }
    // Check if it is a Neo4j Relationship
    if (val.type && val.properties && (val.start !== undefined || val.startNodeElementId !== undefined)) {
      return {
        _type: 'relationship',
        id: val.identity ? toNative(val.identity) : undefined,
        type: val.type,
        start: val.start ? toNative(val.start) : val.startNodeElementId,
        end: val.end ? toNative(val.end) : val.endNodeElementId,
        ...toNative(val.properties)
      };
    }
    // Check for Temporal types
    if (typeof val.toString === 'function' && (val.year !== undefined || val.hour !== undefined)) {
      return val.toString();
    }

    const res = {};
    for (const key of Object.keys(val)) {
      res[key] = toNative(val[key]);
    }
    return res;
  }

  return val;
}

/**
 * Execute a parameterized Cypher query with automatic session lifecycle management.
 */
async function runQuery(cypher, params = {}) {
  const currentDriver = getDriver();
  const session = currentDriver.session({ database });
  try {
    const result = await session.run(cypher, params);
    return result.records.map(record => {
      const obj = {};
      record.keys.forEach(k => {
        obj[k] = toNative(record.get(k));
      });
      return obj;
    });
  } finally {
    await session.close();
  }
}

/**
 * Execute queries inside a managed write transaction.
 */
async function runTransaction(txWork) {
  const currentDriver = getDriver();
  const session = currentDriver.session({ database });
  try {
    return await session.executeWrite(async tx => {
      return await txWork(tx, toNative);
    });
  } finally {
    await session.close();
  }
}

/**
 * Verifies connectivity to the configured Neo4j instance.
 */
async function verifyConnectivity() {
  try {
    const currentDriver = getDriver();
    const serverInfo = await currentDriver.getServerInfo();
    return {
      connected: true,
      uri,
      database,
      serverInfo: {
        address: serverInfo.address,
        protocolVersion: serverInfo.protocolVersion,
        agent: serverInfo.agent
      }
    };
  } catch (err) {
    return {
      connected: false,
      uri,
      database,
      error: err.message,
      suggestion: 'Verify that your local Neo4j server is started on ' + uri + ' or check your Neo4j Aura credentials in backend/.env'
    };
  }
}

async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

module.exports = {
  getDriver,
  runQuery,
  runTransaction,
  verifyConnectivity,
  closeDriver,
  toNative,
  neo4j
};
