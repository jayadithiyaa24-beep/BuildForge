// ==============================================================================
// BUILDFORGE DA3 - CYPHER QUERIES CATALOG & QUERY GENERATORS
// All persistent operations strictly use parameterized Cypher
// ==============================================================================

const cypherQueries = {
  // ----------------------------------------------------------------------------
  // CATEGORIES
  // ----------------------------------------------------------------------------
  getAllCategories: `
    MATCH (c:Category)
    OPTIONAL MATCH (cp:Component)-[:BELONGS_TO]->(c)
    RETURN c.categoryId AS categoryId, c.name AS name, c.slug AS slug, c.icon AS icon,
           count(cp) AS componentCount
    ORDER BY c.name ASC
  `,

  // ----------------------------------------------------------------------------
  // COMPONENTS (CRUD)
  // ----------------------------------------------------------------------------
  getAllComponents: `
    MATCH (c:Component)-[:BELONGS_TO]->(cat:Category)
    WHERE ($categorySlug IS NULL OR cat.slug = $categorySlug)
      AND ($search IS NULL OR toLower(c.model) CONTAINS toLower($search) OR toLower(c.manufacturer) CONTAINS toLower($search))
    OPTIONAL MATCH (r:Review)-[:REVIEWS]->(c)
    WITH c, cat, count(r) AS reviewCount, avg(r.rating) AS avgRating
    RETURN c.compId AS compId,
           c.manufacturer AS manufacturer,
           c.model AS model,
           c.priceINR AS priceINR,
           c.tdpWatts AS tdpWatts,
           c.performanceScore AS performanceScore,
           c.specs AS specs,
           c.imageUrl AS imageUrl,
           c.socketType AS socketType,
           c.formFactor AS formFactor,
           c.ramGeneration AS ramGeneration,
           c.vramGb AS vramGb,
           c.capacityGb AS capacityGb,
           c.wattage AS wattage,
           cat.categoryId AS categoryId,
           cat.name AS categoryName,
           cat.slug AS categorySlug,
           labels(c) AS labels,
           reviewCount,
           round(coalesce(avgRating, 0.0), 2) AS averageRating
    ORDER BY
      CASE WHEN $sortBy = 'price_asc' THEN c.priceINR END ASC,
      CASE WHEN $sortBy = 'price_desc' THEN c.priceINR END DESC,
      CASE WHEN $sortBy = 'score_desc' THEN c.performanceScore END DESC,
      CASE WHEN $sortBy = 'name_asc' THEN c.model END ASC,
      c.model ASC
  `,

  getComponentById: `
    MATCH (c:Component {compId: $id})-[:BELONGS_TO]->(cat:Category)
    OPTIONAL MATCH (r:Review)-[:REVIEWS]->(c)
    OPTIONAL MATCH (c)-[:HAS_LISTING]->(l:Listing)-[:OFFERED_BY]->(ret:Retailer)
    OPTIONAL MATCH (l)-[:HAS_PRICE_HISTORY]->(ph:PriceHistory)
    WITH c, cat,
         count(DISTINCT r) AS reviewCount,
         round(coalesce(avg(r.rating), 0.0), 2) AS averageRating,
         collect(DISTINCT {
           listingId: l.listingId,
           currentPriceINR: l.currentPriceINR,
           stockStatus: l.stockStatus,
           url: l.url,
           retailerId: ret.retailerId,
           retailerName: ret.name
         }) AS listings,
         collect(DISTINCT {
           historyId: ph.historyId,
           priceINR: ph.priceINR,
           recordedAt: ph.recordedAt,
           listingId: l.listingId
         }) AS rawPriceHistory
    RETURN c {.*} AS component,
           labels(c) AS labels,
           cat.name AS categoryName,
           cat.slug AS categorySlug,
           reviewCount,
           averageRating,
           listings,
           rawPriceHistory
  `,

  checkComponentDependencies: `
    MATCH (c:Component {compId: $id})
    OPTIONAL MATCH (b:Build)-[:CONTAINS]->(c)
    OPTIONAL MATCH (c)-[:HAS_LISTING]->(l:Listing)
    OPTIONAL MATCH (o:Order)-[:CONTAINS_LISTING]->(l)
    OPTIONAL MATCH (r:Review)-[:REVIEWS]->(c)
    RETURN count(DISTINCT b) AS buildCount,
           count(DISTINCT l) AS listingCount,
           count(DISTINCT o) AS orderCount,
           count(DISTINCT r) AS reviewCount
  `,

  deleteComponent: `
    MATCH (c:Component {compId: $id})
    OPTIONAL MATCH (c)-[:HAS_LISTING]->(l:Listing)
    OPTIONAL MATCH (l)-[:HAS_PRICE_HISTORY]->(ph:PriceHistory)
    OPTIONAL MATCH (r:Review)-[:REVIEWS]->(c)
    DETACH DELETE ph, l, r, c
    RETURN count(c) AS deletedCount
  `,

  // ----------------------------------------------------------------------------
  // BUILDS (CRUD & Validation)
  // ----------------------------------------------------------------------------
  getAllBuilds: `
    MATCH (b:Build)<-[:CREATED]-(u:User)
    OPTIONAL MATCH (b)-[rel:CONTAINS]->(cp:Component)-[:BELONGS_TO]->(cat:Category)
    WITH b, u,
         count(cp) AS partCount,
         sum(cp.priceINR) AS calcTotalINR,
         sum(cp.tdpWatts) AS calcWattage,
         collect({
           compId: cp.compId,
           model: cp.model,
           manufacturer: cp.manufacturer,
           priceINR: cp.priceINR,
           categoryName: cat.name,
           categorySlug: cat.slug,
           socketType: cp.socketType
         }) AS components
    RETURN b.buildId AS buildId,
           b.name AS name,
           b.createdAt AS createdAt,
           b.status AS status,
           coalesce(b.totalEstimatedPrice, calcTotalINR) AS totalEstimatedPrice,
           coalesce(b.totalWattage, calcWattage + 50) AS totalWattage,
           u.userId AS userId,
           u.username AS creatorUsername,
           partCount,
           components
    ORDER BY b.createdAt DESC
  `,

  getBuildById: `
    MATCH (b:Build {buildId: $id})<-[:CREATED]-(u:User)
    OPTIONAL MATCH (b)-[rel:CONTAINS]->(cp:Component)-[:BELONGS_TO]->(cat:Category)
    OPTIONAL MATCH (b)-[:TESTED_ON]->(bm:Benchmark)
    WITH b, u, bm, collect({
      compId: cp.compId,
      manufacturer: cp.manufacturer,
      model: cp.model,
      priceINR: cp.priceINR,
      tdpWatts: cp.tdpWatts,
      performanceScore: cp.performanceScore,
      specs: cp.specs,
      imageUrl: cp.imageUrl,
      socketType: cp.socketType,
      formFactor: cp.formFactor,
      ramGeneration: cp.ramGeneration,
      wattage: cp.wattage,
      categoryName: cat.name,
      categorySlug: cat.slug,
      quantity: rel.quantity
    }) AS components
    RETURN b.buildId AS buildId,
           b.name AS name,
           b.createdAt AS createdAt,
           b.status AS status,
           b.totalEstimatedPrice AS totalEstimatedPrice,
           b.totalWattage AS totalWattage,
           u.userId AS userId,
           u.username AS creatorUsername,
           bm {.*} AS benchmark,
           components
  `,

  deleteBuild: `
    MATCH (b:Build {buildId: $id})
    OPTIONAL MATCH (bm:Benchmark)<-[:TESTED_ON]-(b)
    DETACH DELETE bm, b
    RETURN count(b) AS deletedCount
  `,

  // Check hardware compatibility between chosen CPU, Motherboard, RAM, PSU
  checkCompatibility: `
    MATCH (b:Build {buildId: $id})
    OPTIONAL MATCH (b)-[:CONTAINS]->(cpu:CPU)
    WITH b, head(collect(cpu)) AS cpu
    OPTIONAL MATCH (b)-[:CONTAINS]->(mobo:Motherboard)
    WITH b, cpu, head(collect(mobo)) AS mobo
    OPTIONAL MATCH (b)-[:CONTAINS]->(ram:RAM)
    WITH b, cpu, mobo, head(collect(ram)) AS ram
    OPTIONAL MATCH (b)-[:CONTAINS]->(psu:PowerSupply)
    WITH b, cpu, mobo, ram, head(collect(psu)) AS psu
    OPTIONAL MATCH (b)-[:CONTAINS]->(allParts:Component)
    WITH b, cpu, mobo, ram, psu, sum(coalesce(allParts.tdpWatts, 0)) AS totalTdp
    RETURN b.buildId AS buildId,
           b.name AS buildName,
           cpu.model AS cpuModel,
           cpu.socketType AS cpuSocket,
           mobo.model AS moboModel,
           mobo.socketType AS moboSocket,
           ram.model AS ramModel,
           ram.ramGeneration AS ramGen,
           mobo.ramGeneration AS moboRamGen,
           psu.model AS psuModel,
           psu.wattage AS psuWattage,
           totalTdp,
           CASE
             WHEN cpu IS NULL OR mobo IS NULL THEN 'INCOMPLETE'
             WHEN cpu.socketType <> mobo.socketType THEN 'SOCKET_MISMATCH'
             WHEN ram IS NOT NULL AND mobo.ramGeneration IS NOT NULL AND ram.ramGeneration <> mobo.ramGeneration THEN 'RAM_MISMATCH'
             WHEN psu IS NOT NULL AND psu.wattage < (totalTdp + 80) THEN 'INSUFFICIENT_PSU_WATTAGE'
             ELSE 'COMPATIBLE'
           END AS compatibilityStatus
  `,

  // ----------------------------------------------------------------------------
  // CARTS & ORDERS
  // ----------------------------------------------------------------------------
  getUserCart: `
    MATCH (u:User {userId: $userId})-[:HAS_CART]->(cart:Cart)
    OPTIONAL MATCH (cart)-[rel:CONTAINS_BUILD]->(b:Build)
    OPTIONAL MATCH (b)-[:CONTAINS]->(cp:Component)
    WITH cart, b, rel, count(cp) AS compCount, sum(cp.priceINR) AS buildTotal
    RETURN cart.cartId AS cartId,
           collect(CASE WHEN b IS NOT NULL THEN {
             buildId: b.buildId,
             name: b.name,
             totalPrice: coalesce(b.totalEstimatedPrice, buildTotal),
             quantity: rel.quantity,
             componentCount: compCount,
             addedAt: rel.addedAt
           } END) AS items
  `,

  addBuildToCart: `
    MATCH (u:User {userId: $userId})-[:HAS_CART]->(cart:Cart)
    MATCH (b:Build {buildId: $buildId})
    OPTIONAL MATCH (cart)-[existing:CONTAINS_BUILD]->(b)
    WITH cart, b, existing
    WHERE existing IS NULL
    CREATE (cart)-[rel:CONTAINS_BUILD {quantity: 1, addedAt: datetime().epochMillis}]->(b)
    RETURN count(rel) AS addedCount
  `,

  removeBuildFromCart: `
    MATCH (u:User {userId: $userId})-[:HAS_CART]->(cart:Cart)-[rel:CONTAINS_BUILD]->(b:Build {buildId: $buildId})
    DELETE rel
    RETURN count(rel) AS removedCount
  `,

  getUserOrders: `
    MATCH (u:User {userId: $userId})-[:PLACED]->(o:Order)
    OPTIONAL MATCH (o)-[rel:CONTAINS_LISTING]->(l:Listing)<-[:HAS_LISTING]-(cp:Component)
    OPTIONAL MATCH (l)-[:OFFERED_BY]->(r:Retailer)
    WITH o, collect({
      listingId: l.listingId,
      componentModel: cp.model,
      retailerName: r.name,
      purchasePriceINR: rel.purchasePriceINR,
      quantity: rel.quantity
    }) AS items
    RETURN o.orderId AS orderId,
           o.orderDate AS orderDate,
           o.totalAmountINR AS totalAmountINR,
           o.status AS status,
           items
    ORDER BY o.orderDate DESC
  `,

  // ----------------------------------------------------------------------------
  // REVIEWS
  // ----------------------------------------------------------------------------
  getComponentReviews: `
    MATCH (r:Review)-[:REVIEWS]->(c:Component {compId: $compId})
    MATCH (u:User)-[:WROTE]->(r)
    RETURN r.reviewId AS reviewId,
           r.rating AS rating,
           r.comment AS comment,
           r.createdAt AS createdAt,
           u.userId AS userId,
           u.username AS username
    ORDER BY r.createdAt DESC
  `,

  createReview: `
    MATCH (u:User {userId: $userId})
    MATCH (c:Component {compId: $compId})
    CREATE (r:Review {
      reviewId: $reviewId,
      rating: $rating,
      comment: $comment,
      createdAt: datetime().epochMillis
    })
    CREATE (u)-[:WROTE]->(r)
    CREATE (r)-[:REVIEWS]->(c)
    RETURN r {.*} AS review, u.username AS username
  `,

  deleteReview: `
    MATCH (r:Review {reviewId: $reviewId})
    DETACH DELETE r
    RETURN count(r) AS deletedCount
  `,

  // ----------------------------------------------------------------------------
  // GRAPH VISUALIZATION (CYTOSCAPE.JS ADAPTER)
  // ----------------------------------------------------------------------------
  getGraphData: `
    MATCH (n)
    WHERE ($nodeLabel IS NULL OR $nodeLabel IN labels(n))
    WITH n LIMIT toInteger($limit)
    OPTIONAL MATCH (n)-[r]->(m)
    WHERE ($relType IS NULL OR type(r) = $relType)
      AND ($targetLabel IS NULL OR $targetLabel IN labels(m))
    RETURN collect(DISTINCT {
      id: elementId(n),
      labels: labels(n),
      name: coalesce(n.name, n.model, n.username, n.categoryId, elementId(n)),
      properties: properties(n)
    }) AS nodes,
    collect(DISTINCT CASE WHEN r IS NOT NULL THEN {
      id: elementId(r),
      type: type(r),
      source: elementId(n),
      target: elementId(m),
      properties: properties(r)
    } END) AS edges
  `,

  getNodeNeighbors: `
    MATCH (n) WHERE elementId(n) = $nodeId OR n.compId = $nodeId OR n.buildId = $nodeId OR n.userId = $nodeId
    OPTIONAL MATCH (n)-[r]-(m)
    RETURN collect(DISTINCT {
      id: elementId(n),
      labels: labels(n),
      name: coalesce(n.name, n.model, n.username, elementId(n)),
      properties: properties(n)
    }) + collect(DISTINCT {
      id: elementId(m),
      labels: labels(m),
      name: coalesce(m.name, m.model, m.username, elementId(m)),
      properties: properties(m)
    }) AS nodes,
    collect(DISTINCT {
      id: elementId(r),
      type: type(r),
      source: elementId(startNode(r)),
      target: elementId(endNode(r)),
      properties: properties(r)
    }) AS edges
  `
};

// ------------------------------------------------------------------------------
// THE 18 DBMS LAB DEMONSTRATION CYPHER QUERIES
// ------------------------------------------------------------------------------
const analyticsCatalog = [
  {
    id: 'query-1',
    name: 'Components Belonging to Category',
    category: 'Filtering & Projection',
    description: 'Retrieves all hardware parts categorized under a selected category with specification details, sorted by price.',
    cypher: `MATCH (c:Component)-[:BELONGS_TO]->(cat:Category {slug: $categorySlug})\nRETURN c.compId AS id, c.manufacturer AS manufacturer, c.model AS model,\n       c.priceINR AS priceINR, c.tdpWatts AS tdpWatts, c.performanceScore AS score,\n       c.specs AS specs\nORDER BY c.priceINR ASC;`,
    defaultParams: { categorySlug: 'cpu' },
    hasGraph: false
  },
  {
    id: 'query-2',
    name: 'Components in a Specific PC Build',
    category: 'Relationship Traversal',
    description: 'Traverses the [:CONTAINS] edge from a specific PC build to its constituent components and their parent categories.',
    cypher: `MATCH (b:Build {buildId: $buildId})-[rel:CONTAINS]->(c:Component)-[:BELONGS_TO]->(cat:Category)\nRETURN cat.name AS category, c.manufacturer AS manufacturer, c.model AS model,\n       c.priceINR AS priceINR, c.tdpWatts AS tdpWatts, rel.quantity AS quantity\nORDER BY cat.name ASC;`,
    defaultParams: { buildId: 'bld-1001' },
    hasGraph: true
  },
  {
    id: 'query-3',
    name: 'Builds Created by User',
    category: 'User Activity',
    description: 'Finds all builds designed by a selected user with total component count and calculated build pricing.',
    cypher: `MATCH (u:User {userId: $userId})-[:CREATED]->(b:Build)\nOPTIONAL MATCH (b)-[:CONTAINS]->(c:Component)\nRETURN b.buildId AS buildId, b.name AS buildName, b.createdAt AS createdAt,\n       count(c) AS componentCount, sum(c.priceINR) AS calculatedTotalINR\nORDER BY b.createdAt DESC;`,
    defaultParams: { userId: 'usr-1' },
    hasGraph: true
  },
  {
    id: 'query-4',
    name: 'Latest Component Price Across Retailers',
    category: 'Marketplace Comparison',
    description: 'Cross-references all active retailer listings for a component and displays competitive pricing and stock status.',
    cypher: `MATCH (c:Component {compId: $compId})-[:HAS_LISTING]->(l:Listing)-[:OFFERED_BY]->(r:Retailer)\nRETURN c.model AS component, r.name AS retailer, l.currentPriceINR AS priceINR,\n       l.stockStatus AS stock, l.url AS storeUrl\nORDER BY l.currentPriceINR ASC;`,
    defaultParams: { compId: 'cpu-1' },
    hasGraph: false
  },
  {
    id: 'query-5',
    name: 'Average Rating of Each Component',
    category: 'Aggregation',
    description: 'Aggregates all user reviews for each component and computes the average star rating and review count.',
    cypher: `MATCH (c:Component)\nOPTIONAL MATCH (r:Review)-[:REVIEWS]->(c)\nWITH c, count(r) AS totalReviews, avg(r.rating) AS rawAvg\nRETURN c.compId AS compId, c.manufacturer AS manufacturer, c.model AS model,\n       totalReviews,\n       round(coalesce(rawAvg, 0.0), 2) AS averageRating\nORDER BY averageRating DESC, totalReviews DESC;`,
    defaultParams: {},
    hasGraph: false
  },
  {
    id: 'query-6',
    name: 'Top Benchmark Scores & Ranked Builds',
    category: 'Benchmarking',
    description: 'Ranks custom PC builds by synthetic benchmark scores (Cinebench, 3DMark, game FPS) along with build creator names.',
    cypher: `MATCH (b:Build)-[:TESTED_ON]->(bm:Benchmark)\nMATCH (u:User)-[:CREATED]->(b)\nRETURN b.name AS buildName, u.username AS creator, bm.name AS benchmarkName,\n       bm.score AS score, bm.fps1080p AS fps1080p, bm.fps1440p AS fps1440p\nORDER BY bm.score DESC;`,
    defaultParams: {},
    hasGraph: false
  },
  {
    id: 'query-7',
    name: 'Unreviewed Components (Graph Anti-Join)',
    category: 'Data Integrity',
    description: 'Executes a negative pattern search in the graph to find all hardware parts that have received zero community reviews.',
    cypher: `MATCH (c:Component)\nWHERE NOT ()-[:REVIEWS]->(c)\nRETURN c.compId AS compId, c.manufacturer AS manufacturer, c.model AS model,\n       c.priceINR AS priceINR, c.specs AS specs\nORDER BY c.priceINR DESC;`,
    defaultParams: {},
    hasGraph: false
  },
  {
    id: 'query-8',
    name: 'Recommend Alternative Components (±25% Price)',
    category: 'Recommendation',
    description: 'Finds drop-in alternative hardware within the same category matching price budget and ranking by performance score.',
    cypher: `MATCH (target:Component {compId: $compId})-[:BELONGS_TO]->(cat:Category)\nMATCH (alt:Component)-[:BELONGS_TO]->(cat)\nWHERE alt.compId <> target.compId\n  AND alt.priceINR >= target.priceINR * 0.75\n  AND alt.priceINR <= target.priceINR * 1.25\nRETURN alt.compId AS compId, alt.manufacturer AS manufacturer, alt.model AS model,\n       alt.priceINR AS priceINR, alt.performanceScore AS performanceScore,\n       (alt.priceINR - target.priceINR) AS priceDifferenceINR,\n       alt.specs AS specs\nORDER BY alt.performanceScore DESC;`,
    defaultParams: { compId: 'gpu-1' },
    hasGraph: false
  },
  {
    id: 'query-9',
    name: '360° User Activity Graph Traversal',
    category: 'Multi-Hop Traversal',
    description: 'Traverses user activity across four hops: User -> Saved Builds -> Constituent Parts, Active Carts, and Placed Orders.',
    cypher: `MATCH (u:User {userId: $userId})\nOPTIONAL MATCH (u)-[:CREATED]->(b:Build)-[:CONTAINS]->(bc:Component)\nOPTIONAL MATCH (u)-[:HAS_CART]->(cart:Cart)-[:CONTAINS_BUILD]->(cb:Build)\nOPTIONAL MATCH (u)-[:PLACED]->(o:Order)-[:CONTAINS_LISTING]->(l:Listing)<-[:HAS_LISTING]-(oc:Component)\nRETURN u.username AS username,\n       collect(DISTINCT b.name) AS createdBuilds,\n       collect(DISTINCT bc.model) AS usedComponents,\n       collect(DISTINCT cb.name) AS cartBuilds,\n       collect(DISTINCT o.orderId) AS placedOrders;`,
    defaultParams: { userId: 'usr-1' },
    hasGraph: true
  },
  {
    id: 'query-10',
    name: 'Components Shared Across Multiple Builds',
    category: 'Popularity Analysis',
    description: 'Identifies hardware parts that appear in multiple community builds, indicating high builder consensus.',
    cypher: `MATCH (c:Component)<-[:CONTAINS]-(b:Build)\nWITH c, count(DISTINCT b) AS buildCount, collect(b.name) AS usedInBuilds\nWHERE buildCount > 1\nRETURN c.compId AS compId, c.manufacturer AS manufacturer, c.model AS model,\n       buildCount, usedInBuilds\nORDER BY buildCount DESC;`,
    defaultParams: {},
    hasGraph: true
  },
  {
    id: 'query-11',
    name: 'Best Price-to-Performance Ratio',
    category: 'Analytics & Value',
    description: 'Calculates a normalized price-to-performance index for all components to discover best value configurations.',
    cypher: `MATCH (c:Component)\nWHERE c.priceINR > 0 AND c.performanceScore IS NOT NULL\nRETURN c.model AS model, c.manufacturer AS manufacturer, c.priceINR AS priceINR,\n       c.performanceScore AS score,\n       round((toFloat(c.performanceScore) / toFloat(c.priceINR)) * 10000, 3) AS valueScore\nORDER BY valueScore DESC\nLIMIT 10;`,
    defaultParams: {},
    hasGraph: false
  },
  {
    id: 'query-12',
    name: 'Compatible CPU–Motherboard Combinations',
    category: 'Compatibility',
    description: 'Explores explicit [:COMPATIBLE_WITH] socket relationships between CPUs and motherboards and computes bundle cost.',
    cypher: `MATCH (cpu:CPU)-[r:COMPATIBLE_WITH]->(mobo:Motherboard)\nRETURN cpu.model AS cpuModel, cpu.socketType AS socket,\n       mobo.model AS motherboardModel, mobo.formFactor AS formFactor,\n       (cpu.priceINR + mobo.priceINR) AS comboPriceINR\nORDER BY comboPriceINR ASC\nLIMIT 12;`,
    defaultParams: {},
    hasGraph: true
  },
  {
    id: 'query-13',
    name: 'Detect Socket Mismatches in Builds',
    category: 'Integrity Check',
    description: 'Finds saved builds where the CPU socket type does not match the motherboard socket type.',
    cypher: `MATCH (b:Build)-[:CONTAINS]->(cpu:CPU)\nMATCH (b)-[:CONTAINS]->(mobo:Motherboard)\nWHERE cpu.socketType <> mobo.socketType\nRETURN b.buildId AS buildId, b.name AS buildName,\n       cpu.model AS cpu, cpu.socketType AS cpuSocket,\n       mobo.model AS motherboard, mobo.socketType AS moboSocket,\n       'INCOMPATIBLE: Socket mismatch' AS validationStatus;`,
    defaultParams: {},
    hasGraph: false
  },
  {
    id: 'query-14',
    name: 'Multi-Retailer Price Comparison Matrix',
    category: 'Marketplace',
    description: 'Compares prices across multiple retail stores for the same part, highlighting potential user savings.',
    cypher: `MATCH (c:Component)-[:HAS_LISTING]->(l:Listing)-[:OFFERED_BY]->(r:Retailer)\nWITH c, collect({retailer: r.name, price: l.currentPriceINR}) AS listings,\n     min(l.currentPriceINR) AS lowestPrice,\n     max(l.currentPriceINR) AS highestPrice\nWHERE size(listings) > 1\nRETURN c.model AS component, listings, lowestPrice, highestPrice,\n       (highestPrice - lowestPrice) AS savingsOpportunityINR\nORDER BY savingsOpportunityINR DESC;`,
    defaultParams: {},
    hasGraph: false
  },
  {
    id: 'query-15',
    name: 'Price History Trend & Fluctuation Analysis',
    category: 'Historical Analysis',
    description: 'Analyzes recorded price histories over time, tracking price drops or surges and percentage changes.',
    cypher: `MATCH (c:Component)-[:HAS_LISTING]->(l:Listing)-[:OFFERED_BY]->(r:Retailer)\nMATCH (l)-[:HAS_PRICE_HISTORY]->(ph:PriceHistory)\nWITH c, r, l, ph\nORDER BY ph.recordedAt ASC\nWITH c.model AS component, r.name AS retailer,\n     collect(ph.priceINR) AS priceTimeline,\n     collect(ph.recordedAt) AS dateTimeline\nWHERE size(priceTimeline) > 1\nRETURN component, retailer,\n       priceTimeline[0] AS originalPrice,\n       priceTimeline[-1] AS currentPrice,\n       (priceTimeline[-1] - priceTimeline[0]) AS priceDifferenceINR,\n       round(((toFloat(priceTimeline[-1]) - toFloat(priceTimeline[0])) / toFloat(priceTimeline[0])) * 100, 1) AS percentChange;`,
    defaultParams: {},
    hasGraph: false
  },
  {
    id: 'query-16',
    name: 'Most Frequently Used Components',
    category: 'Popularity',
    description: 'Calculates the selection frequency of each component across all community builds.',
    cypher: `MATCH (c:Component)<-[:CONTAINS]-(b:Build)\nRETURN c.model AS component, c.manufacturer AS manufacturer,\n       count(b) AS selectionCount\nORDER BY selectionCount DESC\nLIMIT 8;`,
    defaultParams: {},
    hasGraph: false
  },
  {
    id: 'query-17',
    name: 'Popular Categories by Build Utilization',
    category: 'Aggregations',
    description: 'Summarizes category popularity based on total inclusion counts across saved builds.',
    cypher: `MATCH (cat:Category)<-[:BELONGS_TO]-(c:Component)<-[:CONTAINS]-(b:Build)\nRETURN cat.name AS category, count(b) AS buildOccurrences,\n       count(DISTINCT c) AS uniqueComponentsUsed\nORDER BY buildOccurrences DESC;`,
    defaultParams: {},
    hasGraph: false
  },
  {
    id: 'query-18',
    name: 'Related Builds via Shared Components (Collaborative Filtering)',
    category: 'Graph Recommendation',
    description: 'Discovers similar builds that share 2 or more components with a selected build through graph traversal.',
    cypher: `MATCH (b1:Build {buildId: $buildId})-[:CONTAINS]->(shared:Component)<-[:CONTAINS]-(b2:Build)\nWHERE b1 <> b2\nWITH b2, count(shared) AS commonPartsCount, collect(shared.model) AS commonParts\nWHERE commonPartsCount >= 2\nRETURN b2.buildId AS relatedBuildId, b2.name AS relatedBuildName,\n       commonPartsCount, commonParts\nORDER BY commonPartsCount DESC;`,
    defaultParams: { buildId: 'bld-1001' },
    hasGraph: true
  }
];

module.exports = {
  cypherQueries,
  analyticsCatalog
};
