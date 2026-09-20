"use client";

// Quota-/privacy-proof localStorage wrapper for zustand persist.
// When the quota is exceeded (or storage is blocked), writes are dropped and
// the app keeps running on in-memory state instead of throwing into set().
export const safeLocalStorage: Storage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* quota exceeded or storage blocked: keep in-memory state */
    }
  },
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
  clear(): void {
    try {
      window.localStorage.clear();
    } catch {
      /* ignore */
    }
  },
  key(index: number): string | null {
    try {
      return window.localStorage.key(index);
    } catch {
      return null;
    }
  },
  get length(): number {
    try {
      return window.localStorage.length;
    } catch {
      return 0;
    }
  },
};
