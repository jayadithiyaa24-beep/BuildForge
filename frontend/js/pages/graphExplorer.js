import { api } from '../api.js';

let cyInstance = null;
let selectedNodeData = null;

export function renderGraphExplorerPage(app) {
  const container = document.getElementById('page-graph');
  container.innerHTML = `
    <div class="sectionTitle" style="margin-top:0;">
      <div>
        <div class="eyebrow">NEO4J PROPERTY GRAPH VISUALIZATION</div>
        <h2>Interactive Graph Explorer</h2>
        <p class="muted">Live interactive visualization of nodes, relationships, and multi-hop traversals using Cytoscape.js.</p>
      </div>
      <div class="actions">
        <button class="secondary" id="graphReloadBtn">Reload Graph</button>
      </div>
    </div>

    <div class="graphContainer">
      <!-- Floating Control Bar -->
      <div class="graphControls">
        <select id="graphFilterLabel">
          <option value="ALL">All Node Labels</option>
          <option value="Component">Components</option>
          <option value="Build">Builds</option>
          <option value="User">Users</option>
          <option value="Category">Categories</option>
          <option value="Retailer">Retailers</option>
          <option value="Order">Orders</option>
        </select>

        <select id="graphLayoutSelect">
          <option value="cose">Force-Directed (CoSE)</option>
          <option value="concentric">Concentric Layout</option>
          <option value="breadthfirst">Hierarchical Tree</option>
          <option value="circle">Circular</option>
        </select>

        <button id="zoomInBtn" title="Zoom in">＋</button>
        <button id="zoomOutBtn" title="Zoom out">－</button>
        <button id="fitViewBtn" title="Fit to screen">Fit</button>
      </div>

      <!-- Graph Canvas -->
      <div id="cyCanvas"></div>

      <!-- Node Properties Inspector Drawer -->
      <div class="graphDrawer" id="graphDrawer">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h4 style="margin:0; font-size:16px;" id="drawerNodeTitle">Node Details</h4>
          <button id="closeDrawerBtn" style="color:var(--muted); font-size:18px;">✕</button>
        </div>
        <div id="drawerNodeBadge" style="margin-bottom:10px;"></div>
        <div id="drawerNodeProps" style="font-size:12.5px; line-height:1.6;"></div>
        <div style="margin-top:20px; border-top:1px solid var(--line); padding-top:14px;">
          <button class="primary" id="expandNeighborsBtn" style="width:100%; font-size:12px; padding:8px;">
            Expand Neighbors (1-Hop Traversal)
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach control events
  const filterSelect = document.getElementById('graphFilterLabel');
  const layoutSelect = document.getElementById('graphLayoutSelect');
  const reloadBtn = document.getElementById('graphReloadBtn');
  const zoomIn = document.getElementById('zoomInBtn');
  const zoomOut = document.getElementById('zoomOutBtn');
  const fitView = document.getElementById('fitViewBtn');
  const closeDrawer = document.getElementById('closeDrawerBtn');
  const expandBtn = document.getElementById('expandNeighborsBtn');

  if (filterSelect) filterSelect.onchange = () => loadGraph(app);
  if (layoutSelect) {
    layoutSelect.onchange = () => {
      if (cyInstance) {
        cyInstance.layout({ name: layoutSelect.value, animate: true, animationDuration: 600 }).run();
      }
    };
  }
  if (reloadBtn) reloadBtn.onclick = () => loadGraph(app);
  if (zoomIn) zoomIn.onclick = () => cyInstance && cyInstance.zoom(cyInstance.zoom() * 1.25);
  if (zoomOut) zoomOut.onclick = () => cyInstance && cyInstance.zoom(cyInstance.zoom() * 0.8);
  if (fitView) fitView.onclick = () => cyInstance && cyInstance.fit(null, 40);
  if (closeDrawer) {
    closeDrawer.onclick = () => {
      document.getElementById('graphDrawer').classList.remove('show');
    };
  }
  if (expandBtn) {
    expandBtn.onclick = async () => {
      if (!selectedNodeData || !cyInstance) return;
      try {
        expandBtn.textContent = 'Traversing...';
        const res = await api.expandGraphNode(selectedNodeData.id);
        if (res.success && res.data) {
          const { nodes = [], edges = [] } = res.data;
          nodes.forEach(n => {
            if (!cyInstance.getElementById(n.data.id).length) {
              cyInstance.add(n);
            }
          });
          edges.forEach(e => {
            if (!cyInstance.getElementById(e.data.id).length) {
              cyInstance.add(e);
            }
          });
          cyInstance.layout({ name: 'cose', animate: true, animationDuration: 500 }).run();
          app.toast(`Expanded ${nodes.length} connected neighbor nodes from Neo4j!`);
        }
      } catch (err) {
        app.toast('Expand error: ' + err.message);
      } finally {
        expandBtn.textContent = 'Expand Neighbors (1-Hop Traversal)';
      }
    };
  }

  // Initial load
  loadGraph(app);
}

async function loadGraph(app) {
  const canvas = document.getElementById('cyCanvas');
  if (!canvas || !window.cytoscape) {
    if (!window.cytoscape) {
      canvas.innerHTML = '<div style="padding:40px; text-align:center;">Loading Cytoscape.js engine...</div>';
      setTimeout(() => loadGraph(app), 300);
    }
    return;
  }

  const labelFilter = document.getElementById('graphFilterLabel').value;

  try {
    const res = await api.getGraphData({
      nodeLabel: labelFilter,
      limit: 80
    });

    if (!res.success || !res.data) {
      canvas.innerHTML = '<div style="padding:40px; text-align:center; color:var(--bad);">Failed to load graph from Neo4j.</div>';
      return;
    }

    const { nodes = [], edges = [] } = res.data;

    // Destroy existing instance
    if (cyInstance) {
      cyInstance.destroy();
      cyInstance = null;
    }

    // Initialize Cytoscape.js
    cyInstance = window.cytoscape({
      container: canvas,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'font-size': '11px',
            'font-family': 'Inter, sans-serif',
            'color': '#2B2625',
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'text-background-color': '#F7F4EE',
            'text-background-opacity': 0.8,
            'text-background-padding': '2px',
            'width': 34,
            'height': 34,
            'background-color': '#7A8B7B',
            'border-width': 2,
            'border-color': '#ffffff'
          }
        },
        {
          selector: 'node[type = "User"]',
          style: {
            'background-color': '#D4A359',
            'shape': 'ellipse',
            'width': 38,
            'height': 38
          }
        },
        {
          selector: 'node[type = "Build"]',
          style: {
            'background-color': '#657A69',
            'shape': 'hexagon',
            'width': 40,
            'height': 40
          }
        },
        {
          selector: 'node[type = "CPU"]',
          style: { 'background-color': '#E06D53', 'shape': 'rectangle' }
        },
        {
          selector: 'node[type = "Motherboard"]',
          style: { 'background-color': '#4A8296', 'shape': 'rectangle' }
        },
        {
          selector: 'node[type = "GPU"]',
          style: { 'background-color': '#3D9970', 'shape': 'rectangle' }
        },
        {
          selector: 'node[type = "RAM"], node[type = "Storage"]',
          style: { 'background-color': '#8B7B8B', 'shape': 'rectangle' }
        },
        {
          selector: 'node[type = "Category"]',
          style: { 'background-color': '#4E937A', 'shape': 'diamond' }
        },
        {
          selector: 'node[type = "Retailer"]',
          style: { 'background-color': '#8A6FB0', 'shape': 'round-rectangle' }
        },
        {
          selector: 'node[type = "Order"]',
          style: { 'background-color': '#D9822B', 'shape': 'star' }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#C8C0B4',
            'target-arrow-color': '#C8C0B4',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '9px',
            'color': '#756D65',
            'text-rotation': 'autorotate',
            'text-background-color': '#F7F4EE',
            'text-background-opacity': 0.7,
            'text-background-padding': '1px'
          }
        },
        {
          selector: 'edge[type = "COMPATIBLE_WITH"]',
          style: {
            'line-color': '#657A69',
            'line-style': 'dashed',
            'target-arrow-color': '#657A69',
            'width': 2.5
          }
        },
        {
          selector: ':selected',
          style: {
            'border-width': 4,
            'border-color': '#D4A359',
            'line-color': '#D4A359',
            'target-arrow-color': '#D4A359'
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: false,
        padding: 40
      }
    });

    // Node selection event
    cyInstance.on('tap', 'node', (evt) => {
      const node = evt.target;
      const data = node.data();
      selectedNodeData = data;

      const drawer = document.getElementById('graphDrawer');
      const title = document.getElementById('drawerNodeTitle');
      const badge = document.getElementById('drawerNodeBadge');
      const props = document.getElementById('drawerNodeProps');

      if (drawer && title && props) {
        title.textContent = data.label || 'Selected Node';
        badge.innerHTML = `<span class="badge good">${(data.labels || []).join(' : ')}</span>`;

        const p = data.properties || data;
        props.innerHTML = Object.keys(p)
          .filter(k => !k.startsWith('_') && k !== 'imageUrl' && typeof p[k] !== 'object')
          .map(k => `<div><b style="color:var(--muted);">${k}:</b> ${p[k]}</div>`)
          .join('');

        drawer.classList.add('show');
      }
    });

    cyInstance.on('tap', (evt) => {
      if (evt.target === cyInstance) {
        document.getElementById('graphDrawer').classList.remove('show');
      }
    });
  } catch (err) {
    canvas.innerHTML = `<div style="padding:40px; text-align:center; color:var(--bad);">Cytoscape error: ${err.message}</div>`;
  }
}
