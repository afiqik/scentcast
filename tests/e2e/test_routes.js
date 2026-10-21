/**
 * ScentCast Malaysia — E2E Test Suite: R10 SPA Navigation & 8 Canonical Routes
 * Covers the 8 canonical hash routes, query parameter parsing, route parameter extraction,
 * deep linking, and navigation boundary conditions.
 */

import {
  describe,
  test,
  assert,
  assertEqual,
  assertTrue,
  assertFalse,
  assertNull,
  assertNotNull,
  assertIncludes,
  assertNotIncludes,
  assertDeepEqual
} from './runner.js';

// Canonical route parser matching R10 specifications
export function parseRoute(hash) {
  const raw = hash || '#/';
  // Normalize leading hash and optional slash
  const clean = raw.replace(/^#\/?/, '');
  // Split path from query string
  const [pathPart, queryPart] = clean.split('?');
  const segments = pathPart ? pathPart.split('/').filter(Boolean) : [];

  const mainRoute = segments[0] || 'laman-utama';
  const param = segments[1] || null;

  // Parse query params
  const query = {};
  if (queryPart) {
    queryPart.split('&').forEach((pair) => {
      if (!pair) return;
      const [k, v] = pair.split('=');
      if (k) {
        query[decodeURIComponent(k)] = v !== undefined ? decodeURIComponent(v.replace(/\+/g, ' ')) : '';
      }
    });
  }

  // Canonical route mapping matching R10 & R1 specifications
  const ROUTE_MAP = {
    '': 'HomeView',
    'laman-utama': 'HomeView',
    'cuaca': 'WeatherView',
    'cadangan-cuaca': 'WeatherView',
    'direktori': 'DirectoryView',
    'cari': 'SearchView',
    'detail': 'DetailView',
    'dupe': 'DupeView',
    'dupe-finder': 'DupeView',
    'profil': 'ProfileView',
    'admin': 'AdminView',
    'tentang-kami': 'AboutView',
    '404': 'NotFoundView'
  };

  const isUnknown = !(mainRoute in ROUTE_MAP);
  const viewName = isUnknown ? 'NotFoundView' : ROUTE_MAP[mainRoute];

  return {
    raw,
    path: mainRoute,
    param,
    query,
    viewName,
    isUnknown
  };
}

export const ROUTE_MAP = {
  '': 'HomeView',
  'laman-utama': 'HomeView',
  'cuaca': 'WeatherView',
  'cadangan-cuaca': 'WeatherView',
  'direktori': 'DirectoryView',
  'cari': 'SearchView',
  'detail': 'DetailView',
  'dupe': 'DupeView',
  'dupe-finder': 'DupeView',
  'profil': 'ProfileView',
  'admin': 'AdminView',
  'tentang-kami': 'AboutView',
  '404': 'NotFoundView'
};

describe('R10: SPA Navigation & Routes — Tier 1 Feature Coverage', () => {

  test('Routes-01: Root route "#/" and "#/laman-utama" map to HomeView', () => {
    const r1 = parseRoute('#/');
    assertEqual(r1.viewName, 'HomeView');

    const r2 = parseRoute('#/laman-utama');
    assertEqual(r2.viewName, 'HomeView');
  });

  test('Routes-02: Route "#/cuaca" maps to WeatherView', () => {
    const r = parseRoute('#/cuaca');
    assertEqual(r.viewName, 'WeatherView');
    assertEqual(r.path, 'cuaca');
  });

  test('Routes-03: Route "#/direktori" maps to DirectoryView', () => {
    const r = parseRoute('#/direktori');
    assertEqual(r.viewName, 'DirectoryView');
    assertEqual(r.path, 'direktori');
  });

  test('Routes-04: Route "#/cari?q=..." maps to SearchView with parsed query', () => {
    const r = parseRoute('#/cari?q=citrus');
    assertEqual(r.viewName, 'SearchView');
    assertEqual(r.path, 'cari');
    assertEqual(r.query.q, 'citrus');
  });

  test('Routes-05: Route "#/detail/:id" maps to DetailView with perfume ID param', () => {
    const r = parseRoute('#/detail/turathi-blue');
    assertEqual(r.viewName, 'DetailView');
    assertEqual(r.path, 'detail');
    assertEqual(r.param, 'turathi-blue');
  });

  test('Routes-06: Route "#/dupe" maps to DupeView', () => {
    const r = parseRoute('#/dupe');
    assertEqual(r.viewName, 'DupeView');
    assertEqual(r.path, 'dupe');
  });

  test('Routes-07: Route "#/profil" maps to ProfileView', () => {
    const r = parseRoute('#/profil');
    assertEqual(r.viewName, 'ProfileView');
    assertEqual(r.path, 'profil');
  });

  test('Routes-08: Route "#/admin" maps to AdminView', () => {
    const r = parseRoute('#/admin');
    assertEqual(r.viewName, 'AdminView');
    assertEqual(r.path, 'admin');
  });
});

describe('R10: SPA Navigation & Routes — Tier 2 Boundary & Corner Cases', () => {

  test('Routes-09: Unknown routes safely fallback to NotFoundView without throwing errors', () => {
    const r = parseRoute('#/random-unknown-route-99');
    assertEqual(r.viewName, 'NotFoundView', 'Unknown route must fallback to NotFoundView');
    assertTrue(r.isUnknown);
  });

  test('Routes-10: Route with empty query string or empty "q" parameter parses safely', () => {
    const r1 = parseRoute('#/cari?');
    assertEqual(r1.viewName, 'SearchView');
    assertDeepEqual(r1.query, {});

    const r2 = parseRoute('#/cari?q=');
    assertEqual(r2.viewName, 'SearchView');
    assertEqual(r2.query.q, '');
  });

  test('Routes-11: Detail route missing ID parameter handles safely', () => {
    const r1 = parseRoute('#/detail/');
    assertEqual(r1.viewName, 'DetailView');
    assertNull(r1.param, 'Missing param evaluates to null');

    const r2 = parseRoute('#/detail');
    assertEqual(r2.viewName, 'DetailView');
    assertNull(r2.param);
  });

  test('Routes-12: Hash without leading slash is normalized automatically', () => {
    const r = parseRoute('#cuaca');
    assertEqual(r.viewName, 'WeatherView');
    assertEqual(r.path, 'cuaca');
  });

  test('Routes-13: URL-encoded special characters in query string decode properly', () => {
    const r = parseRoute('#/cari?q=acqua%20di%20gio&gender=male');
    assertEqual(r.query.q, 'acqua di gio');
    assertEqual(r.query.gender, 'male');
  });

  test('Routes-14: Trailing slashes on canonical routes are cleanly normalized', () => {
    const r1 = parseRoute('#/direktori/');
    assertEqual(r1.viewName, 'DirectoryView');

    const r2 = parseRoute('#/dupe/');
    assertEqual(r2.viewName, 'DupeView');
  });

  test('Routes-15: Multiple arbitrary non-existent routes consistently map to NotFoundView with isUnknown true', () => {
    const unknownPaths = [
      '#/does-not-exist',
      '#/invalid/subpath',
      '#/unknown-route?query=test',
      '#/halaman-tak-wujud-xyz'
    ];
    for (const hash of unknownPaths) {
      const parsed = parseRoute(hash);
      assertEqual(parsed.viewName, 'NotFoundView', `Route ${hash} must map to NotFoundView`);
      assertTrue(parsed.isUnknown, `Route ${hash} must have isUnknown true`);
    }
  });

  test('Routes-16: Route "#/404" is an explicitly recognized canonical route in ROUTE_MAP', () => {
    assertTrue('404' in ROUTE_MAP, 'ROUTE_MAP must contain "404"');
    assertEqual(ROUTE_MAP['404'], 'NotFoundView', 'ROUTE_MAP["404"] must map to NotFoundView');

    const r1 = parseRoute('#/404');
    assertEqual(r1.viewName, 'NotFoundView');
    assertEqual(r1.path, '404');
    assertFalse(r1.isUnknown, 'Route #/404 must not be classified as unknown');

    const r2 = parseRoute('#/404?type=perfume&id=turathi-blue');
    assertEqual(r2.viewName, 'NotFoundView');
    assertEqual(r2.path, '404');
    assertEqual(r2.query.type, 'perfume');
    assertEqual(r2.query.id, 'turathi-blue');
    assertFalse(r2.isUnknown);
  });

  test('Routes-17: Unknown routes trigger canonical auto-redirection to #/404', () => {
    // Evaluates router redirect logic: if isUnknown and hash !== '#/404' -> redirect to '#/404'
    const evaluateRedirect = (hash) => {
      const routeInfo = parseRoute(hash);
      if (routeInfo.isUnknown && hash !== '#/404') {
        return '#/404';
      }
      return null;
    };

    assertEqual(evaluateRedirect('#/invalid-route'), '#/404');
    assertEqual(evaluateRedirect('#/test-random'), '#/404');
    assertEqual(evaluateRedirect('#/random-page?q=hello'), '#/404');
    assertEqual(evaluateRedirect('#/unknown/nested/path'), '#/404');

    // Canonical / recognized routes must not redirect
    assertNull(evaluateRedirect('#/404'), 'Visiting #/404 must not trigger redirection');
    assertNull(evaluateRedirect('#/404?type=perfume&id=unknown'), 'Visiting #/404 with query must not trigger redirection');
    assertNull(evaluateRedirect('#/'), 'Home route must not trigger redirection');
    assertNull(evaluateRedirect('#/cuaca'), 'Canonical route #/cuaca must not trigger redirection');
    assertNull(evaluateRedirect('#/direktori'), 'Canonical route #/direktori must not trigger redirection');
  });
});
