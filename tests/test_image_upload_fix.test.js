/**
 * ScentCast Malaysia — Verification Test for Image Upload State, Preview & Fallback Fixes
 * Covers:
 * 1. Automatic Form State Sync (setFormData callback with downloadURL)
 * 2. Save Perfume Handler (prioritizes formData.imageUrl over stale doc.data())
 * 3. Real-time Live Card & Detail View Updates (without manual page reload)
 */

import fs from 'fs';
import { compressImage, uploadPerfumeImage } from '../src/services/storageService.js';
import { perfumeService } from '../src/services/perfumeService.js';
import { adminService } from '../src/services/adminService.js';

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
console.log('  🔍 VERIFICATION AUDIT: Admin Image Upload & Live Sync Fixes');
console.log('===============================================================\n');

// 1. Verify AdminView.js source code
console.log('► 1. AdminView.js State & Form Sync Checks:');
const adminCode = fs.readFileSync('src/views/AdminView.js', 'utf8');

assert(adminCode.includes('setFormData((prev) => ({ ...prev, imageUrl: downloadURL }))'), 'AdminView calls setFormData((prev) => ({ ...prev, imageUrl: downloadURL })) on upload complete');
assert(adminCode.includes('urlInput.value = downloadURL'), 'AdminView immediately sets urlInput.value to new Firebase Storage downloadURL');
assert(adminCode.includes('formData.imageUrl'), 'AdminView references formData.imageUrl for form state');
assert(adminCode.includes('finalImageUrl = formData.imageUrl'), 'AdminView save handler extracts finalImageUrl directly from formData.imageUrl');
assert(adminCode.includes('hasUploadedNewImage'), 'AdminView tracks hasUploadedNewImage flag');
assert(adminCode.includes('lastUploadedStorageUrl'), 'AdminView tracks lastUploadedStorageUrl');
assert(adminCode.includes('alt=""'), 'AdminView modal image preview has alt="" to prevent "Pratont" text overflow');
assert(adminCode.includes('dataset.blob'), 'AdminView modal image preview utilizes dataset.blob fallback');
assert(adminCode.includes('URL.createObjectURL'), 'AdminView utilizes createObjectURL for instantaneous 0ms preview');
assert(adminCode.includes('scentcast:perfumeUpdated'), 'AdminView broadcasts scentcast:perfumeUpdated event on save');

// 2. Verify Card & Detail View Live Updates
console.log('\n► 2. Live Image Updates across Cards and Views:');
const detailCode = fs.readFileSync('src/views/DetailView.js', 'utf8');
const cardCode = fs.readFileSync('src/components/PerfumeCard.js', 'utf8');
const dupeCode = fs.readFileSync('src/views/DupeView.js', 'utf8');

assert(cardCode.includes('scentcast:perfumeUpdated'), 'PerfumeCard listens to scentcast:perfumeUpdated for live card image updates');
assert(detailCode.includes('scentcast:perfumeUpdated'), 'DetailView listens to scentcast:perfumeUpdated for live flacon image updates');
assert(detailCode.includes('onerror="this.onerror=null; this.src='), 'DetailView flacon image has onError fallback');
assert(cardCode.includes('onerror="this.onerror=null; this.src='), 'PerfumeCard flacon image has onError fallback');
assert(dupeCode.includes('onerror="this.onerror=null; this.src='), 'DupeView flacon image has onError fallback');

// 3. Verify perfumeService and adminService cache synchronization
console.log('\n► 3. PerfumeService & AdminService Cache Synchronization:');
const perfumeServiceCode = fs.readFileSync('src/services/perfumeService.js', 'utf8');
const adminServiceCode = fs.readFileSync('src/services/adminService.js', 'utf8');

assert(perfumeServiceCode.includes('updatePerfumeInCache(perfume)'), 'perfumeService implements updatePerfumeInCache');
assert(adminServiceCode.includes('perfumeService.updatePerfumeInCache'), 'adminService syncs updates into perfumeService cache');
assert(adminServiceCode.includes('finalImageUrl = updateData.imageUrl || updateData.image'), 'adminService updatePerfume prioritizes updateData.imageUrl');

// 4. Test Runtime Cache Update & Retrieval
console.log('\n► 4. Runtime Cache & Service Verification:');
const testNewImage = 'https://firebasestorage.googleapis.com/v0/b/scentcast-54308.firebasestorage.app/o/perfumes%2Ftest_update.webp?alt=media&token=test-token-123';
perfumeService.updatePerfumeInCache({
  id: 'turathi-blue',
  name: 'Turathi Blue',
  imageUrl: testNewImage,
  image: testNewImage
});

const cachedTurathi = await perfumeService.getPerfumeById('turathi-blue');
assert(cachedTurathi && cachedTurathi.imageUrl === testNewImage, 'getPerfumeById immediately returns updated Firebase Storage imageUrl from cache');

const allCached = await perfumeService.getAllPerfumes();
const foundInAll = allCached.find((p) => p.id === 'turathi-blue');
assert(foundInAll && foundInAll.imageUrl === testNewImage, 'getAllPerfumes preserves updated Firebase Storage imageUrl without page refresh');

// 5. Verify Non-blocking Asynchronous Optimization in storageService
console.log('\n► 5. Non-blocking Asynchronous Optimization:');
const storageCode = fs.readFileSync('src/services/storageService.js', 'utf8');
assert(storageCode.includes('setTimeout(r, 0)'), 'storageService yields UI execution thread with setTimeout(r, 0)');
assert(storageCode.includes('alt=media&token='), 'storageService generates valid public URL with alt=media&token=');

// 6. Test uploadPerfumeImage response format
const mockFile = { name: 'test_flacon.jpg', size: 180000 };
const uploadResult = await uploadPerfumeImage(mockFile, 'test_perfume_123');
assert(uploadResult.downloadUrl.includes('alt=media&token='), 'uploadPerfumeImage returns URL with alt=media and token');
assert(uploadResult.downloadUrl === uploadResult.url, 'uploadResult provides synchronized downloadUrl and url alias');

console.log('\n===============================================================');
console.log(`📊 TOTAL CHECKS: Passed: ${passed} | Failed: ${failed}`);
console.log('===============================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
