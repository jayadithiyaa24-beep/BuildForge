const { runQuery } = require('../config/neo4j');
const { cypherQueries } = require('../queries/cypherQueries');

async function getCategories(req, res, next) {
  try {
    const categories = await runQuery(cypherQueries.getAllCategories);
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

async function getComponents(req, res, next) {
  try {
    const { category, search, sortBy } = req.query;
    const params = {
      categorySlug: category && category !== 'all' ? category : null,
      search: search ? search.trim() : null,
      sortBy: sortBy || 'score_desc'
    };
    const components = await runQuery(cypherQueries.getAllComponents, params);
    res.json({ success: true, count: components.length, data: components });
  } catch (err) {
    next(err);
  }
}

async function getComponentById(req, res, next) {
  try {
    const { id } = req.params;
    const records = await runQuery(cypherQueries.getComponentById, { id });
    if (!records.length || !records[0].component) {
      return res.status(404).json({ success: false, error: `Component with ID ${id} not found.` });
    }
    const item = records[0];
    res.json({
      success: true,
      data: {
        ...item.component,
        labels: item.labels,
        categoryName: item.categoryName,
        categorySlug: item.categorySlug,
        reviewCount: item.reviewCount,
        averageRating: item.averageRating,
        listings: item.listings.filter(l => l.listingId),
        priceHistory: item.rawPriceHistory.filter(ph => ph.historyId)
      }
    });
  } catch (err) {
    next(err);
  }
}

async function createComponent(req, res, next) {
  try {
    const {
      compId,
      categoryId,
      categorySlug,
      manufacturer,
      model,
      priceINR,
      tdpWatts,
      performanceScore,
      specs,
      imageUrl,
      socketType,
      formFactor,
      ramGeneration,
      vramGb,
      capacityGb,
      wattage
    } = req.body;

    if (!manufacturer || !model || !priceINR) {
      return res.status(400).json({ success: false, error: 'Manufacturer, model, and priceINR are required.' });
    }

    const id = compId || 'comp-' + Date.now();
    let subtypeLabel = 'Component';

    const slug = (categorySlug || '').toLowerCase();
    if (slug === 'cpu' || socketType && (socketType.startsWith('AM') || socketType.startsWith('LGA'))) {
      subtypeLabel = 'CPU';
    } else if (slug === 'motherboard' || slug === 'mobo') {
      subtypeLabel = 'Motherboard';
    } else if (slug === 'gpu') {
      subtypeLabel = 'GPU';
    } else if (slug === 'ram') {
      subtypeLabel = 'RAM';
    } else if (slug === 'storage') {
      subtypeLabel = 'Storage';
    } else if (slug === 'psu' || slug === 'power-supply') {
      subtypeLabel = 'PowerSupply';
    } else if (slug === 'case') {
      subtypeLabel = 'Case';
    } else if (slug === 'cooler') {
      subtypeLabel = 'Cooler';
    }

    const cypher = `
      MATCH (cat:Category)
      WHERE cat.categoryId = $categoryId OR cat.slug = $categorySlug
      CREATE (c:Component:${subtypeLabel} {
        compId: $id,
        manufacturer: $manufacturer,
        model: $model,
        priceINR: toInteger($priceINR),
        tdpWatts: toInteger(coalesce($tdpWatts, 0)),
        performanceScore: toInteger(coalesce($performanceScore, 80)),
        specs: coalesce($specs, ''),
        imageUrl: coalesce($imageUrl, 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=80'),
        socketType: $socketType,
        formFactor: $formFactor,
        ramGeneration: $ramGeneration,
        vramGb: $vramGb,
        capacityGb: $capacityGb,
        wattage: $wattage
      })
      CREATE (c)-[:BELONGS_TO]->(cat)
      WITH c, cat
      OPTIONAL MATCH (cpu:CPU), (mobo:Motherboard)
      WHERE (c = cpu AND mobo.socketType = c.socketType)
         OR (c = mobo AND cpu.socketType = c.socketType)
      FOREACH (_ IN CASE WHEN c = cpu THEN [1] ELSE [] END |
        MERGE (cpu)-[:COMPATIBLE_WITH {socketType: cpu.socketType}]->(mobo)
      )
      FOREACH (_ IN CASE WHEN c = mobo THEN [1] ELSE [] END |
        MERGE (cpu)-[:COMPATIBLE_WITH {socketType: mobo.socketType}]->(mobo)
      )
      RETURN c {.*} AS component, labels(c) AS labels, cat.name AS categoryName
    `;

    const records = await runQuery(cypher, {
      id,
      categoryId: categoryId || ('cat-' + slug),
      categorySlug: slug || 'cpu',
      manufacturer,
      model,
      priceINR,
      tdpWatts: tdpWatts || 0,
      performanceScore: performanceScore || 80,
      specs: specs || '',
      imageUrl: imageUrl || '',
      socketType: socketType || null,
      formFactor: formFactor || null,
      ramGeneration: ramGeneration || null,
      vramGb: vramGb ? Number(vramGb) : null,
      capacityGb: capacityGb ? Number(capacityGb) : null,
      wattage: wattage ? Number(wattage) : null
    });

    if (!records.length) {
      return res.status(400).json({ success: false, error: 'Could not create component. Check category slug/ID.' });
    }

    res.status(201).json({ success: true, data: records[0] });
  } catch (err) {
    next(err);
  }
}

async function updateComponent(req, res, next) {
  try {
    const { id } = req.params;
    const {
      manufacturer,
      model,
      priceINR,
      tdpWatts,
      performanceScore,
      specs,
      imageUrl,
      socketType,
      formFactor,
      ramGeneration
    } = req.body;

    const cypher = `
      MATCH (c:Component {compId: $id})
      SET c.manufacturer = coalesce($manufacturer, c.manufacturer),
          c.model = coalesce($model, c.model),
          c.priceINR = CASE WHEN $priceINR IS NOT NULL THEN toInteger($priceINR) ELSE c.priceINR END,
          c.tdpWatts = CASE WHEN $tdpWatts IS NOT NULL THEN toInteger($tdpWatts) ELSE c.tdpWatts END,
          c.performanceScore = CASE WHEN $performanceScore IS NOT NULL THEN toInteger($performanceScore) ELSE c.performanceScore END,
          c.specs = coalesce($specs, c.specs),
          c.imageUrl = coalesce($imageUrl, c.imageUrl),
          c.socketType = coalesce($socketType, c.socketType),
          c.formFactor = coalesce($formFactor, c.formFactor),
          c.ramGeneration = coalesce($ramGeneration, c.ramGeneration)
      RETURN c {.*} AS component, labels(c) AS labels
    `;

    const records = await runQuery(cypher, {
      id,
      manufacturer: manufacturer || null,
      model: model || null,
      priceINR: priceINR !== undefined ? priceINR : null,
      tdpWatts: tdpWatts !== undefined ? tdpWatts : null,
      performanceScore: performanceScore !== undefined ? performanceScore : null,
      specs: specs || null,
      imageUrl: imageUrl || null,
      socketType: socketType || null,
      formFactor: formFactor || null,
      ramGeneration: ramGeneration || null
    });

    if (!records.length) {
      return res.status(404).json({ success: false, error: `Component with ID ${id} not found.` });
    }

    res.json({ success: true, data: records[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteComponent(req, res, next) {
  try {
    const { id } = req.params;
    const { force } = req.query;

    const depRecords = await runQuery(cypherQueries.checkComponentDependencies, { id });
    const deps = depRecords[0] || { buildCount: 0, listingCount: 0, orderCount: 0, reviewCount: 0 };

    if (!force && (deps.buildCount > 0 || deps.orderCount > 0)) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete component: It is referenced in ${deps.buildCount} build(s) and ${deps.orderCount} order(s). Pass ?force=true to override for development demo.`,
        dependencies: deps
      });
    }

    const delRecords = await runQuery(cypherQueries.deleteComponent, { id });
    res.json({
      success: true,
      message: `Component ${id} successfully removed from Neo4j database.`,
      deletedCount: delRecords[0] ? delRecords[0].deletedCount : 1
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCategories,
  getComponents,
  getComponentById,
  createComponent,
  updateComponent,
  deleteComponent
};
