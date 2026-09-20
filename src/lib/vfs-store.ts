"use client";

import { create } from "zustand";

export interface VFSNode {
  path: string;
  name: string;
  type: "file" | "folder";
  content?: string;
  children?: string[];
  createdAt: number;
  updatedAt: number;
}

interface VFSStore {
  nodes: Record<string, VFSNode>;
  loaded: boolean;

  init: () => void;
  readFile: (path: string) => string | undefined;
  writeFile: (path: string, content: string) => void;
  createFile: (path: string, content?: string) => void;
  createFolder: (path: string) => void;
  deleteNode: (path: string) => void;
  listDir: (path: string) => VFSNode[];
  exists: (path: string) => boolean;
  rename: (oldPath: string, newName: string) => void;
}

const DB_NAME = "morphos-vfs";
const STORE_NAME = "files";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadFromDB(): Promise<Record<string, VFSNode>> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get("root");
      req.onsuccess = () => resolve(req.result || {});
      req.onerror = () => resolve({});
    });
  } catch {
    return {};
  }
}

async function saveToDB(nodes: Record<string, VFSNode>) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.onerror = () => { /* quota: keep in-memory nodes */ };
    const req = tx.objectStore(STORE_NAME).put(nodes, "root");
    req.onerror = () => { /* quota: keep in-memory nodes */ };
  } catch {}
}

const DEFAULT_VFS: Record<string, VFSNode> = {
  "/": { path: "/", name: "root", type: "folder", children: ["/home"], createdAt: Date.now(), updatedAt: Date.now() },
  "/home": { path: "/home", name: "home", type: "folder", children: ["/home/notes.md", "/home/welcome.txt", "/home/projects"], createdAt: Date.now(), updatedAt: Date.now() },
  "/home/notes.md": { path: "/home/notes.md", name: "notes.md", type: "file", content: "# My Notes\n\nWelcome to MorphOS VFS!\n\nThis is a persistent virtual file system.\nAll files are stored in IndexedDB and survive page reloads.\n\n## Todo\n- [ ] Explore the file system\n- [ ] Create new files\n- [ ] Edit existing ones\n", createdAt: Date.now(), updatedAt: Date.now() },
  "/home/welcome.txt": { path: "/home/welcome.txt", name: "welcome.txt", type: "file", content: "Welcome to MorphOS!\n\nThis virtual file system is real and persistent.\nYou can create, edit, and delete files.\nThey are stored in your browser's IndexedDB.\n", createdAt: Date.now(), updatedAt: Date.now() },
  "/home/projects": { path: "/home/projects", name: "projects", type: "folder", children: ["/home/projects/morphos.ts"], createdAt: Date.now(), updatedAt: Date.now() },
  "/home/projects/morphos.ts": { path: "/home/projects/morphos.ts", name: "morphos.ts", type: "file", content: "// MorphOS main entry\nexport function createMorphOS() {\n  return {\n    name: 'MorphOS',\n    version: '0.10',\n    selfWriting: true,\n  };\n}\n", createdAt: Date.now(), updatedAt: Date.now() },
};

export const useVFS = create<VFSStore>((set, get) => ({
  nodes: {},
  loaded: false,

  init: () => {
    if (get().loaded) return;
    loadFromDB().then(saved => {
      const nodes = Object.keys(saved).length > 0 ? saved : DEFAULT_VFS;
      set({ nodes, loaded: true });
      if (Object.keys(saved).length === 0) {
        saveToDB(DEFAULT_VFS);
      }
    });
  },

  readFile: (path) => get().nodes[path]?.content,

  writeFile: (path, content) => {
    set((s) => {
      const nodes = { ...s.nodes };
      if (nodes[path]) {
        nodes[path] = { ...nodes[path], content, updatedAt: Date.now() };
      }
      saveToDB(nodes);
      return { nodes };
    });
  },

  createFile: (path, content = "") => {
    set((s) => {
      const nodes = { ...s.nodes };
      const name = path.split("/").pop() || "untitled";
      const parent = path.substring(0, path.lastIndexOf("/")) || "/";
      nodes[path] = { path, name, type: "file", content, createdAt: Date.now(), updatedAt: Date.now() };
      if (nodes[parent]) {
        nodes[parent] = { ...nodes[parent], children: [...(nodes[parent].children || []), path] };
      }
      saveToDB(nodes);
      return { nodes };
    });
  },

  createFolder: (path) => {
    set((s) => {
      const nodes = { ...s.nodes };
      const name = path.split("/").pop() || "folder";
      const parent = path.substring(0, path.lastIndexOf("/")) || "/";
      nodes[path] = { path, name, type: "folder", children: [], createdAt: Date.now(), updatedAt: Date.now() };
      if (nodes[parent]) {
        nodes[parent] = { ...nodes[parent], children: [...(nodes[parent].children || []), path] };
      }
      saveToDB(nodes);
      return { nodes };
    });
  },

  deleteNode: (path) => {
    set((s) => {
      const nodes = { ...s.nodes };
      const node = nodes[path];
      if (!node) return {};
      // Recursively delete children
      if (node.children) {
        for (const child of node.children) {
          delete nodes[child];
        }
      }
      delete nodes[path];
      // Remove from parent
      const parent = path.substring(0, path.lastIndexOf("/")) || "/";
      if (nodes[parent]) {
        nodes[parent] = {
          ...nodes[parent],
          children: (nodes[parent].children || []).filter(c => c !== path),
        };
      }
      saveToDB(nodes);
      return { nodes };
    });
  },

  listDir: (path) => {
    const node = get().nodes[path];
    if (!node || node.type !== "folder") return [];
    return (node.children || [])
      .map(p => get().nodes[p])
      .filter(Boolean)
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  },

  exists: (path) => !!get().nodes[path],

  rename: (oldPath, newName) => {
    set((s) => {
      const nodes = { ...s.nodes };
      const node = nodes[oldPath];
      if (!node) return {};
      const newPath = oldPath.substring(0, oldPath.lastIndexOf("/") + 1) + newName;
      nodes[newPath] = { ...node, path: newPath, name: newName, updatedAt: Date.now() };
      delete nodes[oldPath];
      // Update parent
      const parent = oldPath.substring(0, oldPath.lastIndexOf("/")) || "/";
      if (nodes[parent]) {
        nodes[parent] = {
          ...nodes[parent],
          children: (nodes[parent].children || []).map(c => c === oldPath ? newPath : c),
        };
      }
      saveToDB(nodes);
      return { nodes };
    });
  },
}));
