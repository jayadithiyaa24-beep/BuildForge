const { runQuery, runTransaction } = require('../config/neo4j');
const { cypherQueries } = require('../queries/cypherQueries');

async function getUserOrders(req, res, next) {
  try {
    const { userId } = req.params;
    const uId = userId || 'usr-1';
    const orders = await runQuery(cypherQueries.getUserOrders, { userId: uId });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    next(err);
  }
}

async function checkoutCart(req, res, next) {
  try {
    const { userId } = req.body;
    const uId = userId || 'usr-1';

    // Execute checkout inside a managed write transaction (matching DA2 CHECKOUT_CART procedure)
    const result = await runTransaction(async (tx, toNative) => {
      // 1. Inspect cart contents with accurate sum (no cartesian product)
      const cartQuery = `
        MATCH (u:User {userId: $userId})-[:HAS_CART]->(cart:Cart)
        MATCH (cart)-[:CONTAINS_BUILD]->(b:Build)
        WITH u, cart, collect(DISTINCT b) AS builds, sum(coalesce(b.totalEstimatedPrice, 0)) AS grandTotal
        UNWIND builds AS b
        OPTIONAL MATCH (b)-[:CONTAINS]->(cp:Component)-[:HAS_LISTING]->(l:Listing)
        WITH u, cart, builds, grandTotal, cp, l
        WITH u, cart, builds, grandTotal, cp, head(collect(l)) AS bestListing
        WITH u, cart, builds, grandTotal, collect(DISTINCT bestListing) AS chosenListings
        RETURN u.userId AS userId,
               size(builds) AS buildCount,
               grandTotal,
               [b IN builds | b.buildId] AS buildIds,
               [l IN chosenListings WHERE l IS NOT NULL | { id: l.listingId, price: l.currentPriceINR }] AS listingItems
      `;
      const cartRes = await tx.run(cartQuery, { userId: uId });
      if (!cartRes.records.length) {
        throw new Error('User cart not found.');
      }
      const cartData = toNative(cartRes.records[0].toObject());
      if (cartData.buildCount === 0) {
        throw new Error('Your cart is empty. Add a build before checkout.');
      }

      const orderId = 'ord-' + Date.now();
      const orderDate = new Date().toISOString().split('T')[0];
      const totalAmount = cartData.grandTotal || 0;

      // 2. Create Order node and link to User
      const createOrderQuery = `
        MATCH (u:User {userId: $userId})
        CREATE (o:Order {
          orderId: $orderId,
          orderDate: $orderDate,
          totalAmountINR: toInteger($totalAmount),
          status: 'ORDER_PLACED'
        })
        CREATE (u)-[:PLACED]->(o)
        WITH o
        UNWIND $listingItems AS item
        MATCH (l:Listing {listingId: item.id})
        CREATE (o)-[:CONTAINS_LISTING {quantity: 1, purchasePriceINR: item.price}]->(l)
        RETURN o.orderId AS orderId, o.totalAmountINR AS totalAmountINR
      `;
      const orderRes = await tx.run(createOrderQuery, {
        userId: uId,
        orderId,
        orderDate,
        totalAmount,
        listingItems: cartData.listingItems || []
      });

      // 3. Clear user's cart items
      const clearCartQuery = `
        MATCH (u:User {userId: $userId})-[:HAS_CART]->(cart:Cart)-[rel:CONTAINS_BUILD]->()
        DELETE rel
      `;
      await tx.run(clearCartQuery, { userId: uId });

      return {
        orderId,
        orderDate,
        totalAmountINR: totalAmount,
        buildsCheckedOut: cartData.buildCount,
        message: 'Order created and user cart emptied atomically via Neo4j transaction.'
      };
    });

    res.status(201).json({
      success: true,
      data: result,
      academicNotice: 'Academic Demonstration Only: Order logged in graph. No real payment charged.'
    });
  } catch (err) {
    if (err.message && err.message.includes('cart is empty')) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next(err);
  }
}

module.exports = {
  getUserOrders,
  checkoutCart
};
