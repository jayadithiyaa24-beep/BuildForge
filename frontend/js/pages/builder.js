import { api } from '../api.js';

export const CORE_SLOTS = [
  { key: 'cpu', label: 'CPU', desc: 'Central Processing Unit', catSlug: 'cpu' },
  { key: 'motherboard', label: 'Motherboard', desc: 'Mainboard with matching socket', catSlug: 'motherboard' },
  { key: 'gpu', label: 'GPU', desc: 'Dedicated Graphics Card', catSlug: 'gpu' },
  { key: 'ram', label: 'RAM', desc: 'System Memory Kit', catSlug: 'ram' },
  { key: 'storage', label: 'Storage', desc: 'NVMe Gen4 / Gen5 SSD', catSlug: 'storage' },
  { key: 'psu', label: 'Power Supply', desc: 'ATX Power Supply Unit', catSlug: 'psu' }
];

export function renderBuilderPage(app) {
  const container = document.getElementById('page-builder');
  const build = app.currentBuild;

  // Compute metrics
  let totalINR = 0;
  let totalWatts = 0;
  let totalScore = 0;
  let filledCount = 0;

  CORE_SLOTS.forEach(slot => {
    const comp = build[slot.key];
    if (comp) {
      totalINR += comp.priceINR || 0;
      totalWatts += comp.tdpWatts || 0;
      totalScore += comp.performanceScore || 80;
      filledCount++;
    }
  });

  const avgScore = filledCount ? Math.round(totalScore / filledCount) : 0;

  // Run dynamic compatibility validation
  const compat = evaluateCompatibility(build, totalWatts);

  container.innerHTML = `
    <div class="sectionTitle" style="margin-top:0;">
      <div>
        <div class="eyebrow">CONFIGURATOR WORKSPACE</div>
        <h2>PC Build Configurator</h2>
        <p class="muted">Select real hardware parts fetched from Neo4j. Real-time Cypher validation engine.</p>
      </div>
      <div class="actions">
        <button class="secondary" id="resetBuildBtn">Reset</button>
        <button class="primary" id="saveBuildBtn">Save Build to Neo4j</button>
      </div>
    </div>

    <div class="builderLayout">
      <div class="partsList">
        ${CORE_SLOTS.map(slot => {
          const comp = build[slot.key];
          return `
            <div class="partSlot ${comp ? 'filled' : ''}">
              <div class="slotThumb">${slot.label}</div>
              <div>
                <h3 style="margin-bottom:2px; font-size:15px;">${comp ? comp.model : 'Choose ' + slot.label}</h3>
                <p class="muted" style="font-size:12px;">${comp ? (comp.specs || comp.manufacturer) : slot.desc}</p>
              </div>
              <div class="price">${comp ? '₹' + (comp.priceINR || 0).toLocaleString('en-IN') : '—'}</div>
              <div style="display:flex; gap:6px;">
                ${comp ? `<button class="secondary removeSlotBtn" data-slot="${slot.key}" title="Remove part" style="padding:8px 10px; color:var(--bad);">✕</button>` : ''}
                <button class="secondary selectSlotBtn" data-slot="${slot.key}" data-cat="${slot.catSlug}">
                  ${comp ? 'Change' : 'Choose'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <aside class="sideSummary">
        <div class="card">
          <div class="eyebrow">ESTIMATED QUOTATION</div>
          <div class="totalDisplay">₹${totalINR.toLocaleString('en-IN')}</div>
          <div class="muted" style="font-size:12px;">Baseline INR hardware cost</div>
          
          <div class="divider"></div>

          <div class="row">
            <span>Core Components</span>
            <b>${filledCount} / ${CORE_SLOTS.length}</b>
          </div>
          <div class="row">
            <span>Estimated Power Draw</span>
            <b>${totalWatts}W ${totalWatts ? '(+50W headroom)' : ''}</b>
          </div>
          <div class="row">
            <span>Performance Index</span>
            <b>${avgScore ? avgScore + '/100' : '—'}</b>
          </div>

          <!-- Compatibility Status -->
          <div class="compatBox ${compat.status}">
            <div>${compat.icon}</div>
            <div>
              <strong>${compat.title}</strong>
              <div style="font-size:11.5px; opacity:0.9; margin-top:2px;">${compat.message}</div>
            </div>
          </div>

          <button class="primary" id="addCartBtn" style="width:100%; margin-top:10px;" ${filledCount === 0 ? 'disabled' : ''}>
            Add Build to Cart 🛒
          </button>
        </div>
      </aside>
    </div>
  `;

  // Attach button events
  container.querySelectorAll('.selectSlotBtn').forEach(btn => {
    btn.onclick = () => app.openPartModal(btn.dataset.slot, btn.dataset.cat);
  });

  container.querySelectorAll('.removeSlotBtn').forEach(btn => {
    btn.onclick = () => {
      delete app.currentBuild[btn.dataset.slot];
      app.saveBuildLocally();
      renderBuilderPage(app);
      app.toast(`Removed ${btn.dataset.slot.toUpperCase()} from build`);
    };
  });

  const resetBtn = document.getElementById('resetBuildBtn');
  if (resetBtn) {
    resetBtn.onclick = () => {
      app.currentBuild = {};
      app.saveBuildLocally();
      renderBuilderPage(app);
      app.toast('Build reset');
    };
  }

  const saveBtn = document.getElementById('saveBuildBtn');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      if (filledCount === 0) {
        return app.toast('Please select at least one component before saving');
      }
      const buildName = prompt('Enter a name for your custom build:', 'BuildForge Custom Rig ' + new Date().toLocaleDateString('en-IN'));
      if (!buildName) return;

      const compIds = Object.values(app.currentBuild).map(c => c.compId).filter(Boolean);
      try {
        const res = await api.createBuild({
          userId: app.currentUserId,
          name: buildName,
          componentIds: compIds
        });
        if (res.success) {
          app.toast(`✓ Build "${buildName}" saved in Neo4j database!`);
          app.navigate('builds');
        } else {
          app.toast('Failed to save build: ' + (res.error || 'Server error'));
        }
      } catch (err) {
        app.toast('Error saving build to database: ' + err.message);
      }
    };
  }

  const addCartBtn = document.getElementById('addCartBtn');
  if (addCartBtn) {
    addCartBtn.onclick = async () => {
      if (filledCount === 0) return app.toast('Build is empty');

      // First check if build is saved, or save temporary build
      const compIds = Object.values(app.currentBuild).map(c => c.compId).filter(Boolean);
      try {
        const createRes = await api.createBuild({
          userId: app.currentUserId,
          name: 'Cart Rig - ' + new Date().toLocaleTimeString(),
          componentIds: compIds
        });

        if (createRes.success && createRes.data) {
          const cartRes = await api.addToCart(app.currentUserId, createRes.data.buildId);
          if (cartRes.success) {
            app.toast('✓ Build added to Cart! Check Cart & Orders.');
            app.updateCartCount();
          } else {
            app.toast(cartRes.error || 'Failed to add build to cart');
          }
        }
      } catch (err) {
        app.toast('Cart error: ' + err.message);
      }
    };
  }
}

function evaluateCompatibility(build, totalWatts) {
  const cpu = build.cpu;
  const mobo = build.motherboard;
  const ram = build.ram;
  const psu = build.psu;

  // 1. Check socket match
  if (cpu && mobo) {
    if (cpu.socketType && mobo.socketType && cpu.socketType !== mobo.socketType) {
      return {
        status: 'mismatch',
        icon: '✕',
        title: 'Physical Socket Conflict!',
        message: `CPU (${cpu.model}) requires ${cpu.socketType} socket, but Motherboard (${mobo.model}) has ${mobo.socketType} socket. Parts cannot be mounted.`
      };
    }
  }

  // 2. Check RAM Generation match
  if (ram && mobo) {
    if (ram.ramGeneration && mobo.ramGeneration && ram.ramGeneration !== mobo.ramGeneration) {
      return {
        status: 'mismatch',
        icon: '✕',
        title: 'Memory Generation Conflict!',
        message: `RAM kit is ${ram.ramGeneration}, but motherboard slots require ${mobo.ramGeneration}.`
      };
    }
  }

  // 3. Check PSU Capacity
  if (psu && totalWatts > 0) {
    if (psu.wattage && psu.wattage < (totalWatts + 80)) {
      return {
        status: 'mismatch',
        icon: '⚠️',
        title: 'Insufficient Power Supply Headroom',
        message: `Estimated draw is ${totalWatts}W (+80W buffer = ${totalWatts + 80}W), but selected PSU provides only ${psu.wattage}W.`
      };
    }
  }

  // 4. Incomplete check
  const missing = CORE_SLOTS.filter(s => !build[s.key]);
  if (missing.length > 0) {
    return {
      status: 'incomplete',
      icon: 'ℹ',
      title: 'Build in Progress',
      message: `Selected parts are compatible so far. Add ${missing.map(m => m.label).slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''} to complete system.`
    };
  }

  return {
    status: 'ready',
    icon: '✓',
    title: 'Hardware Fully Compatible',
    message: `All core parts physically verified. Socket: ${cpu.socketType}, Memory: ${ram.ramGeneration || 'DDR5'}, PSU Headroom: ${psu ? (psu.wattage - totalWatts) + 'W' : 'Adequate'}.`
  };
}
