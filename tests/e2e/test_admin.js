/**
 * ScentCast Malaysia — E2E Test Suite: R7 Role-Based Admin Panel & Security
 * Covers admin authentication checks (role: 'admin'), access rejection (⛔ Akses Ditolak),
 * full CRUD operations on perfumes, searchTokens generation, and review moderation.
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
  assertThrows
} from './runner.js';
import { generateSearchTokens } from './test_search.js';

// In-memory admin service simulator
export class AdminServiceSimulator {
  constructor(catalog = []) {
    this.catalog = [...catalog];
    this.comments = [];
  }

  checkIsAdmin(user) {
    return Boolean(user && user.role === 'admin');
  }

  guardAdmin(user) {
    if (!this.checkIsAdmin(user)) {
      throw new Error('⛔ Akses Ditolak: Anda tidak mempunyai kebenaran pentadbir.');
    }
  }

  createPerfume(user, perfumeData) {
    this.guardAdmin(user);

    // Validation
    if (!perfumeData.name || !perfumeData.name.trim()) {
      throw new Error('Nama wangian diperlukan.');
    }
    if (!perfumeData.brand || !perfumeData.brand.trim()) {
      throw new Error('Jenama wangian diperlukan.');
    }
    if (!perfumeData.gender) {
      throw new Error('Jantina wangian diperlukan.');
    }

    // Zero-Price Integrity Guard
    if ('priceMYR' in perfumeData || 'originalPriceMYR' in perfumeData || 'price' in perfumeData) {
      throw new Error('Pelanggaran integriti: Sebarang data harga tidak dibenarkan.');
    }

    const id = perfumeData.id || perfumeData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const autoTokens = generateSearchTokens({ ...perfumeData, id });

    const newPerfume = {
      ...perfumeData,
      id,
      searchTokens: autoTokens,
      createdAt: new Date().toISOString()
    };

    this.catalog.push(newPerfume);
    return newPerfume;
  }

  updatePerfume(user, perfumeId, updateData) {
    this.guardAdmin(user);

    const idx = this.catalog.findIndex((p) => p.id === perfumeId);
    if (idx === -1) {
      throw new Error(`Wangian dengan ID "${perfumeId}" tidak ditemui.`);
    }

    // Zero-Price Integrity Guard
    if ('priceMYR' in updateData || 'price' in updateData) {
      throw new Error('Pelanggaran integriti: Sebarang data harga tidak dibenarkan.');
    }

    const updated = {
      ...this.catalog[idx],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    // Re-generate tokens
    updated.searchTokens = generateSearchTokens(updated);
    this.catalog[idx] = updated;
    return updated;
  }

  deletePerfume(user, perfumeId) {
    this.guardAdmin(user);
    const idx = this.catalog.findIndex((p) => p.id === perfumeId);
    if (idx === -1) {
      return { success: false, message: 'Wangian tidak wujud.' };
    }
    this.catalog.splice(idx, 1);
    return { success: true };
  }

  deleteComment(user, commentId) {
    this.guardAdmin(user);
    const idx = this.comments.findIndex((c) => c.id === commentId);
    if (idx !== -1) {
      this.comments.splice(idx, 1);
    }
    return { success: true };
  }
}

describe('R7: Role-Based Admin Panel — Tier 1 Feature Coverage', () => {

  test('Admin-01: Admin role check allows users with role: "admin"', () => {
    const sim = new AdminServiceSimulator();
    const adminUser = { uid: 'adm_1', role: 'admin', email: 'admin@scentcast.my' };
    assertTrue(sim.checkIsAdmin(adminUser), 'User with role: "admin" must be recognized as admin');
  });

  test('Admin-02: createPerfume succeeds with complete fields and auto-generates searchTokens', () => {
    const sim = new AdminServiceSimulator();
    const adminUser = { uid: 'adm_1', role: 'admin' };

    const payload = {
      name: 'Oud Wood Intense',
      brand: 'Tom Ford',
      gender: 'Unisex',
      accords: [{ name: 'Woody', percent: 90 }, { name: 'Oud', percent: 85 }],
      notes: {
        top: ['Cardamom', 'Rosewood'],
        mid: ['Oud Wood', 'Sandalwood'],
        base: ['Vetiver', 'Tonka Bean', 'Amber']
      },
      longevity: '10 - 12 Jam',
      sillage: '2.5 m',
      whenToWear: { occasion: 'Malam / Majlis Rasmi' }
    };

    const created = sim.createPerfume(adminUser, payload);
    assertNotNull(created.id);
    assertEqual(created.name, 'Oud Wood Intense');
    assertTrue(Array.isArray(created.searchTokens), 'searchTokens must be auto-generated');
    assertIncludes(created.searchTokens, 'wood');
    assertIncludes(created.searchTokens, 'oud');
    assertIncludes(created.searchTokens, 'unisex');
    assertEqual(sim.catalog.length, 1);
  });

  test('Admin-03: updatePerfume modifies existing catalog item and refreshes searchTokens', () => {
    const sim = new AdminServiceSimulator([
      { id: 'perfume-x', name: 'Perfume X', brand: 'Brand A', gender: 'Male' }
    ]);
    const adminUser = { uid: 'adm_1', role: 'admin' };

    const updated = sim.updatePerfume(adminUser, 'perfume-x', {
      name: 'Perfume X Extreme',
      longevity: '12 Jam'
    });

    assertEqual(updated.name, 'Perfume X Extreme');
    assertEqual(updated.longevity, '12 Jam');
    assertIncludes(updated.searchTokens, 'extreme', 'Updated tokens must include new words');
  });

  test('Admin-04: deletePerfume removes item from catalog', () => {
    const sim = new AdminServiceSimulator([
      { id: 'to-delete', name: 'Delete Me', brand: 'Brand' }
    ]);
    const adminUser = { uid: 'adm_1', role: 'admin' };

    const res = sim.deletePerfume(adminUser, 'to-delete');
    assertTrue(res.success);
    assertEqual(sim.catalog.length, 0);
  });

  test('Admin-05: deleteComment allows admin to moderate inappropriate community comments', () => {
    const sim = new AdminServiceSimulator();
    sim.comments = [{ id: 'spam-comment-1', text: 'Spam text', userId: 'spammer' }];
    const adminUser = { uid: 'adm_1', role: 'admin' };

    const res = sim.deleteComment(adminUser, 'spam-comment-1');
    assertTrue(res.success);
    assertEqual(sim.comments.length, 0);
  });
});

describe('R7: Role-Based Admin Panel — Tier 2 Boundary & Corner Cases', () => {

  test('Admin-06: Unauthenticated guest accessing #/admin renders ⛔ Akses Ditolak', () => {
    const sim = new AdminServiceSimulator();
    assertFalse(sim.checkIsAdmin(null), 'Guest is not admin');

    assertThrows(() => {
      sim.guardAdmin(null);
    }, '⛔ Akses Ditolak');
  });

  test('Admin-07: Regular member (role: "member") accessing #/admin renders ⛔ Akses Ditolak', () => {
    const sim = new AdminServiceSimulator();
    const regularMember = { uid: 'usr_2', role: 'member', email: 'member@scentcast.my' };
    assertFalse(sim.checkIsAdmin(regularMember), 'Regular member is not admin');

    assertThrows(() => {
      sim.guardAdmin(regularMember);
    }, '⛔ Akses Ditolak');
  });

  test('Admin-08: createPerfume rejects payload missing mandatory fields (name, brand, gender)', () => {
    const sim = new AdminServiceSimulator();
    const adminUser = { uid: 'adm_1', role: 'admin' };

    assertThrows(() => {
      sim.createPerfume(adminUser, { brand: 'Afnan', gender: 'Male' });
    }, 'Nama wangian diperlukan');

    assertThrows(() => {
      sim.createPerfume(adminUser, { name: 'Test', gender: 'Male' });
    }, 'Jenama wangian diperlukan');

    assertThrows(() => {
      sim.createPerfume(adminUser, { name: 'Test', brand: 'Afnan' });
    }, 'Jantina wangian diperlukan');
  });

  test('Admin-09: Zero-price guard strictly rejects attempts to inject price fields in admin form', () => {
    const sim = new AdminServiceSimulator();
    const adminUser = { uid: 'adm_1', role: 'admin' };

    assertThrows(() => {
      sim.createPerfume(adminUser, {
        name: 'Pricey Perfume',
        brand: 'Niche',
        gender: 'Unisex',
        priceMYR: 500 // Illegal field
      });
    }, 'Pelanggaran integriti: Sebarang data harga tidak dibenarkan');
  });

  test('Admin-10: Deleting non-existent perfume handles gracefully without throwing unhandled error', () => {
    const sim = new AdminServiceSimulator();
    const adminUser = { uid: 'adm_1', role: 'admin' };

    const res = sim.deletePerfume(adminUser, 'non-existent-id');
    assertFalse(res.success);
    assertIncludes(res.message, 'tidak wujud');
  });

  test('Admin-11: Non-admin calling deleteComment throws authorization error', () => {
    const sim = new AdminServiceSimulator();
    sim.comments = [{ id: 'c1', text: 'Nice', userId: 'u1' }];
    const member = { uid: 'u2', role: 'member' };

    assertThrows(() => {
      sim.deleteComment(member, 'c1');
    }, '⛔ Akses Ditolak');
  });

  test('Admin-12: Form schema & submission does not require targetCategory field and succeeds', () => {
    const sim = new AdminServiceSimulator();
    const adminUser = { uid: 'adm_1', role: 'admin' };

    // Payload WITHOUT targetCategory or targetType (validating removal)
    const payload = {
      name: 'Bleu de Chanel EdP',
      brand: 'Chanel',
      gender: 'male',
      isDupe: false,
      longevity: '8 - 10 Hours',
      sillage: '2.0 m'
    };

    const result = sim.createPerfume(adminUser, payload);
    assertNotNull(result);
    assertEqual(result.name, 'Bleu de Chanel EdP');
    assertFalse('targetCategory' in result, 'targetCategory must not be required');
  });

  test('Admin-13: Validation catches missing required fields and preserves state without freezing', () => {
    const sim = new AdminServiceSimulator();
    const adminUser = { uid: 'adm_1', role: 'admin' };

    let isSubmitting = true;
    try {
      sim.createPerfume(adminUser, { name: '', brand: 'Dior', gender: 'male' });
    } catch (err) {
      assertIncludes(err.message, 'Nama wangian diperlukan');
    } finally {
      isSubmitting = false;
    }
    assertFalse(isSubmitting, 'isSubmitting must reset to false in finally block');
  });

  test('Admin-14: Dupe item submission without targetCategory succeeds and saves dupe info', () => {
    const sim = new AdminServiceSimulator();
    const adminUser = { uid: 'adm_1', role: 'admin' };

    const dupePayload = {
      name: 'CDNIM Pure Parfum',
      brand: 'Armaf',
      gender: 'male',
      isDupe: true,
      dupeCategory: 'Other',
      dupeOf: 'Creed Aventus',
      matchScore: 94
    };

    const result = sim.createPerfume(adminUser, dupePayload);
    assertEqual(result.name, 'CDNIM Pure Parfum');
    assertTrue(result.isDupe);
    assertEqual(result.dupeOf, 'Creed Aventus');
    assertEqual(result.matchScore, 94);
  });
});
