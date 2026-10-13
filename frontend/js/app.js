import { api } from './api.js';
import { renderHomePage } from './pages/home.js';
import { renderBuilderPage } from './pages/builder.js';
import { renderComponentsPage } from './pages/components.js';
import { renderComparePage } from './pages/compare.js';
import { renderBuildsPage } from './pages/builds.js';
import { renderCartPage } from './pages/cart.js';
import { renderGraphExplorerPage } from './pages/graphExplorer.js';
import { renderDbmsLabPage } from './pages/dbmsLab.js';
import { renderAboutDbPage } from './pages/aboutDb.js';

class BuildForgeApp {
  constructor() {
    this.currentPage = 'home';
    this.currentUserId = localStorage.getItem('bf_user') || 'usr-1';
    this.currentBuild = JSON.parse(localStorage.getItem('bf_build') || '{}');
    this.compareList = JSON.parse(localStorage.getItem('bf_compare') || '[]');
    this.theme = localStorage.getItem('bf_theme') || 'light';

    this.init();
  }

  async init() {
    this.applyTheme(this.theme);
    this.setupEventListeners();
    await this.loadUsers();
    this.updateCartCount();

    // Check hash route
    const hash = window.location.hash.replace('#', '');
    this.navigate(hash || 'home');
  }

  setupEventListeners() {
    // Nav buttons
    document.querySelectorAll('.nav').forEach(btn => {
      btn.onclick = () => this.navigate(btn.dataset.page);
    });

    // Theme toggle
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
      themeBtn.onclick = () => {
        const next = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(next);
        this.toast(next === 'dark' ? 'Midnight dark theme enabled' : 'Studio light theme enabled');
      };
    }

    // Modal close
    const closeBtn = document.getElementById('closeModalBtn');
    const modalWrap = document.getElementById('modalWrap');
    if (closeBtn && modalWrap) {
      closeBtn.onclick = () => modalWrap.classList.remove('show');
      modalWrap.onclick = (e) => {
        if (e.target.id === 'modalWrap') modalWrap.classList.remove('show');
      };
    }

    // User selector
    const userSelect = document.getElementById('userSwitcher');
    if (userSelect) {
      userSelect.onchange = (e) => {
        this.currentUserId = e.target.value;
        localStorage.setItem('bf_user', this.currentUserId);
        this.toast(`Active user switched to: ${userSelect.options[userSelect.selectedIndex].text}`);
        this.updateCartCount();
        if (this.currentPage === 'cart' || this.currentPage === 'builds') {
          this.navigate(this.currentPage);
        }
      };
    }

    // Cart icon
    const cartBtn = document.getElementById('cartNavBtn');
    if (cartBtn) {
      cartBtn.onclick = () => this.navigate('cart');
    }

    // Logo click
    const logo = document.querySelector('.logo');
    if (logo) {
      logo.onclick = () => this.navigate('home');
    }
  }

  async loadUsers() {
    const userSelect = document.getElementById('userSwitcher');
    if (!userSelect) return;

    try {
      const res = await api.getUsers();
      if (res.data && res.data.length) {
        userSelect.innerHTML = res.data.map(u => `
          <option value="${u.userId}" ${u.userId === this.currentUserId ? 'selected' : ''}>
            👤 ${u.username} (${u.userId})
          </option>
        `).join('');
      }
    } catch (e) {
      console.warn('Could not load users list:', e);
    }
  }

  navigate(pageId) {
    if (pageId === 'components') pageId = 'parts';
    const pages = ['home', 'builder', 'parts', 'compare', 'builds', 'cart', 'graph', 'lab', 'about'];
    if (!pages.includes(pageId)) pageId = 'home';

    this.currentPage = pageId;
    window.location.hash = pageId;

    // Toggle nav active classes
    document.querySelectorAll('.nav').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === pageId);
    });

    // Toggle page active classes
    pages.forEach(p => {
      const el = document.getElementById(`page-${p}`) || (p === 'parts' ? document.getElementById('page-components') : null);
      if (el) el.classList.toggle('active', p === pageId);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Render corresponding page
    switch (pageId) {
      case 'home':
        renderHomePage(this);
        break;
      case 'builder':
        renderBuilderPage(this);
        break;
      case 'parts':
        renderComponentsPage(this);
        break;
      case 'compare':
        renderComparePage(this);
        break;
      case 'builds':
        renderBuildsPage(this);
        break;
      case 'cart':
        renderCartPage(this);
        break;
      case 'graph':
        renderGraphExplorerPage(this);
        break;
      case 'lab':
        renderDbmsLabPage(this);
        break;
      case 'about':
        renderAboutDbPage(this);
        break;
    }
  }

  applyTheme(theme) {
    this.theme = theme;
    localStorage.setItem('bf_theme', theme);
    document.body.classList.toggle('dark-theme', theme === 'dark');
    const btn = document.getElementById('themeBtn');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀' : '☾';
      btn.title = theme === 'dark' ? 'Switch to studio light theme' : 'Switch to midnight dark theme';
    }
  }

  toast(message) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = message;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  saveBuildLocally() {
    localStorage.setItem('bf_build', JSON.stringify(this.currentBuild));
  }

  saveCompareLocally() {
    localStorage.setItem('bf_compare', JSON.stringify(this.compareList));
  }

  setBuildSlot(slotKey, component) {
    if (!slotKey) slotKey = component.categorySlug;
    this.currentBuild[slotKey] = component;
    this.saveBuildLocally();
    this.toast(`Added ${component.model} to build (${slotKey.toUpperCase()})`);
  }

  addToCompare(component) {
    if (!this.compareList.find(c => c.compId === component.compId)) {
      this.compareList.push(component);
      this.saveCompareLocally();
      this.toast(`Added ${component.model} to comparison table`);
    } else {
      this.toast(`${component.model} is already in comparison table`);
    }
  }

  async updateCartCount() {
    const badge = document.getElementById('cartBadgeCount');
    if (!badge) return;
    try {
      const res = await api.getCart(this.currentUserId);
      const count = res.data && res.data.items ? res.data.items.length : 0;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'block' : 'none';
    } catch (e) {
      // Ignored
    }
  }

  async openPartModal(slotKey, catSlug) {
    const modalWrap = document.getElementById('modalWrap');
    const modalTitle = document.getElementById('modalTitle');
    const modalSub = document.getElementById('modalSub');
    const modalContent = document.getElementById('modalContent');

    modalTitle.textContent = `Choose ${slotKey.toUpperCase()}`;
    modalSub.textContent = `Pick a component from Neo4j for the ${slotKey.toUpperCase()} slot.`;
    modalContent.innerHTML = '<div style="padding:20px; text-align:center;">Loading options from database...</div>';
    modalWrap.classList.add('show');

    try {
      const res = await api.getComponents({ category: catSlug });
      if (!res.data || !res.data.length) {
        modalContent.innerHTML = '<div style="padding:30px; text-align:center; color:var(--muted);">No options found for this category.</div>';
        return;
      }

      modalContent.innerHTML = `
        <div class="choiceList">
          ${res.data.map(c => `
            <div class="choiceItem">
              <img src="${c.imageUrl}" alt="${c.model}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=80'">
              <div>
                <b style="font-size:14px;">${c.model}</b>
                <div class="muted" style="font-size:12px;">${c.specs || c.manufacturer} · Score: ${c.performanceScore}/100</div>
              </div>
              <div class="price" style="font-size:15px;">₹${(c.priceINR || 0).toLocaleString('en-IN')}</div>
              <button class="primary pickPartBtn" data-id="${c.compId}" style="padding:7px 14px; font-size:12px;">Select</button>
            </div>
          `).join('')}
        </div>
      `;

      modalContent.querySelectorAll('.pickPartBtn').forEach(b => {
        b.onclick = () => {
          const comp = res.data.find(x => x.compId === b.dataset.id);
          if (comp) {
            this.setBuildSlot(slotKey, comp);
            modalWrap.classList.remove('show');
            renderBuilderPage(this);
          }
        };
      });
    } catch (err) {
      modalContent.innerHTML = `<div style="padding:20px; color:var(--bad);">Error loading from Neo4j: ${err.message}</div>`;
    }
  }
}

// Instantiate global app
window.app = new BuildForgeApp();
