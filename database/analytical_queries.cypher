// ==============================================================================
// BUILDFORGE DA3 - 18 ADVANCED CYPHER DEMONSTRATION QUERIES (DBMS LAB)
// ==============================================================================

// --- Query 1: Components by Selected Category ---
// Purpose: Retrieve all components belonging to a category (e.g., 'cat-cpu')
MATCH (c:Component)-[:BELONGS_TO]->(cat:Category {categoryId: $categoryId})
RETURN c.compId AS id, c.manufacturer AS manufacturer, c.model AS model,
       c.priceINR AS priceINR, c.tdpWatts AS tdpWatts, c.performanceScore AS score,
       c.specs AS specs
ORDER BY c.priceINR ASC;

// --- Query 2: Components Used in a Particular Build ---
// Purpose: Multi-part traversal from a build to its components and categories
MATCH (b:Build {buildId: $buildId})-[rel:CONTAINS]->(c:Component)-[:BELONGS_TO]->(cat:Category)
RETURN cat.name AS category, c.manufacturer AS manufacturer, c.model AS model,
       c.priceINR AS priceINR, c.tdpWatts AS tdpWatts, rel.quantity AS quantity
ORDER BY cat.name ASC;

// --- Query 3: Builds Created by a Selected User ---
// Purpose: Find all custom builds assembled by a specific user
MATCH (u:User {userId: $userId})-[:CREATED]->(b:Build)
OPTIONAL MATCH (b)-[:CONTAINS]->(c:Component)
RETURN b.buildId AS buildId, b.name AS buildName, b.createdAt AS createdAt,
       count(c) AS componentCount, sum(c.priceINR) AS calculatedTotalINR
ORDER BY b.createdAt DESC;

// --- Query 4: Latest Price for a Component Across Retailers ---
// Purpose: Compare current retailer listings for a specific component
MATCH (c:Component {compId: $compId})-[:HAS_LISTING]->(l:Listing)-[:OFFERED_BY]->(r:Retailer)
RETURN c.model AS component, r.name AS retailer, l.currentPriceINR AS priceINR,
       l.stockStatus AS stock, l.url AS storeUrl
ORDER BY l.currentPriceINR ASC;

// --- Query 5: Average Rating of Each Component ---
// Purpose: Aggregate review ratings per component with review count
MATCH (c:Component)
OPTIONAL MATCH (r:Review)-[:REVIEWS]->(c)
WITH c, count(r) AS totalReviews, avg(r.rating) AS rawAvg
RETURN c.compId AS compId, c.manufacturer AS manufacturer, c.model AS model,
       totalReviews,
       round(coalesce(rawAvg, 0.0), 2) AS averageRating
ORDER BY averageRating DESC, totalReviews DESC;

// --- Query 6: Highest Benchmark Scores and Rank Builds ---
// Purpose: Discover top-performing builds ordered by benchmark score
MATCH (b:Build)-[:TESTED_ON]->(bm:Benchmark)
MATCH (u:User)-[:CREATED]->(b)
RETURN b.name AS buildName, u.username AS creator, bm.name AS benchmarkName,
       bm.score AS score, bm.fps1080p AS fps1080p, bm.fps1440p AS fps1440p
ORDER BY bm.score DESC;

// --- Query 7: Components Never Reviewed ---
// Purpose: Negative pattern matching (antijoin in graph)
MATCH (c:Component)
WHERE NOT ()-[:REVIEWS]->(c)
RETURN c.compId AS compId, c.manufacturer AS manufacturer, c.model AS model,
       c.priceINR AS priceINR, c.specs AS specs
ORDER BY c.priceINR DESC;

// --- Query 8: Recommend Alternative Components ---
// Purpose: Recommend alternatives in same category within ±20% price budget
MATCH (target:Component {compId: $compId})-[:BELONGS_TO]->(cat:Category)
MATCH (alt:Component)-[:BELONGS_TO]->(cat)
WHERE alt.compId <> target.compId
  AND alt.priceINR >= target.priceINR * 0.75
  AND alt.priceINR <= target.priceINR * 1.25
RETURN alt.compId AS compId, alt.manufacturer AS manufacturer, alt.model AS model,
       alt.priceINR AS priceINR, alt.performanceScore AS performanceScore,
       (alt.priceINR - target.priceINR) AS priceDifferenceINR,
       alt.specs AS specs
ORDER BY alt.performanceScore DESC;

// --- Query 9: Full User Activity Traversal (360° Graph View) ---
// Purpose: Traverse from User -> Builds, Components, Cart, and Orders in single query
MATCH (u:User {userId: $userId})
OPTIONAL MATCH (u)-[:CREATED]->(b:Build)-[:CONTAINS]->(bc:Component)
OPTIONAL MATCH (u)-[:HAS_CART]->(cart:Cart)-[:CONTAINS_BUILD]->(cb:Build)
OPTIONAL MATCH (u)-[:PLACED]->(o:Order)-[:CONTAINS_LISTING]->(l:Listing)<-[:HAS_LISTING]-(oc:Component)
RETURN u.username AS username,
       collect(DISTINCT b.name) AS createdBuilds,
       collect(DISTINCT bc.model) AS usedComponents,
       collect(DISTINCT cb.name) AS cartBuilds,
       collect(DISTINCT o.orderId) AS placedOrders;

// --- Query 10: Components Shared Across Multiple Builds ---
// Purpose: Find overlap / popularity by finding parts in > 1 build
MATCH (c:Component)<-[:CONTAINS]-(b:Build)
WITH c, count(DISTINCT b) AS buildCount, collect(b.name) AS usedInBuilds
WHERE buildCount > 1
RETURN c.compId AS compId, c.manufacturer AS manufacturer, c.model AS model,
       buildCount, usedInBuilds
ORDER BY buildCount DESC;

// --- Query 11: Best Price-to-Performance Ratio ---
// Purpose: Calculate value metric (performanceScore / price * 10000)
MATCH (c:Component)
WHERE c.priceINR > 0 AND c.performanceScore IS NOT NULL
RETURN c.model AS model, c.manufacturer AS manufacturer, c.priceINR AS priceINR,
       c.performanceScore AS score,
       round((toFloat(c.performanceScore) / toFloat(c.priceINR)) * 10000, 3) AS valueScore
ORDER BY valueScore DESC
LIMIT 10;

// --- Query 12: Compatible CPU–Motherboard Combinations ---
// Purpose: Graph traversal using explicit COMPATIBLE_WITH edge and socket match
MATCH (cpu:CPU)-[r:COMPATIBLE_WITH]->(mobo:Motherboard)
RETURN cpu.model AS cpuModel, cpu.socketType AS socket,
       mobo.model AS motherboardModel, mobo.formFactor AS formFactor,
       (cpu.priceINR + mobo.priceINR) AS comboPriceINR
ORDER BY comboPriceINR ASC;

// --- Query 13: Detect Socket Mismatches in Builds ---
// Purpose: Database integrity check detecting conflicting hardware in builds
MATCH (b:Build)-[:CONTAINS]->(cpu:CPU)
MATCH (b)-[:CONTAINS]->(mobo:Motherboard)
WHERE cpu.socketType <> mobo.socketType
RETURN b.buildId AS buildId, b.name AS buildName,
       cpu.model AS cpu, cpu.socketType AS cpuSocket,
       mobo.model AS motherboard, mobo.socketType AS moboSocket,
       'INCOMPATIBLE: Socket mismatch' AS validationStatus;

// --- Query 14: Multi-Retailer Price Comparison Matrix ---
// Purpose: Direct retailer price comparison for popular components
MATCH (c:Component)-[:HAS_LISTING]->(l:Listing)-[:OFFERED_BY]->(r:Retailer)
WITH c, collect({retailer: r.name, price: l.currentPriceINR}) AS listings,
     min(l.currentPriceINR) AS lowestPrice,
     max(l.currentPriceINR) AS highestPrice
WHERE size(listings) > 1
RETURN c.model AS component, listings, lowestPrice, highestPrice,
       (highestPrice - lowestPrice) AS savingsOpportunityINR
ORDER BY savingsOpportunityINR DESC;

// --- Query 15: Price History Trend Analysis ---
// Purpose: Track historical price fluctuations and percentage change
MATCH (c:Component)-[:HAS_LISTING]->(l:Listing)-[:OFFERED_BY]->(r:Retailer)
MATCH (l)-[:HAS_PRICE_HISTORY]->(ph:PriceHistory)
WITH c, r, l, ph
ORDER BY ph.recordedAt ASC
WITH c.model AS component, r.name AS retailer,
     collect(ph.priceINR) AS priceTimeline,
     collect(ph.recordedAt) AS dateTimeline
WHERE size(priceTimeline) > 1
RETURN component, retailer,
       priceTimeline[0] AS originalPrice,
       priceTimeline[-1] AS currentPrice,
       (priceTimeline[-1] - priceTimeline[0]) AS priceDifferenceINR,
       round(((toFloat(priceTimeline[-1]) - toFloat(priceTimeline[0])) / toFloat(priceTimeline[0])) * 100, 1) AS percentChange;

// --- Query 16: Most Frequently Used Components Across Builds ---
// Purpose: Frequency ranking of parts chosen by the community
MATCH (c:Component)<-[:CONTAINS]-(b:Build)
RETURN c.model AS component, c.manufacturer AS manufacturer,
       count(b) AS selectionCount
ORDER BY selectionCount DESC
LIMIT 8;

// --- Query 17: Popular Categories by Build Utilization ---
// Purpose: Aggregate builds through parts to categories
MATCH (cat:Category)<-[:BELONGS_TO]-(c:Component)<-[:CONTAINS]-(b:Build)
RETURN cat.name AS category, count(b) AS buildOccurrences,
       count(DISTINCT c) AS uniqueComponentsUsed
ORDER BY buildOccurrences DESC;

// --- Query 18: Related Builds Discovery (Collaborative Graph Traversal) ---
// Purpose: Multi-hop graph recommendation - builds sharing 2+ components with a given build
MATCH (b1:Build {buildId: $buildId})-[:CONTAINS]->(shared:Component)<-[:CONTAINS]-(b2:Build)
WHERE b1 <> b2
WITH b2, count(shared) AS commonPartsCount, collect(shared.model) AS commonParts
WHERE commonPartsCount >= 2
RETURN b2.buildId AS relatedBuildId, b2.name AS relatedBuildName,
       commonPartsCount, commonParts
ORDER BY commonPartsCount DESC;
