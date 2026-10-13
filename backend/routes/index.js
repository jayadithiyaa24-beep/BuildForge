const express = require('express');
const router = express.Router();
const { verifyConnectivity, runQuery } = require('../config/neo4j');

const componentController = require('../controllers/componentController');
const buildController = require('../controllers/buildController');
const retailerController = require('../controllers/retailerController');
const reviewController = require('../controllers/reviewController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const graphController = require('../controllers/graphController');
const analyticsController = require('../controllers/analyticsController');

// ------------------------------------------------------------------------------
// HEALTH & DATABASE CONNECTIVITY
// ------------------------------------------------------------------------------
router.get('/health', async (req, res) => {
  const status = await verifyConnectivity();
  let counts = null;
  if (status.connected) {
    try {
      const stats = await runQuery(`
        OPTIONAL MATCH (u:User) WITH count(u) AS users
        OPTIONAL MATCH (c:Component) WITH users, count(c) AS components
        OPTIONAL MATCH (b:Build) WITH users, components, count(b) AS builds
        OPTIONAL MATCH (r:Retailer) WITH users, components, builds, count(r) AS retailers
        RETURN users, components, builds, retailers
      `);
      counts = stats[0] || null;
    } catch (e) {
      // Ignored if query fails
    }
  }

  res.status(status.connected ? 200 : 503).json({
    status: status.connected ? 'UP' : 'DATABASE_DISCONNECTED',
    database: 'Neo4j Graph Database',
    ...status,
    entityCounts: counts,
    timestamp: new Date().toISOString()
  });
});

// ------------------------------------------------------------------------------
// USERS (For Demo User Switcher)
// ------------------------------------------------------------------------------
router.get('/users', async (req, res, next) => {
  try {
    const users = await runQuery(`
      MATCH (u:User)
      OPTIONAL MATCH (u)-[:CREATED]->(b:Build)
      RETURN u.userId AS userId, u.username AS username, u.email AS email, count(b) AS buildCount
      ORDER BY u.username ASC
    `);
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------------------
// CATEGORIES & COMPONENTS
// ------------------------------------------------------------------------------
router.get('/categories', componentController.getCategories);
router.get('/components', componentController.getComponents);
router.get('/components/:id', componentController.getComponentById);
router.post('/components', componentController.createComponent);
router.put('/components/:id', componentController.updateComponent);
router.delete('/components/:id', componentController.deleteComponent);

// ------------------------------------------------------------------------------
// BUILDS & COMPATIBILITY
// ------------------------------------------------------------------------------
router.get('/builds', buildController.getBuilds);
router.get('/builds/:id', buildController.getBuildById);
router.post('/builds', buildController.createBuild);
router.put('/builds/:id', buildController.updateBuild);
router.delete('/builds/:id', buildController.deleteBuild);
router.get('/builds/:id/compatibility', buildController.checkCompatibility);

// ------------------------------------------------------------------------------
// RETAILERS & LISTINGS
// ------------------------------------------------------------------------------
router.get('/retailers', retailerController.getRetailers);
router.get('/listings', retailerController.getListings);
router.post('/listings', retailerController.createListing);
router.put('/listings/:id/price', retailerController.updateListingPrice);
router.delete('/listings/:id', retailerController.deleteListing);

// ------------------------------------------------------------------------------
// REVIEWS
// ------------------------------------------------------------------------------
router.get('/reviews', reviewController.getReviews);
router.post('/reviews', reviewController.createReview);
router.delete('/reviews/:id', reviewController.deleteReview);

// ------------------------------------------------------------------------------
// CARTS & ORDERS
// ------------------------------------------------------------------------------
router.get('/carts/:userId', cartController.getCart);
router.post('/carts/:userId/items', cartController.addBuildToCart);
router.delete('/carts/:userId/items/:buildId', cartController.removeBuildFromCart);
router.get('/orders/:userId', orderController.getUserOrders);
router.post('/orders/checkout', orderController.checkoutCart);

// ------------------------------------------------------------------------------
// GRAPH VISUALIZATION & EXPANSION
// ------------------------------------------------------------------------------
router.get('/graph', graphController.getGraph);
router.get('/graph/expand/:id', graphController.expandNode);

// ------------------------------------------------------------------------------
// DBMS LAB / ANALYTICS (18 ALLOWLISTED CYPHER QUERIES)
// ------------------------------------------------------------------------------
router.get('/analytics/catalog', analyticsController.getCatalog);
router.get('/analytics/run/:queryId', analyticsController.runAnalytics);
router.post('/analytics/run/:queryId', analyticsController.runAnalytics);

module.exports = router;
