const { runQuery, runTransaction } = require('../config/neo4j');
const { cypherQueries } = require('../queries/cypherQueries');

async function getBuilds(req, res, next) {
  try {
    const builds = await runQuery(cypherQueries.getAllBuilds);
    res.json({ success: true, count: builds.length, data: builds });
  } catch (err) {
    next(err);
  }
}

async function getBuildById(req, res, next) {
  try {
    const { id } = req.params;
    const records = await runQuery(cypherQueries.getBuildById, { id });
    if (!records.length) {
      return res.status(404).json({ success: false, error: `Build with ID ${id} not found.` });
    }
    const build = records[0];

    // Also run compatibility check
    const compatRecords = await runQuery(cypherQueries.checkCompatibility, { id });
    const compatibility = compatRecords[0] || { compatibilityStatus: 'UNKNOWN' };

    res.json({
      success: true,
      data: {
        ...build,
        compatibility
      }
    });
  } catch (err) {
    next(err);
  }
}

async function createBuild(req, res, next) {
  try {
    const { userId, name, componentIds, slots } = req.body;
    const uId = userId || 'usr-1';
    const bName = (name || 'My Custom Rig').trim();
    const bId = 'bld-' + Date.now();

    // Collect IDs either from componentIds array or slots object { CPU: 'cpu-1', ... }
    let ids = [];
    if (Array.isArray(componentIds)) {
      ids = componentIds;
    } else if (slots && typeof slots === 'object') {
      ids = Object.values(slots).map(item => (typeof item === 'string' ? item : item && item.compId)).filter(Boolean);
    }

    if (!ids.length) {
      return res.status(400).json({ success: false, error: 'At least one component must be selected for the build.' });
    }

    const cypher = `
      MATCH (u:User {userId: $userId})
      CREATE (b:Build {
        buildId: $buildId,
        name: $name,
        createdAt: toString(datetime().year) + '-' + 
                   substring('0' + toString(datetime().month), size('0' + toString(datetime().month))-2) + '-' + 
                   substring('0' + toString(datetime().day), size('0' + toString(datetime().day))-2),
        status: 'SAVED'
      })
      CREATE (u)-[:CREATED]->(b)
      WITH b
      UNWIND $componentIds AS compId
      MATCH (cp:Component {compId: compId})
      CREATE (b)-[:CONTAINS {quantity: 1}]->(cp)
      WITH b
      MATCH (b)-[:CONTAINS]->(p:Component)
      WITH b, sum(p.priceINR) AS totPrice, sum(p.tdpWatts) AS totWatts
      SET b.totalEstimatedPrice = totPrice,
          b.totalWattage = totWatts + 50
      RETURN b.buildId AS buildId, b.name AS name, b.totalEstimatedPrice AS totalEstimatedPrice, b.totalWattage AS totalWattage
    `;

    const records = await runQuery(cypher, {
      userId: uId,
      name: bName,
      buildId: bId,
      componentIds: ids
    });

    if (!records.length) {
      return res.status(400).json({ success: false, error: `User ${uId} not found or components missing.` });
    }

    // Run compatibility check on newly created build
    const compatRecords = await runQuery(cypherQueries.checkCompatibility, { id: bId });
    const compatibility = compatRecords[0] || { compatibilityStatus: 'UNKNOWN' };

    res.status(201).json({
      success: true,
      message: 'Build successfully saved in Neo4j graph.',
      data: {
        ...records[0],
        compatibility
      }
    });
  } catch (err) {
    next(err);
  }
}

async function updateBuild(req, res, next) {
  try {
    const { id } = req.params;
    const { name, componentIds } = req.body;

    const cypher = `
      MATCH (b:Build {buildId: $id})
      SET b.name = coalesce($name, b.name)
      WITH b
      OPTIONAL MATCH (b)-[rel:CONTAINS]->(:Component)
      DELETE rel
      WITH b
      UNWIND $componentIds AS compId
      MATCH (cp:Component {compId: compId})
      CREATE (b)-[:CONTAINS {quantity: 1}]->(cp)
      WITH b
      MATCH (b)-[:CONTAINS]->(p:Component)
      WITH b, sum(p.priceINR) AS totPrice, sum(p.tdpWatts) AS totWatts
      SET b.totalEstimatedPrice = totPrice,
          b.totalWattage = totWatts + 50
      RETURN b.buildId AS buildId, b.name AS name, b.totalEstimatedPrice AS totalEstimatedPrice
    `;

    const records = await runQuery(cypher, {
      id,
      name: name || null,
      componentIds: Array.isArray(componentIds) ? componentIds : []
    });

    if (!records.length) {
      return res.status(404).json({ success: false, error: `Build with ID ${id} not found.` });
    }

    res.json({ success: true, message: 'Build updated in Neo4j.', data: records[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteBuild(req, res, next) {
  try {
    const { id } = req.params;
    const records = await runQuery(cypherQueries.deleteBuild, { id });
    res.json({
      success: true,
      message: `Build ${id} deleted from Neo4j.`,
      deletedCount: records[0] ? records[0].deletedCount : 1
    });
  } catch (err) {
    next(err);
  }
}

async function checkCompatibility(req, res, next) {
  try {
    const { id } = req.params;
    const records = await runQuery(cypherQueries.checkCompatibility, { id });
    if (!records.length) {
      return res.status(404).json({ success: false, error: `Build with ID ${id} not found.` });
    }
    res.json({ success: true, data: records[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBuilds,
  getBuildById,
  createBuild,
  updateBuild,
  deleteBuild,
  checkCompatibility
};
