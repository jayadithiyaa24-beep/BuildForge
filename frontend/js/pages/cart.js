import { api } from '../api.js';

export function renderCartPage(app) {
  const container = document.getElementById('page-cart');
  container.innerHTML = `
    <div class="sectionTitle" style="margin-top:0;">
      <div>
        <div class="eyebrow">CHECKOUT & TRANSACTION ENGINE</div>
        <h2>Shopping Cart & Placed Orders</h2>
        <p class="muted">Demonstrating atomic graph transaction: <code>CHECKOUT_CART</code> procedure converting Cart to Order in Neo4j.</p>
      </div>
    </div>

    <!-- Active Cart Section -->
    <div class="card" style="padding:24px; margin-bottom:28px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h3 style="font-size:18px;">Active Cart Items</h3>
        <span class="badge good" id="cartUserIdBadge">User: ${app.currentUserId}</span>
      </div>

      <div id="cartItemsContainer">Loading cart items...</div>

      <div id="cartSummaryFooter" style="display:none; border-top:1px solid var(--line); margin-top:20px; padding-top:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div class="muted">Cart Grand Total</div>
            <div class="price" id="cartGrandTotal" style="font-size:26px; color:var(--accent2);">₹0</div>
          </div>
          <button class="primary" id="checkoutBtn" style="padding:12px 24px; font-size:15px;">
            Complete Graph Checkout →
          </button>
        </div>
        <p class="muted" style="font-size:11.5px; margin-top:10px;">
          * Academic Demo: Checkout runs a real Neo4j write transaction creating an <code>(:Order)</code> node and clearing <code>[:CONTAINS_BUILD]</code> edges. No real financial payment processed.
        </p>
      </div>
    </div>

    <!-- Order History Section -->
    <div class="sectionTitle">
      <div>
        <div class="eyebrow">AUDIT & TRANSACTION LOG</div>
        <h2>Order History</h2>
      </div>
    </div>

    <div id="orderHistoryContainer">Loading orders...</div>
  `;

  loadCartAndOrders(app);
}

async function loadCartAndOrders(app) {
  const cartContainer = document.getElementById('cartItemsContainer');
  const footer = document.getElementById('cartSummaryFooter');
  const totalDisplay = document.getElementById('cartGrandTotal');
  const orderContainer = document.getElementById('orderHistoryContainer');

  if (!cartContainer) return;

  // 1. Load Cart
  try {
    const cartRes = await api.getCart(app.currentUserId);
    if (!cartRes.data || !cartRes.data.items || !cartRes.data.items.length) {
      cartContainer.innerHTML = `
        <div style="text-align:center; padding:30px; color:var(--muted);">
          Your cart is currently empty. Configure a rig in the PC Builder and click "Add to Cart".
        </div>
      `;
      if (footer) footer.style.display = 'none';
    } else {
      const items = cartRes.data.items;
      cartContainer.innerHTML = items.map(item => `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--line); padding:14px 0;">
          <div>
            <h4 style="font-size:16px; margin-bottom:4px;">${item.name}</h4>
            <p class="muted" style="font-size:12.5px;">${item.componentCount} Components · Added via <code>[:CONTAINS_BUILD]</code></p>
          </div>
          <div style="display:flex; align-items:center; gap:16px;">
            <div class="price">₹${(item.totalPrice || 0).toLocaleString('en-IN')}</div>
            <button class="dangerBtn removeCartItemBtn" data-id="${item.buildId}">Remove</button>
          </div>
        </div>
      `).join('');

      if (footer) {
        footer.style.display = 'block';
        totalDisplay.textContent = '₹' + (cartRes.data.totalPrice || 0).toLocaleString('en-IN');
      }

      cartContainer.querySelectorAll('.removeCartItemBtn').forEach(b => {
        b.onclick = async () => {
          try {
            const remRes = await api.removeFromCart(app.currentUserId, b.dataset.id);
            if (remRes.success) {
              app.toast('Removed from cart');
              app.updateCartCount();
              loadCartAndOrders(app);
            }
          } catch (e) {
            app.toast('Remove error: ' + e.message);
          }
        };
      });

      const checkoutBtn = document.getElementById('checkoutBtn');
      if (checkoutBtn) {
        checkoutBtn.onclick = async () => {
          if (!confirm('Execute transactional checkout in Neo4j? This will create an Order node and clear active cart items.')) return;
          try {
            checkoutBtn.disabled = true;
            checkoutBtn.textContent = 'Executing Transaction...';
            const orderRes = await api.checkoutCart(app.currentUserId);
            if (orderRes.success) {
              app.toast(`✓ Order ${orderRes.data.orderId} placed successfully! Cart emptied.`);
              app.updateCartCount();
              loadCartAndOrders(app);
            } else {
              app.toast(orderRes.error || 'Checkout failed');
              checkoutBtn.disabled = false;
              checkoutBtn.textContent = 'Complete Graph Checkout →';
            }
          } catch (e) {
            app.toast('Checkout error: ' + e.message);
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Complete Graph Checkout →';
          }
        };
      }
    }
  } catch (err) {
    cartContainer.innerHTML = `<div style="color:var(--bad);">Error loading cart: ${err.message}</div>`;
  }

  // 2. Load Orders
  try {
    const orderRes = await api.getOrders(app.currentUserId);
    if (!orderRes.data || !orderRes.data.length) {
      orderContainer.innerHTML = `
        <div class="card" style="padding:30px; text-align:center; color:var(--muted);">
          No placed orders found for this user. Complete a checkout above to record an order in Neo4j.
        </div>
      `;
    } else {
      orderContainer.innerHTML = orderRes.data.map(ord => `
        <div class="card" style="padding:18px; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <span class="badge good">${ord.orderId}</span>
              <span style="font-size:12px; color:var(--muted); margin-left:8px;">Date: ${ord.orderDate} · Status: ${ord.status}</span>
              <h4 style="margin-top:8px;">${ord.items ? ord.items.length : 0} Components Purchased</h4>
            </div>
            <div class="price" style="font-size:20px; color:var(--accent2);">
              ₹${(ord.totalAmountINR || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div style="margin-top:12px; font-size:12px; color:var(--muted);">
            ${(ord.items || []).map(it => `
              <span style="display:inline-block; margin-right:12px;">• ${it.componentModel} (₹${(it.purchasePriceINR || 0).toLocaleString('en-IN')})</span>
            `).join('')}
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    orderContainer.innerHTML = `<div style="color:var(--bad);">Error loading orders: ${err.message}</div>`;
  }
}
