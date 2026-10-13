export function renderComparePage(app) {
  const container = document.getElementById('page-compare');
  const items = app.compareList;

  container.innerHTML = `
    <div class="sectionTitle" style="margin-top:0;">
      <div>
        <div class="eyebrow">HARDWARE COMPARATOR</div>
        <h2>Side-by-Side Component Comparison</h2>
        <p class="muted">Compare specifications, power consumption, benchmark scores, and value metrics.</p>
      </div>
      <div class="actions">
        <button class="secondary" id="clearCompareBtn" ${items.length === 0 ? 'disabled' : ''}>Clear All</button>
      </div>
    </div>

    ${!items.length ? `
      <div class="card" style="padding:60px 20px; text-align:center;">
        <div style="font-size:36px; margin-bottom:12px;">⚖️</div>
        <h3>No Components Selected for Comparison</h3>
        <p class="muted" style="max-width:440px; margin:8px auto 18px;">Browse the Components or PC Builder page and click "Compare" on any hardware part to analyze them side-by-side.</p>
        <button class="primary" data-nav="parts">Browse Components Catalogue →</button>
      </div>
    ` : `
      <div class="tableWrap">
        <table>
          <thead>
            <tr>
              <th style="width:200px;">Metric</th>
              ${items.map(c => `
                <th>
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span>${c.model}</span>
                    <button class="removeCompareBtn" data-id="${c.compId}" style="color:var(--bad); font-size:14px; padding:2px 6px;">✕</button>
                  </div>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Category</b></td>
              ${items.map(c => `<td><span class="badge good">${c.categoryName || c.categorySlug || 'Hardware'}</span></td>`).join('')}
            </tr>
            <tr>
              <td><b>Manufacturer</b></td>
              ${items.map(c => `<td>${c.manufacturer}</td>`).join('')}
            </tr>
            <tr>
              <td><b>Price (INR)</b></td>
              ${items.map(c => `<td><b style="color:var(--accent2); font-size:15px;">₹${(c.priceINR || 0).toLocaleString('en-IN')}</b></td>`).join('')}
            </tr>
            <tr>
              <td><b>Performance Index</b></td>
              ${items.map(c => `<td><span class="badge" style="font-weight:700;">${c.performanceScore || 80} / 100</span></td>`).join('')}
            </tr>
            <tr>
              <td><b>TDP / Power Draw</b></td>
              ${items.map(c => `<td>${c.tdpWatts ? c.tdpWatts + 'W' : '—'}</td>`).join('')}
            </tr>
            <tr>
              <td><b>Socket / Form Factor</b></td>
              ${items.map(c => `<td>${c.socketType || c.formFactor || 'Standard'}</td>`).join('')}
            </tr>
            <tr>
              <td><b>Key Specifications</b></td>
              ${items.map(c => `<td style="font-size:12px; color:var(--muted);">${c.specs || 'Standard specifications'}</td>`).join('')}
            </tr>
            <tr>
              <td><b>Value Score (Perf/₹)</b></td>
              ${items.map(c => {
                const ratio = c.priceINR ? (((c.performanceScore || 80) / c.priceINR) * 10000).toFixed(2) : '—';
                return `<td><span class="badge good">${ratio} pts</span></td>`;
              }).join('')}
            </tr>
            <tr>
              <td><b>Action</b></td>
              ${items.map(c => `
                <td>
                  <button class="primary addCompareToBuildBtn" data-id="${c.compId}" data-cat="${c.categorySlug}" style="padding:6px 12px; font-size:12px;">
                    Add to Build
                  </button>
                </td>
              `).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `}
  `;

  // Attach events
  container.querySelectorAll('[data-nav]').forEach(b => {
    b.onclick = () => app.navigate(b.dataset.nav);
  });

  const clearBtn = document.getElementById('clearCompareBtn');
  if (clearBtn) {
    clearBtn.onclick = () => {
      app.compareList = [];
      app.saveCompareLocally();
      renderComparePage(app);
      app.toast('Comparison list cleared');
    };
  }

  container.querySelectorAll('.removeCompareBtn').forEach(b => {
    b.onclick = () => {
      app.compareList = app.compareList.filter(x => x.compId !== b.dataset.id);
      app.saveCompareLocally();
      renderComparePage(app);
      app.toast('Removed from comparison');
    };
  });

  container.querySelectorAll('.addCompareToBuildBtn').forEach(b => {
    b.onclick = () => {
      const item = items.find(x => x.compId === b.dataset.id);
      if (item) {
        app.setBuildSlot(item.categorySlug, item);
        app.navigate('builder');
      }
    };
  });
}
