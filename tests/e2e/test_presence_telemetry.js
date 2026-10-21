/**
 * ScentCast Malaysia — E2E Test Suite: Milestone M1 (RTDB Presence, Weather Telemetry & Admin Dashboard)
 * Tests presenceService, weather sensor telemetry sync, AdminView live cards, dynamic navbar, and Zero-Price compliance.
 */

import {
  describe,
  test,
  assert,
  assertEqual,
  assertTrue,
  assertFalse,
  assertNotNull
} from './runner.js';

import {
  presenceService,
  initPresence,
  subscribeActiveUsersCount,
  getActiveUsersCount,
  subscribeSensorTelemetry as presenceSensorTelemetry
} from '../../src/services/presenceService.js';

import {
  weatherService,
  subscribeSensorTelemetry
} from '../../src/services/weatherService.js';

import { authService } from '../../src/services/authService.js';
import { renderAdminView } from '../../src/views/AdminView.js';
import { renderHeader } from '../../src/components/Header.js';

describe('Milestone M1: RTDB Presence, Weather Telemetry & Live Admin Dashboard', () => {

  test('M1-01: presenceService exports required presence and telemetry interfaces', () => {
    assertNotNull(presenceService, 'presenceService must exist');
    assertEqual(typeof initPresence, 'function', 'initPresence must be a function');
    assertEqual(typeof subscribeActiveUsersCount, 'function', 'subscribeActiveUsersCount must be a function');
    assertEqual(typeof getActiveUsersCount, 'function', 'getActiveUsersCount must be a function');
    assertEqual(typeof presenceSensorTelemetry, 'function', 'presenceSensorTelemetry must be a function');
    assertEqual(typeof presenceService.initPresence, 'function', 'presenceService.initPresence must be a function');
    assertEqual(typeof presenceService.subscribeActiveUsersCount, 'function', 'presenceService.subscribeActiveUsersCount must be a function');
  });

  test('M1-02: initPresence handles guest and authenticated user states gracefully', () => {
    // Guest initialization
    initPresence(null);
    let count = getActiveUsersCount();
    assertTrue(count >= 1, 'Guest presence must record count >= 1');

    // Authenticated user initialization
    const mockUser = {
      uid: 'admin_test_uid_999',
      email: 'admin@scentcast.my',
      role: 'admin'
    };
    initPresence(mockUser);
    count = getActiveUsersCount();
    assertTrue(count >= 1, 'Authenticated user presence must maintain count >= 1');
  });

  test('M1-03: subscribeActiveUsersCount invokes callback with count and returns cleanup function', () => {
    let capturedCount = null;
    const unsub = subscribeActiveUsersCount((cnt) => {
      capturedCount = cnt;
    });

    assertNotNull(capturedCount, 'Callback must receive active users count');
    assertTrue(typeof capturedCount === 'number', 'Count must be a number');
    assertTrue(capturedCount >= 1, 'Count must be >= 1');
    assertEqual(typeof unsub, 'function', 'subscribeActiveUsersCount must return an unsubscribe function');

    // Test teardown call
    unsub();
  });

  test('M1-04: weatherService syncs sensor telemetry and updates latestTelemetry', async () => {
    assertEqual(typeof weatherService.syncSensorTelemetry, 'function', 'syncSensorTelemetry must be a method on weatherService');
    assertEqual(typeof subscribeSensorTelemetry, 'function', 'subscribeSensorTelemetry must be exported from weatherService');

    const sampleWeather = {
      id: 'kl',
      name: 'Kuala Lumpur',
      temp: 32,
      humidity: 75,
      windSpeed: 12
    };

    await weatherService.setActiveCity('kl');
    await weatherService.syncSensorTelemetry(sampleWeather);
    const telemetry = weatherService.latestTelemetry;

    assertNotNull(telemetry, 'latestTelemetry must be populated after syncSensorTelemetry');
    assertEqual(telemetry.stationId, 'kl', 'Station ID must match');
    assertEqual(telemetry.temperature, 32, 'Temperature must match');
    assertEqual(telemetry.status, 'ONLINE', 'Telemetry status must be ONLINE');
    assertTrue(telemetry.skinTemp >= 34, 'Skin temp must include +2.8C offset');
  });

  test('M1-05: subscribeSensorTelemetry emits real-time station metrics payload', (done) => {
    let received = null;
    const unsub = subscribeSensorTelemetry((payload) => {
      received = payload;
    });

    assertNotNull(received, 'Telemetry subscription must provide immediate or synced telemetry');
    assertTrue(typeof received.temperature === 'number', 'Telemetry must have numeric temperature');
    assertTrue(typeof received.humidity === 'number', 'Telemetry must have numeric humidity');
    assertNotNull(received.skinTemp, 'Telemetry must contain skinTemp');
    assertEqual(typeof unsub, 'function', 'subscribeSensorTelemetry must return an unsubscribe function');

    unsub();
  });

  test('M1-06: AdminView renders Live Active Users stat card with live counter and pulsating indicator', async () => {
    // Elevate to admin role for view rendering
    authService.currentUser = {
      uid: 'admin_audit_01',
      email: 'admin@scentcast.my',
      role: 'admin'
    };

    const html = await renderAdminView();

    assert(html.includes('id="admin-active-users-card"'), 'Must contain #admin-active-users-card element');
    assert(html.includes('Pengguna Aktif Langsung'), 'Must contain title "Pengguna Aktif Langsung"');
    assert(html.includes('id="admin-live-users-count"'), 'Must contain #admin-live-users-count counter');
    assert(html.includes('animate-ping'), 'Must contain pulsating green live indicator with animate-ping');
  });

  test('M1-07: AdminView renders Station Weather Telemetry Card with RTDB live indicator and metric cavities', async () => {
    authService.currentUser = {
      uid: 'admin_audit_01',
      email: 'admin@scentcast.my',
      role: 'admin'
    };

    const html = await renderAdminView();

    assert(html.includes('id="admin-sensor-telemetry-card"'), 'Must contain #admin-sensor-telemetry-card');
    assert(html.includes('Telemetri Sensor Cuaca Stesen'), 'Must contain Telemetri Sensor Cuaca Stesen header');
    assert(html.includes('sensors/currentWeather'), 'Must reference sensors/currentWeather node');
    assert(html.includes('id="admin-telemetry-temp"'), 'Must contain #admin-telemetry-temp');
    assert(html.includes('id="admin-telemetry-skintemp"'), 'Must contain #admin-telemetry-skintemp');
    assert(html.includes('id="admin-telemetry-humidity"'), 'Must contain #admin-telemetry-humidity');
    assert(html.includes('id="admin-telemetry-evap"'), 'Must contain #admin-telemetry-evap');
    assert(html.includes('id="admin-telemetry-projection"'), 'Must contain #admin-telemetry-projection');
    assert(html.includes('id="admin-telemetry-family"'), 'Must contain #admin-telemetry-family');
  });

  test('M1-08: Header dynamic navbar reactively shows Admin link only when authService.isAdmin() is true', () => {
    // 1. Guest user -> no Admin link
    authService.currentUser = null;
    let headerHtml = renderHeader('/');
    assertFalse(headerHtml.includes('#/admin'), 'Guest header must not contain #/admin link');

    // 2. Regular member -> no Admin link
    authService.currentUser = { uid: 'mem1', email: 'member@scentcast.my', role: 'member' };
    headerHtml = renderHeader('/');
    assertFalse(headerHtml.includes('#/admin'), 'Member header must not contain #/admin link');

    // 3. Admin user -> Admin link appears
    authService.currentUser = { uid: 'adm1', email: 'admin@scentcast.my', role: 'admin' };
    headerHtml = renderHeader('/');
    assertTrue(headerHtml.includes('#/admin'), 'Admin header must contain #/admin link');
  });

  test('M1-09: Zero-Price Rule Compliance across presence, telemetry, and AdminView live metrics', async () => {
    authService.currentUser = { uid: 'adm1', email: 'admin@scentcast.my', role: 'admin' };
    const html = await renderAdminView();

    const visibleText = html.replace(/<[^>]*>/g, ' ');
    assertFalse(html.includes('RM '), 'AdminView must contain zero RM price tags');
    assertFalse(html.includes('MYR '), 'AdminView must contain zero MYR price tags');
    assertFalse(/\bRM\s*\d+/i.test(visibleText), 'AdminView must contain zero RM price tags with digits');
    assertFalse(/\bMYR\s*\d+/i.test(visibleText), 'AdminView must contain zero MYR price tags with digits');
  });
});
