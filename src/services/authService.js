import { auth, googleProvider, db } from '../firebase.js';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
// One-time bootstrap only: the first sign-in from this email is provisioned into the Firestore
// `admins` collection, which is the actual source of truth for admin role afterwards (and
// matches firestore.rules' isAdmin()). Promoting anyone else to admin is a Firestore change
// (add a doc under admins/{uid}), not a code change.
const BOOTSTRAP_ADMIN_EMAILS = ['admin@scentcast.my'];

class AuthService {
  constructor() {
    this.currentUser = null;
    this.listeners = new Set();
    this.knownUsernames = new Map(); // cleanUsername -> uid for offline/cache fallback

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const fallbackUsername = (user.email ? user.email.split('@')[0] : 'user')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .slice(0, 20);

        let userProfile = {
          uid: user.uid,
          displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
          username: (this.currentUser && this.currentUser.uid === user.uid && this.currentUser.username)
            ? this.currentUser.username
            : fallbackUsername,
          email: user.email,
          photoURL: user.photoURL || DEFAULT_AVATAR,
          role: 'member',
          savedPerfumes: []
        };

        try {
          // Firestore `admins/{uid}` is the single source of truth for admin role.
          const adminDocRef = doc(db, 'admins', user.uid);
          const adminSnap = await getDoc(adminDocRef);
          if (adminSnap.exists()) {
            userProfile = { ...userProfile, ...adminSnap.data(), role: 'admin' };
          } else if (BOOTSTRAP_ADMIN_EMAILS.includes((user.email || '').toLowerCase())) {
            userProfile.role = 'admin';
            await setDoc(adminDocRef, userProfile, { merge: true });
          }

          // Check customers collection (and legacy users collection fallback) for profile data
          const customerDocRef = doc(db, 'customers', user.uid);
          const userDocRef = doc(db, 'users', user.uid);
          const [custSnap, userSnap] = await Promise.all([
            getDoc(customerDocRef).catch(() => null),
            getDoc(userDocRef).catch(() => null)
          ]);

          if (custSnap && custSnap.exists()) {
            const data = custSnap.data();
            userProfile = {
              ...userProfile,
              ...data,
              role: userProfile.role,
              username: data.username || userProfile.username
            };
          } else if (userSnap && userSnap.exists()) {
            // Legacy migration from users to customers
            const data = userSnap.data();
            userProfile = {
              ...userProfile,
              ...data,
              role: userProfile.role,
              username: data.username || userProfile.username
            };
            await setDoc(customerDocRef, userProfile, { merge: true });
          } else {
            // Create in both customers and users
            await Promise.all([
              setDoc(customerDocRef, userProfile, { merge: true }),
              setDoc(userDocRef, userProfile, { merge: true })
            ]);
          }
        } catch (e) {
          console.warn('[Firestore] Error syncing user profile:', e);
        }

        if (userProfile.username) {
          this.knownUsernames.set(userProfile.username, user.uid);
        }

        this.currentUser = userProfile;
      } else {
        this.currentUser = null;
      }
      this.notify();
    });
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback({
      user: this.currentUser,
      isGuest: this.isGuest()
    });
    return () => this.listeners.delete(callback);
  }

  notify() {
    const payload = {
      user: this.currentUser,
      isGuest: this.isGuest()
    };
    this.listeners.forEach((cb) => {
      try {
        cb(payload);
      } catch (e) {
        console.error(e);
      }
    });
  }

  isGuest() {
    return !this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAdmin() {
    return Boolean(this.currentUser && this.currentUser.role === 'admin');
  }

  async checkUsernameUnique(username, excludeUid = null) {
    const cleanUsername = (username || '').trim().toLowerCase();
    const formatRegex = /^[a-z0-9_]{3,20}$/;
    if (!formatRegex.test(cleanUsername)) {
      return false;
    }

    const targetExcludeUid = excludeUid || null;

    // 1. Fast in-memory cache check
    if (this.knownUsernames.has(cleanUsername)) {
      const cachedUid = this.knownUsernames.get(cleanUsername);
      if (!targetExcludeUid || cachedUid !== targetExcludeUid) {
        return false;
      }
    }

    // 2. Query Firestore collections 'customers' and 'users' where 'username' == cleanUsername
    try {
      const customersCol = collection(db, 'customers');
      const q = query(customersCol, where('username', '==', cleanUsername));
      const snap = await getDocs(q);

      if (snap && !snap.empty) {
        for (const docSnap of snap.docs) {
          if (targetExcludeUid && docSnap.id === targetExcludeUid) {
            continue;
          }
          return false;
        }
      }

      // Check legacy users collection fallback
      const usersCol = collection(db, 'users');
      const qUsers = query(usersCol, where('username', '==', cleanUsername));
      const snapUsers = await getDocs(qUsers);
      if (snapUsers && !snapUsers.empty) {
        for (const docSnap of snapUsers.docs) {
          if (targetExcludeUid && docSnap.id === targetExcludeUid) {
            continue;
          }
          return false;
        }
      }
    } catch (err) {
      console.warn('[AuthService] Firestore checkUsernameUnique error/mock:', err);
      // Fallback check on memory cache
      if (this.knownUsernames.has(cleanUsername)) {
        const cachedUid = this.knownUsernames.get(cleanUsername);
        if (!targetExcludeUid || cachedUid !== targetExcludeUid) {
          return false;
        }
      }
    }

    return true;
  }

  async updateProfileData({ displayName, username, photoURL } = {}) {
    if (!this.currentUser) {
      throw new Error('Sila log masuk terlebih dahulu.');
    }

    const updates = {};
    if (displayName !== undefined && displayName !== null) {
      updates.displayName = displayName.trim();
    }

    if (username !== undefined && username !== null) {
      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername !== this.currentUser.username) {
        const formatRegex = /^[a-z0-9_]{3,20}$/;
        if (!formatRegex.test(cleanUsername)) {
          throw new Error('Nama pengguna mestilah 3-20 aksara (huruf kecil, nombor, garis bawah sahaja).');
        }
        const isAvailable = await this.checkUsernameUnique(cleanUsername, this.currentUser.uid);
        if (!isAvailable) {
          throw new Error(`Nama pengguna "${cleanUsername}" telah digunakan. Sila pilih nama lain.`);
        }
        updates.username = cleanUsername;
      }
    }

    if (photoURL !== undefined && photoURL !== null) {
      updates.photoURL = photoURL.trim();
    }

    // 1. Update Firebase Auth Profile
    if (auth.currentUser) {
      const authUpdates = {};
      if (updates.displayName) authUpdates.displayName = updates.displayName;
      if (updates.photoURL) authUpdates.photoURL = updates.photoURL;
      if (Object.keys(authUpdates).length > 0) {
        try {
          await updateProfile(auth.currentUser, authUpdates);
        } catch (e) {
          console.warn('[AuthService] Error updating auth profile:', e);
        }
      }
    }

    // 2. Update Firestore Documents (customers, users, and admins if admin)
    if (Object.keys(updates).length > 0) {
      try {
        const updatesList = [
          updateDoc(doc(db, 'customers', this.currentUser.uid), updates).catch(() => null),
          updateDoc(doc(db, 'users', this.currentUser.uid), updates).catch(() => null)
        ];
        if (this.isAdmin()) {
          updatesList.push(updateDoc(doc(db, 'admins', this.currentUser.uid), updates).catch(() => null));
        }
        await Promise.all(updatesList);
      } catch (e) {
        console.warn('[AuthService] Error updating firestore doc:', e);
      }

      if (updates.username && this.currentUser.username) {
        this.knownUsernames.delete(this.currentUser.username);
        this.knownUsernames.set(updates.username, this.currentUser.uid);
      }

      this.currentUser = {
        ...this.currentUser,
        ...updates
      };
      this.notify();
    }

    return this.currentUser;
  }

  async updateUserProfile(params) {
    return this.updateProfileData(params);
  }

  async updateUsername(newUsername) {
    return this.updateProfileData({ username: newUsername });
  }

  async updateAvatar(photoURL) {
    return this.updateProfileData({ photoURL });
  }

  /**
   * Single sign-in path for both customers and admins. Role is resolved by
   * onAuthStateChanged from Firestore `admins/{uid}` once the popup completes.
   */
  async loginGoogle() {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      return res.user;
    } catch (err) {
      console.error('[Auth] Google sign in failed:', err);
      throw err;
    }
  }

  async logout() {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn(e);
    }
    this.currentUser = null;
    this.notify();
  }
}

export const authService = new AuthService();
