import { rtdb, auth } from '../firebase.js';
import {
  ref,
  onValue,
  set,
  remove,
  onDisconnect,
  serverTimestamp
} from 'firebase/database';

let sessionId = null;
let currentUser = null;
let currentKey = null;
let isConnected = false;
let currentActiveUsersCount = 1;
let presenceDisconnectHook = null;
let isInitialized = false;

/**
 * Returns or creates a stable session ID for this browser tab
 */
function getSessionId() {
  if (sessionId) return sessionId;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = window.sessionStorage.getItem('scentcast_presence_session_id');
      if (stored) {
        sessionId = stored;
        return sessionId;
      }
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
      window.sessionStorage.setItem('scentcast_presence_session_id', sessionId);
      return sessionId;
    } catch (_) {}
  }
  sessionId = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
  return sessionId;
}

/**
 * Synchronizes client connection entry to RTDB presence node:
 * presence/activeUsers/{uid || sessionId}
 */
async function syncPresenceNode() {
  if (!currentKey) {
    currentKey = (currentUser && currentUser.uid) ? currentUser.uid : getSessionId();
  }

  try {
    const userRef = ref(rtdb, `presence/activeUsers/${currentKey}`);

    // Setup onDisconnect cleanup: upon disconnect, the entry is automatically removed from RTDB
    try {
      const disconnectRef = onDisconnect(userRef);
      disconnectRef.remove().catch((e) => {
        // Defensive log for headless / testing environments
        console.warn('[Presence] onDisconnect hook notice:', e);
      });
      presenceDisconnectHook = disconnectRef;
    } catch (err) {
      console.warn('[Presence] onDisconnect setup notice:', err);
    }

    const payload = {
      uid: (currentUser && currentUser.uid) || currentKey,
      email: (currentUser && currentUser.email) || 'guest@scentcast.my',
      role: (currentUser && currentUser.role) || 'guest',
      online: true,
      lastSeen: typeof serverTimestamp === 'function' ? serverTimestamp() : Date.now()
    };

    await set(userRef, payload);
  } catch (err) {
    console.warn('[Presence] syncPresenceNode notice:', err);
  }
}

/**
 * Initializes and updates presence tracking for the given user (or guest)
 * Listens to .info/connected and sets up onDisconnect cleanup.
 *
 * @param {Object|null} user - Current user object from authService or Firebase Auth
 */
export function initPresence(user = null) {
  if (user) {
    currentUser = user;
  } else if (auth && auth.currentUser) {
    currentUser = {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      role: auth.currentUser.role || 'member'
    };
  } else {
    currentUser = null;
  }

  const previousKey = currentKey;
  const newKey = (currentUser && currentUser.uid) ? currentUser.uid : getSessionId();
  currentKey = newKey;

  // If the presence key changed (e.g. guest signed in or user signed out), remove the old key
  if (previousKey && previousKey !== newKey) {
    try {
      const oldRef = ref(rtdb, `presence/activeUsers/${previousKey}`);
      remove(oldRef).catch(() => {});
    } catch (_) {}
  }

  // Setup connection listener once
  if (!isInitialized) {
    isInitialized = true;
    try {
      const connectedRef = ref(rtdb, '.info/connected');
      onValue(connectedRef, async (snap) => {
        isConnected = snap.val() === true;
        if (isConnected) {
          await syncPresenceNode();
        }
      }, (err) => {
        console.warn('[Presence] .info/connected listener notice:', err);
      });
    } catch (err) {
      console.warn('[Presence] Connection listener initialization fallback:', err);
    }
  } else if (isConnected) {
    syncPresenceNode().catch(() => {});
  }
}

/**
 * Subscribes to realtime active users count from presence/activeUsers
 *
 * @param {Function} callback - Invoked with active count number: (count: number) => void
 * @returns {Function} Unsubscribe function
 */
export function subscribeActiveUsersCount(callback) {
  if (typeof callback !== 'function') return () => {};

  // Immediate invocation with current known count
  try {
    callback(currentActiveUsersCount);
  } catch (e) {
    console.error(e);
  }

  try {
    const activeUsersRef = ref(rtdb, 'presence/activeUsers');
    const unsub = onValue(activeUsersRef, (snapshot) => {
      let count = 0;
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val && typeof val === 'object') {
          count = Object.keys(val).length;
        }
      }
      // Guarantee at least 1 if currently connected
      currentActiveUsersCount = count > 0 ? count : (isConnected ? 1 : currentActiveUsersCount);
      try {
        callback(currentActiveUsersCount);
      } catch (e) {
        console.error(e);
      }
    }, (err) => {
      console.warn('[Presence] activeUsers listener notice:', err);
    });

    return () => {
      try {
        if (typeof unsub === 'function') unsub();
      } catch (_) {}
    };
  } catch (err) {
    console.warn('[Presence] subscribeActiveUsersCount fallback:', err);
    return () => {};
  }
}

/**
 * Retrieves the current active users count
 * @returns {number}
 */
export function getActiveUsersCount() {
  return currentActiveUsersCount;
}

/**
 * Subscribes to live weather sensor telemetry from RTDB node sensors/currentWeather
 *
 * @param {Function} callback - Invoked with telemetry payload
 * @returns {Function} Unsubscribe function
 */
export function subscribeSensorTelemetry(callback) {
  if (typeof callback !== 'function') return () => {};

  try {
    const sensorRef = ref(rtdb, 'sensors/currentWeather');
    const unsub = onValue(sensorRef, (snap) => {
      if (snap.exists()) {
        const val = snap.val();
        try { callback(val); } catch (e) { console.error(e); }
      }
    }, (err) => {
      console.warn('[Presence] Sensor telemetry listener notice:', err);
    });
    return () => {
      try {
        if (typeof unsub === 'function') unsub();
      } catch (_) {}
    };
  } catch (err) {
    console.warn('[Presence] subscribeSensorTelemetry fallback:', err);
    return () => {};
  }
}

export const presenceService = {
  initPresence,
  subscribeActiveUsersCount,
  getActiveUsersCount,
  subscribeSensorTelemetry
};

export default presenceService;
