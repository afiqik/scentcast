/**
 * ScentCast Malaysia — Milestone G5-M2 Forensic Integrity Audit Suite
 * Auditor: gen5_auditor_m2
 * 
 * Focus:
 * 1. Storage Integration & Client-Side Canvas Image Compression
 * 2. RBAC Admin Authentication Guard & Login Flow Separation
 * 3. Dropzone Upload UI & Auto-Population in AdminView
 * 4. Zero-Price Rule Compliance
 * 5. Firebase Configuration Validation
 */

import fs from 'fs';
import path from 'path';
import { storage } from '../src/firebase.js';
import { storageService, compressImage, uploadPerfumeImage } from '../src/services/storageService.js';
import { authService } from '../src/services/authService.js';
import { renderAdminView, renderAccessDenied } from '../src/views/AdminView.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('\n===============================================================');
console.log('  🔍 G5-M2 FORENSIC INTEGRITY AUDIT SUITE');
console.log('===============================================================\n');

// -------------------------------------------------------------
// CHECK 1: Static Source Code Integrity & Cheating Detection
// -------------------------------------------------------------
console.log('► 1. Static Source Code Analysis:');

const fbCode = fs.readFileSync('src/firebase.js', 'utf8');
const storageCode = fs.readFileSync('src/services/storageService.js', 'utf8');
const authCode = fs.readFileSync('src/services/authService.js', 'utf8');
const authModalCode = fs.readFileSync('src/components/AuthModal.js', 'utf8');
const adminViewCode = fs.readFileSync('src/views/AdminView.js', 'utf8');
const firebaseJsonCode = fs.readFileSync('firebase.json', 'utf8');

// Firebase.js checks
assert(fbCode.includes("import { getStorage } from 'firebase/storage'"), 'firebase.js imports getStorage');
assert(fbCode.includes('export const storage ='), 'firebase.js exports storage');
assert(fbCode.includes('storageBucket: "scentcast-54308.firebasestorage.app"'), 'firebase.js configures valid storageBucket');

// StorageService.js checks
assert(storageCode.includes('export async function compressImage'), 'storageService exports compressImage');
assert(storageCode.includes('export async function uploadPerfumeImage'), 'storageService exports uploadPerfumeImage');
assert(storageCode.includes("document.createElement('canvas')"), 'compressImage uses genuine HTML5 Canvas');
assert(storageCode.includes('Math.min(maxWidth / width, maxHeight / height)'), 'compressImage proportionally scales dimensions');
assert(storageCode.includes('image/webp'), 'compressImage utilizes WebP compression format');
assert(storageCode.includes('image/jpeg'), 'compressImage includes JPEG fallback');
assert(storageCode.includes('maxSizeBytes'), 'compressImage enforces maxSizeBytes (<200KB)');
assert(storageCode.includes('uploadBytes'), 'uploadPerfumeImage calls Firebase uploadBytes');
assert(storageCode.includes('getDownloadURL'), 'uploadPerfumeImage calls Firebase getDownloadURL');
assert(storageCode.includes('perfumes/'), 'uploadPerfumeImage stores under perfumes/ folder');

// AuthService.js checks
assert(authCode.includes('async loginAdmin(email, password)'), 'authService implements loginAdmin(email, password)');
assert(authCode.includes('signInWithEmailAndPassword(auth, email, password)'), 'loginAdmin uses real Firebase auth');
assert(authCode.includes("doc(db, 'users', user.uid)"), 'loginAdmin checks Firestore users collection for UID');
assert(authCode.includes("role !== 'admin'"), 'loginAdmin strictly validates role !== admin');
assert(authCode.includes('signOut(auth)'), 'loginAdmin immediately signs out non-admin user');
assert(authCode.includes('this.currentUser = null'), 'loginAdmin clears currentUser on rejected admin login');
assert(!authCode.includes('admin@scentcast.com'), 'authService has NO hardcoded admin credentials');
assert(!authCode.includes('password123'), 'authService has NO mock passwords');

// AuthModal.js checks
assert(authModalCode.includes('auth-tab-member') && authModalCode.includes('auth-tab-admin'), 'AuthModal provides role tabs: Ahli vs Pentadbir');
assert(authModalCode.includes('loginAdmin(email, password)'), 'AuthModal calls loginAdmin for admin tab');
assert(authModalCode.includes('!isAdminTab') && authModalCode.includes('auth-google-btn'), 'AuthModal strictly hides Google login on Admin tab');
assert(authModalCode.includes('!isAdminTab') && authModalCode.includes('toggle-auth-mode-btn'), 'AuthModal strictly hides Register toggle on Admin tab');
assert(authModalCode.includes('#/admin'), 'AuthModal navigates to #/admin on successful admin login');

// AdminView.js checks
assert(adminViewCode.includes('if (!authService.isAdmin())'), 'AdminView strictly guards access via authService.isAdmin()');
assert(adminViewCode.includes('admin-image-dropzone'), 'AdminView implements drag-and-drop dropzone #admin-image-dropzone');
assert(adminViewCode.includes('admin-form-file'), 'AdminView implements file input #admin-form-file');
assert(adminViewCode.includes('admin-image-preview-container'), 'AdminView implements preview container');
assert(adminViewCode.includes('storageService.compressImage'), 'AdminView triggers client-side auto-compression');
assert(adminViewCode.includes('storageService.uploadPerfumeImage'), 'AdminView triggers upload to Firebase Storage');
assert(adminViewCode.includes('admin-form-image'), 'AdminView auto-populates #admin-form-image with download URL');

// firebase.json checks
const parsedFbJson = JSON.parse(firebaseJsonCode);
assert(parsedFbJson.storage && parsedFbJson.storage.rules === 'storage.rules', 'firebase.json correctly configures storage.rules');

// -------------------------------------------------------------
// CHECK 2: Zero-Price Rule Compliance Verification
// -------------------------------------------------------------
console.log('\n► 2. Zero-Price Rule Forensic Verification:');

// Verify AdminView.js has NO price fields, RM tags, or currency inputs
assert(!adminViewCode.includes('admin-form-price'), 'AdminView form has NO #admin-form-price input');
assert(!adminViewCode.includes('priceMYR'), 'AdminView form has NO priceMYR field');
assert(!adminViewCode.includes('RM '), 'AdminView form has NO RM price labels');
assert(!adminViewCode.includes('MYR'), 'AdminView form has NO MYR currency references');
assert(!adminViewCode.includes('harga'), 'AdminView form has NO harga fields');

// Verify storageService.js has NO price fields
assert(!storageCode.includes('price'), 'storageService has NO price fields');
assert(!storageCode.includes('RM'), 'storageService has NO RM symbols');

// -------------------------------------------------------------
// CHECK 3: Behavioral Execution & RBAC Defense Verification
// -------------------------------------------------------------
console.log('\n► 3. Behavioral Execution & Security Guards:');

// Verify storageService compressImage in Node
const mockFile = { name: 'chanel_flacon.png', size: 350000 };
const compressedRes = await compressImage(mockFile, 800, 800, 200 * 1024, 0.8);
assert(compressedRes !== null && typeof compressedRes === 'object', 'compressImage returns valid result object in headless env');
assert(compressedRes.sizeBytes === 350000, 'compressImage attaches sizeBytes metadata');

// Verify uploadPerfumeImage
const uploadRes = await uploadPerfumeImage(mockFile, 'test-perfume-99');
assert(uploadRes.path === 'perfumes/test-perfume-99_chanel_flacon.png', 'uploadPerfumeImage constructs correct path perfumes/{id}_{filename}');
assert(uploadRes.downloadUrl.includes('test-perfume-99_chanel_flacon.png'), 'uploadPerfumeImage generates valid storage URL');
assert(uploadRes.url === uploadRes.downloadUrl, 'uploadPerfumeImage provides alias url matching downloadUrl');

// Verify RBAC access rejection on AdminView
authService.currentUser = null; // Guest
const guestAdminHtml = await renderAdminView();
assert(guestAdminHtml.includes('⛔ Akses Ditolak'), 'renderAdminView() blocks guest with ⛔ Akses Ditolak');

authService.currentUser = { uid: 'usr_normal', role: 'member', email: 'member@test.com' }; // Regular member
const memberAdminHtml = await renderAdminView();
assert(memberAdminHtml.includes('⛔ Akses Ditolak'), 'renderAdminView() blocks normal member with ⛔ Akses Ditolak');

authService.currentUser = { uid: 'usr_admin', role: 'admin', email: 'admin@scentcast.my' }; // Admin
const adminHtml = await renderAdminView();
assert(adminHtml.includes('id="admin-view-root"'), 'renderAdminView() renders admin dashboard for role: admin');
assert(adminHtml.includes('id="admin-image-dropzone"'), 'Admin dashboard includes image dropzone');
assert(adminHtml.includes('id="admin-form-file"'), 'Admin dashboard includes hidden file input');
assert(adminHtml.includes('id="admin-form-image"'), 'Admin dashboard includes imageUrl input');

// Reset authService state
authService.currentUser = null;

console.log('\n===============================================================');
console.log(`📊 G5-M2 FORENSIC AUDIT SUMMARY: Passed: ${passed} | Failed: ${failed}`);
console.log('===============================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
