const { runQuery } = require('../config/neo4j');
const { cypherQueries } = require('../queries/cypherQueries');

async function getReviews(req, res, next) {
  try {
    const { compId } = req.query;
    if (!compId) {
      // Return all recent reviews
      const cypher = `
        MATCH (r:Review)-[:REVIEWS]->(c:Component)
        MATCH (u:User)-[:WROTE]->(r)
        RETURN r.reviewId AS reviewId,
               r.rating AS rating,
               r.comment AS comment,
               r.createdAt AS createdAt,
               u.userId AS userId,
               u.username AS username,
               c.compId AS compId,
               c.model AS componentModel
        ORDER BY r.createdAt DESC
        LIMIT 50
      `;
      const reviews = await runQuery(cypher);
      return res.json({ success: true, count: reviews.length, data: reviews });
    }

    const reviews = await runQuery(cypherQueries.getComponentReviews, { compId });
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    next(err);
  }
}

async function createReview(req, res, next) {
  try {
    const { compId, userId, rating, comment } = req.body;
    const rVal = Number(rating);

    // Enforce DB-level constraint: Rating between 1 and 5
    if (!compId || isNaN(rVal)) {
      return res.status(400).json({ success: false, error: 'Component ID and numeric rating are required.' });
    }
    if (rVal < 1 || rVal > 5) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed: Review rating must be an integer between 1 and 5 (enforcing DA2 bounds constraint).'
      });
    }

    const reviewId = 'rev-' + Date.now();
    const uId = userId || 'usr-1';

    const records = await runQuery(cypherQueries.createReview, {
      compId,
      userId: uId,
      reviewId,
      rating: Math.round(rVal),
      comment: comment || 'Verified hardware builder review.'
    });

    if (!records.length) {
      return res.status(404).json({ success: false, error: 'Component or User not found.' });
    }

    res.status(201).json({
      success: true,
      message: 'Review successfully written to Neo4j graph.',
      data: records[0]
    });
  } catch (err) {
    next(err);
  }
}

async function deleteReview(req, res, next) {
  try {
    const { id } = req.params;
    const records = await runQuery(cypherQueries.deleteReview, { reviewId: id });
    res.json({
      success: true,
      message: `Review ${id} removed.`,
      deletedCount: records[0] ? records[0].deletedCount : 1
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getReviews,
  createReview,
  deleteReview
};
