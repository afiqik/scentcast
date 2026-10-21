import { db } from '../firebase.js';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { initialPerfumes, initialComments } from '../data/seedData.js';
import { authService } from './authService.js';
import { formatImageUrl } from './storageService.js';

export function calculatePerfumeRating(perfume, comments = []) {
  if (Array.isArray(comments) && comments.length > 0) {
    const validRatings = comments
      .map((c) => Number(c.rating))
      .filter((r) => !isNaN(r) && r > 0);

    const count = comments.length;
    let avg = 0.0;
    if (validRatings.length > 0) {
      const sum = validRatings.reduce((acc, val) => acc + val, 0);
      avg = parseFloat((sum / validRatings.length).toFixed(1));
    }
    return {
      rating: avg.toFixed(1),
      ratingNum: avg,
      reviewCount: count,
      hasReviews: true
    };
  }

  // If perfume has explicit rating & reviewCount in database (e.g. from seed data), and no comments found
  if (
    perfume &&
    typeof perfume.rating === 'number' &&
    perfume.rating > 0 &&
    typeof perfume.reviewCount === 'number' &&
    perfume.reviewCount > 0
  ) {
    return {
      rating: Number(perfume.rating).toFixed(1),
      ratingNum: Number(perfume.rating),
      reviewCount: Number(perfume.reviewCount),
      hasReviews: true
    };
  }

  // Brand new perfume or perfume with no reviews
  return {
    rating: '0.0',
    ratingNum: 0.0,
    reviewCount: 0,
    hasReviews: false
  };
}

export function generateSearchTokens(perfume) {
  const tokens = new Set();

  const tokenize = (val) => {
    if (!val) return;
    if (typeof val === 'string') {
      val
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2)
        .forEach((t) => tokens.add(t));
    } else if (Array.isArray(val)) {
      val.forEach(tokenize);
    }
  };

  tokenize(perfume.name);
  tokenize(perfume.brand);
  tokenize(perfume.gender);
  if (perfume.gender === 'male') {
    tokens.add('lelaki');
  } else if (perfume.gender === 'female') {
    tokens.add('wanita');
  }
  tokenize(perfume.originalDesignerRef);
  tokenize(perfume.origin);

  if (Array.isArray(perfume.accords)) {
    perfume.accords.forEach((a) => tokenize(typeof a === 'string' ? a : a.name));
  }
  if (Array.isArray(perfume.mainAccords)) {
    perfume.mainAccords.forEach((a) => tokenize(a.name));
  }

  if (perfume.notes) {
    tokenize(perfume.notes.top);
    tokenize(perfume.notes.mid);
    tokenize(perfume.notes.base);
  }

  if (perfume.whenToWear) {
    tokenize(perfume.whenToWear.time);
    tokenize(perfume.whenToWear.occasions);
    tokenize(perfume.whenToWear.occasion);
    tokenize(perfume.whenToWear.weather);
    tokenize(perfume.whenToWear.season);
  }

  return Array.from(tokens);
}

function ensureIndexedPerfume(p) {
  const gender = (p.gender || 'unisex').toLowerCase();
  const searchTokens =
    Array.isArray(p.searchTokens) && p.searchTokens.length > 0
      ? p.searchTokens
      : generateSearchTokens({ ...p, gender });

  const cleanImageUrl = formatImageUrl(p.imageUrl || p.image || '');

  return {
    ...p,
    gender,
    imageUrl: cleanImageUrl || p.imageUrl || '',
    image: cleanImageUrl || p.image || '',
    searchTokens
  };
}

class PerfumeService {
  constructor() {
    this.perfumesCache = initialPerfumes.map(ensureIndexedPerfume);
    this.commentsCache = { ...initialComments };
    this.deletedIds = new Set();
    this.isInitialized = false;
    this.init();
  }

  markDeleted(id) {
    if (!id) return;
    this.deletedIds.add(id);
    if (this.perfumesCache) {
      this.perfumesCache = this.perfumesCache.filter((p) => p.id !== id);
    }
  }

  updatePerfumeInCache(perfume) {
    if (!perfume || !perfume.id) return;
    const item = ensureIndexedPerfume({ ...perfume, _isFreshCache: true, _cachedAt: Date.now() });
    if (!this.perfumesCache) this.perfumesCache = [];
    const idx = this.perfumesCache.findIndex((p) => p.id === perfume.id);
    if (idx !== -1) {
      this.perfumesCache[idx] = { ...this.perfumesCache[idx], ...item };
    } else {
      this.perfumesCache.unshift(item);
    }
  }

  async init() {
    try {
      const perfumesCol = collection(db, 'perfumes');
      const snap = await getDocs(perfumesCol);

      if (snap.empty) {
        console.log('[Firestore] Seeding initial perfumes collection with searchTokens & gender...');
        for (const raw of initialPerfumes) {
          const p = ensureIndexedPerfume(raw);
          await setDoc(doc(db, 'perfumes', p.id), p);
        }
      } else {
        // Use ONLY Firestore data — no seed merge to prevent ghost data after deletion
        const firestorePerfumes = snap.docs.map((d) => ensureIndexedPerfume(d.data()));
        this.perfumesCache = firestorePerfumes.filter((p) => !this.deletedIds.has(p.id));
      }

      // Check comments
      const commentsCol = collection(db, 'comments');
      const comSnap = await getDocs(commentsCol);
      if (comSnap.empty) {
        console.log('[Firestore] Seeding initial comments collection...');
        for (const [perfumeId, commentsList] of Object.entries(initialComments)) {
          for (const c of commentsList) {
            await setDoc(doc(db, 'comments', c.id), c);
          }
        }
      }
      this.isInitialized = true;
    } catch (err) {
      console.warn('[Firestore] Fallback to local memory cache:', err);
      this.perfumesCache = initialPerfumes.filter((p) => !this.deletedIds.has(p.id)).map(ensureIndexedPerfume);
    }
  }

  async getAllPerfumes() {
    try {
      const perfumesCol = collection(db, 'perfumes');
      const snap = await getDocs(perfumesCol);
      if (!snap.empty) {
        const firestorePerfumes = snap.docs.map((d) => ensureIndexedPerfume(d.data()));

        // Intelligently merge cached updates (like freshly uploaded imageUrl) so server lag does not revert images
        const mergedFirestore = firestorePerfumes.map((fp) => {
          const cached = (this.perfumesCache || []).find((cp) => cp.id === fp.id);
          if (cached) {
            let chosenImg = fp.imageUrl;
            if (cached._isFreshCache && cached.imageUrl) {
              chosenImg = cached.imageUrl;
            } else if (!chosenImg && cached.imageUrl) {
              chosenImg = cached.imageUrl;
            }
            const finalImg = formatImageUrl(chosenImg);
            return {
              ...cached,
              ...fp,
              imageUrl: finalImg,
              image: finalImg
            };
          }
          return {
            ...fp,
            imageUrl: formatImageUrl(fp.imageUrl),
            image: formatImageUrl(fp.image || fp.imageUrl)
          };
        });

        // Use ONLY Firestore data — no seed merge to prevent ghost data after deletion
        this.perfumesCache = mergedFirestore.filter((p) => !this.deletedIds.has(p.id));
      }
    } catch (e) {
      console.warn('[Firestore] Error fetching perfumes, using cache:', e);
    }
    return (this.perfumesCache || []).filter((p) => !this.deletedIds.has(p.id));
  }

  async getPerfumeById(id) {
    const cached = this.perfumesCache ? this.perfumesCache.find((p) => p.id === id) : null;
    try {
      const d = await getDoc(doc(db, 'perfumes', id));
      if (d.exists()) {
        const remoteItem = ensureIndexedPerfume(d.data());
        const merged = { ...(cached || {}), ...remoteItem };
        let chosenImg = remoteItem.imageUrl;
        if (cached && cached._isFreshCache && cached.imageUrl) {
          chosenImg = cached.imageUrl;
        } else if (!chosenImg && cached && cached.imageUrl) {
          chosenImg = cached.imageUrl;
        }
        const finalImg = formatImageUrl(chosenImg);
        merged.imageUrl = finalImg;
        merged.image = finalImg;
        if (this.perfumesCache) {
          const idx = this.perfumesCache.findIndex((p) => p.id === id);
          if (idx !== -1) this.perfumesCache[idx] = merged;
          else this.perfumesCache.push(merged);
        }
        return merged;
      }
    } catch (e) {
      console.warn(e);
    }
    return cached ? ensureIndexedPerfume(cached) : null;
  }

  searchPerfumes(queryStr = '', filters = {}) {
    let results = [...this.perfumesCache];

    const q = queryStr.trim().toLowerCase();
    if (q) {
      const terms = q
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 0);

      results = results.filter((perfume) => {
        const tokens = perfume.searchTokens || generateSearchTokens(perfume);
        const nameLower = (perfume.name || '').toLowerCase();
        const brandLower = (perfume.brand || '').toLowerCase();
        const genderLower = (perfume.gender || '').toLowerCase();
        const designerRefLower = (perfume.originalDesignerRef || '').toLowerCase();

        return terms.every((term) => {
          return (
            tokens.some((tok) => tok.includes(term)) ||
            nameLower.includes(term) ||
            brandLower.includes(term) ||
            genderLower.includes(term) ||
            designerRefLower.includes(term)
          );
        });
      });
    }

    // Facet filtering
    if (filters.gender && filters.gender !== 'all') {
      const targetGender = filters.gender.toLowerCase();
      results = results.filter(
        (p) => (p.gender || 'unisex').toLowerCase() === targetGender
      );
    }

    if (filters.brand && filters.brand !== 'all') {
      results = results.filter(
        (p) => (p.brand || '').toLowerCase() === filters.brand.toLowerCase()
      );
    }

    if (filters.accord && filters.accord !== 'all') {
      const targetAccord = filters.accord.toLowerCase();
      results = results.filter((p) => {
        const accords = p.accords || [];
        const mainAccords = (p.mainAccords || []).map((m) => m.name);
        const allAccords = [...accords, ...mainAccords].map((a) =>
          (typeof a === 'string' ? a : a.name).toLowerCase()
        );
        return allAccords.some((a) => a.includes(targetAccord));
      });
    }

    // Sorting (Rating, Match, Longevity, Name) - STRICTLY ZERO PRICE SORTING
    if (filters.sortBy) {
      if (filters.sortBy === 'rating') {
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (filters.sortBy === 'match') {
        results.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
      } else if (filters.sortBy === 'longevity') {
        results.sort((a, b) => (b.climateScore || 0) - (a.climateScore || 0));
      } else if (filters.sortBy === 'name') {
        results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      }
    }

    return results;
  }

  async getCommentsOnce(perfumeId) {
    try {
      const q = query(
        collection(db, 'comments'),
        where('perfumeId', '==', perfumeId)
      );
      const snap = await getDocs(q);
      const comments = snap.docs.map((docSnap) => ({
        ...docSnap.data(),
        id: docSnap.id
      }));
      comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      this.commentsCache[perfumeId] = comments;
      return comments;
    } catch (e) {
      console.warn('[Firestore] getCommentsOnce error, using cache:', e);
      return this.commentsCache[perfumeId] || [];
    }
  }

  async getComments(perfumeId, onUpdate) {
    try {
      const q = query(
        collection(db, 'comments'),
        where('perfumeId', '==', perfumeId)
      );

      return onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id
        }));

        comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        this.commentsCache[perfumeId] = comments;
        if (onUpdate) onUpdate(comments);
      });
    } catch (e) {
      console.warn('[Firestore] Snapshot failed, returning cached comments:', e);
      const fallback = this.commentsCache[perfumeId] || [];
      if (onUpdate) onUpdate(fallback);
      return () => {};
    }
  }

  async addComment(perfumeId, { rating, text, tags, weatherContext }) {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('Sila log masuk untuk berkongsi ulasan.');
    }

    const newComment = {
      id: `comment-${Date.now()}`,
      perfumeId,
      userId: user.uid,
      userName: user.displayName || 'Peminat Wangian',
      userAvatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      rating: Number(rating) || 5,
      weatherContext: weatherContext || 'Ujian Cuaca Tempatan (32°C, 78% RH)',
      tags: tags || ['+6 Semburan', 'Luar Panas Lembap'],
      text,
      helpfulCount: 0,
      helpfulVoters: [],
      createdAt: new Date().toISOString(),
      replies: []
    };

    try {
      await setDoc(doc(db, 'comments', newComment.id), newComment);
    } catch (e) {
      console.warn('[Firestore] Error saving comment to cloud, updating local:', e);
    }

    if (!this.commentsCache[perfumeId]) this.commentsCache[perfumeId] = [];
    if (!this.commentsCache[perfumeId].some((c) => c.id === newComment.id)) {
      this.commentsCache[perfumeId].unshift(newComment);
    }

    // Sync dynamic rating & reviewCount to perfume document in Firestore & in-memory cache
    try {
      const allComments = this.commentsCache[perfumeId] || [];
      const { ratingNum, reviewCount } = calculatePerfumeRating({ id: perfumeId }, allComments);
      await updateDoc(doc(db, 'perfumes', perfumeId), {
        rating: ratingNum,
        reviewCount
      }).catch(() => null);

      if (this.perfumesCache) {
        const cached = this.perfumesCache.find((p) => p.id === perfumeId);
        if (cached) {
          cached.rating = ratingNum;
          cached.reviewCount = reviewCount;
        }
      }
    } catch (syncErr) {
      console.warn('[Firestore] Error syncing rating to perfume doc:', syncErr);
    }

    return newComment;
  }

  async addReply(commentId, perfumeId, replyText) {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('Sila log masuk untuk membalas.');
    }

    const reply = {
      id: `reply-${Date.now()}`,
      userId: user.uid,
      userName: user.displayName || 'Pengguna',
      userAvatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      text: replyText,
      createdAt: new Date().toISOString()
    };

    try {
      const commentRef = doc(db, 'comments', commentId);
      const cSnap = await getDoc(commentRef);
      if (cSnap.exists()) {
        const cData = cSnap.data();
        const updatedReplies = [...(cData.replies || []), reply];
        await updateDoc(commentRef, { replies: updatedReplies });
      }
    } catch (e) {
      console.warn('[Firestore] Error adding reply:', e);
    }
  }

  async deleteComment(commentId, perfumeId = null) {
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (e) {
      console.warn(e);
    }

    // Remove from cache and sync perfume doc
    let targetPerfumeId = perfumeId;
    if (!targetPerfumeId && this.commentsCache) {
      Object.keys(this.commentsCache).forEach((pid) => {
        if (this.commentsCache[pid].some((c) => c.id === commentId)) {
          targetPerfumeId = pid;
        }
      });
    }

    if (targetPerfumeId && this.commentsCache[targetPerfumeId]) {
      this.commentsCache[targetPerfumeId] = this.commentsCache[targetPerfumeId].filter((c) => c.id !== commentId);
      const remaining = this.commentsCache[targetPerfumeId];
      const { ratingNum, reviewCount } = calculatePerfumeRating({ id: targetPerfumeId }, remaining);
      try {
        await updateDoc(doc(db, 'perfumes', targetPerfumeId), {
          rating: ratingNum,
          reviewCount
        }).catch(() => null);

        if (this.perfumesCache) {
          const cached = this.perfumesCache.find((p) => p.id === targetPerfumeId);
          if (cached) {
            cached.rating = ratingNum;
            cached.reviewCount = reviewCount;
          }
        }
      } catch (err) {
        console.warn(err);
      }
    }
  }

  async editComment(commentId, newText) {
    try {
      await updateDoc(doc(db, 'comments', commentId), {
        text: newText,
        editedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn(e);
    }
  }

  async toggleHelpful(commentId, perfumeId) {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Sila log masuk untuk mengundi.');

    try {
      const commentRef = doc(db, 'comments', commentId);
      const snap = await getDoc(commentRef);
      if (snap.exists()) {
        const data = snap.data();
        let voters = data.helpfulVoters || [];
        let count = data.helpfulCount || 0;

        if (voters.includes(user.uid)) {
          voters = voters.filter((id) => id !== user.uid);
          count = Math.max(0, count - 1);
        } else {
          voters.push(user.uid);
          count += 1;
        }

        await updateDoc(commentRef, { helpfulCount: count, helpfulVoters: voters });
      }
    } catch (e) {
      console.warn(e);
    }
  }

  async toggleSavePerfume(perfumeId, userId = null) {
    let user = authService.getCurrentUser();
    const targetUid = userId || user?.uid;
    if (!targetUid) throw new Error('Sila log masuk untuk menyimpan koleksi.');

    if (!user && targetUid) {
      user = { uid: targetUid, savedPerfumes: [] };
    }

    const currentSaved = Array.isArray(user.savedPerfumes)
      ? user.savedPerfumes.map((id) => (typeof id === 'object' && id !== null ? id.id : String(id)))
      : [];
    const isCurrentlySaved = currentSaved.includes(perfumeId);

    // Optimistic local update
    if (isCurrentlySaved) {
      user.savedPerfumes = currentSaved.filter((id) => id !== perfumeId);
    } else {
      user.savedPerfumes = Array.from(new Set([...currentSaved, perfumeId]));
    }

    // Firestore sync using arrayUnion/arrayRemove with setDoc merge on customers and users
    try {
      const payload = {
        savedPerfumes: isCurrentlySaved ? arrayRemove(perfumeId) : arrayUnion(perfumeId)
      };
      await Promise.all([
        setDoc(doc(db, 'customers', targetUid), payload, { merge: true }).catch(() => null),
        setDoc(doc(db, 'users', targetUid), payload, { merge: true }).catch(() => null)
      ]);
    } catch (e) {
      console.warn('[Firestore] Error syncing saved perfumes with arrayUnion/arrayRemove:', e);
    }

    // Broadcast event for active views
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('scentcast-saved-perfumes-changed', {
        detail: { perfumeId, isLiked: !isCurrentlySaved, savedPerfumes: user.savedPerfumes }
      }));
    }

    return !isCurrentlySaved;
  }

  subscribeToSavedPerfumes(userId, callback) {
    if (!userId) return () => {};
    try {
      // Listen to customers or fallback to users
      const customerRef = doc(db, 'customers', userId);
      const userRef = doc(db, 'users', userId);

      const handleSnap = async (snap) => {
        if (snap && snap.exists()) {
          const data = snap.data();
          const rawIds = Array.isArray(data.savedPerfumes) ? data.savedPerfumes : [];
          const savedIds = rawIds.map((id) => (typeof id === 'object' && id !== null ? id.id : String(id)));
          const user = authService.getCurrentUser();
          if (user && user.uid === userId) {
            user.savedPerfumes = savedIds;
          }
          if (typeof callback === 'function') {
            if (!this.perfumesCache || this.perfumesCache.length === 0) {
              await this.getAllPerfumes();
            }
            const savedObjs = (this.perfumesCache || []).filter((p) => savedIds.includes(p.id));
            callback(savedObjs, savedIds);
          }
        }
      };

      const unsubCustomer = onSnapshot(customerRef, handleSnap, () => {});
      const unsubUser = onSnapshot(userRef, handleSnap, (err) => {
        console.warn('[Firestore] Error subscribing to saved perfumes:', err);
      });

      return () => {
        try { unsubCustomer(); } catch (_) {}
        try { unsubUser(); } catch (_) {}
      };
    } catch (e) {
      console.warn(e);
      return () => {};
    }
  }

  async getSavedPerfumes(userOrUserId) {
    let savedIds = [];
    if (typeof userOrUserId === 'string') {
      try {
        const custSnap = await getDoc(doc(db, 'customers', userOrUserId)).catch(() => null);
        if (custSnap && custSnap.exists()) {
          const raw = custSnap.data().savedPerfumes || [];
          savedIds = raw.map((id) => (typeof id === 'object' && id !== null ? id.id : String(id)));
        } else {
          const userDocRef = doc(db, 'users', userOrUserId);
          const snap = await getDoc(userDocRef).catch(() => null);
          if (snap && snap.exists()) {
            const raw = snap.data().savedPerfumes || [];
            savedIds = raw.map((id) => (typeof id === 'object' && id !== null ? id.id : String(id)));
          }
        }
      } catch (e) {
        console.warn(e);
      }
    } else if (userOrUserId && Array.isArray(userOrUserId.savedPerfumes)) {
      savedIds = userOrUserId.savedPerfumes.map((id) => (typeof id === 'object' && id !== null ? id.id : String(id)));
    } else {
      const user = authService.getCurrentUser();
      savedIds = Array.isArray(user?.savedPerfumes)
        ? user.savedPerfumes.map((id) => (typeof id === 'object' && id !== null ? id.id : String(id)))
        : [];
    }

    if (!this.perfumesCache || this.perfumesCache.length === 0) {
      await this.getAllPerfumes();
    }
    return (this.perfumesCache || []).filter((p) => savedIds.includes(p.id));
  }
}

export const perfumeService = new PerfumeService();
