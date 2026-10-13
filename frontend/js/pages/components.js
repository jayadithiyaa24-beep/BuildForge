import { api } from '../api.js';

export function renderComponentsPage(app) {
  const container = document.getElementById('page-parts') || document.getElementById('page-components');
  if (!container) return;
  container.innerHTML = `
    <div class="sectionTitle" style="margin-top:0;">
      <div>
        <div class="eyebrow">COMPONENT CATALOGUE</div>
        <h2>Component Library</h2>
        <p class="muted">Live hardware catalog queried from Neo4j graph database.</p>
      </div>
      <div class="actions">
        <button class="primary" id="openCreateCompBtn">➕ New Component (CRUD)</button>
      </div>
    </div>

    <!-- Filter & Sort Bar -->
    <div style="display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; align-items:center;">
      <div style="display:flex; gap:6px; overflow-x:auto; flex:1;" id="categoryPills">
        <button class="secondary active catPill" data-cat="all" style="padding:7px 14px; font-size:12.5px;">All</button>
        <button class="secondary catPill" data-cat="cpu" style="padding:7px 14px; font-size:12.5px;">CPU</button>
        <button class="secondary catPill" data-cat="motherboard" style="padding:7px 14px; font-size:12.5px;">Motherboards</button>
        <button class="secondary catPill" data-cat="gpu" style="padding:7px 14px; font-size:12.5px;">GPUs</button>
        <button class="secondary catPill" data-cat="ram" style="padding:7px 14px; font-size:12.5px;">RAM</button>
        <button class="secondary catPill" data-cat="storage" style="padding:7px 14px; font-size:12.5px;">Storage</button>
        <button class="secondary catPill" data-cat="psu" style="padding:7px 14px; font-size:12.5px;">Power Supplies</button>
        <button class="secondary catPill" data-cat="case" style="padding:7px 14px; font-size:12.5px;">Cases</button>
        <button class="secondary catPill" data-cat="cooler" style="padding:7px 14px; font-size:12.5px;">Coolers</button>
      </div>

      <div style="display:flex; gap:8px;">
        <input type="text" id="componentSearchInput" placeholder="Filter hardware..." style="padding:8px 12px; border:1px solid var(--line); border-radius:10px; background:var(--panel); font-size:13px; width:180px;">
        <select id="componentSortSelect" style="padding:8px 12px; border:1px solid var(--line); border-radius:10px; background:var(--panel); font-size:13px; font-weight:600;">
          <option value="score_desc">Top Performance</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Model A–Z</option>
        </select>
      </div>
    </div>

    <!-- Components Grid -->
    <div class="grid" id="compCatalogGrid">
      <div class="card" style="padding:40px; text-align:center;">Loading component records...</div>
    </div>
  `;

  let currentCategory = 'all';
  let currentSearch = '';
  let currentSort = 'score_desc';

  async function refreshList() {
    const grid = document.getElementById('compCatalogGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="card" style="padding:40px; text-align:center;">Querying Neo4j...</div>';

    try {
      const res = await api.getComponents({
        category: currentCategory,
        search: currentSearch,
        sortBy: currentSort
      });

      if (!res.data || !res.data.length) {
        grid.innerHTML = '<div class="card" style="grid-column:1/-1; padding:40px; text-align:center; color:var(--muted);">No components found matching filters.</div>';
        return;
      }

      grid.innerHTML = res.data.map(c => `
        <div class="card">
          <img src="${c.imageUrl}" alt="${c.model}" class="componentImg" onerror="this.src='https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=80'">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="badge ${c.categorySlug === 'cpu' || c.categorySlug === 'motherboard' ? 'warn' : 'good'}">${c.categoryName}</span>
            <span style="font-size:12px; font-weight:700; color:var(--accent);">${c.performanceScore}/100</span>
          </div>
          <h3 style="margin:10px 0 4px; font-size:16px;">${c.model}</h3>
          <p class="muted" style="font-size:12px; margin-bottom:8px;">${c.specs || c.manufacturer}</p>
          <div style="font-size:11.5px; color:var(--muted); margin-bottom:12px;">★ ${c.averageRating > 0 ? c.averageRating + ' (' + c.reviewCount + ' reviews)' : 'No reviews yet'}</div>
          
          <div class="row" style="margin-top:auto;">
            <span>Price</span>
            <span class="price">₹${(c.priceINR || 0).toLocaleString('en-IN')}</span>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:12px;">
            <button class="secondary viewCompDetailBtn" data-id="${c.compId}">Details</button>
            <button class="secondary addCompCompareBtn" data-id="${c.compId}">Compare</button>
          </div>
          <button class="primary addCompBuildBtn" data-id="${c.compId}" data-cat="${c.categorySlug}" style="width:100%; margin-top:6px;">
            Add to Build
          </button>
          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
            <button class="editCompBtn" data-id="${c.compId}" style="font-size:11px; color:var(--muted); text-decoration:underline;">Edit</button>
            <button class="delCompBtn" data-id="${c.compId}" style="font-size:11px; color:var(--bad); text-decoration:underline;">Delete</button>
          </div>
        </div>
      `).join('');

      // Attach actions
      grid.querySelectorAll('.viewCompDetailBtn').forEach(b => {
        b.onclick = () => openComponentModal(b.dataset.id, app, refreshList);
      });
      grid.querySelectorAll('.addCompCompareBtn').forEach(b => {
        b.onclick = () => {
          const item = res.data.find(x => x.compId === b.dataset.id);
          if (item) app.addToCompare(item);
        };
      });
      grid.querySelectorAll('.addCompBuildBtn').forEach(b => {
        b.onclick = () => {
          const item = res.data.find(x => x.compId === b.dataset.id);
          if (item) {
            app.setBuildSlot(item.categorySlug, item);
            app.navigate('builder');
          }
        };
      });
      grid.querySelectorAll('.editCompBtn').forEach(b => {
        b.onclick = () => {
          const item = res.data.find(x => x.compId === b.dataset.id);
          if (item) openEditComponentModal(item, app, refreshList);
        };
      });
      grid.querySelectorAll('.delCompBtn').forEach(b => {
        b.onclick = async () => {
          if (!confirm(`Are you sure you want to delete component "${b.dataset.id}" from Neo4j?`)) return;
          try {
            const delRes = await api.deleteComponent(b.dataset.id, false);
            if (delRes.success) {
              app.toast('✓ Component deleted safely from Neo4j');
              refreshList();
            } else {
              if (confirm(`${delRes.error}\n\nForce delete anyway for demonstration?`)) {
                const forceRes = await api.deleteComponent(b.dataset.id, true);
                if (forceRes.success) {
                  app.toast('✓ Component force deleted');
                  refreshList();
                }
              }
            }
          } catch (e) {
            app.toast('Delete error: ' + e.message);
          }
        };
      });
    } catch (e) {
      grid.innerHTML = `<div class="card" style="grid-column:1/-1; padding:40px; color:var(--bad);">Error loading from Neo4j: ${e.message}</div>`;
    }
  }

  // Event handlers
  container.querySelectorAll('.catPill').forEach(p => {
    p.onclick = () => {
      container.querySelectorAll('.catPill').forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      currentCategory = p.dataset.cat;
      refreshList();
    };
  });

  const searchInput = document.getElementById('componentSearchInput');
  if (searchInput) {
    let debounce;
    searchInput.oninput = (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        currentSearch = e.target.value.trim();
        refreshList();
      }, 250);
    };
  }

  const sortSelect = document.getElementById('componentSortSelect');
  if (sortSelect) {
    sortSelect.onchange = (e) => {
      currentSort = e.target.value;
      refreshList();
    };
  }

  const createBtn = document.getElementById('openCreateCompBtn');
  if (createBtn) {
    createBtn.onclick = () => openCreateComponentModal(app, refreshList);
  }

  refreshList();
}

// Component Details Modal
async function openComponentModal(id, app, onDone) {
  try {
    const res = await api.getComponentById(id);
    if (!res.success) return app.toast('Could not fetch details: ' + res.error);

    const c = res.data;
    const modalWrap = document.getElementById('modalWrap');
    const modalTitle = document.getElementById('modalTitle');
    const modalSub = document.getElementById('modalSub');
    const modalContent = document.getElementById('modalContent');

    modalTitle.textContent = c.model;
    modalSub.textContent = `${c.manufacturer} · Category: ${c.categoryName} · Score: ${c.performanceScore}/100`;

    modalContent.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px;">
        <div class="card" style="padding:16px;">
          <div class="eyebrow">SPECIFICATIONS</div>
          <p style="font-size:13px; margin-top:6px;">${c.specs || 'No extended specs'}</p>
          <div class="row" style="margin-top:10px;"><span>Socket</span><b>${c.socketType || 'N/A'}</b></div>
          <div class="row"><span>TDP</span><b>${c.tdpWatts ? c.tdpWatts + 'W' : 'N/A'}</b></div>
          <div class="row"><span>Base Price</span><b>₹${(c.priceINR || 0).toLocaleString('en-IN')}</b></div>
        </div>

        <div class="card" style="padding:16px;">
          <div class="eyebrow">RETAILER LISTINGS (${c.listings.length})</div>
          <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
            ${c.listings.length ? c.listings.map(l => `
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:12.5px; border-bottom:1px solid var(--line); padding-bottom:4px;">
                <span><b>${l.retailerName}</b> (${l.stockStatus})</span>
                <span style="font-weight:700;">₹${(l.currentPriceINR || 0).toLocaleString('en-IN')}</span>
              </div>
            `).join('') : '<p class="muted" style="font-size:12px;">No retailer listings recorded.</p>'}
          </div>
        </div>
      </div>

      <!-- Reviews Section -->
      <div class="card" style="padding:16px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="eyebrow">COMMUNITY REVIEWS (${c.reviewCount})</div>
          <span>Avg: ★ ${c.averageRating} / 5</span>
        </div>
        <div style="margin-top:10px;" id="modalReviewList">Loading reviews...</div>

        <!-- Add Review Form -->
        <div style="margin-top:16px; border-top:1px solid var(--line); padding-top:12px;">
          <div class="eyebrow">WRITE A REVIEW (1–5 RATING CONSTRAINT)</div>
          <div style="display:flex; gap:8px; margin:8px 0;">
            <select id="newReviewRating" style="padding:6px; border:1px solid var(--line); border-radius:8px; background:var(--panel2);">
              <option value="5">★★★★★ (5 - Excellent)</option>
              <option value="4">★★★★☆ (4 - Very Good)</option>
              <option value="3">★★★☆☆ (3 - Average)</option>
              <option value="2">★★☆☆☆ (2 - Below Par)</option>
              <option value="1">★☆☆☆☆ (1 - Poor)</option>
            </select>
            <input type="text" id="newReviewComment" placeholder="Write feedback..." style="flex:1; padding:6px 10px; border:1px solid var(--line); border-radius:8px; background:var(--panel);">
            <button class="primary" id="submitReviewBtn" style="padding:6px 14px;">Post</button>
          </div>
        </div>
      </div>
    `;

    // Load actual reviews
    const revRes = await api.getReviews(c.compId);
    const revList = document.getElementById('modalReviewList');
    if (revList) {
      if (revRes.data && revRes.data.length) {
        revList.innerHTML = revRes.data.map(r => `
          <div style="border-bottom:1px solid var(--line); padding:6px 0; font-size:12.5px;">
            <div style="display:flex; justify-content:space-between;">
              <b>@${r.username}</b>
              <span style="color:var(--accent2); font-weight:700;">★ ${r.rating}/5</span>
            </div>
            <p style="color:var(--text); margin-top:2px;">${r.comment}</p>
          </div>
        `).join('');
      } else {
        revList.innerHTML = '<p class="muted" style="font-size:12px;">No reviews yet. Be the first to write one!</p>';
      }
    }

    // Submit review event
    const submitBtn = document.getElementById('submitReviewBtn');
    if (submitBtn) {
      submitBtn.onclick = async () => {
        const rating = Number(document.getElementById('newReviewRating').value);
        const comment = document.getElementById('newReviewComment').value.trim();
        try {
          const createRev = await api.createReview({
            compId: c.compId,
            userId: app.currentUserId,
            rating,
            comment
          });
          if (createRev.success) {
            app.toast('✓ Review saved in Neo4j with rating constraint!');
            openComponentModal(id, app, onDone);
            if (onDone) onDone();
          } else {
            app.toast(createRev.error || 'Failed to submit review');
          }
        } catch (e) {
          app.toast('Review error: ' + e.message);
        }
      };
    }

    modalWrap.classList.add('show');
  } catch (e) {
    app.toast('Modal error: ' + e.message);
  }
}

// Modal for Creating New Component (CRUD Demo)
function openCreateComponentModal(app, onDone) {
  const modalWrap = document.getElementById('modalWrap');
  document.getElementById('modalTitle').textContent = '➕ Create New Component';
  document.getElementById('modalSub').textContent = 'Adds a new hardware node with subtype labels in Neo4j graph.';

  document.getElementById('modalContent').innerHTML = `
    <form id="createCompForm" style="display:flex; flex-direction:column; gap:12px;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <label style="font-size:12px; font-weight:700; color:var(--muted);">Category</label>
          <select id="newCompCat" style="width:100%; padding:8px; border:1px solid var(--line); border-radius:8px; background:var(--panel); margin-top:4px;">
            <option value="cpu">CPU (Processor)</option>
            <option value="motherboard">Motherboard</option>
            <option value="gpu">GPU (Graphics Card)</option>
            <option value="ram">RAM (Memory)</option>
            <option value="storage">Storage (SSD)</option>
            <option value="psu">Power Supply</option>
            <option value="case">Case</option>
          </select>
        </div>
        <div>
          <label style="font-size:12px; font-weight:700; color:var(--muted);">Manufacturer</label>
          <input type="text" id="newCompMfg" placeholder="e.g. AMD, Intel, ASUS" required style="width:100%; padding:8px; border:1px solid var(--line); border-radius:8px; background:var(--panel); margin-top:4px;">
        </div>
      </div>

      <div>
        <label style="font-size:12px; font-weight:700; color:var(--muted);">Model Name</label>
        <input type="text" id="newCompModel" placeholder="e.g. AMD Ryzen 9 9950X" required style="width:100%; padding:8px; border:1px solid var(--line); border-radius:8px; background:var(--panel); margin-top:4px;">
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
        <div>
          <label style="font-size:12px; font-weight:700; color:var(--muted);">Price (INR)</label>
          <input type="number" id="newCompPrice" placeholder="54999" required style="width:100%; padding:8px; border:1px solid var(--line); border-radius:8px; background:var(--panel); margin-top:4px;">
        </div>
        <div>
          <label style="font-size:12px; font-weight:700; color:var(--muted);">TDP (Watts)</label>
          <input type="number" id="newCompTdp" placeholder="170" style="width:100%; padding:8px; border:1px solid var(--line); border-radius:8px; background:var(--panel); margin-top:4px;">
        </div>
        <div>
          <label style="font-size:12px; font-weight:700; color:var(--muted);">Performance (0–100)</label>
          <input type="number" id="newCompScore" placeholder="98" style="width:100%; padding:8px; border:1px solid var(--line); border-radius:8px; background:var(--panel); margin-top:4px;">
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <label style="font-size:12px; font-weight:700; color:var(--muted);">Socket Type (CPU/Mobo)</label>
          <input type="text" id="newCompSocket" placeholder="e.g. AM5 or LGA1700" style="width:100%; padding:8px; border:1px solid var(--line); border-radius:8px; background:var(--panel); margin-top:4px;">
        </div>
        <div>
          <label style="font-size:12px; font-weight:700; color:var(--muted);">Specs Description</label>
          <input type="text" id="newCompSpecs" placeholder="e.g. 16C/32T · 5.7GHz Boost" style="width:100%; padding:8px; border:1px solid var(--line); border-radius:8px; background:var(--panel); margin-top:4px;">
        </div>
      </div>

      <button type="submit" class="primary" style="margin-top:14px; padding:10px;">Create Component Node in Neo4j</button>
    </form>
  `;

  document.getElementById('createCompForm').onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      categorySlug: document.getElementById('newCompCat').value,
      manufacturer: document.getElementById('newCompMfg').value.trim(),
      model: document.getElementById('newCompModel').value.trim(),
      priceINR: Number(document.getElementById('newCompPrice').value),
      tdpWatts: Number(document.getElementById('newCompTdp').value) || 0,
      performanceScore: Number(document.getElementById('newCompScore').value) || 80,
      socketType: document.getElementById('newCompSocket').value.trim() || null,
      specs: document.getElementById('newCompSpecs').value.trim() || ''
    };

    try {
      const res = await api.createComponent(data);
      if (res.success) {
        app.toast('✓ Component successfully created in Neo4j!');
        modalWrap.classList.remove('show');
        if (onDone) onDone();
      } else {
        app.toast('Failed: ' + res.error);
      }
    } catch (err) {
      app.toast('Creation error: ' + err.message);
    }
  };

  modalWrap.classList.add('show');
}

function openEditComponentModal(item, app, onDone) {
  const modalWrap = document.getElementById('modalWrap');
  document.getElementById('modalTitle').textContent = `✏️ Edit ${item.model}`;
  document.getElementById('modalSub').textContent = 'Updates component specifications directly in Neo4j.';

  document.getElementById('modalContent').innerHTML = `
    <form id="editCompForm" style="display:flex; flex-direction:column; gap:12px;">
      <div>
        <label style="font-size:12px; font-weight:700; color:var(--muted);">Model Name</label>
        <input type="text" id="editCompModel" value="${item.model}" required style="width:100%; padding:8px; border:1px solid var(--line); border-radius:8px; background:var(--panel); margin-top:4px;">
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <label style="font-size:12px; font-weight:700; color:var(--muted);">Price (INR)</label>
          <input type="number" id="editCompPrice" value="${item.priceINR}" required style="width:100%; padding:8px; border:1px solid var(--line); border-radius:8px; background:var(--panel); margin-top:4px;">
        </div>
        <div>
          <label style="font-size:12px; font-weight:700; color:var(--muted);">TDP (Watts)</label>
          <input type="number" id="editCompTdp" value="${item.tdpWatts || 0}" style="width:100%; padding:8px; border:1px solid var(--line); border-radius:8px; background:var(--panel); margin-top:4px;">
        </div>
      </div>
      <div>
        <label style="font-size:12px; font-weight:700; color:var(--muted);">Specifications</label>
        <input type="text" id="editCompSpecs" value="${item.specs || ''}" style="width:100%; padding:8px; border:1px solid var(--line); border-radius:8px; background:var(--panel); margin-top:4px;">
      </div>
      <button type="submit" class="primary" style="margin-top:14px; padding:10px;">Save Changes to Neo4j</button>
    </form>
  `;

  document.getElementById('editCompForm').onsubmit = async (e) => {
    e.preventDefault();
    const updateData = {
      model: document.getElementById('editCompModel').value.trim(),
      priceINR: Number(document.getElementById('editCompPrice').value),
      tdpWatts: Number(document.getElementById('editCompTdp').value),
      specs: document.getElementById('editCompSpecs').value.trim()
    };

    try {
      const res = await api.updateComponent(item.compId, updateData);
      if (res.success) {
        app.toast('✓ Component updated in Neo4j!');
        modalWrap.classList.remove('show');
        if (onDone) onDone();
      } else {
        app.toast('Failed: ' + res.error);
      }
    } catch (err) {
      app.toast('Update error: ' + err.message);
    }
  };

  modalWrap.classList.add('show');
}
