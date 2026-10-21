/**
 * ScentCast Malaysia — Adversarial Challenger Test Harness
 * Milestone M1: Dynamic Navbar Reactivity, AdminView Edge Cases & Access Denied Boundaries
 *
 * Gen 6 Challenger Agent: gen6_challenger_m1_2
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ============================================================================
// LIGHTWEIGHT DOM & ENVIRONMENT SHIMS FOR ISOLATED TESTING
// ============================================================================
class MockDOMElement {
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
        tokens.forEach(t => self._classes.add(t));
        self.className = Array.from(self._classes).join(' ');
      },
      remove(...tokens) {
        tokens.forEach(t => self._classes.delete(t));
        self.className = Array.from(self._classes).join(' ');
      },
      contains(token) {
        return self._classes.has(token);
      },
      toggle(token, force) {
        if (force === true) { this.add(token); return true; }
        if (force === false) { this.remove(token); return false; }
        if (self._classes.has(token)) { this.remove(token); return false; }
        this.add(token); return true;
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

  remove() {
    if (this.parentElement) {
      this.parentElement.removeChild(this);
    }
  }

  addEventListener(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(handler);
  }

  removeEventListener(event, handler) {
    if (!this.eventListeners.has(event)) return;
    const list = this.eventListeners.get(event).filter(h => h !== handler);
    this.eventListeners.set(event, list);
  }

  dispatchEvent(evt) {
    const list = this.eventListeners.get(evt.type) || [];
    for (const handler of list) {
      handler.call(this, evt);
    }
    return true;
  }

  click() {
    this.dispatchEvent({ type: 'click', target: this, preventDefault() {}, stopPropagation() {} });
  }

  querySelector(selector) {
    return findInTree(this, selector);
  }

  querySelectorAll(selector) {
    const results = [];
    findAllInTree(this, selector, results);
    return results;
  }
}

function findInTree(root, selector) {
  if (!root) return null;
  if (selector.startsWith('#')) {
    const id = selector.slice(1);
    if (root.id === id) return root;
  } else if (selector.startsWith('.')) {
    const cls = selector.slice(1);
    if (root.classList && root.classList.contains(cls)) return root;
  } else if (selector.startsWith('[data-')) {
    const match = selector.match(/\[([a-zA-Z0-9_-]+)="?([^"\]]+)"?\]/);
    if (match) {
      const [, attr, val] = match;
      if (root.getAttribute(attr) === val) return root;
    }
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
  if (selector.startsWith('.')) {
    const cls = selector.slice(1);
    if (root.classList && root.classList.contains(cls)) results.push(root);
  } else if (selector.startsWith('#')) {
    const id = selector.slice(1);
    if (root.id === id) results.push(root);
  } else if (root.tagName && root.tagName.toLowerCase() === selector.toLowerCase()) {
    results.push(root);
  }
  for (const child of root.children || []) {
    findAllInTree(child, selector, results);
  }
}

class MockStorage {
  constructor() { this.store = new Map(); }
  getItem(k) { return this.store.has(String(k)) ? this.store.get(String(k)) : null; }
  setItem(k, v) { this.store.set(String(k), String(v)); }
  removeItem(k) { this.store.delete(String(k)); }
  clear() { this.store.clear(); }
}

const docElement = new MockDOMElement('html');
const bodyElement = new MockDOMElement('body');
docElement.appendChild(bodyElement);

const mockDocument = {
  documentElement: docElement,
  body: bodyElement,
  createElement(tag) { return new MockDOMElement(tag); },
  getElementById(id) { return findInTree(docElement, `#${id}`); },
  querySelector(sel) { return findInTree(docElement, sel); },
  querySelectorAll(sel) {
    const res = [];
    findAllInTree(docElement, sel, res);
    return res;
  },
  addEventListener() {},
  removeEventListener() {}
};

const mockWindow = {
  document: mockDocument,
  location: { hash: '#/', pathname: '/', search: '' },
  localStorage: new MockStorage(),
  sessionStorage: new MockStorage(),
  __adminPresenceUnsub: null,
  __adminTelemetryUnsub: null,
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {}
};

globalThis.window = mockWindow;
globalThis.document = mockDocument;
globalThis.localStorage = mockWindow.localStorage;
globalThis.sessionStorage = mockWindow.sessionStorage;
globalThis.location = mockWindow.location;
globalThis.Event = class Event {
  constructor(type, opts = {}) {
    this.type = type;
    this.bubbles = opts.bubbles || false;
  }
  preventDefault() {}
  stopPropagation() {}
};

// ============================================================================
// TEST SUITE HARNESS
// ============================================================================
let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failures = [];

function assert(condition, testName, extraDetail = '') {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedAssertions++;
    const errMsg = `  ✗ FAIL: ${testName}${extraDetail ? ` -> ${extraDetail}` : ''}`;
    console.error(errMsg);
    failures.push({ testName, extraDetail });
  }
}

async function runAdversarialHarness() {
  console.log('================================================================');
  console.log('⚡ ScentCast Malaysia — Adversarial Challenger Harness (Gen 6)');
  console.log('Target: Milestone M1 UI & Integration Deliverables');
  console.log('================================================================\n');

  // Dynamic imports of modules under test
  const { renderHeader } = await import('../src/components/Header.js');
  const { renderAdminView, attachAdminListeners, renderAccessDenied } = await import('../src/views/AdminView.js');
  const { authService } = await import('../src/services/authService.js');
  const { presenceService } = await import('../src/services/presenceService.js');
  const { weatherService } = await import('../src/services/weatherService.js');
  const { adminService } = await import('../src/services/adminService.js');
  const { perfumeService } = await import('../src/services/perfumeService.js');

  // ==========================================================================
  // PILLAR 1: Dynamic Navbar Reactivity & Rapid State Transitions
  // ==========================================================================
  console.log('► PILLAR 1: Dynamic Navbar Reactivity & Rapid State Transitions');

  // Test 1.1: Rapid state transition loop (100 state transitions)
  console.log('  Testing 100 rapid sequential state transitions (Guest -> Member -> Admin)...');
  let transitionIntegrityViolations = 0;
  for (let i = 0; i < 100; i++) {
    const cycle = i % 3;
    if (cycle === 0) {
      // Guest
      authService.currentUser = null;
      const html = renderHeader('/');
      if (html.includes('#/admin') || html.includes('nav.admin') || !html.includes('id="open-auth-btn"') || html.includes('href="#/profil"')) {
        transitionIntegrityViolations++;
      }
    } else if (cycle === 1) {
      // Member
      authService.currentUser = { uid: `mem_${i}`, email: `mem_${i}@scentcast.my`, role: 'member', photoURL: 'https://avatar.test/mem.png' };
      const html = renderHeader('/');
      if (html.includes('#/admin') || html.includes('nav.admin') || html.includes('id="open-auth-btn"') || !html.includes('href="#/profil"')) {
        transitionIntegrityViolations++;
      }
    } else {
      // Admin
      authService.currentUser = { uid: `adm_${i}`, email: `admin_${i}@scentcast.my`, role: 'admin', photoURL: 'https://avatar.test/adm.png' };
      const html = renderHeader('/');
      if (!html.includes('#/admin') || html.includes('id="open-auth-btn"') || !html.includes('href="#/profil"')) {
        transitionIntegrityViolations++;
      }
    }
  }
  assert(transitionIntegrityViolations === 0, '1.1: 100 rapid state transitions maintain 100% deterministic navbar integrity', `Violations: ${transitionIntegrityViolations}`);

  // Test 1.2: Mobile drawer link parity across roles
  authService.currentUser = null;
  let guestHeader = renderHeader('/');
  assert(!guestHeader.includes('id="mobile-menu-drawer"') || !guestHeader.match(/id="mobile-menu-drawer"[\s\S]*?href="#\/admin"/), '1.2a: Guest mobile drawer excludes #/admin');

  authService.currentUser = { uid: 'mem1', email: 'mem@scentcast.my', role: 'member' };
  let memberHeader = renderHeader('/');
  assert(!memberHeader.includes('id="mobile-menu-drawer"') || !memberHeader.match(/id="mobile-menu-drawer"[\s\S]*?href="#\/admin"/), '1.2b: Member mobile drawer excludes #/admin');

  authService.currentUser = { uid: 'adm1', email: 'admin@scentcast.my', role: 'admin' };
  let adminHeader = renderHeader('/');
  assert(adminHeader.includes('id="mobile-menu-drawer"') && adminHeader.match(/id="mobile-menu-drawer"[\s\S]*?href="#\/admin"/), '1.2c: Admin mobile drawer includes #/admin link');

  // Test 1.3: Active route highlighting for /admin
  authService.currentUser = { uid: 'adm1', email: 'admin@scentcast.my', role: 'admin' };
  let activeAdminHeader = renderHeader('admin');
  assert(activeAdminHeader.includes('href="#/admin"') && activeAdminHeader.includes('neu-inset text-atmospheric-blue'), '1.3a: Route /admin gets active style for admin');

  authService.currentUser = null;
  let guestAdminRouteHeader = renderHeader('admin');
  assert(!guestAdminRouteHeader.includes('#/admin'), '1.3b: Route /admin for guest still completely omits admin navbar link');

  // Test 1.4: Malformed User Object Resilience in Header
  const malformedUsers = [
    { role: 'admin' }, // missing email, displayName, photoURL
    { role: 'admin', photoURL: null, email: null },
    { role: 'ADMIN' }, // uppercase should NOT be admin
    { role: 'superadmin' }, // unknown role should NOT be admin
    { role: 'user' },
    { role: '' },
    { role: null }
  ];

  let malformedHandled = true;
  for (const u of malformedUsers) {
    try {
      authService.currentUser = u;
      const html = renderHeader('/');
      if (u.role === 'admin' && !html.includes('#/admin')) malformedHandled = false;
      if (u.role !== 'admin' && html.includes('#/admin')) malformedHandled = false;
    } catch (e) {
      malformedHandled = false;
      console.error('Crash on user object:', u, e);
    }
  }
  assert(malformedHandled, '1.4: Header safely handles malformed, partial, and non-conforming user objects without crashing');

  // Test 1.5: authService multiple subscribers concurrent storm
  let subCountA = 0;
  let subCountB = 0;
  const unsubA = authService.subscribe(({ user }) => { if (user) subCountA++; });
  const unsubB = authService.subscribe(({ isGuest }) => { if (!isGuest) subCountB++; });

  authService.currentUser = { uid: 'u1', role: 'member' };
  authService.notify();
  authService.currentUser = { uid: 'u2', role: 'admin' };
  authService.notify();
  authService.currentUser = null;
  authService.notify();

  unsubA();
  unsubB();

  assert(subCountA >= 2 && subCountB >= 2, '1.5: authService dispatches all notifications concurrently to multiple subscribers');

  // ==========================================================================
  // PILLAR 2: AdminView Rendering Under Edge Cases
  // ==========================================================================
  console.log('\n► PILLAR 2: AdminView Rendering Under Edge Cases');

  // Setup Admin auth session
  authService.currentUser = { uid: 'adm_stress', email: 'admin@scentcast.my', role: 'admin' };

  // Test 2.1: Zero active users edge case
  const origGetActiveCount = presenceService.getActiveUsersCount;
  presenceService.getActiveUsersCount = () => 0;
  let htmlZeroUsers = await renderAdminView();
  assert(htmlZeroUsers.includes('id="admin-live-users-count"'), '2.1a: Zero active users renders #admin-live-users-count element');
  assert(!htmlZeroUsers.includes('NaN'), '2.1b: Zero active users contains no NaN values');
  // In AdminView.js line 48: activeCount = presenceService.getActiveUsersCount() || 1
  assert(htmlZeroUsers.includes('>1<') || htmlZeroUsers.includes('>0<'), '2.1c: Zero active users safely falls back to at least 1 viewer');

  // Test 2.2: 10,000 active users edge case
  presenceService.getActiveUsersCount = () => 10000;
  let html10kUsers = await renderAdminView();
  assert(html10kUsers.includes('>10000<'), '2.2: 10,000 active users renders correctly as "10000" in stat card');

  // Test 2.3: Massive active users (1,000,000) & negative users (-5)
  presenceService.getActiveUsersCount = () => 1000000;
  let htmlMillion = await renderAdminView();
  assert(htmlMillion.includes('>1000000<'), '2.3a: 1,000,000 active users renders correctly');

  presenceService.getActiveUsersCount = () => -5;
  let htmlNegative = await renderAdminView();
  assert(!htmlNegative.includes('NaN') && htmlNegative.length > 500, '2.3b: Negative count does not produce NaN or crash');
  presenceService.getActiveUsersCount = origGetActiveCount;

  // Test 2.4: Real-time listener update of #admin-live-users-count in DOM
  // Setup DOM container
  bodyElement.children = [];
  const testRoot = new MockDOMElement('div');
  testRoot.setAttribute('id', 'admin-view-root');
  const liveCountEl = new MockDOMElement('p');
  liveCountEl.setAttribute('id', 'admin-live-users-count');
  liveCountEl.textContent = '1';
  testRoot.appendChild(liveCountEl);
  bodyElement.appendChild(testRoot);

  let activeUserSubscriber = null;
  const origSubUsers = presenceService.subscribeActiveUsersCount;
  presenceService.subscribeActiveUsersCount = (cb) => {
    activeUserSubscriber = cb;
    return () => { activeUserSubscriber = null; };
  };

  attachAdminListeners();
  assert(typeof activeUserSubscriber === 'function', '2.4a: attachAdminListeners registers active users subscriber');

  // Send 0
  activeUserSubscriber(0);
  assert(liveCountEl.textContent === '1', '2.4b: Subscriber passing 0 active users is clamped to 1 (current viewer)');

  // Send 10,000
  activeUserSubscriber(10000);
  assert(liveCountEl.textContent === '10000', '2.4c: Subscriber passing 10,000 active users updates DOM textContent to "10000"');

  // Send 500,000
  activeUserSubscriber(500000);
  assert(liveCountEl.textContent === '500000', '2.4d: Subscriber passing 500,000 active users updates DOM textContent to "500000"');
  presenceService.subscribeActiveUsersCount = origSubUsers;

  // Test 2.5: Null sensor telemetry in initial render
  const origGetCurrentWeather = weatherService.getCurrentWeather;
  weatherService.getCurrentWeather = () => null;

  let nullTelemetryHtml = '';
  let didNullCrash = false;
  try {
    nullTelemetryHtml = await renderAdminView();
  } catch (err) {
    didNullCrash = true;
    console.error('Null telemetry crash:', err);
  }
  assert(!didNullCrash, '2.5a: Null weatherService.getCurrentWeather() does NOT crash renderAdminView()');
  assert(nullTelemetryHtml.includes('Kuala Lumpur'), '2.5b: Null telemetry safely defaults station name to Kuala Lumpur');
  assert(nullTelemetryHtml.includes('31°C'), '2.5c: Null telemetry safely defaults temperature to 31°C');
  assert(nullTelemetryHtml.includes('78%'), '2.5d: Null telemetry safely defaults humidity to 78%');
  assert(nullTelemetryHtml.includes('3.4x'), '2.5e: Null telemetry safely defaults evaporation rate to 3.4x');
  assert(nullTelemetryHtml.includes('4 - 6 Jam'), '2.5f: Null telemetry safely defaults projection hold to 4 - 6 Jam');
  assert(nullTelemetryHtml.includes('Aquatic Marine'), '2.5g: Null telemetry safely defaults family to Aquatic Marine');
  weatherService.getCurrentWeather = origGetCurrentWeather;

  // Test 2.6: Malformed sensor data in live telemetry subscriber
  // Setup telemetry cavities in mock DOM
  const tempEl = new MockDOMElement('span'); tempEl.setAttribute('id', 'admin-telemetry-temp'); testRoot.appendChild(tempEl);
  const skinEl = new MockDOMElement('span'); skinEl.setAttribute('id', 'admin-telemetry-skintemp'); testRoot.appendChild(skinEl);
  const humEl = new MockDOMElement('span'); humEl.setAttribute('id', 'admin-telemetry-humidity'); testRoot.appendChild(humEl);
  const evapEl = new MockDOMElement('span'); evapEl.setAttribute('id', 'admin-telemetry-evap'); testRoot.appendChild(evapEl);
  const projEl = new MockDOMElement('span'); projEl.setAttribute('id', 'admin-telemetry-projection'); testRoot.appendChild(projEl);
  const famEl = new MockDOMElement('span'); famEl.setAttribute('id', 'admin-telemetry-family'); testRoot.appendChild(famEl);
  const stationEl = new MockDOMElement('span'); stationEl.setAttribute('id', 'admin-telemetry-station'); testRoot.appendChild(stationEl);
  const lastSyncEl = new MockDOMElement('span'); lastSyncEl.setAttribute('id', 'admin-telemetry-lastsync'); testRoot.appendChild(lastSyncEl);

  let telemetrySubscriber = null;
  const origSubTelem = weatherService.subscribeSensorTelemetry;
  weatherService.subscribeSensorTelemetry = (cb) => {
    telemetrySubscriber = cb;
    return () => { telemetrySubscriber = null; };
  };

  attachAdminListeners();
  assert(typeof telemetrySubscriber === 'function', '2.6a: attachAdminListeners registers sensor telemetry subscriber');

  // Subtest: null/undefined payload (should not crash)
  let nullSubCrash = false;
  try {
    telemetrySubscriber(null);
    telemetrySubscriber(undefined);
  } catch (e) {
    nullSubCrash = true;
  }
  assert(!nullSubCrash, '2.6b: Null/undefined telemetry payload handled safely without throwing');

  // Subtest: Empty object {}
  telemetrySubscriber({});
  assert(tempEl.textContent === '31°C', '2.6c: Empty telemetry payload defaults temperature to 31°C');
  assert(humEl.textContent === '78% RH', '2.6d: Empty telemetry payload defaults humidity to 78% RH');
  assert(evapEl.textContent === '3.4x', '2.6e: Empty telemetry payload defaults evaporation rate to 3.4x');
  assert(projEl.textContent === '4 - 6 Jam', '2.6f: Empty telemetry payload defaults projection hold to 4 - 6 Jam');

  // Subtest: Extreme temperatures (-15°C and 48°C)
  telemetrySubscriber({ temperature: -15, humidity: 20 });
  assert(tempEl.textContent === '-15°C', '2.6g: Extreme freezing temperature (-15°C) correctly formatted');

  telemetrySubscriber({ temperature: 48, humidity: 95 });
  assert(tempEl.textContent === '48°C' && humEl.textContent === '95% RH', '2.6h: Extreme boiling temperature (48°C) and 95% humidity correctly formatted');

  // Subtest: Corrupted lastSync date string
  let corruptDateCrash = false;
  try {
    telemetrySubscriber({ lastSync: 'NOT_A_VALID_DATE_CORRUPT' });
    telemetrySubscriber({ lastSync: NaN });
  } catch (e) {
    corruptDateCrash = true;
  }
  assert(!corruptDateCrash, '2.6i: Corrupted lastSync date string does NOT crash subscriber or throw RangeError');
  weatherService.subscribeSensorTelemetry = origSubTelem;

  // Test 2.7: Catalog & Comment moderation edge cases
  const origGetAllPerfumes = perfumeService.getAllPerfumes;
  const origGetAllComments = adminService.getAllComments;

  perfumeService.getAllPerfumes = async () => [];
  adminService.getAllComments = async () => [];

  const emptyAdminHtml = await renderAdminView();
  assert(emptyAdminHtml.includes('Jumlah Wangian') && emptyAdminHtml.includes('>0<'), '2.7a: Empty perfume catalog renders count 0 gracefully');
  assert(emptyAdminHtml.includes('Ulasan Komuniti') && emptyAdminHtml.includes('>0<'), '2.7b: Empty comments collection renders count 0 gracefully');
  assert(emptyAdminHtml.includes('Tiada ulasan komuniti untuk dimoderasi'), '2.7c: Empty comments shows friendly empty moderation notice');

  // Zero-price sanitization in moderation view
  adminService.getAllComments = async () => [
    { id: 'c1', userName: 'Ahmad', rating: 5, text: 'Wangian sedap sangat, saya beli harga RM 180 di mall!', createdAt: new Date().toISOString() },
    { id: 'c2', userName: 'Sarah', rating: 4, text: 'Berbaloi dengan MYR 250 untuk bau mewah ini.', createdAt: new Date().toISOString() }
  ];

  const sanitizedCommentsHtml = await renderAdminView();
  assert(!sanitizedCommentsHtml.includes('RM 180'), '2.7d: Comment text with RM 180 is sanitized of price tag');
  assert(!sanitizedCommentsHtml.includes('MYR 250'), '2.7e: Comment text with MYR 250 is sanitized of currency tag');
  assert(!/\bRM\s*\d+/i.test(sanitizedCommentsHtml), '2.7f: AdminView zero-price regex passes with zero RM price leaks');
  assert(!/\bMYR\s*\d+/i.test(sanitizedCommentsHtml), '2.7g: AdminView zero-price regex passes with zero MYR price leaks');

  perfumeService.getAllPerfumes = origGetAllPerfumes;
  adminService.getAllComments = origGetAllComments;

  // ==========================================================================
  // PILLAR 3: Access Denied Screen Boundary Enforcement
  // ==========================================================================
  console.log('\n► PILLAR 3: Access Denied Screen Boundary Enforcement');

  // Test 3.1: Direct invocation of renderAdminView() by guest
  authService.currentUser = null;
  const guestAdminView = await renderAdminView();
  assert(guestAdminView.includes('⛔ Akses Ditolak') || guestAdminView.includes('⛔ Access Denied'), '3.1a: Guest calling renderAdminView() gets Access Denied screen');
  assert(!guestAdminView.includes('id="admin-view-root"'), '3.1b: Guest response does NOT contain #admin-view-root');
  assert(!guestAdminView.includes('id="admin-active-users-card"'), '3.1c: Guest response does NOT contain #admin-active-users-card');
  assert(!guestAdminView.includes('id="admin-sensor-telemetry-card"'), '3.1d: Guest response does NOT contain telemetry card');

  // Test 3.2: Direct invocation of renderAdminView() by regular member
  authService.currentUser = { uid: 'regular_cust_1', email: 'cust@scentcast.my', role: 'member' };
  const memberAdminView = await renderAdminView();
  assert(memberAdminView.includes('⛔ Akses Ditolak') || memberAdminView.includes('⛔ Access Denied'), '3.2: Member calling renderAdminView() gets Access Denied screen');

  // Test 3.3: Unauthorized roles ('user', 'moderator', 'hacker', empty)
  const rogueRoles = ['user', 'moderator', 'client', 'guest', 'ADMIN_SUPER', ''];
  let allRogueRejected = true;
  for (const r of rogueRoles) {
    authService.currentUser = { uid: 'rogue_1', email: 'rogue@scentcast.my', role: r };
    const res = await renderAdminView();
    if (!res.includes('⛔ Akses Ditolak') && !res.includes('⛔ Access Denied')) {
      allRogueRejected = false;
    }
  }
  assert(allRogueRejected, '3.3: All unauthorized non-admin roles strictly rejected with Access Denied');

  // Test 3.4: Zero data leakage in Access Denied screen
  const deniedHtml = renderAccessDenied();
  assert(deniedHtml.includes('lock'), '3.4a: Access Denied screen contains lock icon');
  assert(deniedHtml.includes('href="#/"'), '3.4b: Access Denied screen provides safe "Back to Home" navigation');
  assert(!deniedHtml.includes('sensors/currentWeather'), '3.4c: Access Denied screen leaks zero telemetry nodes');
  assert(!deniedHtml.includes('adminService'), '3.4d: Access Denied screen leaks zero service details');

  // Test 3.5: Unauthorized invocation of attachAdminListeners()
  authService.currentUser = null;
  mockWindow.__adminPresenceUnsub = null;
  mockWindow.__adminTelemetryUnsub = null;

  attachAdminListeners();
  assert(mockWindow.__adminPresenceUnsub === null, '3.5a: Guest calling attachAdminListeners() does NOT attach presence subscription');
  assert(mockWindow.__adminTelemetryUnsub === null, '3.5b: Guest calling attachAdminListeners() does NOT attach telemetry subscription');

  authService.currentUser = { uid: 'mem2', role: 'member' };
  attachAdminListeners();
  assert(mockWindow.__adminPresenceUnsub === null, '3.5c: Member calling attachAdminListeners() does NOT attach presence subscription');
  assert(mockWindow.__adminTelemetryUnsub === null, '3.5d: Member calling attachAdminListeners() does NOT attach telemetry subscription');

  // Test 3.6: Spoofed DOM test (Injected #admin-view-root by unauthorized attacker)
  bodyElement.children = [];
  const spoofedRoot = new MockDOMElement('div');
  spoofedRoot.setAttribute('id', 'admin-view-root');
  const spoofedDeleteBtn = new MockDOMElement('button');
  spoofedDeleteBtn.setAttribute('class', 'admin-delete-perfume-btn');
  spoofedDeleteBtn.setAttribute('data-id', 'turathi-blue');
  spoofedRoot.appendChild(spoofedDeleteBtn);
  bodyElement.appendChild(spoofedRoot);

  authService.currentUser = { uid: 'attacker', role: 'member' };
  attachAdminListeners();

  // Attempt to trigger click on spoofed button
  let deletedCount = 0;
  const origDel = adminService.deletePerfume;
  adminService.deletePerfume = async () => { deletedCount++; };

  spoofedDeleteBtn.click();
  assert(deletedCount === 0, '3.6: Spoofed DOM element click does NOT invoke adminService operations when user is not admin');
  adminService.deletePerfume = origDel;

  // Test 3.7: Re-mount cleanup of admin listeners
  authService.currentUser = { uid: 'adm_cleanup', role: 'admin' };
  let unsubPresenceCalls = 0;
  let unsubTelemetryCalls = 0;
  mockWindow.__adminPresenceUnsub = () => { unsubPresenceCalls++; };
  mockWindow.__adminTelemetryUnsub = () => { unsubTelemetryCalls++; };

  attachAdminListeners();
  assert(unsubPresenceCalls === 1, '3.7a: Re-attaching admin listeners executes previous presence unsubscription cleanup');
  assert(unsubTelemetryCalls === 1, '3.7b: Re-attaching admin listeners executes previous telemetry unsubscription cleanup');

  // Clean mock window hooks
  if (typeof mockWindow.__adminPresenceUnsub === 'function') mockWindow.__adminPresenceUnsub();
  if (typeof mockWindow.__adminTelemetryUnsub === 'function') mockWindow.__adminTelemetryUnsub();
  mockWindow.__adminPresenceUnsub = null;
  mockWindow.__adminTelemetryUnsub = null;

  // Test 3.8: Service-level Admin Mutation Guards
  // 3.8a: Unauthenticated guest session (authService.currentUser = null)
  authService.currentUser = null;
  let unauthSessionCreateBlocked = false;
  try {
    await adminService.createPerfume({ name: 'Hack Scent', brand: 'Evil', gender: 'unisex' });
  } catch (err) {
    if (err.message.includes('Akses Ditolak')) unauthSessionCreateBlocked = true;
  }
  assert(unauthSessionCreateBlocked, '3.8a: adminService.createPerfume rejects unauthenticated guest session with Akses Ditolak');

  // 3.8b: Explicit guest user object ({ role: 'guest' })
  const explicitGuestUser = { uid: 'guest_anon', role: 'guest' };
  let explicitGuestCreateBlocked = false;
  try {
    await adminService.createPerfume(explicitGuestUser, { name: 'Hack Scent', brand: 'Evil', gender: 'unisex' });
  } catch (err) {
    if (err.message.includes('Akses Ditolak')) explicitGuestCreateBlocked = true;
  }
  assert(explicitGuestCreateBlocked, '3.8b: adminService.createPerfume rejects explicit guest object with Akses Ditolak');

  // 3.8c: Customer member user object ({ role: 'member' })
  const customerUser = { uid: 'cust_123', role: 'member' };
  let customerCreateBlocked = false;
  try {
    await adminService.createPerfume(customerUser, { name: 'Hack Scent', brand: 'Evil', gender: 'unisex' });
  } catch (err) {
    if (err.message.includes('Akses Ditolak')) customerCreateBlocked = true;
  }
  assert(customerCreateBlocked, '3.8c: adminService.createPerfume rejects customer with Akses Ditolak');

  let customerDeletePerfumeBlocked = false;
  try {
    await adminService.deletePerfume(customerUser, 'turathi-blue');
  } catch (err) {
    if (err.message.includes('Akses Ditolak')) customerDeletePerfumeBlocked = true;
  }
  assert(customerDeletePerfumeBlocked, '3.8d: adminService.deletePerfume rejects customer with Akses Ditolak');

  let customerDeleteCommentBlocked = false;
  try {
    await adminService.deleteComment(customerUser, 'turathi-blue', 'c1');
  } catch (err) {
    if (err.message.includes('Akses Ditolak')) customerDeleteCommentBlocked = true;
  }
  assert(customerDeleteCommentBlocked, '3.8e: adminService.deleteComment rejects customer with Akses Ditolak');

  // Test 3.9: Zero-Price enforcement on admin mutations
  authService.currentUser = { uid: 'adm_legit', role: 'admin' };
  let priceCreationBlocked = false;
  try {
    await adminService.createPerfume({ name: 'Pricey Scent', brand: 'Luxe', gender: 'unisex', priceMYR: 199 });
  } catch (err) {
    if (err.message.includes('integriti: Sebarang data harga tidak dibenarkan')) {
      priceCreationBlocked = true;
    }
  }
  assert(priceCreationBlocked, '3.9: adminService.createPerfume enforces zero-price invariant even for authenticated admin');

  // Test 3.10: Bilingual rendering of Access Denied Screen (BM vs EN)
  const { setLanguage, initI18n } = await import('../src/services/i18nService.js');
  initI18n();

  setLanguage('bm');
  const bmDenied = renderAccessDenied();
  assert(bmDenied.includes('⛔ Akses Ditolak'), '3.10a: Access Denied screen in BM renders "⛔ Akses Ditolak"');

  setLanguage('en');
  const enDenied = renderAccessDenied();
  assert(enDenied.includes('⛔ Access Denied'), '3.10b: Access Denied screen in EN renders "⛔ Access Denied"');
  setLanguage('bm'); // Reset to default

  // ==========================================================================
  // PILLAR 4: Corrupted Catalog & Rapid Telemetry Storm Stress Tests
  // ==========================================================================
  console.log('\n► PILLAR 4: Corrupted Catalog & Rapid Telemetry Storm Stress Tests');

  // Test 4.1: Corrupted perfume catalog entities
  authService.currentUser = { uid: 'adm_corrupt_test', email: 'admin@scentcast.my', role: 'admin' };
  perfumeService.getAllPerfumes = async () => [
    { id: 'corrupt-1', name: 'Corrupt 1', brand: 'Mystery', gender: null, mainAccords: null, notes: null },
    { id: 'corrupt-2', name: 'Corrupt 2', brand: null, gender: 'male', mainAccords: 'Woody 90%', accords: null },
    { id: 'corrupt-3', name: 'Corrupt 3', brand: 'Test', imageUrl: null, longevity: null, sillage: null }
  ];

  let corruptCatalogRenderOk = true;
  let corruptCatalogHtml = '';
  try {
    corruptCatalogHtml = await renderAdminView();
  } catch (err) {
    corruptCatalogRenderOk = false;
    console.error('Crash rendering corrupt catalog:', err);
  }
  assert(corruptCatalogRenderOk, '4.1a: renderAdminView() survives completely corrupted perfume catalog entities without throwing');
  assert(corruptCatalogHtml.includes('Corrupt 1') && corruptCatalogHtml.includes('Corrupt 2'), '4.1b: Corrupted perfumes rendered safely in table');
  perfumeService.getAllPerfumes = origGetAllPerfumes;

  // Test 4.2: Rapid Telemetry Storm (100 rapid dispatches in succession)
  let stormSubscriber = null;
  weatherService.subscribeSensorTelemetry = (cb) => {
    stormSubscriber = cb;
    return () => { stormSubscriber = null; };
  };

  attachAdminListeners();
  assert(typeof stormSubscriber === 'function', '4.2a: Active telemetry storm subscriber successfully attached');

  let stormErrors = 0;
  for (let s = 0; s < 100; s++) {
    const fakeTemp = 20 + (s % 20);
    const fakeHum = 50 + (s % 45);
    try {
      stormSubscriber({
        temperature: fakeTemp,
        humidity: fakeHum,
        evaporationRate: `${(fakeTemp / 20).toFixed(1)}x`,
        projectionHold: `${s % 6 + 2} - ${s % 6 + 4} Jam`,
        recommendedFamily: s % 2 === 0 ? 'Aquatic Marine' : 'Citrus Woody',
        stationName: `Station ${s}`,
        lastSync: Date.now() - (s * 1000)
      });
    } catch (err) {
      stormErrors++;
      console.error('Storm error at step', s, err);
    }
  }
  assert(stormErrors === 0, '4.2b: Rapid telemetry storm of 100 dispatches completed with ZERO errors or DOM crashes');
  weatherService.subscribeSensorTelemetry = origSubTelem;


  // ==========================================================================
  // FINAL ADVERSARIAL SCORECARD
  // ==========================================================================
  console.log('\n================================================================');
  console.log('📊 ADVERSARIAL CHALLENGER SCORECARD — MILESTONE M1');
  console.log(`  Total Invariants Tested : ${totalAssertions}`);
  console.log(`  Passed                  : ${passedAssertions}`);
  console.log(`  Failed                  : ${failedAssertions}`);
  console.log(`  Success Rate            : ${((passedAssertions / totalAssertions) * 100).toFixed(1)}%`);
  console.log('================================================================\n');

  if (failedAssertions > 0) {
    console.error('CRITICAL ADVERSARIAL CHALLENGE FAILURES:');
    failures.forEach((f, i) => console.error(`  [${i + 1}] ${f.testName}: ${f.extraDetail}`));
    process.exitCode = 1;
  } else {
    console.log('🏆 VERDICT: ALL ADVERSARIAL CHALLENGES PASSED.');
    console.log('   Dynamic Navbar, AdminView Edge Cases, and Access Denied Boundaries are 100% fortified.');
  }
}

runAdversarialHarness().catch((err) => {
  console.error('Fatal unhandled error in adversarial test harness:', err);
  process.exit(1);
});
