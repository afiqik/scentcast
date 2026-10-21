/**
 * ScentCast Malaysia — E2E Test Runner & Assertion Harness
 * Pure Vanilla JavaScript ES Modules (Node.js & Browser Compatible)
 */

// --- Lightweight Environment Shims for Node.js Execution ---
export function setupTestEnvironment() {
  if (typeof globalThis.window === 'undefined') {
    // In-memory Storage Mock
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

    // Mock DOM Element
    class MockElement {
      constructor(tagName = 'div') {
        this.tagName = tagName.toUpperCase();
        this.id = '';
        this.className = '';
        this.classList = new Set();
        this.innerHTML = '';
        this.textContent = '';
        this.value = '';
        this.dataset = {};
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

      click() {
        this.dispatchEvent({ type: 'click', target: this, preventDefault() {}, stopPropagation() {} });
      }

      querySelector(selector) {
        return findInMockTree(this, selector);
      }

      querySelectorAll(selector) {
        const results = [];
        findAllInMockTree(this, selector, results);
        return results;
      }
    }

    function findInMockTree(root, selector) {
      if (!root) return null;
      if (selector.startsWith('#')) {
        const id = selector.slice(1);
        if (root.id === id) return root;
      } else if (selector.startsWith('.')) {
        const cls = selector.slice(1);
        if (root.classList && root.classList.contains(cls)) return root;
      } else if (root.tagName && root.tagName.toLowerCase() === selector.toLowerCase()) {
        return root;
      }
      for (const child of root.children || []) {
        const found = findInMockTree(child, selector);
        if (found) return found;
      }
      return null;
    }

    function findAllInMockTree(root, selector, results) {
      if (!root) return;
      if (selector.startsWith('.')) {
        const cls = selector.slice(1);
        if (root.classList && root.classList.contains(cls)) results.push(root);
      } else if (root.tagName && root.tagName.toLowerCase() === selector.toLowerCase()) {
        results.push(root);
      }
      for (const child of root.children || []) {
        findAllInMockTree(child, selector, results);
      }
    }

    const documentElement = new MockElement('html');
    const body = new MockElement('body');
    documentElement.appendChild(body);

    const mockDocument = {
      documentElement,
      body,
      createElement(tag) {
        return new MockElement(tag);
      },
      getElementById(id) {
        return findInMockTree(documentElement, `#${id}`);
      },
      querySelector(sel) {
        return findInMockTree(documentElement, sel);
      },
      querySelectorAll(sel) {
        const res = [];
        findAllInMockTree(documentElement, sel, res);
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
      matchMedia: (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {}
      })
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
      }
      preventDefault() {}
      stopPropagation() {}
    };
    globalThis.CustomEvent = class CustomEvent extends globalThis.Event {
      constructor(type, opts = {}) {
        super(type, opts);
        this.detail = opts.detail || null;
      }
    };
  }
}

// Ensure env is set up immediately
setupTestEnvironment();

// --- Assertion Utilities ---
export function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
}

export function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(
      `[ASSERTION FAILED] Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}. ${message}`
    );
  }
}

export function assertNotEqual(actual, expected, message = '') {
  if (actual === expected) {
    throw new Error(
      `[ASSERTION FAILED] Expected value NOT to equal: ${JSON.stringify(expected)}. ${message}`
    );
  }
}

export function assertTrue(val, message = '') {
  if (val !== true) {
    throw new Error(`[ASSERTION FAILED] Expected true, got: ${JSON.stringify(val)}. ${message}`);
  }
}

export function assertFalse(val, message = '') {
  if (val !== false) {
    throw new Error(`[ASSERTION FAILED] Expected false, got: ${JSON.stringify(val)}. ${message}`);
  }
}

export function assertNull(val, message = '') {
  if (val !== null) {
    throw new Error(`[ASSERTION FAILED] Expected null, got: ${JSON.stringify(val)}. ${message}`);
  }
}

export function assertNotNull(val, message = '') {
  if (val === null || val === undefined) {
    throw new Error(`[ASSERTION FAILED] Expected non-null value, got: ${val}. ${message}`);
  }
}

export function assertIncludes(haystack, needle, message = '') {
  if (typeof haystack === 'string') {
    if (!haystack.includes(needle)) {
      throw new Error(
        `[ASSERTION FAILED] Expected string to include "${needle}". Content was: "${haystack.slice(0, 100)}...". ${message}`
      );
    }
  } else if (Array.isArray(haystack)) {
    if (!haystack.includes(needle)) {
      throw new Error(
        `[ASSERTION FAILED] Expected array to include element ${JSON.stringify(needle)}. ${message}`
      );
    }
  } else {
    throw new Error(`[ASSERTION FAILED] assertIncludes target must be string or array. ${message}`);
  }
}

export function assertNotIncludes(haystack, needle, message = '') {
  if (typeof haystack === 'string') {
    if (haystack.includes(needle)) {
      throw new Error(
        `[ASSERTION FAILED] Expected string NOT to include "${needle}". Found in: "${haystack.slice(0, 100)}...". ${message}`
      );
    }
  } else if (Array.isArray(haystack)) {
    if (haystack.includes(needle)) {
      throw new Error(
        `[ASSERTION FAILED] Expected array NOT to include element ${JSON.stringify(needle)}. ${message}`
      );
    }
  } else {
    throw new Error(`[ASSERTION FAILED] assertNotIncludes target must be string or array. ${message}`);
  }
}

export function assertMatch(str, regex, message = '') {
  if (!regex.test(str)) {
    throw new Error(
      `[ASSERTION FAILED] String "${str}" did not match pattern ${regex}. ${message}`
    );
  }
}

export function assertThrows(fn, expectedErrorMsgOrRegex = null, message = '') {
  let threw = false;
  try {
    fn();
  } catch (err) {
    threw = true;
    if (expectedErrorMsgOrRegex) {
      if (typeof expectedErrorMsgOrRegex === 'string') {
        assertIncludes(err.message, expectedErrorMsgOrRegex, message);
      } else if (expectedErrorMsgOrRegex instanceof RegExp) {
        assertMatch(err.message, expectedErrorMsgOrRegex, message);
      }
    }
  }
  if (!threw) {
    throw new Error(`[ASSERTION FAILED] Expected function to throw an error, but it did not. ${message}`);
  }
}

export async function assertAsyncThrows(asyncFn, expectedErrorMsgOrRegex = null, message = '') {
  let threw = false;
  try {
    await asyncFn();
  } catch (err) {
    threw = true;
    if (expectedErrorMsgOrRegex) {
      if (typeof expectedErrorMsgOrRegex === 'string') {
        assertIncludes(err.message, expectedErrorMsgOrRegex, message);
      } else if (expectedErrorMsgOrRegex instanceof RegExp) {
        assertMatch(err.message, expectedErrorMsgOrRegex, message);
      }
    }
  }
  if (!threw) {
    throw new Error(`[ASSERTION FAILED] Expected async function to throw an error, but it did not. ${message}`);
  }
}

export function assertDeepEqual(actual, expected, message = '') {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(
      `[ASSERTION FAILED] Deep equality mismatch.\nExpected: ${expectedStr}\nActual:   ${actualStr}\n${message}`
    );
  }
}

export function assertGreaterThan(val, threshold, message = '') {
  if (!(val > threshold)) {
    throw new Error(
      `[ASSERTION FAILED] Expected ${val} > ${threshold}. ${message}`
    );
  }
}

export function assertLessThan(val, threshold, message = '') {
  if (!(val < threshold)) {
    throw new Error(
      `[ASSERTION FAILED] Expected ${val} < ${threshold}. ${message}`
    );
  }
}

export function assertBetween(val, min, max, message = '') {
  if (val < min || val > max) {
    throw new Error(
      `[ASSERTION FAILED] Expected ${val} to be between ${min} and ${max}. ${message}`
    );
  }
}

// --- Suite & Test Registry ---
const suites = [];
let currentSuite = null;

export function describe(name, fn) {
  const suite = {
    name,
    tests: [],
    beforeAllHooks: [],
    afterAllHooks: [],
    beforeEachHooks: [],
    afterEachHooks: []
  };
  suites.push(suite);
  const prevSuite = currentSuite;
  currentSuite = suite;
  try {
    fn();
  } finally {
    currentSuite = prevSuite;
  }
}

export function test(name, fn) {
  if (!currentSuite) {
    describe('Default Suite', () => {
      test(name, fn);
    });
    return;
  }
  currentSuite.tests.push({ name, fn });
}

export const it = test;

export function beforeAll(fn) {
  if (currentSuite) currentSuite.beforeAllHooks.push(fn);
}

export function afterAll(fn) {
  if (currentSuite) currentSuite.afterAllHooks.push(fn);
}

export function beforeEach(fn) {
  if (currentSuite) currentSuite.beforeEachHooks.push(fn);
}

export function afterEach(fn) {
  if (currentSuite) currentSuite.afterEachHooks.push(fn);
}

// --- Runner Engine ---
export async function runAllTests() {
  const startTime = Date.now();
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const suiteResults = [];

  const isTerminal = typeof process !== 'undefined' && process.stdout?.isTTY;
  const green = (s) => (isTerminal ? `\x1b[32m${s}\x1b[0m` : s);
  const red = (s) => (isTerminal ? `\x1b[31m${s}\x1b[0m` : s);
  const cyan = (s) => (isTerminal ? `\x1b[36m${s}\x1b[0m` : s);
  const yellow = (s) => (isTerminal ? `\x1b[33m${s}\x1b[0m` : s);
  const bold = (s) => (isTerminal ? `\x1b[1m${s}\x1b[0m` : s);

  console.log('\n' + bold('==============================================================='));
  console.log(bold('  🧪 ScentCast Malaysia — Comprehensive E2E Verification Suite'));
  console.log(bold('===============================================================\n'));

  for (const suite of suites) {
    console.log(cyan(bold(`\n► SUITE: ${suite.name}`)));
    const suiteRes = { name: suite.name, tests: [], passed: 0, failed: 0 };

    for (const hook of suite.beforeAllHooks) {
      await hook();
    }

    for (const t of suite.tests) {
      totalTests++;
      for (const hook of suite.beforeEachHooks) {
        await hook();
      }

      const tStart = Date.now();
      let err = null;
      try {
        await t.fn();
      } catch (e) {
        err = e;
      }

      for (const hook of suite.afterEachHooks) {
        try {
          await hook();
        } catch (e) {
          if (!err) err = e;
        }
      }

      const duration = Date.now() - tStart;

      if (!err) {
        passedTests++;
        suiteRes.passed++;
        console.log(`  ${green('✓')} ${t.name} (${duration}ms)`);
        suiteRes.tests.push({ name: t.name, passed: true, duration });
      } else {
        failedTests++;
        suiteRes.failed++;
        console.log(`  ${red('✗')} ${t.name} (${duration}ms)`);
        console.log(`    ${red(err.message)}`);
        if (err.stack) {
          const firstStackLine = err.stack.split('\n')[1] || '';
          console.log(`    ${yellow(firstStackLine.trim())}`);
        }
        suiteRes.tests.push({ name: t.name, passed: false, error: err.message, duration });
      }
    }

    for (const hook of suite.afterAllHooks) {
      await hook();
    }

    suiteResults.push(suiteRes);
  }

  const totalDuration = Date.now() - startTime;

  console.log('\n' + bold('---------------------------------------------------------------'));
  console.log(bold('📊 TEST EXECUTION SUMMARY:'));
  console.log(`  Total Suites : ${suites.length}`);
  console.log(`  Total Tests  : ${totalTests}`);
  console.log(`  Passed       : ${green(passedTests)}`);
  console.log(`  Failed       : ${failedTests > 0 ? red(failedTests) : '0'}`);
  console.log(`  Duration     : ${totalDuration}ms`);
  console.log(bold('---------------------------------------------------------------\n'));

  // In-browser visual reporter update
  if (typeof window !== 'undefined' && globalThis.document?.getElementById('test-results')) {
    renderBrowserDashboard({
      suites: suiteResults,
      totalSuites: suites.length,
      totalTests,
      passedTests,
      failedTests,
      duration: totalDuration,
      success: failedTests === 0
    });
  }

  return {
    suites: suiteResults,
    totalSuites: suites.length,
    totalTests,
    passedTests,
    failedTests,
    duration: totalDuration,
    success: failedTests === 0
  };
}

function renderBrowserDashboard(report) {
  const container = globalThis.document.getElementById('test-results');
  if (!container) return;

  const statusColor = report.success ? '#10b981' : '#ef4444';
  const statusText = report.success ? 'ALL TESTS PASSED' : `${report.failedTests} TESTS FAILED`;

  let html = `
    <div style="background: #1e293b; color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 16px;">
        <div>
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #38bdf8;">🧪 ScentCast E2E Test Suite Dashboard</h2>
          <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Vanilla JS Modular Test Framework</div>
        </div>
        <div style="background: ${statusColor}; color: #ffffff; padding: 6px 14px; border-radius: 9999px; font-weight: 700; font-size: 13px;">
          ${statusText}
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; text-align: center;">
        <div style="background: #0f172a; padding: 12px; border-radius: 8px;">
          <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Suites</div>
          <div style="font-size: 22px; font-weight: bold; color: #f8fafc;">${report.totalSuites}</div>
        </div>
        <div style="background: #0f172a; padding: 12px; border-radius: 8px;">
          <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Total Tests</div>
          <div style="font-size: 22px; font-weight: bold; color: #f8fafc;">${report.totalTests}</div>
        </div>
        <div style="background: #0f172a; padding: 12px; border-radius: 8px;">
          <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Passed</div>
          <div style="font-size: 22px; font-weight: bold; color: #10b981;">${report.passedTests}</div>
        </div>
        <div style="background: #0f172a; padding: 12px; border-radius: 8px;">
          <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Failed</div>
          <div style="font-size: 22px; font-weight: bold; color: ${report.failedTests > 0 ? '#ef4444' : '#94a3b8'};">${report.failedTests}</div>
        </div>
        <div style="background: #0f172a; padding: 12px; border-radius: 8px;">
          <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Duration</div>
          <div style="font-size: 22px; font-weight: bold; color: #38bdf8;">${report.duration}ms</div>
        </div>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 16px;">
  `;

  for (const s of report.suites) {
    const suitePassed = s.failed === 0;
    html += `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="background: ${suitePassed ? '#f8fafc' : '#fef2f2'}; padding: 14px 18px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-weight: 700; color: #1e293b; font-size: 15px;">${s.name}</div>
          <div style="font-size: 12px; font-weight: 600; color: ${suitePassed ? '#10b981' : '#ef4444'};">
            ${s.passed} / ${s.tests.length} passed
          </div>
        </div>
        <div style="padding: 10px 18px;">
    `;

    for (const t of s.tests) {
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: ${t.passed ? '#10b981' : '#ef4444'}; font-weight: bold;">${t.passed ? '✓' : '✗'}</span>
            <span style="color: #334155;">${t.name}</span>
          </div>
          <span style="color: #94a3b8; font-size: 11px; font-family: monospace;">${t.duration}ms</span>
        </div>
      `;
      if (!t.passed && t.error) {
        html += `
          <div style="background: #fff1f2; color: #be123c; padding: 8px 12px; margin: 4px 0 8px 24px; border-radius: 6px; font-size: 12px; font-family: monospace; border-left: 3px solid #ef4444;">
            ${t.error}
          </div>
        `;
      }
    }

    html += `
        </div>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
}

// --- Auto-run when executed as script ---
if (typeof process !== 'undefined') {
  (async () => {
    setupTestEnvironment();
    await import('./test_removals.js');
    await import('./test_weather.js');
    await import('./test_search.js');
    await import('./test_detail_comments.js');
    await import('./test_love_profile.js');
    await import('./test_dupe.js');
    await import('./test_admin.js');
    await import('./test_theme_i18n.js');
    await import('./test_routes.js');
    await import('./test_combinations_scenarios.js');
    await import('./test_presence_telemetry.js');
    await import('./test_admin_auth_db_separation.js');

    const res = await runAllTests();
    process.exit(res.success ? 0 : 1);
  })();
}

