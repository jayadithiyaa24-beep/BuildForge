const { runQuery } = require('../config/neo4j');
const { analyticsCatalog } = require('../queries/cypherQueries');

function getCatalog(req, res) {
  res.json({
    success: true,
    count: analyticsCatalog.length,
    data: analyticsCatalog.map(({ cypher, ...meta }) => ({
      ...meta,
      cypherCode: cypher
    }))
  });
}

async function runAnalytics(req, res, next) {
  try {
    const { queryId } = req.params;
    const item = analyticsCatalog.find(q => q.id === queryId);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: `Allowlisted query with ID '${queryId}' not found. Please choose between query-1 and query-18.`
      });
    }

    // Merge supplied params with defaultParams
    const params = {
      ...item.defaultParams,
      ...(req.body || {}),
      ...(req.query || {})
    };

    const startTime = Date.now();
    const rows = await runQuery(item.cypher, params);
    const executionTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      queryId: item.id,
      name: item.name,
      description: item.description,
      cypher: item.cypher,
      appliedParams: params,
      executionTimeMs,
      rowCount: rows.length,
      data: rows,
      hasGraph: item.hasGraph
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCatalog,
  runAnalytics
};
