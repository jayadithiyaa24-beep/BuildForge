export function renderAboutDbPage(app) {
  const container = document.getElementById('page-about');
  container.innerHTML = `
    <div class="sectionTitle" style="margin-top:0;">
      <div>
        <div class="eyebrow">DBMS ARCHITECTURE & COMPARISON</div>
        <h2>Relational Database (SQL) vs Property Graph (Neo4j)</h2>
        <p class="muted">Technical assessment of why Neo4j is uniquely suited for PC configurators, hardware compatibility trees, and recommendation graphs.</p>
      </div>
    </div>

    <!-- Concrete Comparison Table -->
    <div class="tableWrap" style="margin-bottom:32px;">
      <table>
        <thead>
          <tr>
            <th style="width:220px;">Evaluation Dimension</th>
            <th style="width:380px;">Relational Model (Oracle / PostgreSQL)</th>
            <th>Property Graph Model (Neo4j / Cypher)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>Data Model</b></td>
            <td>Tabular: Normalised tables (1NF–BCNF) with rows, columns, and foreign keys.</td>
            <td>Graph: Directed nodes (entities), properties, and first-class typed edges (relationships).</td>
          </tr>
          <tr>
            <td><b>Relationship Representation</b></td>
            <td>Inferred at runtime via foreign keys and associative link tables (e.g. <code>Build_Component</code>).</td>
            <td>Direct pointer connections (Index-Free Adjacency). Traversals follow physical graph pointers.</td>
          </tr>
          <tr>
            <td><b>Many-to-Many Relationships</b></td>
            <td>Requires dedicated junction tables (e.g., <code>Cart_Item</code>, <code>Order_Item</code>, <code>Build_Part</code>).</td>
            <td>Native bidirectional or directed relationships with rich properties (e.g. <code>[:CONTAINS {quantity: 1}]</code>).</td>
          </tr>
          <tr>
            <td><b>Multi-Hop Deep Queries</b></td>
            <td>Exponentially expensive. Each hop requires another SQL <code>JOIN</code>, joining entire index tables.</td>
            <td>Linear complexity relative to the traversed subgraph: <code>O(k)</code> independent of total database size.</td>
          </tr>
          <tr>
            <td><b>Component Recommendations</b></td>
            <td>Complex self-joins and subqueries with nested aggregations that can cause table locks.</td>
            <td>Intuitive graph pattern matching: <code>(b1)-[:CONTAINS]->(c)<-[:CONTAINS]-(b2)</code>.</td>
          </tr>
          <tr>
            <td><b>Compatibility Trees</b></td>
            <td>Requires stored procedures or recursive CTEs checking foreign key pairs and parent socket tables.</td>
            <td>Explicit relationships (<code>[:COMPATIBLE_WITH]</code>) or path traversal across socket nodes.</td>
          </tr>
          <tr>
            <td><b>Polymorphic Hardware Subtypes</b></td>
            <td>Table-per-type or table-per-hierarchy. Leads to many nullable columns or union queries.</td>
            <td>Multiple labels: <code>(:Component:CPU)</code>, <code>(:Component:Motherboard)</code> with custom properties.</td>
          </tr>
          <tr>
            <td><b>Transactions & ACID</b></td>
            <td>Strict ACID with mature two-phase commit, savepoints, and granular isolation levels.</td>
            <td>Full ACID transactions with causal consistency and write transaction clustering.</td>
          </tr>
          <tr>
            <td><b>Aggregation & Reporting</b></td>
            <td>Extremely fast for columnar scans, financial ledger summaries, and large bulk group-bys.</td>
            <td>Optimized for graph aggregations within traversed neighborhoods; slower for global analytical OLAP scans.</td>
          </tr>
          <tr>
            <td><b>Ideal Fit in Production</b></td>
            <td>Billing systems, inventory accounting, regulatory compliance, structured ledgers.</td>
            <td>Hardware configurators, recommendation engines, knowledge graphs, fraud detection networks.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Join vs Traversal Deep Dive -->
    <div class="grid" style="grid-template-columns:1fr 1fr; gap:20px; margin-bottom:32px;">
      <div class="card">
        <div class="badge warn" style="margin-bottom:10px;">DA2 Relational SQL (6 Joins)</div>
        <h3 style="margin-bottom:8px;">Relational Join Execution</h3>
        <p class="muted" style="font-size:13px; line-height:1.6;">
          Retrieving a user's build parts, store listings, and retailer prices required 6 relational join operations:
        </p>
        <div class="codeBox" style="font-size:11.5px;">
<span class="keyword">SELECT</span> u.username, b.name, c.model, r.name, ph.price
<span class="keyword">FROM</span> Users u
<span class="keyword">JOIN</span> Build b <span class="keyword">ON</span> u.user_id = b.user_id
<span class="keyword">JOIN</span> Build_Component bc <span class="keyword">ON</span> b.build_id = bc.build_id
<span class="keyword">JOIN</span> Component c <span class="keyword">ON</span> bc.comp_id = c.comp_id
<span class="keyword">JOIN</span> Listing l <span class="keyword">ON</span> c.comp_id = l.comp_id
<span class="keyword">JOIN</span> Retailer r <span class="keyword">ON</span> l.retailer_id = r.retailer_id
<span class="keyword">JOIN</span> Price_History ph <span class="keyword">ON</span> l.listing_id = ph.listing_id;
        </div>
        <p class="muted" style="font-size:12px;">As the dataset scales to millions of rows, indexing multiple junction tables introduces significant query planning and memory overhead.</p>
      </div>

      <div class="card">
        <div class="badge good" style="margin-bottom:10px;">DA3 Neo4j Cypher (Zero Joins)</div>
        <h3 style="margin-bottom:8px;">Native Graph Path Traversal</h3>
        <p class="muted" style="font-size:13px; line-height:1.6;">
          In Neo4j, relationships are physical pointers stored directly on the nodes. Cypher reads the exact connected path:
        </p>
        <div class="codeBox" style="font-size:11.5px;">
<span class="keyword">MATCH</span> (u:User)-[:CREATED]->(b:Build)
      -[:CONTAINS]->(c:Component)
      -[:HAS_LISTING]->(l:Listing)
      -[:OFFERED_BY]->(r:Retailer)
<span class="keyword">MATCH</span> (l)-[:HAS_PRICE_HISTORY]->(ph:PriceHistory)
<span class="keyword">RETURN</span> u.username, b.name, c.model, r.name, ph.priceINR;
        </div>
        <p class="muted" style="font-size:12px;">Execution time is proportional only to the user's specific build parts, completely unaffected by millions of other components or users in the graph.</p>
      </div>
    </div>

    <!-- Realistic Academic Trade-Off Summary -->
    <div class="card" style="padding:24px; background:var(--panel2);">
      <div class="eyebrow">OBJECTIVE DBMS ASSESSMENT & TRADE-OFFS</div>
      <h3 style="margin:6px 0 10px;">When Should You NOT Use a Graph Database?</h3>
      <p style="font-size:13.5px; line-height:1.65; color:var(--text); margin-bottom:12px;">
        While Neo4j delivers unparalleled developer velocity and query performance for interconnected datasets (like PC building compatibility, part recommendations, and user behavior networks), it is <b>not a universal silver bullet</b>:
      </p>
      <ul style="padding-left:22px; font-size:13px; line-height:1.8; color:var(--muted);">
        <li><b>High-Volume Tabular Analytics (OLAP):</b> Relational column-store databases (e.g., Snowflake, ClickHouse) perform bulk statistical aggregates across billions of unlinked rows significantly faster than graph engines.</li>
        <li><b>Strict Financial Ledgers:</b> Double-entry accounting ledgers and ERP systems have rigid relational schemas where table-level constraints and row locks guarantee strict audit compliance.</li>
        <li><b>Hardware Footprint:</b> Graph engines keep relationship pointer caches in RAM for optimal Index-Free Adjacency, which requires higher memory allocation than disk-based append logs.</li>
      </ul>
      <p style="font-size:13px; margin-top:14px; font-weight:600; color:var(--accent);">
        Conclusion: For BuildForge, the property graph is the optimal paradigm for hardware compatibility verification, multi-retailer price aggregation, and collaborative recommendation discovery.
      </p>
    </div>
  `;
}
