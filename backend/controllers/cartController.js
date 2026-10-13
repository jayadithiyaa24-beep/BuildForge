const { runQuery } = require('../config/neo4j');
const { cypherQueries } = require('../queries/cypherQueries');

async function getCart(req, res, next) {
  try {
    const { userId } = req.params;
    const uId = userId || 'usr-1';
    const records = await runQuery(cypherQueries.getUserCart, { userId: uId });

    if (!records.length) {
      return res.json({ success: true, data: { cartId: 'cart-' + uId, items: [], totalPrice: 0 } });
    }

    const cart = records[0];
    const items = (cart.items || []).filter(item => item && item.buildId);
    const totalPrice = items.reduce((sum, it) => sum + (it.totalPrice || 0) * (it.quantity || 1), 0);

    res.json({
      success: true,
      data: {
        cartId: cart.cartId,
        items,
        itemCount: items.length,
        totalPrice
      }
    });
  } catch (err) {
    next(err);
  }
}

async function addBuildToCart(req, res, next) {
  try {
    const { userId } = req.params;
    const { buildId } = req.body;
    const uId = userId || 'usr-1';

    if (!buildId) {
      return res.status(400).json({ success: false, error: 'buildId is required.' });
    }

    // First check if build is already in cart (DA2 Trigger TRG_UNIQUE_CART_BUILD enforcement)
    const checkCypher = `
      MATCH (u:User {userId: $userId})-[:HAS_CART]->(cart:Cart)
      OPTIONAL MATCH (cart)-[:CONTAINS_BUILD]->(b:Build {buildId: $buildId})
      RETURN count(b) AS existingCount
    `;
    const checkRecords = await runQuery(checkCypher, { userId: uId, buildId });
    if (checkRecords[0] && checkRecords[0].existingCount > 0) {
      return res.status(409).json({
        success: false,
        error: 'Trigger Constraint Violation (TRG_UNIQUE_CART_BUILD): This build is already present in your cart.'
      });
    }

    const addRecords = await runQuery(cypherQueries.addBuildToCart, { userId: uId, buildId });
    res.status(201).json({
      success: true,
      message: 'Build added to cart.',
      addedCount: addRecords[0] ? addRecords[0].addedCount : 1
    });
  } catch (err) {
    next(err);
  }
}

async function removeBuildFromCart(req, res, next) {
  try {
    const { userId, buildId } = req.params;
    const uId = userId || 'usr-1';
    const records = await runQuery(cypherQueries.removeBuildFromCart, { userId: uId, buildId });
    res.json({
      success: true,
      message: 'Build removed from cart.',
      removedCount: records[0] ? records[0].removedCount : 1
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCart,
  addBuildToCart,
  removeBuildFromCart
};
