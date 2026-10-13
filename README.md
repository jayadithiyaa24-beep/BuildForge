# BuildForge — PC Builder Ecosystem (DA3 DBMS Project)

BuildForge is a full-stack PC building platform and database management systems (DBMS) mini-project upgraded from relational Oracle SQL (DA2) to a modern **Property Graph Database using Neo4j and Cypher (DA3)**.

---

## ⚡ Tech Stack

- **Primary Database:** Neo4j Graph Database (5.x / Neo4j Aura Free Tier)
- **Query Language:** Cypher
- **Backend:** Node.js, Express, Official `neo4j-driver`
- **Frontend:** Modern Vanilla JS / ES Modules, Cytoscape.js, Earthy Design System
- **Theme:** Studio Light Mode (`#EFECE6`, `#7A8B7B`, `#D4A359`) & Midnight Dark Mode (`#171614`)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+)
- **Neo4j** (Either a local Neo4j instance at `bolt://localhost:7687` OR a free cloud database on [Neo4j Aura](https://console.neo4j.io))

### 2. Configure Environment
In `backend/.env`:
```env
PORT=5000

# For Local Neo4j:
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
NEO4J_DATABASE=neo4j

# For Neo4j Aura:
# NEO4J_URI=neo4j+s://<dbid>.databases.neo4j.io
# NEO4J_USERNAME=neo4j
# NEO4J_PASSWORD=<aura-password>
```

### 3. Initialize Schema & Seed Data
Inside the `backend/` directory:
```bash
cd backend
npm install
npm run init:schema    # Creates uniqueness constraints and performance indexes
npm run seed           # Inserts 10 users, 8 categories, 44 components, 10 builds
npm run verify         # Runs verification checks and reports node/rel breakdown
```

### 4. Start Application
```bash
npm start
```
Open **`http://localhost:5000`** in your browser. The single backend server serves both the REST API and the frontend application!

*(Optional: To run the frontend dev server independently on port 3000, run `npm run dev` in `frontend/`)*.

---

## 🧪 Testing

Run backend automated unit and integration tests:
```bash
cd backend
npm test
```
All tests verify Neo4j type conversions, rating constraint bounds (1-5), Cypher query catalog integrity, and CPU-motherboard socket compatibility logic.

---

## 📂 Project Structure

```
buildforge-da3/
├── backend/
│   ├── config/neo4j.js            # Official Neo4j driver connection pooling & type conversion
│   ├── controllers/               # REST API controllers for Components, Builds, Orders, Graph
│   ├── queries/cypherQueries.js   # Parameterised Cypher query catalog & 18 analytical queries
│   ├── routes/index.js            # Express API router
│   ├── scripts/
│   │   ├── initSchema.js          # Executes schema constraints and indexes
│   │   ├── seed.js                # Idempotent seed script
│   │   └── verify.js              # Database audit and verification script
│   ├── tests/queries.test.js      # Automated test suite
│   ├── server.js                  # Main Express server serving API + static frontend
│   └── .env.example
├── frontend/
│   ├── css/style.css              # Earthy design system tokens (light/dark mode)
│   ├── js/
│   │   ├── api.js                 # Fetch API client
│   │   ├── app.js                 # Router, state management, theme manager
│   │   └── pages/                 # Home, Builder, Components, Compare, Builds, Cart, Graph, Lab, About
│   ├── public/vendor/             # Offline Cytoscape.js bundle
│   ├── index.html                 # Main single page application
│   └── dev-server.js              # Standalone frontend proxy server (port 3000)
├── database/
│   ├── schema.cypher              # Cypher uniqueness constraints & indexes
│   ├── seed.cypher                # Idempotent seed dataset (10 users, 44 parts, 10 builds)
│   ├── analytical_queries.cypher  # 18 DBMS Lab Cypher demonstration queries
│   └── reset.cypher               # Reset script for development
└── docs/
    ├── DA3_REPORT.md              # Complete report material formatted for handwriting
    ├── DEMO_GUIDE.md              # Ordered viva demonstration script
    ├── GRAPH_MODEL.md             # Graph schema, labels, relationships, and cardinalities
    └── API_DOCUMENTATION.md       # Comprehensive REST API endpoint reference
```

---

## 📑 Academic Documentation

- **[DA3_REPORT.md](docs/DA3_REPORT.md):** Complete academic report material suitable for handwritten preparation.
- **[DEMO_GUIDE.md](docs/DEMO_GUIDE.md):** Viva presentation script with step-by-step instructions.
- **[GRAPH_MODEL.md](docs/GRAPH_MODEL.md):** Formal property graph model specification.
- **[API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md):** REST API endpoints reference.
