/**
 * ScentCast Malaysia — Milestone M1 Forensic Auditor Verification Suite
 * 
 * Independent forensic integrity checks:
 * 1. RTDB Presence Engine Architecture & Signatures
 * 2. .info/connected listener, presence/activeUsers path, onDisconnect cleanup
 * 3. Station Telemetry Sync to sensors/currentWeather & Math Accuracy
 * 4. AdminView Access Control, Live Presence Card, Station Telemetry Card
 * 5. Header Dynamic Admin Navigation Reactivity
 * 6. Zero-Price & Zero-Facade Integrity Across All M1 Artifacts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('\n===============================================================');
console.log('  🕵️‍♂️ FORENSIC AUDITOR M1 INTEGRITY & VERIFICATION SUITE');
console.log('===============================================================\n');

// -------------------------------------------------------------
// CHECK 1: Static Source Code Analysis for Required Interfaces
// -------------------------------------------------------------
console.log('► 1. Static Source Code Analysis:');
const presencePath = path.join(ROOT, 'src', 'services', 'presenceService.js');
const weatherPath = path.join(ROOT, 'src', 'services', 'weatherService.js');
const adminViewPath = path.join(ROOT, 'src', 'views', 'AdminView.js');
const mainPath = path.join(ROOT, 'src', 'main.js');
const headerPath = path.join(ROOT, 'src', 'components', 'Header.js');

const presenceCode = fs.readFileSync(presencePath, 'utf8');
const weatherCode = fs.readFileSync(weatherPath, 'utf8');
const adminViewCode = fs.readFileSync(adminViewPath, 'utf8');
const mainCode = fs.readFileSync(mainPath, 'utf8');
const headerCode = fs.readFileSync(headerPath, 'utf8');

assert(presenceCode.includes('.info/connected'), 'presenceService.js listens to .info/connected');
assert(presenceCode.includes('presence/activeUsers'), 'presenceService.js targets presence/activeUsers');
assert(presenceCode.includes('onDisconnect'), 'presenceService.js implements onDisconnect hook');
assert(presenceCode.includes('serverTimestamp'), 'presenceService.js uses serverTimestamp for lastSeen');
assert(presenceCode.includes('Object.keys'), 'presenceService.js computes active count dynamically via Object.keys()');

assert(weatherCode.includes('sensors/currentWeather'), 'weatherService.js syncs to sensors/currentWeather');
assert(weatherCode.includes('calculateSkinTemperature') || weatherCode.includes('+ 2.8'), 'weatherService.js calculates skin temperature + 2.8°C');
assert(weatherCode.includes('subscribeSensorTelemetry'), 'weatherService.js exports subscribeSensorTelemetry');

assert(adminViewCode.includes('id="admin-live-users-count"'), 'AdminView.js includes live user count ID');
assert(adminViewCode.includes('id="admin-active-users-card"'), 'AdminView.js includes live active users card');
assert(adminViewCode.includes('id="admin-sensor-telemetry-card"'), 'AdminView.js includes station sensor telemetry card');
assert(adminViewCode.includes('admin-telemetry-skintemp'), 'AdminView.js includes skin temperature metric element');
assert(adminViewCode.includes('animate-ping'), 'AdminView.js includes pulsating live indicator (animate-ping)');
assert(adminViewCode.includes('renderAccessDenied'), 'AdminView.js includes renderAccessDenied');

assert(mainCode.includes('presenceService.initPresence'), 'main.js initializes presence tracking');
assert(headerCode.includes("authService.isAdmin()"), 'Header.js checks authService.isAdmin() for navigation');

// -------------------------------------------------------------
// CHECK 2: Facade & Cheating Detection (No hardcoded return constants)
// -------------------------------------------------------------
console.log('\n► 2. Facade & Cheating Detection:');
assert(!presenceCode.includes('return 42') && !presenceCode.includes('return 48'), 'presenceService.js does not return hardcoded user count');
assert(!presenceCode.includes('return "CLEAN"') && !presenceCode.includes('return true // mock'), 'presenceService.js has no fake bypass returns');

// Verify onDisconnect teardown logic is genuine
assert(presenceCode.includes('disconnectRef.remove()'), 'presenceService genuinely calls disconnectRef.remove()');

// Verify presenceService exports all contract functions
assert(presenceCode.includes('export function initPresence'), 'presenceService exports initPresence');
assert(presenceCode.includes('export function subscribeActiveUsersCount'), 'presenceService exports subscribeActiveUsersCount');
assert(presenceCode.includes('export function getActiveUsersCount'), 'presenceService exports getActiveUsersCount');
assert(presenceCode.includes('export function subscribeSensorTelemetry'), 'presenceService exports subscribeSensorTelemetry');

// -------------------------------------------------------------
// CHECK 3: Zero-Price Policy Forensic Scan
// -------------------------------------------------------------
console.log('\n► 3. Zero-Price Policy Forensic Scan:');
const priceRegex = /\b(RM|MYR)\s*\d+/i;
assert(!priceRegex.test(presenceCode), 'presenceService.js has zero price tokens');
assert(!priceRegex.test(weatherCode), 'weatherService.js has zero price tokens');
assert(!priceRegex.test(adminViewCode), 'AdminView.js has zero price tokens');
assert(!priceRegex.test(mainCode), 'main.js has zero price tokens');
assert(!priceRegex.test(headerCode), 'Header.js has zero price tokens');

assert(!adminViewCode.includes('harga') && !adminViewCode.includes('price'), 'AdminView.js has zero harga/price form fields or labels');

// -------------------------------------------------------------
// CHECK 4: Dynamic Functional Tracing & Math Verification
// -------------------------------------------------------------
console.log('\n► 4. Scientific Olfactory Math Verification:');
import {
  calculateSkinTemperature,
  calculateEvaporationRate,
  calculateProjectionHold,
  getRecommendedOlfactoryFamily,
  getSprayAdvice,
  weatherService
} from '../src/services/weatherService.js';

const skinTemp25 = calculateSkinTemperature(25);
assert(skinTemp25 === 27.8, `calculateSkinTemperature(25) = ${skinTemp25} (expected 27.8)`);

const skinTemp31 = calculateSkinTemperature(31.2);
assert(skinTemp31 === 34.0, `calculateSkinTemperature(31.2) = ${skinTemp31} (expected 34.0)`);

const evapRate = calculateEvaporationRate(30, 15);
assert(typeof evapRate === 'number' && evapRate > 0, `Evaporation rate calculation is valid positive number (${evapRate})`);

const projHoldHot = calculateProjectionHold(34, 80);
assert(projHoldHot === '3 - 5 Jam', `Projection hold in hot/humid weather is '3 - 5 Jam' (got ${projHoldHot})`);

const projHoldCool = calculateProjectionHold(20, 60);
assert(projHoldCool === '6 - 9 Jam', `Projection hold in cool weather is '6 - 9 Jam' (got ${projHoldCool})`);

const recFamilyHot = getRecommendedOlfactoryFamily(33, 80);
assert(recFamilyHot.includes('Aquatic Marine'), `Recommended family for 33°C / 80% RH is Aquatic Marine (got ${recFamilyHot})`);

const recFamilyCool = getRecommendedOlfactoryFamily(20, 60);
assert(recFamilyCool.includes('Gourmand / Amber'), `Recommended family for 20°C is Gourmand / Amber (got ${recFamilyCool})`);

const sprayHighHumid = getSprayAdvice(30, 85);
assert(sprayHighHumid.includes('kolar atau fabrik'), `Spray advice for >80% RH advises collar/fabric application`);

// -------------------------------------------------------------
// CHECK 5: Execution Simulation & Dynamic Binding
// -------------------------------------------------------------
console.log('\n► 5. Execution Simulation & Dynamic Binding:');
import { authService } from '../src/services/authService.js';
import { renderAdminView, renderAccessDenied } from '../src/views/AdminView.js';
import { renderHeader } from '../src/components/Header.js';
import { presenceService } from '../src/services/presenceService.js';

// Test 5.1: Non-Admin Access Denied
authService.currentUser = null;
const guestAdminHtml = await renderAdminView();
assert(guestAdminHtml.includes('⛔ Akses Ditolak'), 'Non-admin/guest receives Access Denied screen');
assert(!guestAdminHtml.includes('id="admin-catalog-view"'), 'Access Denied does not leak catalog table');

// Test 5.2: Admin Access Granted with Metrics
authService.currentUser = { uid: 'auditor_admin', email: 'admin@scentcast.my', role: 'admin' };
const adminHtml = await renderAdminView();
assert(adminHtml.includes('id="admin-active-users-card"'), 'Admin view renders active users card for admin');
assert(adminHtml.includes('id="admin-sensor-telemetry-card"'), 'Admin view renders sensor telemetry card for admin');
assert(adminHtml.includes('id="admin-live-users-count"'), 'Admin view renders live users counter');
assert(adminHtml.includes('id="admin-telemetry-temp"'), 'Admin view renders telemetry temperature element');

// Test 5.3: Header dynamic navbar
authService.currentUser = null;
const guestHeader = renderHeader('/');
assert(!guestHeader.includes('#/admin'), 'Guest header does not contain admin link');

authService.currentUser = { uid: 'member_01', email: 'member@scentcast.my', role: 'member' };
const memberHeader = renderHeader('/');
assert(!memberHeader.includes('#/admin'), 'Member header does not contain admin link');

authService.currentUser = { uid: 'admin_01', email: 'admin@scentcast.my', role: 'admin' };
const adminHeader = renderHeader('/');
assert(adminHeader.includes('#/admin'), 'Admin header dynamically contains #/admin link');

// Test 5.4: Presence service state tracking
presenceService.initPresence({ uid: 'test_u1', email: 'u1@test.com', role: 'member' });
assert(presenceService.getActiveUsersCount() >= 1, 'Active users count is >= 1');

let presenceCallbackCalled = false;
let capturedCountVal = 0;
const unsub = presenceService.subscribeActiveUsersCount((c) => {
  presenceCallbackCalled = true;
  capturedCountVal = c;
});
assert(presenceCallbackCalled, 'subscribeActiveUsersCount immediately emits active count');
assert(capturedCountVal >= 1, `Active count captured is >= 1 (${capturedCountVal})`);
assert(typeof unsub === 'function', 'subscribeActiveUsersCount returns unsubscribe function');
unsub();

// -------------------------------------------------------------
// CHECK 6: Summary & Verdict Calculation
// -------------------------------------------------------------
console.log('\n===============================================================');
console.log(`📊 AUDIT RESULT: Passed: ${passedTests} | Failed: ${failedTests} | Total: ${totalTests}`);
console.log('===============================================================\n');

if (failedTests > 0) {
  console.error('❌ VERDICT: INTEGRITY VIOLATION');
  process.exit(1);
} else {
  console.log('✅ VERDICT: CLEAN');
  process.exit(0);
}
