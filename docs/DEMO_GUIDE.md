# BUILDFORGE DA3: VIVA DEMONSTRATION GUIDE

Follow this step-by-step script during your DBMS DA3 project evaluation / viva presentation.

---

## 1. Quick Setup & Starting the Application

### Step 1.1: Connect Neo4j (Local Bolt or Aura Free)
1. If using **Neo4j Desktop / Local Community Server**:
   - Ensure Neo4j is running on `bolt://localhost:7687`.
   - Default user: `neo4j`, default password: `password`.
2. If using **Neo4j Aura (Free Tier)**:
   - Create a free instance at [https://console.neo4j.io](https://console.neo4j.io).
   - Copy connection URI (e.g., `neo4j+s://xxxx.databases.neo4j.io`) and password.
   - Update `backend/.env`:
     ```env
     NEO4J_URI=neo4j+s://<your-db-id>.databases.neo4j.io
     NEO4J_USERNAME=neo4j
     NEO4J_PASSWORD=<your-password>
     ```

### Step 1.2: Seed the Database
In terminal inside `backend/`:
```bash
cd backend
npm run init:schema    # Creates uniqueness constraints & indexes
npm run seed           # Inserts 10 users, 8 categories, 44 components, 10 builds
npm run verify         # Verifies node counts and test traversals
```

### Step 1.3: Launch the Full Application
```bash
# Inside backend/
npm start
```
Open your browser to: **`http://localhost:5000`**

*(Alternatively, run `npm run dev` in `frontend/` on port 3000 if running services separately).*

---

## 2. Ordered Demonstration Script (Viva Presentation)

### Step 1: System Overview & Connection Verification
- **Show:** The top green connection banner on the Home Page showing:
  `✓ Neo4j Database Connected: bolt://localhost:7687 (Neo4j/5.20.0) · 44 components active`.
- **Explain:** Highlight that all persistent records are loaded directly from Neo4j via official `neo4j-driver`, not hardcoded arrays or local storage.
- **Show:** The Demo User Switcher in the top navbar (switching between Aarav, Priya, Rohan).

---

### Step 2: Component Library & CRUD Demonstration
- **Navigate:** Click **Components** in the navbar.
- **Filter:** Click the **Motherboard** and **CPU** pills to show dynamic filtering.
- **Search:** Type `"Ryzen"` in the filter box.
- **Component Details:** Click **Details** on `AMD Ryzen 7 7800X3D`.
  - Show specs, retailer listings (MDComputers, PrimeABGB, Amazon), and community reviews.
  - Submit a review with rating `5` to show live graph insertion.
- **CRUD Demonstration:**
  - Click **➕ New Component (CRUD)** button.
  - Create a test part: `AMD Ryzen 9 9900X` (Socket: `AM5`, Price: `49999`).
  - Click **Create Component Node in Neo4j**. Show instant appearance in the library.
  - Click **Edit** to adjust price or specs.
  - Click **Delete** to demonstrate safe deletion and dependency safeguards.

---

### Step 3: PC Builder & Real-Time Hardware Compatibility Engine
- **Navigate:** Click **PC Builder** in the navbar.
- **Compatible Combination:**
  - Slot 1 (CPU): Choose `AMD Ryzen 7 7800X3D` (Socket: AM5).
  - Slot 2 (Motherboard): Choose `MSI MAG B650 Tomahawk WiFi` (Socket: AM5).
  - Slot 3 (GPU): Choose `NVIDIA GeForce RTX 4070 SUPER`.
  - Slot 4 (RAM): Choose `Corsair Vengeance 32GB DDR5`.
  - Slot 5 (Storage): Choose `Samsung 990 PRO 1TB`.
  - Slot 6 (PSU): Choose `Corsair RM850e 850W`.
- **Show:** Status box turns green: `✓ Hardware Fully Compatible (Socket AM5 verified, adequate PSU buffer)`.
- **Incompatible Demonstration (Socket Mismatch):**
  - Click **Change** on Motherboard and choose an Intel motherboard: `MSI PRO Z790-A MAX WiFi` (Socket: LGA1700).
  - **Show:** Status box immediately flags:
    `❌ Physical Socket Conflict! CPU requires AM5, but Motherboard uses LGA1700`.
- **Save Build:**
  - Change motherboard back to AM5.
  - Click **Save Build to Neo4j**. Enter name: `"Viva Gaming Rig"`.
  - Show confirmation toast.

---

### Step 4: My Builds & Shopping Cart Transaction
- **Navigate:** Click **My Builds** in navbar.
  - Show your newly saved build alongside existing community builds loaded from Neo4j.
  - Click **Add to Cart**.
  - Click **Add to Cart** a second time to demonstrate the DA2 trigger constraint:
    `Trigger Constraint Violation (TRG_UNIQUE_CART_BUILD): This build is already in your cart.`
- **Navigate:** Click **Cart & Orders**.
  - Show active build in cart with estimated grand total in INR.
  - Click **Complete Graph Checkout →**.
  - **Explain:** Point out that checkout executes an atomic Neo4j write transaction (`CHECKOUT_CART` procedure), creating an `(:Order)` node, linking purchase prices, and emptying the cart atomically. Show the newly created order in Order History below!

---

### Step 5: DBMS Lab (18 Cypher Analytical Demonstrations)
- **Navigate:** Click **DBMS Lab** in navbar.
- **Show Query #1:** Category filtering (`MATCH (c:Component)-[:BELONGS_TO]->(cat) ...`).
- **Show Query #8:** Alternative component recommendations within ±25% price budget.
  - Click **Run Query on Neo4j**.
  - Show execution time in milliseconds and tabular results.
- **Show Query #10:** Components shared across multiple saved builds.
- **Show Query #12:** Explicit `[:COMPATIBLE_WITH]` CPU-Motherboard socket pairings.
- **Show Query #18:** Collaborative recommendation: related builds discovered through 2+ shared components.
- **Explain:** Show that these queries are allowlisted and execute genuine parameterised Cypher against the Neo4j database.

---

### Step 6: Interactive Graph Explorer (Cytoscape.js)
- **Navigate:** Click **Graph Explorer** in navbar.
- **Demonstrate:**
  - Pan and zoom the graph canvas.
  - Filter by Node Label (e.g., select `Build` or `Component`).
  - Change layout to **Concentric** or **Force-Directed (CoSE)**.
  - Click on a Component node: Show the side properties inspector drawer slide out with all node properties.
  - Click **Expand Neighbors (1-Hop Traversal)**: Show connected Category, Listings, and Builds dynamically fetched from Neo4j and drawn on canvas!

---

### Step 7: About Database (Relational vs. Graph Comparison)
- **Navigate:** Click **About DB** in navbar.
- **Explain to Evaluator:**
  - Relational SQL required 6 expensive table joins across associative junction tables to reconstruct a build with prices.
  - Neo4j utilizes **Index-Free Adjacency**: Cypher traverses direct pointer relationships in constant algorithmic time `O(1)`.
  - Acknowledge realistic trade-offs: relational databases excel for high-volume columnar OLAP and strict financial ledgers, while Neo4j is optimal for interconnected hardware configurators and recommendation networks.
