// ==============================================================================
// BUILDFORGE DA3 - API CLIENT (Neo4j Backend Bridge)
// ==============================================================================

const API_BASE = '/api';

export const api = {
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch (err) {
      return { status: 'DOWN', error: err.message, connected: false };
    }
  },

  async getUsers() {
    const res = await fetch(`${API_BASE}/users`);
    return await res.json();
  },

  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`);
    return await res.json();
  },

  async getComponents(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/components${query ? '?' + query : ''}`);
    return await res.json();
  },

  async getComponentById(id) {
    const res = await fetch(`${API_BASE}/components/${id}`);
    return await res.json();
  },

  async createComponent(data) {
    const res = await fetch(`${API_BASE}/components`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async updateComponent(id, data) {
    const res = await fetch(`${API_BASE}/components/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async deleteComponent(id, force = false) {
    const res = await fetch(`${API_BASE}/components/${id}${force ? '?force=true' : ''}`, {
      method: 'DELETE'
    });
    return await res.json();
  },

  async getBuilds() {
    const res = await fetch(`${API_BASE}/builds`);
    return await res.json();
  },

  async getBuildById(id) {
    const res = await fetch(`${API_BASE}/builds/${id}`);
    return await res.json();
  },

  async createBuild(data) {
    const res = await fetch(`${API_BASE}/builds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async deleteBuild(id) {
    const res = await fetch(`${API_BASE}/builds/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  },

  async getRetailers() {
    const res = await fetch(`${API_BASE}/retailers`);
    return await res.json();
  },

  async getListings(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/listings${query ? '?' + query : ''}`);
    return await res.json();
  },

  async updateListingPrice(listingId, priceINR) {
    const res = await fetch(`${API_BASE}/listings/${listingId}/price`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceINR })
    });
    return await res.json();
  },

  async getReviews(compId) {
    const res = await fetch(`${API_BASE}/reviews${compId ? '?compId=' + compId : ''}`);
    return await res.json();
  },

  async createReview(data) {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async getCart(userId) {
    const res = await fetch(`${API_BASE}/carts/${userId}`);
    return await res.json();
  },

  async addToCart(userId, buildId) {
    const res = await fetch(`${API_BASE}/carts/${userId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buildId })
    });
    return await res.json();
  },

  async removeFromCart(userId, buildId) {
    const res = await fetch(`${API_BASE}/carts/${userId}/items/${buildId}`, {
      method: 'DELETE'
    });
    return await res.json();
  },

  async getOrders(userId) {
    const res = await fetch(`${API_BASE}/orders/${userId}`);
    return await res.json();
  },

  async checkoutCart(userId) {
    const res = await fetch(`${API_BASE}/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return await res.json();
  },

  async getGraphData(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/graph${query ? '?' + query : ''}`);
    return await res.json();
  },

  async expandGraphNode(id) {
    const res = await fetch(`${API_BASE}/graph/expand/${id}`);
    return await res.json();
  },

  async getAnalyticsCatalog() {
    const res = await fetch(`${API_BASE}/analytics/catalog`);
    return await res.json();
  },

  async runAnalyticsQuery(queryId, params = {}) {
    const res = await fetch(`${API_BASE}/analytics/run/${queryId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return await res.json();
  }
};
