const { runQuery } = require('../config/neo4j');
const { cypherQueries } = require('../queries/cypherQueries');

/**
 * Returns graph data tailored for Cytoscape.js with visual type hints, colors, and properties.
 */
async function getGraph(req, res, next) {
  try {
    const { nodeLabel, relType, limit = 75 } = req.query;

    const cypher = `
      MATCH (n)
      WHERE ($nodeLabel IS NULL OR $nodeLabel IN labels(n))
      WITH n LIMIT toInteger($limit)
      OPTIONAL MATCH (n)-[r]->(m)
      WHERE ($relType IS NULL OR type(r) = $relType)
      RETURN collect(DISTINCT n) AS rawNodes,
             collect(DISTINCT m) AS rawTargetNodes,
             collect(DISTINCT r) AS rawRels
    `;

    const records = await runQuery(cypher, {
      nodeLabel: nodeLabel && nodeLabel !== 'ALL' ? nodeLabel : null,
      relType: relType && relType !== 'ALL' ? relType : null,
      limit: Math.min(Number(limit) || 75, 200)
    });

    if (!records.length) {
      return res.json({ success: true, data: { nodes: [], edges: [] } });
    }

    const { rawNodes = [], rawTargetNodes = [], rawRels = [] } = records[0];

    // Combine all unique nodes
    const nodeMap = new Map();
    [...rawNodes, ...rawTargetNodes].filter(Boolean).forEach(n => {
      const id = String(n.id !== undefined ? n.id : (n.compId || n.buildId || n.userId || n.categoryId || n.retailerId || n.orderId || Math.random()));
      if (!nodeMap.has(id)) {
        const primaryLabel = (n.labels && n.labels.find(l => l !== 'Component')) || (n.labels && n.labels[0]) || 'Node';
        const displayName = n.model || n.name || n.username || n.categoryId || n.orderId || primaryLabel;
        nodeMap.set(id, {
          data: {
            id,
            label: displayName,
            type: primaryLabel,
            labels: n.labels || [],
            ...n
          }
        });
      }
    });

    const edges = [];
    rawRels.filter(Boolean).forEach(r => {
      const sId = String(r.start);
      const tId = String(r.end);
      if (nodeMap.has(sId) && nodeMap.has(tId)) {
        edges.push({
          data: {
            id: String(r.id || `e-${sId}-${tId}-${Math.random()}`),
            source: sId,
            target: tId,
            label: r.type,
            type: r.type,
            properties: r
          }
        });
      }
    });

    res.json({
      success: true,
      data: {
        nodes: Array.from(nodeMap.values()),
        edges,
        stats: {
          nodeCount: nodeMap.size,
          edgeCount: edges.length
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Expand a single node's immediate neighborhood in the graph.
 */
async function expandNode(req, res, next) {
  try {
    const { id } = req.params;

    const cypher = `
      MATCH (n)
      WHERE toString(id(n)) = $id OR elementId(n) = $id OR n.compId = $id OR n.buildId = $id OR n.userId = $id
      MATCH (n)-[r]-(m)
      RETURN n, r, m, startNode(r) AS sNode, endNode(r) AS eNode
      LIMIT 40
    `;

    const records = await runQuery(cypher, { id: String(id) });
    const nodeMap = new Map();
    const edges = [];

    records.forEach(row => {
      [row.n, row.m].forEach(node => {
        if (!node) return;
        const nId = String(node.id);
        if (!nodeMap.has(nId)) {
          const primaryLabel = (node.labels && node.labels.find(l => l !== 'Component')) || (node.labels && node.labels[0]) || 'Node';
          const displayName = node.model || node.name || node.username || node.categoryId || primaryLabel;
          nodeMap.set(nId, {
            data: {
              id: nId,
              label: displayName,
              type: primaryLabel,
              labels: node.labels || [],
              ...node
            }
          });
        }
      });

      if (row.r && row.sNode && row.eNode) {
        const sId = String(row.sNode.id);
        const tId = String(row.eNode.id);
        edges.push({
          data: {
            id: String(row.r.id),
            source: sId,
            target: tId,
            label: row.r.type,
            type: row.r.type,
            properties: row.r
          }
        });
      }
    });

    res.json({
      success: true,
      data: {
        nodes: Array.from(nodeMap.values()),
        edges
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getGraph,
  expandNode
};
