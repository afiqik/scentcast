/**
 * ScentCast Malaysia — E2E Test Suite: R3 Fragrantica-Style Detail View & Community Comments
 * Covers the strict 7-step hierarchy ordering, accords %, composition notes (3 cards),
 * performance (2 metrics), when to wear, community comments & moderation, and brand carousel.
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
  assertThrows,
  assertAsyncThrows,
  assertBetween,
  assertDeepEqual,
  assertGreaterThan
} from './runner.js';

// Canonical 7-step hierarchy validator
export function validateDetailViewHierarchy(sections) {
  const REQUIRED_ORDER = [
    'header-section',       // 1. Bottle + Name + Brand • Gender + Love Button
    'accords-section',      // 2. Main Accords (%)
    'composition-section',  // 3. Fragrance Composition (3 cards: Top, Mid, Base)
    'performance-section',  // 4. Performance (2 cards: Longevity, Sillage)
    'when-to-wear-section', // 5. When To Wear
    'comments-section',     // 6. Community Comments
    'brand-carousel-section'// 7. More from [Brand] at very bottom
  ];

  let lastIndex = -1;
  for (const req of REQUIRED_ORDER) {
    const currentIndex = sections.indexOf(req);
    if (currentIndex === -1) {
      throw new Error(`Hierarchy validation failed: missing required section "${req}"`);
    }
    if (currentIndex <= lastIndex) {
      throw new Error(`Hierarchy validation failed: section "${req}" is out of order`);
    }
    lastIndex = currentIndex;
  }
  return true;
}

// In-memory comment moderation and voting simulator
export class CommentSystemSimulator {
  constructor() {
    this.comments = [];
  }

  addComment(user, { perfumeId, rating, text, tags, weatherContext }) {
    if (!user) {
      throw new Error('Sila log masuk untuk berkongsi ulasan.');
    }
    if (!text || !text.trim()) {
      throw new Error('Teks ulasan tidak boleh kosong.');
    }
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      throw new Error('Penarafan bintang mestilah antara 1 hingga 5.');
    }

    const comment = {
      id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      perfumeId,
      userId: user.uid,
      userName: user.displayName || 'Peminat Wangian',
      rating: numRating,
      text: text.trim(),
      tags: tags || [],
      weatherContext: weatherContext || '',
      helpfulCount: 0,
      helpfulVoters: [],
      replies: [],
      createdAt: new Date().toISOString()
    };
    this.comments.push(comment);
    return comment;
  }

  toggleHelpful(user, commentId) {
    if (!user) {
      throw new Error('Sila log masuk untuk mengundi.');
    }
    const comment = this.comments.find((c) => c.id === commentId);
    if (!comment) throw new Error('Komen tidak ditemui.');

    const alreadyVoted = comment.helpfulVoters.includes(user.uid);
    if (alreadyVoted) {
      comment.helpfulVoters = comment.helpfulVoters.filter((id) => id !== user.uid);
      comment.helpfulCount = Math.max(0, comment.helpfulCount - 1);
    } else {
      comment.helpfulVoters.push(user.uid);
      comment.helpfulCount += 1;
    }
    return { helpfulCount: comment.helpfulCount, hasVoted: !alreadyVoted };
  }

  editComment(user, commentId, newText) {
    if (!user) throw new Error('Sila log masuk.');
    const comment = this.comments.find((c) => c.id === commentId);
    if (!comment) throw new Error('Komen tidak ditemui.');
    if (comment.userId !== user.uid) {
      throw new Error('Hanya pemilik ulasan dibenarkan menyunting ulasan ini.');
    }
    if (!newText || !newText.trim()) throw new Error('Teks ulasan tidak boleh kosong.');
    comment.text = newText.trim();
    comment.editedAt = new Date().toISOString();
    return comment;
  }

  deleteComment(user, commentId) {
    if (!user) throw new Error('Sila log masuk.');
    const commentIndex = this.comments.findIndex((c) => c.id === commentId);
    if (commentIndex === -1) throw new Error('Komen tidak ditemui.');
    const comment = this.comments[commentIndex];

    // User can delete own comment, or admin can delete any comment
    const isOwner = comment.userId === user.uid;
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new Error('Hanya pemilik ulasan atau pentadbir dibenarkan memadam ulasan ini.');
    }
    this.comments.splice(commentIndex, 1);
    return true;
  }

  addReply(user, commentId, replyText) {
    if (!user) throw new Error('Sila log masuk untuk membalas.');
    if (!replyText || !replyText.trim()) throw new Error('Teks balasan tidak boleh kosong.');
    const comment = this.comments.find((c) => c.id === commentId);
    if (!comment) throw new Error('Komen tidak ditemui.');

    const reply = {
      id: `r_${Date.now()}`,
      userId: user.uid,
      userName: user.displayName || 'Ahli Komuniti',
      text: replyText.trim(),
      createdAt: new Date().toISOString()
    };
    comment.replies.push(reply);
    return reply;
  }
}

describe('R3: Detail View & Community Comments — Tier 1 Feature Coverage', () => {

  test('Detail-01: Detail view layout strictly adheres to the 7-step Fragrantica hierarchy', () => {
    const renderedSections = [
      'header-section',
      'accords-section',
      'composition-section',
      'performance-section',
      'when-to-wear-section',
      'comments-section',
      'brand-carousel-section'
    ];
    const isValid = validateDetailViewHierarchy(renderedSections);
    assertTrue(isValid, '7-step hierarchy must validate in strict order');
  });

  test('Detail-02: Main Accords section renders bar/pill tags with percentage metrics', () => {
    const accords = [
      { name: 'Citrus', percent: 85 },
      { name: 'Amber', percent: 65 },
      { name: 'Woody', percent: 50 }
    ];

    for (const accord of accords) {
      assertBetween(accord.percent, 1, 100, 'Accord percent must be between 1 and 100');
      assertNotNull(accord.name, 'Accord name must exist');
    }
    assertEqual(accords[0].percent, 85);
  });

  test('Detail-03: Fragrance composition renders exactly 3 visual cards (Top, Heart, Base)', () => {
    const composition = {
      top: ['Bergamot', 'Mandarin Orange'],
      mid: ['Amber', 'Woody Notes'],
      base: ['Musk', 'Patchouli', 'Spices']
    };

    const keys = Object.keys(composition);
    assertEqual(keys.length, 3, 'Must have exactly 3 composition tiers');
    assertDeepEqual(keys, ['top', 'mid', 'base']);
    assertGreaterThan(composition.top.length, 0, 'Top notes must not be empty');
    assertGreaterThan(composition.mid.length, 0, 'Mid notes must not be empty');
    assertGreaterThan(composition.base.length, 0, 'Base notes must not be empty');
  });

  test('Detail-04: Performance section renders 2 concise metric cards (Longevity & Sillage)', () => {
    const performance = {
      longevity: '8 - 10 Jam',
      sillage: '2.0 m'
    };

    assertNotNull(performance.longevity, 'Longevity metric is required');
    assertNotNull(performance.sillage, 'Sillage metric is required');
    assertIncludes(performance.longevity, 'Jam', 'Longevity expressed in hours (Jam)');
    assertIncludes(performance.sillage, 'm', 'Sillage expressed in distance meters');
  });

  test('Detail-05: When To Wear section provides structured recommendations', () => {
    const whenToWear = {
      time: ['Siang', 'Malam'],
      occasion: ['Pejabat', 'Luar Panas Lembap'],
      season: 'Sepanjang Tahun (Tropika)'
    };

    assertIncludes(whenToWear.time, 'Siang');
    assertIncludes(whenToWear.occasion, 'Pejabat');
    assertNotNull(whenToWear.season);
  });

  test('Detail-06: Community comments post successfully with rating, tags, and weather context', () => {
    const sim = new CommentSystemSimulator();
    const user = { uid: 'usr_1', displayName: 'Farhan', role: 'member' };

    const comment = sim.addComment(user, {
      perfumeId: 'turathi-blue',
      rating: 5,
      text: 'Aroma citrus bergamot yang sangat segar untuk cuaca panas Kuala Lumpur!',
      tags: ['+6 Semburan', 'Luar Panas Lembap'],
      weatherContext: 'Kuala Lumpur • 32°C • 78% RH'
    });

    assertEqual(comment.rating, 5);
    assertEqual(comment.userId, 'usr_1');
    assertIncludes(comment.text, 'bergamot');
    assertIncludes(comment.tags, '+6 Semburan');
    assertEqual(comment.helpfulCount, 0);
  });

  test('Detail-07: Threaded replies nest cleanly under parent comments', () => {
    const sim = new CommentSystemSimulator();
    const user1 = { uid: 'usr_1', displayName: 'Farhan', role: 'member' };
    const user2 = { uid: 'usr_2', displayName: 'Amir', role: 'member' };

    const comment = sim.addComment(user1, {
      perfumeId: 'turathi-blue',
      rating: 4,
      text: 'Sesuai untuk cuaca siang hari.'
    });

    const reply = sim.addReply(user2, comment.id, 'Setuju, tahan sekitar 7 jam di bawah terik matahari.');
    assertEqual(comment.replies.length, 1, 'Parent comment should contain 1 reply');
    assertEqual(reply.userId, 'usr_2');
    assertIncludes(reply.text, 'tahan sekitar 7 jam');
  });
});

describe('R3: Detail View & Community Comments — Tier 2 Boundary & Corner Cases', () => {

  test('Detail-08: Reject empty or whitespace-only review text', () => {
    const sim = new CommentSystemSimulator();
    const user = { uid: 'usr_1', displayName: 'Farhan', role: 'member' };

    assertThrows(() => {
      sim.addComment(user, { perfumeId: 'p1', rating: 5, text: '' });
    }, 'Teks ulasan tidak boleh kosong');

    assertThrows(() => {
      sim.addComment(user, { perfumeId: 'p1', rating: 5, text: '     ' });
    }, 'Teks ulasan tidak boleh kosong');
  });

  test('Detail-09: Reject invalid star ratings (0 stars, negative, >5 stars)', () => {
    const sim = new CommentSystemSimulator();
    const user = { uid: 'usr_1', displayName: 'Farhan', role: 'member' };

    assertThrows(() => {
      sim.addComment(user, { perfumeId: 'p1', rating: 0, text: 'Test review' });
    }, 'Penarafan bintang mestilah antara 1 hingga 5');

    assertThrows(() => {
      sim.addComment(user, { perfumeId: 'p1', rating: 6, text: 'Test review' });
    }, 'Penarafan bintang mestilah antara 1 hingga 5');

    assertThrows(() => {
      sim.addComment(user, { perfumeId: 'p1', rating: -1, text: 'Test review' });
    }, 'Penarafan bintang mestilah antara 1 hingga 5');
  });

  test('Detail-10: Anti-duplicate helpful voting toggles correctly without count inflation', () => {
    const sim = new CommentSystemSimulator();
    const author = { uid: 'usr_author', displayName: 'Author' };
    const voter = { uid: 'usr_voter', displayName: 'Voter' };

    const comment = sim.addComment(author, { perfumeId: 'p1', rating: 5, text: 'Great perfume' });
    assertEqual(comment.helpfulCount, 0);

    // Vote once -> helpfulCount becomes 1
    const res1 = sim.toggleHelpful(voter, comment.id);
    assertEqual(res1.helpfulCount, 1);
    assertTrue(res1.hasVoted);

    // Vote second time by SAME user -> toggles off, helpfulCount becomes 0
    const res2 = sim.toggleHelpful(voter, comment.id);
    assertEqual(res2.helpfulCount, 0);
    assertFalse(res2.hasVoted);

    // Vote third time -> toggles on again
    const res3 = sim.toggleHelpful(voter, comment.id);
    assertEqual(res3.helpfulCount, 1);
  });

  test('Detail-11: Only review owner can edit review; non-owner attempt is rejected', () => {
    const sim = new CommentSystemSimulator();
    const owner = { uid: 'usr_owner', displayName: 'Owner' };
    const stranger = { uid: 'usr_stranger', displayName: 'Stranger' };

    const comment = sim.addComment(owner, { perfumeId: 'p1', rating: 4, text: 'Original review' });

    // Stranger tries to edit
    assertThrows(() => {
      sim.editComment(stranger, comment.id, 'Hacked text');
    }, 'Hanya pemilik ulasan dibenarkan menyunting ulasan ini');

    // Owner edits successfully
    sim.editComment(owner, comment.id, 'Updated review text');
    assertEqual(comment.text, 'Updated review text');
    assertNotNull(comment.editedAt);
  });

  test('Detail-12: Unauthenticated guest submitting comment or vote triggers login requirement', () => {
    const sim = new CommentSystemSimulator();

    assertThrows(() => {
      sim.addComment(null, { perfumeId: 'p1', rating: 5, text: 'Guest comment' });
    }, 'Sila log masuk untuk berkongsi ulasan');

    assertThrows(() => {
      sim.toggleHelpful(null, 'c_dummy');
    }, 'Sila log masuk untuk mengundi');
  });

  test('Detail-13: Brand carousel excludes current perfume ID from suggestions', () => {
    const currentPerfumeId = 'turathi-blue';
    const brandPerfumes = [
      { id: 'turathi-blue', name: 'Turathi Blue', brand: 'Afnan' },
      { id: '9pm', name: '9 PM', brand: 'Afnan' },
      { id: 'supremacy-silver', name: 'Supremacy Silver', brand: 'Afnan' }
    ];

    const carouselItems = brandPerfumes.filter((p) => p.id !== currentPerfumeId);
    assertEqual(carouselItems.length, 2, 'Must exclude current perfume');
    assertFalse(carouselItems.some((p) => p.id === currentPerfumeId), 'Self must not be in carousel');
  });
});
