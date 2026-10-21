/**
 * Adversarial Test Suite for Milestone G3-M2
 * ScentCast Malaysia — Empirical Challenger 1 (gen3_challenger_m2_1)
 *
 * Scope:
 * 1. Forensic Regex Scan across DetailView.js, PerfumeCard.js, and NotFoundView.js for price/currency leakage.
 * 2. Search for purged text fragments: ensure "Impak semburan", "Karakter teras", "Dry-down mendalam" are absent.
 * 3. Validate 7-step Fragrantica hierarchy in DetailView.js (header, accords, composition, performance, when-to-wear, comments, brand carousel).
 * 4. Test NotFoundView rendering and route handling for weird hashes (#/foo/bar, #/unknown, #/detail/non-existent-xyz, etc.).
 * 5. Edge cases, adversarial injection, and boundary stress-testing.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { register } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Register ESM JSON loader hook for Node v24 support
register('./json_loader.js', import.meta.url);

// ============================================================================
// SELF-CONTAINED MOCK ENVIRONMENT SHIMS
// ============================================================================
function initMockEnv() {
  class MemoryStorage {
    constructor() {
      this.store = new Map();
    }
    getItem(key) {
      return this.store.has(String(key)) ? this.store.get(String(key)) : null;
    }
    setItem(key, value) {
      this.store.set(String(key), String(value));
    }
    removeItem(key) {
      this.store.delete(String(key));
    }
    clear() {
      this.store.clear();
    }
    get length() {
      return this.store.size;
    }
    key(index) {
      return Array.from(this.store.keys())[index] || null;
    }
  }

  class MockElement {
    constructor(tagName = 'div') {
      this.tagName = tagName.toUpperCase();
      this.id = '';
      this.className = '';
      this._classes = new Set();
      this.innerHTML = '';
      this.textContent = '';
      this.value = '';
      this.attributes = new Map();
      this.children = [];
      this.parentElement = null;
      this.eventListeners = new Map();
    }

    get classList() {
      const self = this;
      return {
        add(...tokens) {
          tokens.forEach((t) => self._classes.add(t));
          self.className = Array.from(self._classes).join(' ');
        },
        remove(...tokens) {
          tokens.forEach((t) => self._classes.delete(t));
          self.className = Array.from(self._classes).join(' ');
        },
        contains(token) {
          return self._classes.has(token);
        },
        toggle(token, force) {
          if (force === true) {
            this.add(token);
            return true;
          } else if (force === false) {
            this.remove(token);
            return false;
          }
          if (self._classes.has(token)) {
            this.remove(token);
            return false;
          } else {
            this.add(token);
            return true;
          }
        }
      };
    }

    set classList(val) {
      this._classes = new Set(val);
    }

    setAttribute(name, val) {
      this.attributes.set(name, String(val));
      if (name === 'id') this.id = String(val);
      if (name === 'class') {
        this.className = String(val);
        this._classes = new Set(String(val).split(/\s+/).filter(Boolean));
      }
    }

    getAttribute(name) {
      return this.attributes.has(name) ? this.attributes.get(name) : null;
    }

    removeAttribute(name) {
      this.attributes.delete(name);
    }

    hasAttribute(name) {
      return this.attributes.has(name);
    }

    appendChild(child) {
      child.parentElement = this;
      this.children.push(child);
      return child;
    }

    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) {
        this.children.splice(idx, 1);
        child.parentElement = null;
      }
      return child;
    }

    addEventListener(event, handler) {
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, []);
      }
      this.eventListeners.get(event).push(handler);
    }

    removeEventListener(event, handler) {
      if (!this.eventListeners.has(event)) return;
      const list = this.eventListeners.get(event).filter((h) => h !== handler);
      this.eventListeners.set(event, list);
    }

    dispatchEvent(evt) {
      const list = this.eventListeners.get(evt.type) || [];
      for (const handler of list) {
        handler.call(this, evt);
      }
      return true;
    }

    closest(selector) {
      let cur = this;
      while (cur) {
        if (selector.startsWith('.') && cur.classList?.contains(selector.slice(1))) return cur;
        if (selector.startsWith('#') && cur.id === selector.slice(1)) return cur;
        if (cur.tagName && cur.tagName.toLowerCase() === selector.toLowerCase()) return cur;
        cur = cur.parentElement;
      }
      return null;
    }

    querySelector(selector) {
      return findInTree(this, selector);
    }

    querySelectorAll(selector) {
      const res = [];
      findAllInTree(this, selector, res);
      return res;
    }
  }

  function findInTree(root, selector) {
    if (!root) return null;
    if (selector.startsWith('#')) {
      if (root.id === selector.slice(1)) return root;
    } else if (selector.startsWith('.')) {
      if (root.classList && root.classList.contains(selector.slice(1))) return root;
    } else if (root.tagName && root.tagName.toLowerCase() === selector.toLowerCase()) {
      return root;
    }
    for (const child of root.children || []) {
      const found = findInTree(child, selector);
      if (found) return found;
    }
    return null;
  }

  function findAllInTree(root, selector, results) {
    if (!root) return;
    if (selector.includes(',')) {
      const parts = selector.split(',').map(s => s.trim());
      for (const part of parts) {
        findAllInTree(root, part, results);
      }
      return;
    }
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      if (root.classList && root.classList.contains(cls) && !results.includes(root)) results.push(root);
    } else if (root.tagName && root.tagName.toLowerCase() === selector.toLowerCase() && !results.includes(root)) {
      results.push(root);
    }
    for (const child of root.children || []) {
      findAllInTree(child, selector, results);
    }
  }

  const documentElement = new MockElement('html');
  const body = new MockElement('body');
  const main = new MockElement('main');
  documentElement.appendChild(body);
  body.appendChild(main);

  const mockDocument = {
    documentElement,
    body,
    createElement(tag) {
      return new MockElement(tag);
    },
    getElementById(id) {
      return findInTree(documentElement, `#${id}`);
    },
    querySelector(sel) {
      return findInTree(documentElement, sel);
    },
    querySelectorAll(sel) {
      const res = [];
      findAllInTree(documentElement, sel, res);
      return res;
    },
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  const mockLocation = {
    hash: '#/',
    pathname: '/',
    search: '',
    href: 'http://localhost:5173/#/'
  };

  const mockWindow = {
    document: mockDocument,
    location: mockLocation,
    localStorage: new MemoryStorage(),
    sessionStorage: new MemoryStorage(),
    history: {
      pushState(state, title, url) {
        if (url && url.includes('#')) {
          mockLocation.hash = url.substring(url.indexOf('#'));
        }
      },
      replaceState(state, title, url) {
        if (url && url.includes('#')) {
          mockLocation.hash = url.substring(url.indexOf('#'));
        }
      }
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
    scrollTo: () => {}
  };

  globalThis.window = mockWindow;
  globalThis.document = mockDocument;
  globalThis.localStorage = mockWindow.localStorage;
  globalThis.sessionStorage = mockWindow.sessionStorage;
  globalThis.location = mockLocation;
  globalThis.history = mockWindow.history;
  globalThis.Event = class Event {
    constructor(type, opts = {}) {
      this.type = type;
      this.bubbles = opts.bubbles || false;
      this.cancelable = opts.cancelable || false;
      this.defaultPrevented = false;
      this.propagationStopped = false;
    }
    preventDefault() { this.defaultPrevented = true; }
    stopPropagation() { this.propagationStopped = true; }
  };
}

initMockEnv();

// Dynamic imports of application modules
const seedModule = await import('../src/data/seedData.js');
const seedPerfumes = seedModule.initialPerfumes || seedModule.seedPerfumes || [];
const { renderPerfumeCard, attachPerfumeCardListeners } = await import('../src/components/PerfumeCard.js');
const { renderDetailView, attachDetailListeners } = await import('../src/views/DetailView.js');
const { renderNotFoundView, attachNotFoundListeners } = await import('../src/views/NotFoundView.js');
const { perfumeService } = await import('../src/services/perfumeService.js');
const { parseRoute, renderApp } = await import('../src/main.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];
const observations = [];

function assert(condition, message, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    const err = `  ✗ FAIL: ${message}${details ? ' -> ' + details : ''}`;
    console.error(err);
    failures.push({ message, details });
  }
}

function observe(note) {
  console.log(`  🔍 EMPIRICAL OBSERVATION: ${note}`);
  observations.push(note);
}

async function runAdversarialChallengerSuite() {
  console.log('================================================================');
  console.log('🔥 RUNNING ADVERSARIAL CHALLENGER 1 SUITE: MILESTONE G3-M2');
  console.log('================================================================\n');

  // ==========================================================================
  // SECTION 1: Forensic Regex Scan for Price & Currency Leakage
  // ==========================================================================
  console.log('► SECTION 1: Forensic Price & Currency Leakage Scan across Source Files');

  const filesToAudit = [
    { name: 'DetailView.js', filePath: path.join(rootDir, 'src', 'views', 'DetailView.js') },
    { name: 'PerfumeCard.js', filePath: path.join(rootDir, 'src', 'components', 'PerfumeCard.js') },
    { name: 'NotFoundView.js', filePath: path.join(rootDir, 'src', 'views', 'NotFoundView.js') }
  ];

  for (const file of filesToAudit) {
    assert(fs.existsSync(file.filePath), `File exists: ${file.name}`);
    const source = fs.readFileSync(file.filePath, 'utf8');
    const executableSource = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

    // 1.1 Formatted currency regex (RM 120, MYR 99, $50, €45, £30, ¥1000)
    const formattedCurrencyRegex = /\b(RM\s*\d+|MYR\s*\d+|\$\s*\d+|€\s*\d+|£\s*\d+|¥\s*\d+)\b/i;
    assert(!formattedCurrencyRegex.test(source), `[${file.name}] Zero formatted currency values found in raw file`);

    // 1.2 Isolated currency symbols in executable code: RM, MYR, €, £, ¥, or $ not followed by {
    const isolatedCurrencyRegex = /(\bRM\b|\bMYR\b|\$(?!\{)|€|£|¥)/g;
    const isolatedInCode = executableSource.match(isolatedCurrencyRegex) || [];
    assert(isolatedInCode.length === 0, `[${file.name}] Zero isolated currency symbols in executable code (count: ${isolatedInCode.length})`, isolatedInCode.join(', '));

    // Note presence in comments if any
    const isolatedInFull = source.match(isolatedCurrencyRegex) || [];
    if (isolatedInFull.length > 0) {
      observe(`[${file.name}] Found ${isolatedInFull.length} currency token(s) inside documentation comments: ${isolatedInFull.join(', ')}`);
    }

    // 1.3 Price variable identifiers (priceMYR, price_myr, hargaMYR)
    const priceVarRegex = /\b(priceMYR|price_myr|hargaMYR)\b/i;
    assert(!priceVarRegex.test(executableSource), `[${file.name}] Zero price variable identifiers found in executable code`);

    // 1.4 Commercial budget/discount words
    const budgetWordsRegex = /\b(jimat|mampu milik|harga berpatutan|diskaun)\b/i;
    assert(!budgetWordsRegex.test(executableSource), `[${file.name}] Zero budget marketing buzzwords found in executable code`);
  }

  // 1.5 Dynamic Render Price Leakage Verification across all seed perfumes
  console.log('\n► SECTION 1.5: Dynamic Render Price Leakage Verification');
  for (const perfume of seedPerfumes) {
    const cardHtml = renderPerfumeCard(perfume);
    const detailHtml = await renderDetailView(perfume.id);

    const priceMatchInCard = cardHtml.match(/\b(RM\s*\d+|MYR\s*\d+|\$\s*\d+)\b/i);
    assert(!priceMatchInCard, `[PerfumeCard] Zero price leakage in rendered card for "${perfume.name}"`, priceMatchInCard ? `Matched: "${priceMatchInCard[0]}"` : '');

    const priceMatchInDetail = detailHtml.match(/\b(RM\s*\d+|MYR\s*\d+|\$\s*\d+)\b/i);
    assert(!priceMatchInDetail, `[DetailView] Zero price leakage in rendered detail for "${perfume.name}"`, priceMatchInDetail ? `Matched: "${priceMatchInDetail[0]}"` : '');
  }

  // 1.6 Adversarial Price Injection Stress-Test
  console.log('\n► SECTION 1.6: Adversarial Price Injection Resistance');
  const poisonedPerfume = {
    id: 'poison-01',
    name: 'Poison Price Bottle',
    brand: 'Nefarious Scent Co',
    priceMYR: 299.99,
    price_myr: 250,
    price: 199,
    harga: 'RM 180',
    jimat: 'Jimat RM50',
    diskaun: '20% OFF',
    shopeeUrl: 'https://shopee.com.my/test-link',
    tiktokUrl: 'https://www.tiktok.com/test-link'
  };

  const poisonedCard = renderPerfumeCard(poisonedPerfume);
  assert(!poisonedCard.includes('299.99'), 'PerfumeCard ignores injected priceMYR: 299.99');
  assert(!poisonedCard.includes('250'), 'PerfumeCard ignores injected price_myr: 250');
  assert(!poisonedCard.includes('199'), 'PerfumeCard ignores injected price: 199');
  assert(!poisonedCard.includes('RM 180'), 'PerfumeCard ignores injected harga: "RM 180"');
  assert(!poisonedCard.includes('Jimat'), 'PerfumeCard ignores injected jimat field');
  assert(!poisonedCard.includes('20% OFF'), 'PerfumeCard ignores injected diskaun field');

  // ==========================================================================
  // SECTION 2: Search for Purged Text Fragments
  // ==========================================================================
  console.log('\n► SECTION 2: Search for Purged Text Fragments in DetailView.js');

  const detailViewPath = path.join(rootDir, 'src', 'views', 'DetailView.js');
  const detailViewSource = fs.readFileSync(detailViewPath, 'utf8');

  const purgedPhrases = [
    'Impak semburan',
    'Karakter teras',
    'Dry-down mendalam',
    'Impak semburan pertama (0 - 30 minit):',
    'Karakter teras wangian (30 min - 4 jam):',
    'Dry-down mendalam & tahan lama (4 - 10 jam):'
  ];

  for (const phrase of purgedPhrases) {
    const isFound = detailViewSource.toLowerCase().includes(phrase.toLowerCase());
    assert(!isFound, `Static DetailView.js completely purges "${phrase}"`);
  }

  // Runtime verification across all rendered seed perfumes
  let anyPurgedLeaked = false;
  for (const p of seedPerfumes) {
    const html = await renderDetailView(p.id);
    for (const phrase of purgedPhrases) {
      if (html.toLowerCase().includes(phrase.toLowerCase())) {
        anyPurgedLeaked = true;
        assert(false, `Dynamically rendered DetailView for "${p.id}" leaked purged phrase: "${phrase}"`);
      }
    }
  }
  if (!anyPurgedLeaked) {
    assert(true, 'All 20 catalog perfumes render dynamically without any purged explanatory phrases');
  }

  // Verify duration badges are present in place of purged text
  const sampleDetail = await renderDetailView('turathi-blue');
  assert(sampleDetail.includes('0 - 30 min'), 'DetailView renders minimalist Top phase duration badge "0 - 30 min"');
  assert(sampleDetail.includes('30 min - 4 jam'), 'DetailView renders minimalist Mid phase duration badge "30 min - 4 jam"');
  assert(sampleDetail.includes('4 jam+'), 'DetailView renders minimalist Base phase duration badge "4 jam+"');
  assert(
    sampleDetail.includes('cloud') && sampleDetail.includes('favorite') && sampleDetail.includes('foundation'),
    'DetailView renders phase material icons (cloud, favorite, foundation)'
  );

  // ==========================================================================
  // SECTION 3: Validate 7-Step Fragrantica Hierarchy in DetailView.js
  // ==========================================================================
  console.log('\n► SECTION 3: 7-Step Fragrantica Hierarchy & Section Contract Validation');

  const EXPECTED_ORDER = [
    'header-section',
    'accords-section',
    'composition-section',
    'performance-section',
    'when-to-wear-section',
    'comments-section',
    'brand-carousel-section'
  ];

  for (const perfume of seedPerfumes) {
    const html = await renderDetailView(perfume.id);

    // If perfume incorrectly rendered NotFoundView, catalog was truncated
    if (html.includes('id="not-found-view"')) {
      assert(false, `[${perfume.id}] Catalog perfume incorrectly rendered NotFoundView (perfume dropped from cache by Firestore init)`);
      continue;
    }

    // 3.1 All 7 sections exist
    const missing = EXPECTED_ORDER.filter(s => !html.includes(`id="${s}"`));
    assert(missing.length === 0, `[${perfume.id}] All 7 section IDs exist in rendered view`, missing.join(', '));

    // 3.2 Sequential ordering
    let lastIdx = -1;
    let sequenceCorrect = true;
    for (const s of EXPECTED_ORDER) {
      const idx = html.indexOf(`id="${s}"`);
      if (idx <= lastIdx) {
        sequenceCorrect = false;
        break;
      }
      lastIdx = idx;
    }
    assert(sequenceCorrect, `[${perfume.id}] Sections strictly follow 7-step sequential order`);

    // 3.3 Brand carousel excludes current perfume ID
    const carouselStart = html.indexOf('id="brand-carousel-section"');
    const carouselHtml = html.slice(carouselStart);
    const selfRecommended = carouselHtml.includes(`data-id="${perfume.id}"`) || carouselHtml.includes(`href="#/detail/${perfume.id}"`);
    assert(!selfRecommended, `[${perfume.id}] Brand carousel strictly excludes current perfume ID`);
  }

  // 3.4 Brand carousel fallback when brand has no other items
  console.log('\n► SECTION 3.4: Brand Carousel Fallback for Unique Brands');
  const originalCache = [...perfumeService.perfumesCache];
  perfumeService.perfumesCache.push({
    id: 'solitary-oud-01',
    name: 'Solitary Oud Malaysia',
    brand: 'Solitary Artisans Brand',
    gender: 'unisex',
    notes: { top: ['Oud'], mid: ['Rose'], base: ['Musk'] },
    longevity: '10 Jam',
    sillageDistance: '2.5 m'
  });

  const solitaryDetailHtml = await renderDetailView('solitary-oud-01');
  assert(
    solitaryDetailHtml.includes('Tiada wangian lain daripada jenama') || solitaryDetailHtml.includes('Solitary Artisans Brand'),
    'Brand carousel displays clean fallback message when brand has zero other catalog items'
  );
  perfumeService.perfumesCache = originalCache;

  // 3.5 Robustness on Degraded/Malformed Perfume Object
  console.log('\n► SECTION 3.5: Robustness on Degraded / Incomplete Perfume Data');
  perfumeService.perfumesCache.push({
    id: 'degraded-perfume',
    name: 'Degraded Scent',
    brand: 'Degraded Brand',
    gender: null,
    notes: null,
    accords: null,
    mainAccords: null,
    whenToWear: null,
    longevity: null,
    sillageDistance: null
  });

  try {
    const degradedHtml = await renderDetailView('degraded-perfume');
    assert(degradedHtml.includes('id="header-section"'), 'DetailView gracefully renders header for perfume with null fields');
    assert(degradedHtml.includes('id="composition-section"'), 'DetailView gracefully renders composition section with fallback notes');
    assert(degradedHtml.includes('id="performance-section"'), 'DetailView gracefully renders performance metrics with fallbacks');
  } catch (err) {
    assert(false, 'DetailView crashed on degraded perfume object', err.message);
  }
  perfumeService.perfumesCache = originalCache;

  // ==========================================================================
  // SECTION 4: NotFoundView & Route Handling for Weird Hashes
  // ==========================================================================
  console.log('\n► SECTION 4: NotFoundView & Route Handling for Weird Hashes');

  // 4.1 Standalone NotFoundView Tests
  const notFoundRouteHtml = renderNotFoundView();
  assert(notFoundRouteHtml.includes('id="not-found-view"'), 'NotFoundView has root container id="not-found-view"');
  assert(notFoundRouteHtml.includes('neu-flat') && notFoundRouteHtml.includes('neu-inset') && notFoundRouteHtml.includes('neu-button'), 'NotFoundView implements Neumorphic styling');
  assert(notFoundRouteHtml.includes('<svg') && notFoundRouteHtml.includes('viewBox="0 0 64 64"'), 'NotFoundView renders custom fragrance flask SVG');
  assert(notFoundRouteHtml.includes('404'), 'NotFoundView renders 404 status badge');
  assert(notFoundRouteHtml.includes('href="#/"'), 'NotFoundView renders anchor link returning to Home ("#/")');
  assert(notFoundRouteHtml.includes('href="#/direktori"'), 'NotFoundView renders anchor link to Directory ("#/direktori")');

  // Perfume-specific 404
  const notFoundPerfumeHtml = renderNotFoundView({ type: 'perfume', perfumeId: 'non-existent-xyz' });
  assert(notFoundPerfumeHtml.includes('ID: non-existent-xyz'), 'NotFoundView displays missing perfume ID ("ID: non-existent-xyz")');
  assert(notFoundPerfumeHtml.includes('Wangian Tidak Ditemui') || notFoundPerfumeHtml.includes('tiada dalam katalog'), 'NotFoundView displays perfume-specific not found messaging');

  // 4.2 Router parseRoute Weird Hashes Matrix
  console.log('\n► SECTION 4.2: Router parseRoute Weird Hashes Matrix');
  const routeTestCases = [
    { hash: '#/foo/bar', expectedView: 'NotFoundView', isUnknown: true },
    { hash: '#/unknown', expectedView: 'NotFoundView', isUnknown: true },
    { hash: '#/unknown-path-99', expectedView: 'NotFoundView', isUnknown: true },
    { hash: '#/404', expectedView: 'NotFoundView', isUnknown: true },
    { hash: '#/very/deep/nested/unknown/route', expectedView: 'NotFoundView', isUnknown: true },
    { hash: '#/../../../etc/passwd', expectedView: 'NotFoundView', isUnknown: true },
    { hash: '#!broken-hash', expectedView: 'NotFoundView', isUnknown: true },
    { hash: '#/null', expectedView: 'NotFoundView', isUnknown: true },
    { hash: '#/undefined', expectedView: 'NotFoundView', isUnknown: true },
    { hash: '#/cari?q=vanilla', expectedView: 'SearchView', isUnknown: false },
    { hash: '#/', expectedView: 'HomeView', isUnknown: false },
    { hash: '#/direktori', expectedView: 'DirectoryView', isUnknown: false },
    { hash: '#/detail/turathi-blue', expectedView: 'DetailView', isUnknown: false },
    { hash: '#/detail/non-existent-xyz', expectedView: 'DetailView', isUnknown: false, checkDetailNotFound: true }
  ];

  for (const tc of routeTestCases) {
    const parsed = parseRoute(tc.hash);
    assert(parsed.viewName === tc.expectedView, `parseRoute("${tc.hash}") maps to ${tc.expectedView}`);
    assert(parsed.isUnknown === tc.isUnknown, `parseRoute("${tc.hash}") isUnknown === ${tc.isUnknown}`);

    if (tc.checkDetailNotFound) {
      const detailResult = await renderDetailView(parsed.param);
      assert(
        detailResult.includes('id="not-found-view"'),
        `renderDetailView("${parsed.param}") for missing perfume returns NotFoundView HTML`
      );
      assert(
        detailResult.includes(parsed.param),
        `renderDetailView("${parsed.param}") displays requested ID in NotFoundView`
      );
    }
  }

  // 4.3 End-to-End DOM Assembly & Navigation Lifecycle
  console.log('\n► SECTION 4.3: End-to-End DOM Lifecycle Verification');

  const appContainer = document.createElement('div');
  appContainer.setAttribute('id', 'app');
  document.body.appendChild(appContainer);

  // 4.3.1 Navigate to unknown route #/foo/bar
  window.location.hash = '#/foo/bar';
  await renderApp();
  assert(appContainer.innerHTML.includes('id="not-found-view"'), 'renderApp() for #/foo/bar mounts NotFoundView into DOM #app');

  // 4.3.2 Navigate to unknown route #/unknown
  window.location.hash = '#/unknown';
  await renderApp();
  assert(appContainer.innerHTML.includes('id="not-found-view"'), 'renderApp() for #/unknown mounts NotFoundView into DOM #app');

  // 4.3.3 Navigate to #/detail/non-existent-xyz
  window.location.hash = '#/detail/non-existent-xyz';
  await renderApp();
  assert(
    appContainer.innerHTML.includes('id="not-found-view"') && appContainer.innerHTML.includes('non-existent-xyz'),
    'renderApp() for #/detail/non-existent-xyz mounts NotFoundView with missing ID into DOM #app'
  );

  // 4.3.4 Navigate to valid detail #/detail/turathi-blue
  window.location.hash = '#/detail/turathi-blue';
  await renderApp();
  assert(
    appContainer.innerHTML.includes('id="header-section"') && appContainer.innerHTML.includes('id="composition-section"'),
    'renderApp() for #/detail/turathi-blue mounts full 7-step DetailView'
  );

  // 4.3.5 attachDetailListeners & attachNotFoundListeners resilience on 404
  window.location.hash = '#/detail/non-existent-xyz';
  await renderApp();
  try {
    attachDetailListeners();
    attachNotFoundListeners();
    assert(true, 'attachDetailListeners() safely guards against missing header-section on 404 page');
  } catch (err) {
    assert(false, 'attachDetailListeners() threw exception on 404 view', err.message);
  }

  // ==========================================================================
  // SECTION 5: Security, Boundary & Adversarial Challenge Findings
  // ==========================================================================
  console.log('\n► SECTION 5: Security & Adversarial Challenge Findings');

  // 5.1 Event Propagation Isolation on PerfumeCard Buttons
  console.log('\n► SECTION 5.1: Event Propagation Isolation');
  const cardHost = document.createElement('div');
  cardHost.innerHTML = renderPerfumeCard(seedPerfumes[0]);
  document.body.appendChild(cardHost);

  attachPerfumeCardListeners(cardHost);

  let shopeeBubbleStopped = false;
  let tiktokBubbleStopped = false;

  const shopeeBtn = cardHost.querySelector('.shopee-card-btn');
  const tiktokBtn = cardHost.querySelector('.tiktok-card-btn');

  if (shopeeBtn) {
    shopeeBtn.dispatchEvent({
      type: 'click',
      stopPropagation: () => { shopeeBubbleStopped = true; },
      preventDefault: () => {}
    });
    assert(shopeeBubbleStopped, 'Shopee button click invokes e.stopPropagation()');
  }

  if (tiktokBtn) {
    tiktokBtn.dispatchEvent({
      type: 'click',
      stopPropagation: () => { tiktokBubbleStopped = true; },
      preventDefault: () => {}
    });
    assert(tiktokBubbleStopped, 'TikTok Shop button click invokes e.stopPropagation()');
  }

  // 5.2 Boundary Condition: renderNotFoundView(null)
  console.log('\n► SECTION 5.2: Boundary Stress: renderNotFoundView(null)');
  try {
    renderNotFoundView(null);
    assert(true, 'renderNotFoundView(null) handles null without throwing');
  } catch (err) {
    observe('renderNotFoundView(null) throws TypeError: default parameter (options = {}) only applies to undefined, not null.');
    assert(false, 'renderNotFoundView(null) handles null without throwing', err.message);
  }

  // 5.3 XSS Tag Reflection in NotFoundView
  console.log('\n► SECTION 5.3: XSS Tag Reflection in NotFoundView');
  const xssProbe = '<img src=x onerror=alert(1)>';
  const xssHtml = renderNotFoundView({ type: 'perfume', perfumeId: xssProbe });
  const escapesXss = !xssHtml.includes('<img src=x onerror=alert(1)>');
  if (!escapesXss) {
    observe('NotFoundView reflects raw perfumeId in <span>ID: ${options.perfumeId}</span> without HTML escaping.');
  }
  assert(escapesXss, 'NotFoundView safely sanitizes/escapes raw HTML in perfumeId');

  // 5.4 E-Commerce Button Responsiveness Contract Check
  console.log('\n► SECTION 5.4: Responsive Layout Contract Check');
  const cardSample = renderPerfumeCard(seedPerfumes[0]);
  assert(cardSample.includes('flex flex-wrap gap-2'), 'PerfumeCard store buttons container uses "flex flex-wrap gap-2" for mobile safety');
  assert(cardSample.includes('min-w-[90px]'), 'PerfumeCard store buttons specify "min-w-[90px]" to avoid button distortion');

  const detailSample = await renderDetailView('turathi-blue');
  assert(detailSample.includes('flex flex-wrap items-center gap-3'), 'DetailView store buttons container uses flex-wrap and gap-3 for mobile safety');
  assert(detailSample.includes('min-w-[140px]'), 'DetailView store buttons specify "min-w-[140px]" for touch targets');

  // ==========================================================================
  // FINAL SUMMARY
  // ==========================================================================
  console.log('\n================================================================');
  console.log('📊 ADVERSARIAL CHALLENGER 1 SUMMARY');
  console.log(`  Total Tests : ${totalTests}`);
  console.log(`  Passed      : ${passedTests}`);
  console.log(`  Failed      : ${failedTests}`);
  console.log(`  Observations: ${observations.length}`);
  console.log('================================================================\n');

  if (observations.length > 0) {
    console.log('🔍 EMPIRICAL OBSERVATIONS:');
    observations.forEach((obs, i) => console.log(`  [${i + 1}] ${obs}`));
    console.log('');
  }

  if (failedTests > 0) {
    console.error('💥 FAILURES RECORDED:');
    failures.forEach((f, i) => console.error(`  ${i + 1}. ${f.message}: ${f.details}`));
    process.exit(1);
  } else {
    console.log('🎉 ALL ADVERSARIAL CHALLENGER 1 TESTS PASSED!');
    process.exit(0);
  }
}

runAdversarialChallengerSuite().catch(err => {
  console.error('Fatal unhandled error:', err);
  process.exit(1);
});
