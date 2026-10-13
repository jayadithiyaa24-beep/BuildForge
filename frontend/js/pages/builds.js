import { api } from '../api.js';

export function renderBuildsPage(app) {
  const container = document.getElementById('page-builds');
  container.innerHTML = `
    <div class="sectionTitle" style="margin-top:0;">
      <div>
        <div class="eyebrow">COMMUNITY & USER CONFIGURATIONS</div>
        <h2>Saved PC Builds</h2>
        <p class="muted">All virtual rigs stored as <code>(:Build)</code> nodes and <code>[:CONTAINS]</code> relationships in Neo4j.</p>
      </div>
      <div class="actions">
        <button class="primary" data-nav="builder">➕ Configure New Build</button>
      </div>
    </div>

    <div id="buildsListContainer" style="display:flex; flex-direction:column; gap:16px;">
      <div class="card" style="padding:40px; text-align:center;">Loading builds from Neo4j...</div>
    </div>
  `;

  container.querySelectorAll('[data-nav]').forEach(b => {
    b.onclick = () => app.navigate(b.dataset.nav);
  });

  loadSavedBuilds(app);
}

async function loadSavedBuilds(app) {
  const list = document.getElementById('buildsListContainer');
  if (!list) return;

  try {
    const res = await api.getBuilds();
    if (!res.data || !res.data.length) {
      list.innerHTML = `
        <div class="card" style="padding:60px; text-align:center;">
          <div style="font-size:36px; margin-bottom:12px;">🖥️</div>
          <h3>No Saved Builds Found</h3>
          <p class="muted" style="max-width:400px; margin:8px auto 18px;">Configure your hardware parts and save a new build to store it in Neo4j.</p>
          <button class="primary" data-nav="builder">Start PC Builder →</button>
        </div>
      `;
      list.querySelectorAll('[data-nav]').forEach(b => {
        b.onclick = () => app.navigate(b.dataset.nav);
      });
      return;
    }

    list.innerHTML = res.data.map(b => `
      <div class="card" style="padding:22px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="display:flex; gap:8px; align-items:center;">
              <span class="badge good">ID: ${b.buildId}</span>
              <span style="font-size:12px; color:var(--muted);">By @${b.creatorUsername || 'User'} · ${b.createdAt}</span>
            </div>
            <h3 style="margin:8px 0 4px; font-size:18px;">${b.name}</h3>
            <p class="muted" style="font-size:13px;">${b.partCount} Components · Estimated Draw: ${b.totalWattage}W</p>
          </div>

          <div style="text-align:right;">
            <div class="price" style="font-size:22px; color:var(--accent2);">₹${(b.totalEstimatedPrice || 0).toLocaleString('en-IN')}</div>
            <div style="display:flex; gap:8px; margin-top:10px;">
              <button class="secondary openBuildBtn" data-id="${b.buildId}">Open in Builder</button>
              <button class="secondary addBuildCartBtn" data-id="${b.buildId}">Add to Cart</button>
              <button class="dangerBtn delBuildBtn" data-id="${b.buildId}">Delete</button>
            </div>
          </div>
        </div>

        <!-- Components Pill List -->
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:16px; border-top:1px solid var(--line); padding-top:14px;">
          ${(b.components || []).map(cp => `
            <span class="badge" style="background:var(--panel2); font-size:11.5px;">
              <b>${cp.categoryName || 'Part'}:</b> ${cp.model}
            </span>
          `).join('')}
        </div>
      </div>
    `).join('');

    // Attach actions
    list.querySelectorAll('.openBuildBtn').forEach(btn => {
      btn.onclick = async () => {
        try {
          const detail = await api.getBuildById(btn.dataset.id);
          if (detail.success && detail.data && detail.data.components) {
            app.currentBuild = {};
            detail.data.components.forEach(cp => {
              if (cp.categorySlug) {
                app.currentBuild[cp.categorySlug] = cp;
              }
            });
            app.saveBuildLocally();
            app.toast(`Loaded "${detail.data.name}" into PC Builder`);
            app.navigate('builder');
          }
        } catch (e) {
          app.toast('Could not open build: ' + e.message);
        }
      };
    });

    list.querySelectorAll('.addBuildCartBtn').forEach(btn => {
      btn.onclick = async () => {
        try {
          const res = await api.addToCart(app.currentUserId, btn.dataset.id);
          if (res.success) {
            app.toast('✓ Build added to Cart! Enforcing unique cart build constraint.');
            app.updateCartCount();
          } else {
            app.toast(res.error || 'Failed to add to cart');
          }
        } catch (e) {
          app.toast('Cart error: ' + e.message);
        }
      };
    });

    list.querySelectorAll('.delBuildBtn').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('Are you sure you want to delete this build from Neo4j?')) return;
        try {
          const res = await api.deleteBuild(btn.dataset.id);
          if (res.success) {
            app.toast('✓ Build deleted from Neo4j graph');
            loadSavedBuilds(app);
          } else {
            app.toast('Failed to delete build');
          }
        } catch (e) {
          app.toast('Delete error: ' + e.message);
        }
      };
    });
  } catch (err) {
    list.innerHTML = `<div class="card" style="padding:40px; color:var(--bad);">Error loading builds: ${err.message}</div>`;
  }
}
