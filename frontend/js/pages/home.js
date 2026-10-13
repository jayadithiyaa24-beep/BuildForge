import { api } from '../api.js';

export function renderHomePage(app) {
  const container = document.getElementById('page-home');
  container.innerHTML = `
    <div id="dbHealthBanner" class="dbBanner">Checking Neo4j connection status...</div>

    <div class="hero">
      <div class="heroCopy">
        <div class="eyebrow">Intelligent Graph PC Builder</div>
        <h1>Build smarter.<br><span style="color:var(--accent)">Forge with Neo4j.</span></h1>
        <p>Design your custom PC with graph-powered compatibility checks, multi-retailer price tracking, and deep relationship traversals — backed by native property graph architecture.</p>
        <div class="actions">
          <button class="primary" data-nav="builder">Build My PC →</button>
          <button class="secondary" data-nav="parts">Explore Components</button>
          <button class="secondary" data-nav="lab">Explore DBMS Lab (18 Queries)</button>
        </div>
      </div>
      <div class="heroVisual">
        <div class="pcCase3D"></div>
      </div>
    </div>

    <div class="stats" id="homeStats">
      <div class="stat"><strong id="statComp">44+</strong><span>Components in Neo4j</span></div>
      <div class="stat"><strong id="statBuilds">10+</strong><span>Saved community builds</span></div>
      <div class="stat"><strong id="statRetailers">5</strong><span>Retailers tracked (INR)</span></div>
      <div class="stat"><strong id="statQueries">18</strong><span>Active Cypher queries</span></div>
    </div>

    <div class="sectionTitle">
      <div>
        <div class="eyebrow">DBMS ARCHITECTURE ADVANTAGE</div>
        <h2>Why Neo4j for PC Building?</h2>
      </div>
      <span>Relational vs Graph</span>
    </div>

    <div class="grid">
      <div class="card">
        <div class="badge good" style="margin-bottom:12px;">Relationship Traversal</div>
        <h3 style="margin-bottom:8px;">Zero-Join Compatibility</h3>
        <p class="muted">Instead of costly multi-table SQL joins across subtypes, Cypher traverses <code>(:CPU)-[:COMPATIBLE_WITH]->(:Motherboard)</code> in constant algorithmic time.</p>
      </div>
      <div class="card">
        <div class="badge warn" style="margin-bottom:12px;">Marketplace Network</div>
        <h3 style="margin-bottom:8px;">Multi-Store Price Tracking</h3>
        <p class="muted">Components connect through <code>[:HAS_LISTING]</code> to <code>(:Retailer)</code> and temporal <code>(:PriceHistory)</code> nodes, unlocking instant price-drop insights.</p>
      </div>
      <div class="card">
        <div class="badge" style="margin-bottom:12px;">Graph Recommendations</div>
        <h3 style="margin-bottom:8px;">Collaborative Build Discovery</h3>
        <p class="muted">Find alternative parts and related rigs using multi-hop graph patterns: <code>(b1)-[:CONTAINS]->(c)<-[:CONTAINS]-(b2)</code>.</p>
      </div>
    </div>

    <div class="sectionTitle" style="margin-top:40px;">
      <div>
        <div class="eyebrow">FEATURED HARDWARE</div>
        <h2>Popular Components from Graph</h2>
      </div>
      <button class="secondary" data-nav="parts">View All Hardware →</button>
    </div>

    <div class="grid" id="featuredGrid">
      <div class="card" style="padding:40px; text-align:center;">Loading hardware records from Neo4j...</div>
    </div>
  `;

  // Attach button navigation
  container.querySelectorAll('[data-nav]').forEach(btn => {
    btn.onclick = () => app.navigate(btn.dataset.nav);
  });

  // Load live DB stats and featured components
  loadHomeData(app);
}

async function loadHomeData(app) {
  try {
    const health = await api.getHealth();
    const banner = document.getElementById('dbHealthBanner');
    if (banner) {
      if (health.connected) {
        banner.className = 'dbBanner connected';
        banner.innerHTML = `<span>✓ Neo4j Database Connected: ${health.uri} (${health.serverInfo ? health.serverInfo.agent : 'Aura'}) · ${health.entityCounts ? health.entityCounts.components : '44'} components active</span><button class="secondary" style="padding:4px 10px; font-size:11px;" id="openGraphBtn">View Graph Explorer</button>`;
        const btn = document.getElementById('openGraphBtn');
        if (btn) btn.onclick = () => app.navigate('graph');
      } else {
        banner.className = 'dbBanner';
        banner.innerHTML = `<span>⚠️ Neo4j Database Offline: ${health.suggestion || 'Configure backend/.env with your local Bolt or Neo4j Aura instance'}</span>`;
      }
    }

    // Load components
    const compRes = await api.getComponents({ sortBy: 'score_desc' });
    const grid = document.getElementById('featuredGrid');
    if (grid && compRes.data && compRes.data.length) {
      const top6 = compRes.data.slice(0, 6);
      grid.innerHTML = top6.map(c => `
        <div class="card">
          <img src="${c.imageUrl}" alt="${c.model}" class="componentImg" onerror="this.src='https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=80'">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="badge good">${c.categoryName}</span>
            <span style="font-size:12px; font-weight:700; color:var(--accent);">${c.performanceScore}/100</span>
          </div>
          <h3 style="margin:10px 0 4px; font-size:16px;">${c.model}</h3>
          <p class="muted" style="font-size:12px; margin-bottom:12px;">${c.specs || c.manufacturer}</p>
          <div class="row" style="margin-top:auto;">
            <span>Price</span>
            <span class="price">₹${(c.priceINR || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="actions" style="margin-top:12px;">
            <button class="secondary addToCompareBtn" data-id="${c.compId}" style="flex:1;">Compare</button>
            <button class="primary addDirectBuildBtn" data-id="${c.compId}" data-cat="${c.categorySlug}" style="flex:1;">Add to Build</button>
          </div>
        </div>
      `).join('');

      // Attach actions
      grid.querySelectorAll('.addToCompareBtn').forEach(b => {
        b.onclick = () => {
          const comp = compRes.data.find(x => x.compId === b.dataset.id);
          if (comp) app.addToCompare(comp);
        };
      });
      grid.querySelectorAll('.addDirectBuildBtn').forEach(b => {
        b.onclick = () => {
          const comp = compRes.data.find(x => x.compId === b.dataset.id);
          if (comp) {
            app.setBuildSlot(comp.categorySlug, comp);
            app.navigate('builder');
          }
        };
      });
    }
  } catch (err) {
    console.error('Failed to load home data:', err);
  }
}
