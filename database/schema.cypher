// ==============================================================================
// BUILDFORGE DA3 - NEO4J SCHEMA DEFINITION (CONSTRAINTS & INDEXES)
// Database: Neo4j 5.x / Aura
// ==============================================================================

// --- Uniqueness Constraints ---

CREATE CONSTRAINT user_id_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.userId IS UNIQUE;

CREATE CONSTRAINT user_username_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.username IS UNIQUE;

CREATE CONSTRAINT user_email_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.email IS UNIQUE;

CREATE CONSTRAINT category_id_unique IF NOT EXISTS
FOR (c:Category) REQUIRE c.categoryId IS UNIQUE;

CREATE CONSTRAINT category_slug_unique IF NOT EXISTS
FOR (c:Category) REQUIRE c.slug IS UNIQUE;

CREATE CONSTRAINT component_id_unique IF NOT EXISTS
FOR (cp:Component) REQUIRE cp.compId IS UNIQUE;

CREATE CONSTRAINT retailer_id_unique IF NOT EXISTS
FOR (r:Retailer) REQUIRE r.retailerId IS UNIQUE;

CREATE CONSTRAINT listing_id_unique IF NOT EXISTS
FOR (l:Listing) REQUIRE l.listingId IS UNIQUE;

CREATE CONSTRAINT build_id_unique IF NOT EXISTS
FOR (b:Build) REQUIRE b.buildId IS UNIQUE;

CREATE CONSTRAINT cart_id_unique IF NOT EXISTS
FOR (ct:Cart) REQUIRE ct.cartId IS UNIQUE;

CREATE CONSTRAINT order_id_unique IF NOT EXISTS
FOR (o:Order) REQUIRE o.orderId IS UNIQUE;

CREATE CONSTRAINT review_id_unique IF NOT EXISTS
FOR (rv:Review) REQUIRE rv.reviewId IS UNIQUE;

CREATE CONSTRAINT benchmark_id_unique IF NOT EXISTS
FOR (bm:Benchmark) REQUIRE bm.benchId IS UNIQUE;

CREATE CONSTRAINT price_history_id_unique IF NOT EXISTS
FOR (ph:PriceHistory) REQUIRE ph.historyId IS UNIQUE;

CREATE CONSTRAINT address_id_unique IF NOT EXISTS
FOR (ua:UserAddress) REQUIRE ua.addressId IS UNIQUE;

// --- Performance Indexes ---

CREATE INDEX component_model_idx IF NOT EXISTS
FOR (cp:Component) ON (cp.model);

CREATE INDEX component_mfg_idx IF NOT EXISTS
FOR (cp:Component) ON (cp.manufacturer);

CREATE INDEX cpu_socket_idx IF NOT EXISTS
FOR (cpu:CPU) ON (cpu.socketType);

CREATE INDEX mobo_socket_idx IF NOT EXISTS
FOR (m:Motherboard) ON (m.socketType);

CREATE INDEX build_name_idx IF NOT EXISTS
FOR (b:Build) ON (b.name);

CREATE INDEX review_rating_idx IF NOT EXISTS
FOR (rv:Review) ON (rv.rating);

CREATE INDEX listing_price_idx IF NOT EXISTS
FOR (l:Listing) ON (l.currentPriceINR);
