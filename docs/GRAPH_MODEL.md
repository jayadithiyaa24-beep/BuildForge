# BUILDFORGE DA3: GRAPH DATA MODEL & SCHEMA SPECIFICATION

**Project Title:** BuildForge — PC Builder Ecosystem  
**Database:** Neo4j Property Graph Database (5.x / Aura)  
**Query Language:** Cypher  
**Assessment:** DA3 DBMS Mini-Project  

---

## 1. Property Graph Philosophy & Transition from DA2 Relational Model

In **DA2**, the BuildForge data model was implemented in an Oracle Relational Database with 24 relational tables, normalized up to 3NF/BCNF. While relational databases excel at rigid tabular storage, PC configurators suffer from:
1. **Costly Multi-Table Joins**: Querying a PC build required joining `Build`, `Build_Component`, `Component`, `CPU`, `Motherboard`, `Listing`, `Price_History`, and `Retailer` (6–8 join operations).
2. **Rigid Subtyping / Polymorphism**: Modeling polymorphic hardware (CPUs vs Motherboards vs GPUs vs PSUs) required either table-per-hierarchy with hundreds of nullable columns or multi-table joins per subtype.
3. **Complex Compatibility & Graph Traversals**: Checking if hardware fits together and finding alternative components or recommendations requires exploring network neighborhoods, which is naturally expressed as a graph traversal.

In **DA3**, we translate the ER model directly into a **Property Graph Model** in Neo4j. Entities become **Nodes**, relationships become first-class directed typed **Edges** with properties, and subtypes are elegantly handled using Neo4j's native **Multiple Labels** (`:Component:CPU`, `:Component:Motherboard`, etc.).

---

## 2. Node Labels and Property Schema

### 2.1 Strong Entities

#### `(:User)`
Represents registered users in the BuildForge ecosystem.
- `userId` (STRING, UNIQUE, PK): e.g., `'usr-1'`
- `username` (STRING, UNIQUE): e.g., `'aarav_sharma'`
- `email` (STRING, UNIQUE): e.g., `'aarav@buildforge.in'`
- `phone` (STRING): e.g., `'+91 98765 43210'` (extracted from multivalued attribute in ER diagram)
- `registrationDate` (STRING / DATE): e.g., `'2026-01-15'`

#### `(:Category)`
Component classification hierarchy.
- `categoryId` (STRING, UNIQUE, PK): e.g., `'cat-cpu'`
- `name` (STRING): e.g., `'CPU'`, `'Motherboard'`, `'GPU'`
- `slug` (STRING, UNIQUE): e.g., `'cpu'`, `'motherboard'`
- `icon` (STRING): e.g., `'Cpu'`, `'CircuitBoard'`

#### `(:Component)` (Base Label for all hardware parts)
- `compId` (STRING, UNIQUE, PK): e.g., `'cpu-1'`, `'gpu-1'`
- `manufacturer` (STRING): e.g., `'AMD'`, `'NVIDIA'`, `'Corsair'`
- `model` (STRING): e.g., `'AMD Ryzen 7 7800X3D'`
- `priceINR` (INTEGER): Baseline price in Indian Rupees, e.g., `36999`
- `tdpWatts` (INTEGER): Thermal Design Power in Watts, e.g., `120`
- `performanceScore` (INTEGER): Normalized benchmark score (0–100), e.g., `96`
- `specs` (STRING): Summary specification string
- `imageUrl` (STRING): Hardware photograph URL

#### `(:Retailer)`
Authorized hardware vendors in the marketplace.
- `retailerId` (STRING, UNIQUE, PK): e.g., `'ret-1'`
- `name` (STRING): e.g., `'MDComputers'`, `'PrimeABGB'`
- `websiteUrl` (STRING): e.g., `'https://mdcomputers.in'`
- `rating` (FLOAT): Retailer customer trust score (1.0–5.0)

#### `(:Build)`
Custom virtual PC configurations assembled by users.
- `buildId` (STRING, UNIQUE, PK): e.g., `'bld-1001'`
- `name` (STRING): e.g., `'Apex Esports Beast (AM5)'`
- `createdAt` (STRING / DATE): e.g., `'2026-02-01'`
- `status` (STRING): `'SAVED'`, `'COMPLETED'`
- `totalEstimatedPrice` (INTEGER): Aggregated sum of component prices in INR
- `totalWattage` (INTEGER): Aggregated estimated power draw in Watts

#### `(:Cart)`
Persistent user shopping basket.
- `cartId` (STRING, UNIQUE, PK): e.g., `'cart-usr-1'`
- `createdAt` (DATETIME)
- `updatedAt` (DATETIME)

#### `(:Order)`
Completed purchase orders.
- `orderId` (STRING, UNIQUE, PK): e.g., `'ord-7001'`
- `orderDate` (STRING / DATE): e.g., `'2026-02-20'`
- `totalAmountINR` (INTEGER): Total order amount in INR
- `status` (STRING): `'COMPLETED'`, `'ORDER_PLACED'`

---

### 2.2 Subtype Entities (Polymorphic Specialization via Multiple Labels)

Every hardware subtype possesses the base label `:Component` plus its subtype label:

1. **`(:Component:CPU)`**
   - `socketType` (STRING): `'AM5'`, `'LGA1700'`, `'AM4'`
   - `cores` (INTEGER): e.g., `8`
   - `threads` (INTEGER): e.g., `16`
   - `baseClockGhz` (FLOAT): e.g., `4.2`
   - `boostClockGhz` (FLOAT): e.g., `5.0`

2. **`(:Component:Motherboard)`**
   - `socketType` (STRING): `'AM5'`, `'LGA1700'`, `'AM4'`
   - `formFactor` (STRING): `'ATX'`, `'Micro-ATX'`, `'Mini-ITX'`
   - `ramGeneration` (STRING): `'DDR5'`, `'DDR4'`
   - `pcieVersion` (STRING): `'PCIe 5.0'`, `'PCIe 4.0'`

3. **`(:Component:GPU)`**
   - `vramGb` (INTEGER): e.g., `12`, `16`
   - `lengthMm` (INTEGER): e.g., `242`, `304`

4. **`(:Component:RAM)`**
   - `ramGeneration` (STRING): `'DDR5'`, `'DDR4'`
   - `capacityGb` (INTEGER): e.g., `32`, `64`
   - `speedMhz` (INTEGER): e.g., `6000`, `6400`
   - `modules` (STRING): `'2x16GB'`, `'2x32GB'`

5. **`(:Component:Storage)`**
   - `capacityGb` (INTEGER): e.g., `1000`, `2000`
   - `readSpeedMbps` (INTEGER): e.g., `7450`, `11700`
   - `interface` (STRING): `'PCIe 4.0 x4'`, `'PCIe 5.0 x4'`, `'SATA 6Gb/s'`

6. **`(:Component:PowerSupply)`**
   - `wattage` (INTEGER): e.g., `650`, `750`, `850`, `1000`
   - `efficiencyRating` (STRING): `'80+ Gold'`, `'80+ Bronze'`
   - `modular` (STRING): `'Fully Modular'`, `'Non-Modular'`

7. **`(:Component:Case)`**
   - `formFactor` (STRING): `'ATX Mid Tower'`, `'Micro-ATX'`
   - `maxGpuLengthMm` (INTEGER): e.g., `365`, `422`

8. **`(:Component:Cooler)`**
   - `coolingType` (STRING): `'Air'`, `'Liquid 360mm'`

---

### 2.3 Weak Entities & Historical Nodes

1. **`(:UserAddress)`** (Weak Entity identified by `(:User)`)
   - `addressId` (STRING, UNIQUE, PK)
   - `city` (STRING), `state` (STRING), `zipCode` (STRING)

2. **`(:Listing)`** (Identified by Component and Retailer)
   - `listingId` (STRING, UNIQUE, PK)
   - `url` (STRING)
   - `currentPriceINR` (INTEGER)
   - `stockStatus` (STRING): `'In Stock'`, `'Out of Stock'`

3. **`(:PriceHistory)`** (Temporal Price Point)
   - `historyId` (STRING, UNIQUE, PK)
   - `priceINR` (INTEGER)
   - `recordedAt` (STRING / DATE)

4. **`(:Review)`** (Authored by User, reviewing Component)
   - `reviewId` (STRING, UNIQUE, PK)
   - `rating` (INTEGER): 1 to 5 (strictly validated)
   - `comment` (STRING)
   - `createdAt` (DATETIME / TIMESTAMP)

5. **`(:Benchmark)`** (Tested on Build)
   - `benchId` (STRING, UNIQUE, PK)
   - `name` (STRING)
   - `score` (INTEGER)
   - `fps1080p` (INTEGER), `fps1440p` (INTEGER)
   - `testedAt` (STRING / DATE)

---

## 3. Relationship Types, Directions, and Cardinalities

| Source Node | Relationship Type | Target Node | Cardinality | Properties | Semantic Meaning |
|---|---|---|---|---|---|
| `(:User)` | `[:CREATED]` | `(:Build)` | 1 : N | — | User authored a saved PC build |
| `(:Build)` | `[:CONTAINS]` | `(:Component)` | M : N | `quantity: INTEGER` | Build contains a specific hardware part |
| `(:Component)` | `[:BELONGS_TO]` | `(:Category)` | N : 1 | — | Classification of part |
| `(:Component)` | `[:HAS_LISTING]` | `(:Listing)` | 1 : N | — | Component offers in marketplace |
| `(:Listing)` | `[:OFFERED_BY]` | `(:Retailer)` | N : 1 | — | Retail store providing the listing |
| `(:Listing)` | `[:HAS_PRICE_HISTORY]` | `(:PriceHistory)` | 1 : N | — | Historical record of past prices |
| `(:User)` | `[:HAS_CART]` | `(:Cart)` | 1 : 1 | — | Active shopping basket of user |
| `(:Cart)` | `[:CONTAINS_BUILD]` | `(:Build)` | 1 : N | `quantity: 1, addedAt: TIMESTAMP` | Saved build added into cart |
| `(:User)` | `[:PLACED]` | `(:Order)` | 1 : N | — | Customer order transaction |
| `(:Order)` | `[:CONTAINS_LISTING]` | `(:Listing)` | M : N | `quantity: 1, purchasePriceINR: INT` | Exact listings purchased with historical price lock |
| `(:User)` | `[:HAS_ADDRESS]` | `(:UserAddress)` | 1 : N | — | Address book mapping |
| `(:User)` | `[:WROTE]` | `(:Review)` | 1 : N | — | User review authorship |
| `(:Review)` | `[:REVIEWS]` | `(:Component)` | N : 1 | — | Target component being evaluated |
| `(:Build)` | `[:TESTED_ON]` | `(:Benchmark)` | 1 : N | — | Hardware benchmark run on the build |
| `(:Component:CPU)` | `[:COMPATIBLE_WITH]` | `(:Component:Motherboard)` | M : N | `socketType: STRING` | Explicit physical socket compatibility |

---

## 4. Uniqueness Constraints and Indexes

```cypher
// Uniqueness Constraints
CREATE CONSTRAINT user_id_unique FOR (u:User) REQUIRE u.userId IS UNIQUE;
CREATE CONSTRAINT user_username_unique FOR (u:User) REQUIRE u.username IS UNIQUE;
CREATE CONSTRAINT user_email_unique FOR (u:User) REQUIRE u.email IS UNIQUE;
CREATE CONSTRAINT category_id_unique FOR (c:Category) REQUIRE c.categoryId IS UNIQUE;
CREATE CONSTRAINT component_id_unique FOR (cp:Component) REQUIRE cp.compId IS UNIQUE;
CREATE CONSTRAINT retailer_id_unique FOR (r:Retailer) REQUIRE r.retailerId IS UNIQUE;
CREATE CONSTRAINT listing_id_unique FOR (l:Listing) REQUIRE l.listingId IS UNIQUE;
CREATE CONSTRAINT build_id_unique FOR (b:Build) REQUIRE b.buildId IS UNIQUE;
CREATE CONSTRAINT cart_id_unique FOR (ct:Cart) REQUIRE ct.cartId IS UNIQUE;
CREATE CONSTRAINT order_id_unique FOR (o:Order) REQUIRE o.orderId IS UNIQUE;
CREATE CONSTRAINT review_id_unique FOR (rv:Review) REQUIRE rv.reviewId IS UNIQUE;

// Performance Indexes
CREATE INDEX component_model_idx FOR (cp:Component) ON (cp.model);
CREATE INDEX cpu_socket_idx FOR (cpu:CPU) ON (cpu.socketType);
CREATE INDEX mobo_socket_idx FOR (m:Motherboard) ON (m.socketType);
CREATE INDEX listing_price_idx FOR (l:Listing) ON (l.currentPriceINR);
```
