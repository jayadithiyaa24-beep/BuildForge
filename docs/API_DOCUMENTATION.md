# BUILDFORGE DA3: REST API SPECIFICATION

**Base URL:** `http://localhost:5000/api`  
**Communication:** JSON (`application/json`)  
**Backend:** Node.js + Express  
**Persistence Layer:** Neo4j Graph Database (Cypher)  

---

## 1. System & Database Health

### `GET /api/health`
Verifies backend connectivity to the connected Neo4j instance.
- **Success Response (200 OK):**
```json
{
  "status": "UP",
  "database": "Neo4j Graph Database",
  "connected": true,
  "uri": "bolt://localhost:7687",
  "serverInfo": {
    "address": "localhost:7687",
    "agent": "Neo4j/5.20.0"
  },
  "entityCounts": {
    "users": 10,
    "components": 44,
    "builds": 10,
    "retailers": 5
  }
}
```
- **Error Response (503 Service Unavailable):**
Returned if Neo4j is offline or credentials in `.env` are invalid. Contains clear diagnostic suggestions.

---

## 2. Categories & Components (CRUD)

### `GET /api/categories`
Retrieves all hardware categories with component counts.

### `GET /api/components`
Retrieves components matching filters.
- **Query Parameters:**
  - `category` (string, optional): category slug (e.g. `'cpu'`, `'gpu'`, `'motherboard'`)
  - `search` (string, optional): keyword match against manufacturer or model
  - `sortBy` (string, optional): `'price_asc'`, `'price_desc'`, `'score_desc'`, `'name_asc'`

### `GET /api/components/:id`
Retrieves comprehensive details of a component including reviews, retailer listings, and historical prices.

### `POST /api/components`
Creates a new component with subtype labels (`:Component:CPU`, `:Component:Motherboard`, etc.) and automatically links socket compatibility relationships.
- **Request Body:**
```json
{
  "manufacturer": "AMD",
  "model": "Ryzen 7 9800X3D",
  "priceINR": 46999,
  "tdpWatts": 120,
  "performanceScore": 99,
  "categorySlug": "cpu",
  "socketType": "AM5",
  "cores": 8,
  "threads": 16,
  "specs": "AM5 · 8C/16T · 120W TDP"
}
```

### `PUT /api/components/:id`
Updates specifications or prices for an existing component.

### `DELETE /api/components/:id`
Safely removes a component.
- **Dependency Guard:** If the component is used in saved builds or historical orders, returns `409 Conflict` with a list of dependencies. Pass `?force=true` to override during academic evaluation.

---

## 3. PC Builds & Compatibility Engine

### `GET /api/builds`
Retrieves all saved builds with component counts, total price, and creator usernames.

### `GET /api/builds/:id`
Retrieves full build details and runs an automated compatibility check.

### `POST /api/builds`
Persists a custom virtual PC build in Neo4j.
- **Request Body:**
```json
{
  "userId": "usr-1",
  "name": "Apex Esports AM5 Beast",
  "componentIds": ["cpu-1", "mobo-1", "gpu-1", "ram-1", "stor-1", "psu-1"]
}
```

### `DELETE /api/builds/:id`
Detaches and deletes a build and its benchmark node.

### `GET /api/builds/:id/compatibility`
Executes hardware compatibility rules:
1. **CPU vs Motherboard Socket:** Verifies physical fit (e.g., AM5 matches AM5). Detects socket mismatches.
2. **RAM Generation:** Verifies DDR5/DDR4 compatibility with motherboard slots.
3. **PSU Wattage:** Verifies that PSU rated capacity provides at least 80W headroom over total component TDP.

---

## 4. Retailers, Listings & Price History

### `GET /api/retailers`
Lists hardware retailers (MDComputers, PrimeABGB, Amazon India, etc.).

### `GET /api/listings`
Retrieves active component store listings with pricing.

### `POST /api/listings`
Creates a new retailer listing for a component and creates an initial `(:PriceHistory)` node.

### `PUT /api/listings/:id/price`
Updates listing price and appends a new `(:PriceHistory)` node to the graph with the current timestamp.

---

## 5. Reviews (Rating Bounds Validation)

### `GET /api/reviews?compId=:id`
Fetches all user reviews and ratings for a component.

### `POST /api/reviews`
Creates a review.
- **Validation:** Rating **must** be an integer between 1 and 5 (enforcing the DA2 `TRG_REVIEW_RATING_BOUNDS` database trigger rule).

---

## 6. Carts & Orders (Transactions)

### `GET /api/carts/:userId`
Returns active cart contents for a user.

### `POST /api/carts/:userId/items`
Adds a build to the cart.
- **Trigger Guard:** Enforces `TRG_UNIQUE_CART_BUILD`. If the build is already in the cart, rejects with `409 Conflict`.

### `DELETE /api/carts/:userId/items/:buildId`
Removes a build from the user's cart.

### `POST /api/orders/checkout`
Executes an atomic checkout in a Neo4j write transaction:
1. Validates that the cart is not empty.
2. Creates an `(:Order)` node linked to `(:User)`.
3. Links purchased listings with locked historical purchase prices.
4. Clears all `[:CONTAINS_BUILD]` edges from the cart atomically.

---

## 7. Graph Visualization (Cytoscape.js)

### `GET /api/graph?nodeLabel=Component&limit=75`
Returns graph data formatted for Cytoscape.js:
- Nodes: `{ id, label, type, properties }`
- Edges: `{ id, source, target, label, properties }`

### `GET /api/graph/expand/:id`
Dynamically expands the 1-hop neighborhood of a selected node.

---

## 8. DBMS Lab / Analytics (18 Allowlisted Cypher Queries)

### `GET /api/analytics/catalog`
Returns metadata and explanations for all 18 demonstration queries.

### `POST /api/analytics/run/:queryId`
Executes an allowlisted query with parameterized inputs and returns tabular data and execution metrics.
