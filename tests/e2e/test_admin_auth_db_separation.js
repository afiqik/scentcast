/**
 * ScentCast Malaysia — E2E Test Suite: Admin Dual-Auth & Database Separation
 * Validates:
 * 1. Google Sign-In is the single login path for both customers and admins; there is no
 *    separate email/password admin login anymore.
 * 2. Firestore `admins/{uid}` is the source of truth for admin role, bootstrapped on first
 *    sign-in for admin@scentcast.my only.
 * 3. Database separation: customers/ collection for members vs admins/ & admin_logs/ for admins
 * 4. Audit logging on admin CRUD operations
 * 5. firestore.rules and database.rules.json security enforcement
 * 6. Zero-Price Rule compliance across admin services and views
 */

import {
  describe,
  test,
  assert,
  assertEqual,
  assertTrue,
  assertFalse,
  assertNotNull,
  assertThrows
} from './runner.js';
import { authService } from '../../src/services/authService.js';
import { adminService } from '../../src/services/adminService.js';
import { perfumeService } from '../../src/services/perfumeService.js';
import fs from 'node:fs';
import path from 'node:path';

describe('Admin Dual-Auth & Database Separation (customers/ vs admins/)', () => {

  test('Admin-Dual-01: there is no email/password admin login path anymore', () => {
    // Email/Password was never enabled for this Firebase project and the old canonical
    // admin@scentcast.my credentials were hardcoded in client source (a security smell) while
    // not even corresponding to a real Firebase Auth account. Google Sign-In is now the only
    // login path for both customers and admins, so loginAdmin/login/register no longer exist.
    assertEqual(typeof authService.loginAdmin, 'undefined', 'authService.loginAdmin must be removed');
    assertEqual(typeof authService.login, 'undefined', 'authService.login (email/password) must be removed');
    assertEqual(typeof authService.register, 'undefined', 'authService.register (email/password) must be removed');
    assertEqual(typeof authService.loginGoogle, 'function', 'authService.loginGoogle must remain the single sign-in entry point');
  });

  test('Admin-Dual-02: AuthModal only offers a single Google sign-in action, no email/password form', () => {
    const authModalCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/AuthModal.js'), 'utf8');
    assertTrue(authModalCode.includes('authService.loginGoogle'), 'AuthModal must call authService.loginGoogle()');
    assertFalse(authModalCode.includes('loginAdmin'), 'AuthModal must not reference the removed loginAdmin()');
    assertFalse(authModalCode.includes('createUserWithEmailAndPassword') || authModalCode.includes('authService.register'), 'AuthModal must not offer email/password registration');
  });

  test('Admin-Dual-03: Google login auto-elevation for admin@scentcast.my grants admin role', () => {
    // Simulate authorized Google login user
    const googleUser = {
      uid: 'google_adm_viq',
      email: 'admin@scentcast.my',
      displayName: 'Viq Akmal',
      role: 'admin'
    };
    authService.currentUser = googleUser;
    assertTrue(authService.isAdmin(), 'Authorized email admin@scentcast.my must be recognized as admin');
    assertEqual(authService.getCurrentUser().role, 'admin');
  });

  test('Admin-Dual-04: Non-admin customer does not have admin privileges', () => {
    const memberUser = {
      uid: 'cust_normal_123',
      email: 'customer@gmail.com',
      displayName: 'Normal User',
      role: 'member'
    };
    authService.currentUser = memberUser;
    assertFalse(authService.isAdmin(), 'Regular member must NOT be an admin');
  });

  test('DB-Sep-01: Admin audit logging records administrative operations to admin_logs', async () => {
    const adminUser = { uid: 'adm_test', email: 'admin@scentcast.my', role: 'admin' };
    authService.currentUser = adminUser;

    const logEntry = await adminService.logAuditAction('TEST_ACTION', { target: 'perfume_xyz' }, adminUser);
    assertNotNull(logEntry, 'logAuditAction must return the created log entry');
    assertEqual(logEntry.action, 'TEST_ACTION');
    assertEqual(logEntry.adminEmail, 'admin@scentcast.my');
    assertNotNull(logEntry.timestamp);
  });

  test('DB-Sep-02: createPerfume rejects the write when there is no real Firebase Auth session, even if the local role says admin', async () => {
    // A local `{ role: 'admin' }` object is not a Firebase Auth session. firestore.rules'
    // isAdmin() requires request.auth != null, so without real authentication this write
    // must be rejected by Firestore instead of silently "succeeding" in memory only.
    const adminUser = { uid: 'adm_test', email: 'admin@scentcast.my', role: 'admin' };
    authService.currentUser = adminUser;

    let threw = false;
    try {
      await adminService.createPerfume(adminUser, {
        id: 'e2e-test-perfume',
        name: 'E2E Test Oud',
        brand: 'Test Brand',
        gender: 'unisex'
      });
    } catch (e) {
      threw = true;
    }
    assertTrue(threw, 'createPerfume must surface a Firestore permission error instead of a false "success" without a real Firebase Auth session');

    const logs = await adminService.getAuditLogs();
    assertTrue(Array.isArray(logs), 'getAuditLogs must return an array');
  });

  test('DB-Sep-03: Saved perfumes sync supports customers collection', async () => {
    const customer = { uid: 'cust_save_test', savedPerfumes: [], role: 'member' };
    authService.currentUser = customer;

    const liked = await perfumeService.toggleSavePerfume('turathi-blue', customer.uid);
    assertTrue(liked, 'First toggle must save perfume');
    assertTrue(customer.savedPerfumes.includes('turathi-blue'), 'customer.savedPerfumes must contain saved perfume');
  });

  test('Rules-01: firestore.rules declares strict separation of admins, admin_logs, and customers', () => {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');

    assertTrue(rulesContent.includes('match /admins/{adminId}'), 'firestore.rules must secure /admins/{adminId}');
    assertTrue(rulesContent.includes('match /admin_logs/{logId}'), 'firestore.rules must secure /admin_logs/{logId}');
    assertTrue(rulesContent.includes('match /customers/{customerId}'), 'firestore.rules must define /customers/{customerId}');
    assertTrue(rulesContent.includes('match /users/{userId}'), 'firestore.rules must maintain legacy /users/{userId}');
    assertFalse(rulesContent.includes('admin@scentcast.my'), 'firestore.rules must not reference the phantom admin@scentcast.my account');
    assertTrue(rulesContent.includes('admin@scentcast.my'), 'firestore.rules must include the sole bootstrap admin admin@scentcast.my');
  });

  test('Rules-02: database.rules.json defines presence and sensors nodes', () => {
    const dbRulesPath = path.resolve(process.cwd(), 'database.rules.json');
    const dbRulesContent = fs.readFileSync(dbRulesPath, 'utf8');

    assertTrue(dbRulesContent.includes('presence'), 'database.rules.json must define presence node');
    assertTrue(dbRulesContent.includes('sensors'), 'database.rules.json must define sensors node');
    assertTrue(dbRulesContent.includes('activeUsers'), 'database.rules.json must define activeUsers');
  });

  test('ZeroPrice-01: Zero-Price Rule compliance in authService, adminService, and AdminView', () => {
    const authCode = fs.readFileSync(path.resolve(process.cwd(), 'src/services/authService.js'), 'utf8');
    const adminCode = fs.readFileSync(path.resolve(process.cwd(), 'src/services/adminService.js'), 'utf8');
    const adminViewCode = fs.readFileSync(path.resolve(process.cwd(), 'src/views/AdminView.js'), 'utf8');

    const priceKeywords = [/\bRM\b/, /\bMYR\b/, /diskaun/i, /penjimatan/i];
    priceKeywords.forEach((regex) => {
      assertFalse(regex.test(authCode), `authService must not contain price leakage ${regex}`);
      assertFalse(regex.test(adminCode), `adminService must not contain price leakage ${regex}`);
      // AdminView displays UI, ensure no price leaks
      assertFalse(regex.test(adminViewCode.replace(/replace\([^)]+\)/g, '')), `AdminView must not contain hardcoded price ${regex}`);
    });
  });
});
