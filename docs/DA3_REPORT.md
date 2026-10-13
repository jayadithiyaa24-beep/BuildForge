# DA3 ACADEMIC REPORT: PC BUILDER ECOSYSTEM (BUILDFORGE)
## Advanced Graph Database Implementation using Neo4j & Cypher

**Course:** Database Management Systems (DBMS)  
**Assessment:** Digital Assignment 3 (DA3)  
**Student Topic:** Graph Database Modeling & Application Development  

---

### 1. Title and Objective

**Title:** BuildForge — PC Builder Ecosystem with Neo4j Graph Database  
**Objective:**  
To re-architect and upgrade the BuildForge PC Builder DBMS project from a relational model (DA2) to a modern Property Graph Database model (DA3) using Neo4j. The objective is to leverage native graph traversals for hardware compatibility validation, multi-retailer marketplace price tracking, collaborative part recommendations, and interactive graph exploration.

---

### 2. Introduction to BuildForge

BuildForge is an intelligent PC building platform that assists computer enthusiasts, gamers, and system integrators in designing custom desktop computers. The system:
- Provides a 6-slot hardware configurator (CPU, Motherboard, GPU, RAM, Storage, Power Supply).
- Verifies physical hardware compatibility (CPU-to-motherboard socket alignment, RAM generation matching, power supply wattage headroom).
- Aggregates multi-retailer listings (MDComputers, PrimeABGB, Amazon, Vedant, EliteHubs) and tracks historical price fluctuations.
- Empowers users to save virtual builds, benchmark performance, manage shopping carts, and place orders.

---

### 3. Existing DA2 Relational Model and DA3 Motivation

In **DA2**, the system was implemented using an Oracle Relational Database with 24 relational tables normalized up to 3NF/BCNF.

#### Why Migrate to a Graph Database in DA3?
1. **Elimination of Costly Multi-Table Joins:** In DA2, inspecting a complete PC build required 6 to 8 relational `JOIN` operations across `Build`, `Build_Component`, `Component`, `CPU`, `Motherboard`, `Listing`, `Retailer`, and `Price_History`. In Neo4j, relationships are stored as direct physical pointers (Index-Free Adjacency), allowing zero-join path traversals in constant time.
2. **Polymorphic Hardware Subtyping:** Hardware parts have distinct specifications (e.g. CPUs have cores/sockets; GPUs have VRAM; PSUs have wattage). In SQL, this required table-per-type or wide tables with numerous nullable fields. Neo4j handles this natively through **Multiple Labels** (`:Component:CPU`, `:Component:GPU`).
3. **Intuitive Recommendation & Compatibility Paths:** Exploring compatibility combinations or finding alternative parts within budget is naturally formulated as finding paths and patterns in a graph network.

---

### 4. Selected Technology: Neo4j

- **Database Model:** Labeled Property Graph (LPG).
- **Query Language:** Cypher (declarative pattern-matching language).
- **Backend Stack:** Node.js, Express, Official `neo4j-driver`.
- **Frontend Stack:** Modern Vanilla JS / React architecture, CSS Earthy Theme, Cytoscape.js for interactive graph visualization.
- **Transactions:** Full ACID compliance for multi-step mutations (e.g., atomic cart checkout).

---

### 5. Explanation of the Property Graph Model

A Property Graph consists of:
1. **Nodes (Vertices):** Discrete domain entities (e.g., Users, Builds, Components, Categories, Retailers).
2. **Labels:** Tags grouping nodes into types or roles (e.g., `:User`, `:Component:CPU`).
3. **Properties:** Key-value pairs stored directly on nodes and edges (e.g., `priceINR: 36999`, `socketType: 'AM5'`).
4. **Relationships (Edges):** Directed, named connections linking two nodes (e.g., `-[:CONTAINS]->`, `-[:BELONGS_TO]->`).

---

### 6. Node Labels and Property Schema

| Node Label | Key Properties & Data Types | Semantic Description |
|---|---|---|
| `User` | `userId` (String, PK), `username` (String), `email` (String), `phone` (String) | Registered customer profile |
| `Category` | `categoryId` (String, PK), `name` (String), `slug` (String), `icon` (String) | Component classification |
| `Component` | `compId` (String, PK), `manufacturer` (String), `model` (String), `priceINR` (Int), `tdpWatts` (Int), `performanceScore` (Int) | Base hardware product record |
| `CPU` | *Subtype of Component*: `socketType` (String), `cores` (Int), `threads` (Int), `baseClockGhz` (Float) | Central processing units |
| `Motherboard`| *Subtype of Component*: `socketType` (String), `formFactor` (String), `ramGeneration` (String) | Main logic boards |
| `GPU` | *Subtype of Component*: `vramGb` (Int), `lengthMm` (Int) | Dedicated graphics cards |
| `RAM` | *Subtype of Component*: `ramGeneration` (String), `capacityGb` (Int), `speedMhz` (Int) | Memory modules |
| `Storage` | *Subtype of Component*: `capacityGb` (Int), `readSpeedMbps` (Int), `interface` (String) | High-speed NVMe/SATA SSDs |
| `PowerSupply`| *Subtype of Component*: `wattage` (Int), `efficiencyRating` (String), `modular` (String) | Power supply units |
| `Build` | `buildId` (String, PK), `name` (String), `createdAt` (Date), `totalEstimatedPrice` (Int), `totalWattage` (Int) | Virtual PC assemblies |
| `Retailer` | `retailerId` (String, PK), `name` (String), `websiteUrl` (String), `rating` (Float) | Hardware retail stores |
| `Listing` | `listingId` (String, PK), `url` (String), `currentPriceINR` (Int), `stockStatus` (String) | Marketplace product offerings |
| `PriceHistory`| `historyId` (String, PK), `priceINR` (Int), `recordedAt` (Date) | Temporal price audits |
| `Cart` | `cartId` (String, PK), `createdAt` (Datetime) | Shopping cart per user |
| `Order` | `orderId` (String, PK), `orderDate` (Date), `totalAmountINR` (Int), `status` (String) | Historical customer orders |
| `Review` | `reviewId` (String, PK), `rating` (Int, 1-5), `comment` (String), `createdAt` (Datetime) | Customer feedback |
| `Benchmark` | `benchId` (String, PK), `name` (String), `score` (Int), `fps1080p` (Int), `fps1440p` (Int) | Synthetic gaming benchmarks |

---

### 7. Relationship Types, Directions, and Cardinalities

- `(:User)-[:CREATED]->(:Build)` — `1 : N`
- `(:Build)-[:CONTAINS {quantity: 1}]->(:Component)` — `M : N`
- `(:Component)-[:BELONGS_TO]->(:Category)` — `N : 1`
- `(:Component)-[:HAS_LISTING]->(:Listing)` — `1 : N`
- `(:Listing)-[:OFFERED_BY]->(:Retailer)` — `N : 1`
- `(:Listing)-[:HAS_PRICE_HISTORY]->(:PriceHistory)` — `1 : N`
- `(:User)-[:HAS_CART]->(:Cart)` — `1 : 1`
- `(:Cart)-[:CONTAINS_BUILD {quantity: 1}]->(:Build)` — `1 : N`
- `(:User)-[:PLACED]->(:Order)` — `1 : N`
- `(:Order)-[:CONTAINS_LISTING {quantity: 1, purchasePriceINR: Int}]->(:Listing)` — `M : N`
- `(:User)-[:WROTE]->(:Review)-[:REVIEWS]->(:Component)` — `1 : N : 1`
- `(:Build)-[:TESTED_ON]->(:Benchmark)` — `1 : N`
- `(:CPU)-[:COMPATIBLE_WITH {socketType: String}]->(:Motherboard)` — `M : N`

---

### 8. Mapping from the Existing ER Model to the Graph Model

1. **Strong Entities to Nodes:** Tables such as `Users`, `Build`, `Component`, `Category`, and `Retailer` map directly to distinct node labels.
2. **Associative / Junction Tables to Directed Relationships:** Tables with composite keys like `Build_Component` and `Cart_Item` become typed graph relationships (`[:CONTAINS]`, `[:CONTAINS_BUILD]`) containing relationship properties (e.g. `quantity: 1`).
3. **Weak Entities to Identifying Relationship Paths:** `Price_History`, `Listing`, and `Review` become graph nodes anchored to their parent entities via directed edges (`[:HAS_LISTING]`, `[:HAS_PRICE_HISTORY]`, `[:REVIEWS]`).
4. **Generalization / Specialization (`ISA`):** The relational subtype tables (`CPU`, `Motherboard`, `GPU`) are modeled seamlessly using Neo4j's native multiple labeling system (`:Component:CPU`).

---

### 9. Constraints and Indexes

```cypher
// Uniqueness Constraints
CREATE CONSTRAINT FOR (u:User) REQUIRE u.userId IS UNIQUE;
CREATE CONSTRAINT FOR (cp:Component) REQUIRE cp.compId IS UNIQUE;
CREATE CONSTRAINT FOR (b:Build) REQUIRE b.buildId IS UNIQUE;
CREATE CONSTRAINT FOR (r:Retailer) REQUIRE r.retailerId IS UNIQUE;
CREATE CONSTRAINT FOR (l:Listing) REQUIRE l.listingId IS UNIQUE;

// Performance Indexes
CREATE INDEX FOR (c:Component) ON (c.model);
CREATE INDEX FOR (cpu:CPU) ON (cpu.socketType);
CREATE INDEX FOR (mobo:Motherboard) ON (mobo.socketType);
CREATE INDEX FOR (l:Listing) ON (l.currentPriceINR);
```

---

### 10. Dataset Design and Sample Records

The dataset contains realistic Indian market configurations (prices in INR):
- **10 Users:** Aarav Sharma, Priya Patel, Rohan Verma, Ananya Iyer, Vikram Singh, Sneha Nair, Karthik Rajan, Divya Mukherjee, Rahul Deshmukh, Meera Reddy.
- **8 Categories:** CPU, Motherboard, GPU, RAM, Storage, Power Supply, Case, CPU Cooler.
- **44 Components:** Covering AMD AM5 (Ryzen 7 7800X3D), Intel LGA1700 (Core i7-14700K), AMD AM4 (Ryzen 5 5600X), NVIDIA RTX 4080/4070 SUPER, DDR5/DDR4 RAM, Samsung 990 Pro SSDs, Corsair RM850e PSUs.
- **5 Retailers:** MDComputers, PrimeABGB, Vedant Computers, Amazon India, EliteHubs.
- **10 Saved Builds:** Balanced configurations representing esports rigs, creator workstations, and budget gaming PCs.

---

### 11. Implementation Architecture

The architecture consists of a 3-tier decoupled system:
1. **Presentation Layer (Frontend):** Modern responsive web UI built with Vanilla JS ES Modules, Cytoscape.js graph rendering engine, responsive CSS tokens, and real-time fetch API communication.
2. **Application Layer (Backend):** Express REST API on Node.js utilizing parameterised Cypher queries, validation middleware, and connection pooling via the official `neo4j-driver`.
3. **Persistence Layer (Database):** Neo4j 5.x graph instance running locally via Bolt or hosted in the cloud on Neo4j Aura Free tier.

---

### 12. CRUD Operation Examples in Cypher

#### Create Component:
```cypher
MATCH (cat:Category {slug: 'cpu'})
CREATE (c:Component:CPU {
  compId: 'cpu-99', manufacturer: 'AMD', model: 'Ryzen 7 9800X3D',
  priceINR: 46999, tdpWatts: 120, performanceScore: 99, socketType: 'AM5'
})
CREATE (c)-[:BELONGS_TO]->(cat);
```

#### Read Component with Average Rating:
```cypher
MATCH (c:Component {compId: 'cpu-1'})
OPTIONAL MATCH (r:Review)-[:REVIEWS]->(c)
RETURN c.model, c.priceINR, round(avg(r.rating), 2) AS avgRating;
```

#### Update Component Price & Add Price History:
```cypher
MATCH (l:Listing {listingId: 'lst-1'})
SET l.currentPriceINR = 35999
CREATE (ph:PriceHistory {historyId: 'ph-new', priceINR: 35999, recordedAt: '2026-03-01'})
CREATE (l)-[:HAS_PRICE_HISTORY]->(ph);
```

#### Delete Component Safely:
```cypher
MATCH (c:Component {compId: 'cpu-99'})
WHERE NOT ()-[:CONTAINS]->(c)
DETACH DELETE c;
```

---

### 13. Ten Meaningful Cypher Analytical Queries

1. **Category Retrieval:** `MATCH (c:Component)-[:BELONGS_TO]->(cat:Category {slug: 'cpu'}) RETURN c.model, c.priceINR ORDER BY c.priceINR;`
2. **Parts of a Build:** `MATCH (b:Build {buildId: 'bld-1001'})-[:CONTAINS]->(c:Component) RETURN c.model, c.priceINR;`
3. **Price Comparison Matrix:** `MATCH (c:Component {compId: 'cpu-1'})-[:HAS_LISTING]->(l:Listing)-[:OFFERED_BY]->(r:Retailer) RETURN r.name, l.currentPriceINR;`
4. **Average Rating Calculation:** `MATCH (c:Component)<-[:REVIEWS]-(r:Review) RETURN c.model, round(avg(r.rating), 2) AS rating ORDER BY rating DESC;`
5. **Top Benchmark Scores:** `MATCH (b:Build)-[:TESTED_ON]->(bm:Benchmark) RETURN b.name, bm.name, bm.score ORDER BY bm.score DESC;`
6. **Graph Anti-Join (Unreviewed Parts):** `MATCH (c:Component) WHERE NOT ()-[:REVIEWS]->(c) RETURN c.model, c.priceINR;`
7. **Alternative Component Recommendation (±25% Budget):** `MATCH (t:Component {compId: 'gpu-1'})-[:BELONGS_TO]->(cat), (alt:Component)-[:BELONGS_TO]->(cat) WHERE alt <> t AND alt.priceINR >= t.priceINR*0.75 AND alt.priceINR <= t.priceINR*1.25 RETURN alt.model, alt.priceINR;`
8. **Socket Compatibility Path:** `MATCH (cpu:CPU)-[:COMPATIBLE_WITH]->(mobo:Motherboard) RETURN cpu.model, mobo.model, cpu.socketType;`
9. **Socket Conflict Detection in Saved Builds:** `MATCH (b:Build)-[:CONTAINS]->(cpu:CPU), (b)-[:CONTAINS]->(mobo:Motherboard) WHERE cpu.socketType <> mobo.socketType RETURN b.name, 'Socket Mismatch!' AS status;`
10. **Collaborative Build Recommendation:** `MATCH (b1:Build {buildId: 'bld-1001'})-[:CONTAINS]->(c)<-[:CONTAINS]-(b2:Build) WHERE b1 <> b2 RETURN b2.name, count(c) AS sharedParts ORDER BY sharedParts DESC;`

---

### 14. Relational Database vs. Neo4j Comparison

| Feature | Relational Database (SQL) | Neo4j (Graph DB) |
|---|---|---|
| **Join Cost** | High (`O(N * M)`) involving index table lookup scans | Negligible (`O(1)` pointer dereferencing per edge) |
| **Schema Evolution** | Requires altering table structures, migration scripts | Flexible: nodes can hold heterogeneous properties |
| **Path Traversal** | Recursive CTEs (slow, hard to read) | Natural Cypher syntax: `(a)-[:REL*1..3]->(b)` |
| **Recommendation Engine** | Computationally prohibitive for real-time traffic | Real-time subgraph pattern matching |

---

### 15. Advantages, Limitations, and Trade-Offs

#### Advantages:
- Fast multi-hop traversals regardless of dataset size.
- Natural alignment between domain mental models and physical graph storage.
- Interactive visualization using libraries like Cytoscape.js.

#### Limitations & Trade-Offs:
- Higher RAM utilization to store relationship pointer caches.
- Relational databases remain superior for high-volume tabular aggregations (OLAP) and rigid accounting ledgers.

---

### 16. Screenshots to Capture During Demonstration

1. **Home Page:** Hero section showing 3D hardware visual, live Neo4j status badge, and featured parts.
2. **PC Builder Workspace:** 6 slots configured, showing live compatibility validation status (`✓ Hardware Fully Compatible`).
3. **Socket Mismatch Error:** Intentionally pairing an AMD AM5 CPU with an Intel LGA1700 Motherboard to demonstrate `❌ Socket Conflict Detection`.
4. **Graph Explorer:** Interactive Cytoscape graph canvas displaying labeled nodes, typed relationships, and side property drawer.
5. **DBMS Lab (Cypher Suite):** Executing Query #8 (Alternative Recommendations) and Query #10 (Shared Components) showing tabular results and millisecond timing.
6. **Cart & Orders:** Transactional checkout confirmation showing order creation and empty cart.

---

### 17. Conclusion

By migrating BuildForge from a relational database in DA2 to Neo4j in DA3, we successfully resolved multi-table join bottlenecks, simplified polymorphic component modeling, and implemented real-time graph compatibility and recommendation queries. The system demonstrates the practical power of graph databases in modern computer engineering applications.
