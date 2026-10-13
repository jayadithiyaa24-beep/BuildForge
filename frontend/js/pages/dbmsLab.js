import { api } from '../api.js';

let catalog = [];
let currentQueryId = 'query-1';

export function renderDbmsLabPage(app) {
  const container = document.getElementById('page-lab');
  container.innerHTML = `
    <div class="sectionTitle" style="margin-top:0;">
      <div>
        <div class="eyebrow">ACADEMIC CYPHER BENCHMARK SUITE</div>
        <h2>DBMS Lab — 18 Graph Cypher Demonstrations</h2>
        <p class="muted">Live execution of 18 property graph queries demonstrating multi-hop traversals, aggregations, anti-joins, and recommendations in Neo4j.</p>
      </div>
    </div>

    <!-- Query Selector Grid / Bar -->
    <div class="card" style="padding:18px; margin-bottom:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div style="flex:1; min-width:280px;">
          <label style="font-size:12px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:1px;">Select Demonstration Query (1 to 18):</label>
          <select id="labQuerySelect" style="width:100%; padding:10px; border:1px solid var(--line); border-radius:10px; background:var(--panel2); font-weight:700; font-size:14px; margin-top:6px;">
            <option value="">Loading analytical query suite...</option>
          </select>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="primary" id="runLabQueryBtn" style="padding:10px 22px; font-size:14px;">
            ▶ Run Query on Neo4j
          </button>
        </div>
      </div>
    </div>

    <!-- Active Query Inspection Card -->
    <div class="card" style="padding:24px; margin-bottom:24px;" id="activeQueryCard">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
        <div>
          <span class="badge good" id="activeQueryBadge">Category</span>
          <h3 id="activeQueryTitle" style="font-size:20px; margin-top:6px;">Query Name</h3>
        </div>
        <span class="badge" id="activeQueryIdBadge" style="background:var(--panel2); font-family:monospace;">query-1</span>
      </div>
      <p id="activeQueryDesc" class="muted" style="font-size:13.5px; line-height:1.6; margin-bottom:14px;"></p>

      <!-- Parameter Inputs Box -->
      <div id="queryParamInputsContainer" style="background:var(--panel2); border-radius:10px; padding:12px; margin-bottom:14px; display:none;"></div>

      <div class="eyebrow">ACTUAL CYPHER QUERY EXECUTED:</div>
      <div class="codeBox" id="activeCypherBox"></div>
    </div>

    <!-- Query Results Section -->
    <div class="sectionTitle">
      <div>
        <div class="eyebrow">GRAPH EXECUTION OUTPUT</div>
        <h2>Query Results</h2>
      </div>
      <div style="display:flex; gap:12px; align-items:center;">
        <span id="queryExecStats" style="font-size:12.5px; color:var(--muted);"></span>
      </div>
    </div>

    <div id="queryResultsOutput">
      <div class="card" style="padding:40px; text-align:center; color:var(--muted);">
        Click <b>"Run Query on Neo4j"</b> above to execute this Cypher query against your connected database.
      </div>
    </div>
  `;

  loadCatalog(app);
}

async function loadCatalog(app) {
  const select = document.getElementById('labQuerySelect');
  if (!select) return;

  try {
    const res = await api.getAnalyticsCatalog();
    if (!res.success || !res.data) return;

    catalog = res.data;
    select.innerHTML = catalog.map((q, idx) => `
      <option value="${q.id}" ${q.id === currentQueryId ? 'selected' : ''}>
        #${idx + 1}: ${q.name} (${q.category})
      </option>
    `).join('');

    select.onchange = (e) => {
      currentQueryId = e.target.value;
      updateActiveQueryView();
    };

    updateActiveQueryView();

    const runBtn = document.getElementById('runLabQueryBtn');
    if (runBtn) {
      runBtn.onclick = () => executeActiveQuery(app);
    }
  } catch (err) {
    console.error('Failed to load analytical catalog:', err);
  }
}

function updateActiveQueryView() {
  const item = catalog.find(q => q.id === currentQueryId);
  if (!item) return;

  document.getElementById('activeQueryBadge').textContent = item.category || 'Analytical';
  document.getElementById('activeQueryIdBadge').textContent = item.id;
  document.getElementById('activeQueryTitle').textContent = item.name;
  document.getElementById('activeQueryDesc').textContent = item.description;
  
  // Format Cypher code with basic coloring
  const cypherHtml = highlightCypher(item.cypherCode || '');
  document.getElementById('activeCypherBox').innerHTML = cypherHtml;

  // Render parameter inputs if required
  const paramBox = document.getElementById('queryParamInputsContainer');
  if (item.defaultParams && Object.keys(item.defaultParams).length > 0) {
    paramBox.style.display = 'block';
    paramBox.innerHTML = `
      <div style="font-size:12px; font-weight:700; margin-bottom:6px;">Parameters (Cypher $variables):</div>
      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        ${Object.keys(item.defaultParams).map(k => `
          <div style="display:flex; align-items:center; gap:6px;">
            <label style="font-size:12px; color:var(--muted); font-family:monospace;">$${k}:</label>
            <input type="text" id="param_${k}" value="${item.defaultParams[k]}" style="padding:4px 8px; border:1px solid var(--line); border-radius:6px; background:var(--panel); font-size:12px; font-weight:600;">
          </div>
        `).join('')}
      </div>
    `;
  } else {
    paramBox.style.display = 'none';
  }
}

async function executeActiveQuery(app) {
  const item = catalog.find(q => q.id === currentQueryId);
  if (!item) return;

  const runBtn = document.getElementById('runLabQueryBtn');
  const resultsBox = document.getElementById('queryResultsOutput');
  const statsBox = document.getElementById('queryExecStats');

  try {
    runBtn.disabled = true;
    runBtn.textContent = 'Executing Cypher...';
    resultsBox.innerHTML = '<div class="card" style="padding:40px; text-align:center;">Executing graph query in Neo4j engine...</div>';

    // Gather params from inputs
    const params = { ...(item.defaultParams || {}) };
    if (item.defaultParams) {
      Object.keys(item.defaultParams).forEach(k => {
        const inp = document.getElementById(`param_${k}`);
        if (inp) params[k] = inp.value.trim();
      });
    }

    const res = await api.runAnalyticsQuery(item.id, params);

    if (!res.success) {
      resultsBox.innerHTML = `
        <div class="card" style="padding:30px; border-color:var(--bad); background:rgba(168,93,85,0.08);">
          <h4 style="color:var(--bad);">Query Execution Error</h4>
          <p style="font-size:13px; margin-top:6px;">${res.error || 'Server error'}</p>
        </div>
      `;
      return;
    }

    statsBox.innerHTML = `<span>Returned <b>${res.rowCount}</b> record(s) in <b>${res.executionTimeMs}ms</b></span>`;

    if (!res.data || !res.data.length) {
      resultsBox.innerHTML = `
        <div class="card" style="padding:40px; text-align:center; color:var(--muted);">
          Query executed successfully with 0 matching records in Neo4j.
        </div>
      `;
      return;
    }

    // Render Tabular Results
    const columns = Object.keys(res.data[0]);
    resultsBox.innerHTML = `
      <div class="tableWrap">
        <table>
          <thead>
            <tr>
              ${columns.map(c => `<th>${c}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${res.data.map(row => `
              <tr>
                ${columns.map(col => {
                  let val = row[col];
                  if (Array.isArray(val)) {
                    val = val.length ? val.join(', ') : '[]';
                  } else if (typeof val === 'object' && val !== null) {
                    val = JSON.stringify(val);
                  }
                  return `<td>${val !== undefined && val !== null ? val : '—'}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    app.toast(`✓ Query executed in ${res.executionTimeMs}ms (${res.rowCount} rows)`);
  } catch (err) {
    resultsBox.innerHTML = `<div class="card" style="padding:30px; color:var(--bad);">Execution failed: ${err.message}</div>`;
  } finally {
    runBtn.disabled = false;
    runBtn.textContent = '▶ Run Query on Neo4j';
  }
}

function highlightCypher(code) {
  const keywords = ['MATCH', 'OPTIONAL MATCH', 'RETURN', 'WHERE', 'ORDER BY', 'ASC', 'DESC', 'WITH', 'UNWIND', 'LIMIT', 'COLLECT', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'ROUND', 'COALESCE', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'AS', 'NOT', 'AND', 'OR', 'CREATE', 'MERGE', 'SET', 'DELETE', 'DETACH'];
  let escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  keywords.forEach(kw => {
    const reg = new RegExp(`\\b(${kw})\\b`, 'g');
    escaped = escaped.replace(reg, '<span class="keyword">$1</span>');
  });

  // Highlight labels (:Label)
  escaped = escaped.replace(/:([A-Za-z0-9_]+)/g, ':<span class="label">$1</span>');
  // Highlight relationships [:REL]
  escaped = escaped.replace(/\[:([A-Za-z0-9_]+)\]/g, '[:<span class="rel">$1</span>]');

  return escaped;
}
