import { db } from '../firebase.js';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { authService } from './authService.js';
import { perfumeService, generateSearchTokens } from './perfumeService.js';
import { initialPerfumes, initialComments } from '../data/seedData.js';
import { formatImageUrl, DEFAULT_FLACON_PLACEHOLDER } from './storageService.js';

export class AdminService {
  constructor(catalog = null) {
    this.catalog = catalog ? [...catalog] : [...initialPerfumes];
    this.comments = [];
    // Populate initial comments
    Object.entries(initialComments || {}).forEach(([pId, list]) => {
      if (Array.isArray(list)) {
        list.forEach((c) => {
          this.comments.push({ ...c, perfumeId: pId });
        });
      }
    });
  }

  /**
   * Returns true if user has admin role (role: 'admin')
   */
  checkIsAdmin(user) {
    return Boolean(user && user.role === 'admin');
  }

  /**
   * Security guard rejecting non-admin access with standard error
   */
  guardAdmin(user) {
    if (!this.checkIsAdmin(user)) {
      throw new Error('⛔ Akses Ditolak: Anda tidak mempunyai kebenaran pentadbir.');
    }
  }

  /**
   * Helper to normalize user parameter from either explicit argument or authService session
   */
  _resolveUser(potentialUser, fallbackUser = null) {
    if (potentialUser && typeof potentialUser === 'object' && ('role' in potentialUser || 'uid' in potentialUser)) {
      return potentialUser;
    }
    return fallbackUser || authService.getCurrentUser();
  }

  /**
   * Logs an administrative action to Firestore 'admin_logs' and 'admins/{uid}/audit_logs'
   */
  async logAuditAction(action, details = {}, user = null) {
    const activeAdmin = user || authService.getCurrentUser() || { uid: 'system', email: 'admin@scentcast.my' };
    const logEntry = {
      action,
      adminUid: activeAdmin.uid || 'unknown',
      adminEmail: activeAdmin.email || 'admin@scentcast.my',
      timestamp: new Date().toISOString(),
      details
    };

    try {
      await addDoc(collection(db, 'admin_logs'), logEntry);
      if (activeAdmin.uid && activeAdmin.uid !== 'system') {
        await addDoc(collection(db, 'admins', activeAdmin.uid, 'audit_logs'), logEntry);
      }
    } catch (e) {
      console.warn('[AdminService] Error saving audit log:', e);
    }
    return logEntry;
  }

  /**
   * Retrieves audit logs for the admin dashboard
   */
  async getAuditLogs(limitCount = 20) {
    try {
      const snap = await getDocs(query(collection(db, 'admin_logs'), orderBy('timestamp', 'desc')));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })).slice(0, limitCount);
    } catch (e) {
      console.warn('[AdminService] Error getting audit logs:', e);
      return [];
    }
  }

  /**
   * Creates a new perfume document with auto-generated searchTokens and integrity checks.
   * Supports both createPerfume(perfumeData) and createPerfume(user, perfumeData).
   */
  async createPerfume(arg1, arg2) {
    let user, perfumeData;
    if (arg2 !== undefined) {
      user = this._resolveUser(arg1);
      perfumeData = arg2;
    } else {
      user = authService.getCurrentUser();
      perfumeData = arg1;
    }

    this.guardAdmin(user);

    // Validation
    if (!perfumeData || !perfumeData.name || !perfumeData.name.trim()) {
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

    const id = perfumeData.id || perfumeData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const autoTokens = generateSearchTokens({ ...perfumeData, id });

    const rawImageUrl = perfumeData.imageUrl || perfumeData.image || DEFAULT_FLACON_PLACEHOLDER;
    const finalImageUrl = formatImageUrl(rawImageUrl) || DEFAULT_FLACON_PLACEHOLDER;
    const newPerfume = {
      ...perfumeData,
      id,
      imageUrl: finalImageUrl,
      // Not duplicated into `image`: images are stored as base64 data URIs (no Firebase
      // Storage), so a second copy would double the Firestore document's size for nothing.
      // Every read site already falls back to `imageUrl` first, and perfumeService backfills
      // `image` from it on load.
      image: '',
      gender: String(perfumeData.gender).toLowerCase(),
      searchTokens: autoTokens,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString()
    };

    // Update in-memory catalog
    this.catalog.push(newPerfume);

    // Sync to perfumeService cache
    if (typeof perfumeService?.updatePerfumeInCache === 'function') {
      perfumeService.updatePerfumeInCache(newPerfume);
    } else if (perfumeService.perfumesCache) {
      const idx = perfumeService.perfumesCache.findIndex((p) => p.id === id);
      if (idx !== -1) {
        perfumeService.perfumesCache[idx] = newPerfume;
      } else {
        perfumeService.perfumesCache.push(newPerfume);
      }
    }

    // Firestore persistence
    try {
      await setDoc(doc(db, 'perfumes', id), newPerfume);
      await this.logAuditAction('CREATE_PERFUME', { perfumeId: id, name: newPerfume.name }, user);
    } catch (e) {
      console.warn('[AdminService] Firestore setDoc error:', e);
      // Roll back the optimistic in-memory/cache update since the write never reached Firestore
      this.catalog = this.catalog.filter((p) => p.id !== id);
      if (perfumeService.perfumesCache) {
        perfumeService.perfumesCache = perfumeService.perfumesCache.filter((p) => p.id !== id);
      }
      throw new Error(`Gagal menyimpan wangian ke Firestore: ${e.message || 'Sila log masuk semula sebagai admin.'}`);
    }

    return newPerfume;
  }

  /**
   * Updates an existing perfume document and refreshes its searchTokens.
   * Supports updatePerfume(perfumeId, perfumeData) and updatePerfume(user, perfumeId, updateData).
   */
  async updatePerfume(arg1, arg2, arg3) {
    let user, perfumeId, updateData;
    if (arg3 !== undefined) {
      user = this._resolveUser(arg1);
      perfumeId = arg2;
      updateData = arg3;
    } else {
      user = authService.getCurrentUser();
      perfumeId = arg1;
      updateData = arg2;
    }

    this.guardAdmin(user);

    // Zero-Price Integrity Guard
    if ('priceMYR' in updateData || 'originalPriceMYR' in updateData || 'price' in updateData) {
      throw new Error('Pelanggaran integriti: Sebarang data harga tidak dibenarkan.');
    }

    // Locate in local catalog or perfumeService
    let idx = this.catalog.findIndex((p) => p.id === perfumeId);
    let currentItem = idx !== -1 ? this.catalog[idx] : null;

    if (!currentItem && perfumeService.perfumesCache) {
      currentItem = perfumeService.perfumesCache.find((p) => p.id === perfumeId);
    }

    if (!currentItem) {
      throw new Error(`Wangian dengan ID "${perfumeId}" tidak ditemui.`);
    }

    // Strictly prioritize latest imageUrl from updateData over stale product data
    const finalImageUrl = updateData.imageUrl || updateData.image || currentItem.imageUrl || currentItem.image || DEFAULT_FLACON_PLACEHOLDER;
    const cleanFinalImageUrl = formatImageUrl(finalImageUrl) || DEFAULT_FLACON_PLACEHOLDER;

    const updated = {
      ...currentItem,
      ...updateData,
      imageUrl: cleanFinalImageUrl,
      // See createPerfume: not duplicated into `image` to avoid doubling base64 image
      // payloads inside the Firestore document.
      image: '',
      id: perfumeId,
      updatedAt: new Date().toISOString()
    };
    updated.searchTokens = generateSearchTokens(updated);

    if (idx !== -1) {
      this.catalog[idx] = updated;
    } else {
      this.catalog.push(updated);
    }

    // Immediately sync to perfumeService cache so all views receive the new image without reload
    if (typeof perfumeService?.updatePerfumeInCache === 'function') {
      perfumeService.updatePerfumeInCache(updated);
    } else if (perfumeService.perfumesCache) {
      const pIdx = perfumeService.perfumesCache.findIndex((p) => p.id === perfumeId);
      if (pIdx !== -1) {
        perfumeService.perfumesCache[pIdx] = updated;
      } else {
        perfumeService.perfumesCache.push(updated);
      }
    }

    // Firestore persistence
    try {
      await updateDoc(doc(db, 'perfumes', perfumeId), updated);
      await this.logAuditAction('UPDATE_PERFUME', { perfumeId, name: updated.name }, user);
    } catch (e) {
      console.warn('[AdminService] Firestore updateDoc error, retrying with setDoc merge:', e);
      try {
        await setDoc(doc(db, 'perfumes', perfumeId), updated, { merge: true });
        await this.logAuditAction('UPDATE_PERFUME', { perfumeId, name: updated.name }, user);
      } catch (e2) {
        // Roll back the optimistic in-memory/cache update since the write never reached Firestore
        if (idx !== -1) {
          this.catalog[idx] = currentItem;
        } else {
          this.catalog = this.catalog.filter((p) => p.id !== perfumeId);
        }
        if (typeof perfumeService?.updatePerfumeInCache === 'function') {
          perfumeService.updatePerfumeInCache(currentItem);
        }
        throw new Error(`Gagal mengemaskini wangian di Firestore: ${e2.message || 'Sila log masuk semula sebagai admin.'}`);
      }
    }

    return updated;
  }

  /**
   * Deletes a perfume document from the catalog.
   * Supports deletePerfume(perfumeId) and deletePerfume(user, perfumeId).
   */
  async deletePerfume(arg1, arg2) {
    let user, perfumeId;
    if (arg2 !== undefined) {
      user = this._resolveUser(arg1);
      perfumeId = arg2;
    } else {
      user = authService.getCurrentUser();
      perfumeId = arg1;
    }

    this.guardAdmin(user);

    const idx = this.catalog.findIndex((p) => p.id === perfumeId);
    if (idx === -1) {
      return { success: false, message: 'Wangian tidak wujud.' };
    }

    const removedItem = this.catalog[idx];
    this.catalog.splice(idx, 1);

    if (perfumeService) {
      if (typeof perfumeService.markDeleted === 'function') {
        perfumeService.markDeleted(perfumeId);
      } else if (perfumeService.perfumesCache) {
        perfumeService.perfumesCache = perfumeService.perfumesCache.filter((p) => p.id !== perfumeId);
      }
    }

    try {
      await deleteDoc(doc(db, 'perfumes', perfumeId));
      await this.logAuditAction('DELETE_PERFUME', { perfumeId }, user);
    } catch (e) {
      console.warn('[AdminService] Firestore deleteDoc error:', e);
      // Roll back the optimistic in-memory/cache removal since the delete never reached Firestore
      this.catalog.splice(idx, 0, removedItem);
      if (perfumeService?.deletedIds) {
        perfumeService.deletedIds.delete(perfumeId);
      }
      if (perfumeService?.perfumesCache && !perfumeService.perfumesCache.find((p) => p.id === perfumeId)) {
        perfumeService.perfumesCache.push(removedItem);
      }
      throw new Error(`Gagal memadam wangian dari Firestore: ${e.message || 'Sila log masuk semula sebagai admin.'}`);
    }

    return { success: true };
  }

  /**
   * Moderates and deletes inappropriate community comments.
   * Supports deleteComment(commentId), deleteComment(perfumeId, commentId),
   * and deleteComment(user, commentId), deleteComment(user, perfumeId, commentId).
   */
  async deleteComment(arg1, arg2, arg3) {
    let user, perfumeId, commentId;

    if (arg3 !== undefined) {
      user = this._resolveUser(arg1);
      perfumeId = arg2;
      commentId = arg3;
    } else if (arg2 !== undefined) {
      if (arg1 && typeof arg1 === 'object' && ('role' in arg1 || 'uid' in arg1)) {
        user = arg1;
        commentId = arg2;
      } else {
        user = authService.getCurrentUser();
        perfumeId = arg1;
        commentId = arg2;
      }
    } else {
      user = authService.getCurrentUser();
      commentId = arg1;
    }

    this.guardAdmin(user);

    // Update in-memory comments
    const idx = this.comments.findIndex((c) => c.id === commentId);
    if (idx !== -1) {
      this.comments.splice(idx, 1);
    }

    // Remove from perfumeService cache if present
    if (perfumeService.commentsCache) {
      Object.keys(perfumeService.commentsCache).forEach((pid) => {
        perfumeService.commentsCache[pid] = (perfumeService.commentsCache[pid] || []).filter(
          (c) => c.id !== commentId
        );
      });
    }

    // Firestore deletion
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      if (perfumeId) {
        await perfumeService.deleteComment(commentId, perfumeId);
      }
      await this.logAuditAction('DELETE_COMMENT', { commentId, perfumeId }, user);
    } catch (e) {
      console.warn('[AdminService] Firestore deleteComment error:', e);
    }

    return { success: true };
  }

  /**
   * Fetches all community comments for moderation review
   */
  async getAllComments() {
    try {
      const snap = await getDocs(query(collection(db, 'comments'), orderBy('createdAt', 'desc')));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (list.length > 0) return list;
    } catch (e) {
      console.warn('[AdminService] Error fetching comments from Firestore:', e);
    }

    // Fallback to cache and seed
    return this.comments;
  }
}

export const adminService = new AdminService();
