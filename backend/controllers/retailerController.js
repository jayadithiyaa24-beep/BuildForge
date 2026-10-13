const { runQuery } = require('../config/neo4j');

async function getRetailers(req, res, next) {
  try {
    const cypher = `
      MATCH (r:Retailer)
      OPTIONAL MATCH (l:Listing)-[:OFFERED_BY]->(r)
      RETURN r.retailerId AS retailerId,
             r.name AS name,
             r.websiteUrl AS websiteUrl,
             r.rating AS rating,
             count(l) AS listingCount
      ORDER BY r.name ASC
    `;
    const retailers = await runQuery(cypher);
    res.json({ success: true, count: retailers.length, data: retailers });
  } catch (err) {
    next(err);
  }
}

async function getListings(req, res, next) {
  try {
    const { compId, retailerId } = req.query;
    const cypher = `
      MATCH (c:Component)-[:HAS_LISTING]->(l:Listing)-[:OFFERED_BY]->(r:Retailer)
      WHERE ($compId IS NULL OR c.compId = $compId)
        AND ($retailerId IS NULL OR r.retailerId = $retailerId)
      OPTIONAL MATCH (l)-[:HAS_PRICE_HISTORY]->(ph:PriceHistory)
      WITH c, l, r, count(ph) AS pricePoints, max(ph.recordedAt) AS lastUpdated
      RETURN l.listingId AS listingId,
             l.currentPriceINR AS currentPriceINR,
             l.stockStatus AS stockStatus,
             l.url AS url,
             c.compId AS compId,
             c.model AS componentModel,
             r.retailerId AS retailerId,
             r.name AS retailerName,
             pricePoints,
             lastUpdated
      ORDER BY l.currentPriceINR ASC
    `;
    const listings = await runQuery(cypher, {
      compId: compId || null,
      retailerId: retailerId || null
    });
    res.json({ success: true, count: listings.length, data: listings });
  } catch (err) {
    next(err);
  }
}

async function createListing(req, res, next) {
  try {
    const { compId, retailerId, priceINR, url, stockStatus } = req.body;
    if (!compId || !retailerId || !priceINR) {
      return res.status(400).json({ success: false, error: 'compId, retailerId, and priceINR are required.' });
    }

    const listingId = 'lst-' + Date.now();
    const historyId = 'ph-' + Date.now();
    const today = new Date().toISOString().split('T')[0];

    const cypher = `
      MATCH (c:Component {compId: $compId})
      MATCH (r:Retailer {retailerId: $retailerId})
      CREATE (l:Listing {
        listingId: $listingId,
        url: coalesce($url, r.websiteUrl),
        currentPriceINR: toInteger($priceINR),
        stockStatus: coalesce($stockStatus, 'In Stock')
      })
      CREATE (c)-[:HAS_LISTING]->(l)
      CREATE (l)-[:OFFERED_BY]->(r)
      CREATE (ph:PriceHistory {
        historyId: $historyId,
        priceINR: toInteger($priceINR),
        recordedAt: $today
      })
      CREATE (l)-[:HAS_PRICE_HISTORY]->(ph)
      RETURN l.listingId AS listingId, l.currentPriceINR AS currentPriceINR, c.model AS componentModel, r.name AS retailerName
    `;

    const records = await runQuery(cypher, {
      compId,
      retailerId,
      listingId,
      historyId,
      priceINR,
      url: url || null,
      stockStatus: stockStatus || 'In Stock',
      today
    });

    if (!records.length) {
      return res.status(404).json({ success: false, error: 'Component or Retailer not found.' });
    }

    res.status(201).json({ success: true, message: 'Listing created with initial price history record.', data: records[0] });
  } catch (err) {
    next(err);
  }
}

async function updateListingPrice(req, res, next) {
  try {
    const { id } = req.params;
    const { priceINR } = req.body;
    if (!priceINR) {
      return res.status(400).json({ success: false, error: 'New priceINR is required.' });
    }

    const historyId = 'ph-' + Date.now();
    const today = new Date().toISOString().split('T')[0];

    const cypher = `
      MATCH (l:Listing {listingId: $id})
      SET l.currentPriceINR = toInteger($priceINR)
      CREATE (ph:PriceHistory {
        historyId: $historyId,
        priceINR: toInteger($priceINR),
        recordedAt: $today
      })
      CREATE (l)-[:HAS_PRICE_HISTORY]->(ph)
      RETURN l.listingId AS listingId, l.currentPriceINR AS updatedPriceINR, ph.historyId AS recordedHistoryId
    `;

    const records = await runQuery(cypher, {
      id,
      priceINR,
      historyId,
      today
    });

    if (!records.length) {
      return res.status(404).json({ success: false, error: `Listing with ID ${id} not found.` });
    }

    res.json({
      success: true,
      message: 'Listing price updated and recorded in PriceHistory graph node.',
      data: records[0]
    });
  } catch (err) {
    next(err);
  }
}

async function deleteListing(req, res, next) {
  try {
    const { id } = req.params;
    const checkCypher = `
      MATCH (l:Listing {listingId: $id})
      OPTIONAL MATCH (o:Order)-[:CONTAINS_LISTING]->(l)
      RETURN count(o) AS orderCount
    `;
    const checkRecords = await runQuery(checkCypher, { id });
    if (checkRecords[0] && checkRecords[0].orderCount > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete listing: It is linked to ${checkRecords[0].orderCount} historical order(s).`
      });
    }

    const delCypher = `
      MATCH (l:Listing {listingId: $id})
      OPTIONAL MATCH (l)-[:HAS_PRICE_HISTORY]->(ph:PriceHistory)
      DETACH DELETE ph, l
      RETURN count(l) AS deletedCount
    `;
    const delRecords = await runQuery(delCypher, { id });
    res.json({
      success: true,
      message: `Listing ${id} removed.`,
      deletedCount: delRecords[0] ? delRecords[0].deletedCount : 1
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRetailers,
  getListings,
  createListing,
  updateListingPrice,
  deleteListing
};
