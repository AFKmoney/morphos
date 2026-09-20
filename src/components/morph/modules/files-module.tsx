"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, File, Folder, FileCode, FileText, FolderPlus, FilePlus, Trash2, Edit3, X, Check } from "lucide-react";
import { useVFS } from "@/lib/vfs-store";
import { useT } from "@/lib/use-t";

export function FilesModule() {
  const t = useT();
  const vfs = useVFS();
  const [currentPath, setCurrentPath] = useState("/");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["/", "/home"]));
  const [editing, setEditing] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [creating, setCreating] = useState<{ type: "file" | "folder"; parent: string } | null>(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    vfs.init();
  }, []);

  function toggle(path: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function getIcon(node: { type: string; name: string }) {
    if (node.type === "folder") return <Folder className="w-3 h-3 text-cyan-400" />;
    if (node.name.endsWith(".ts") || node.name.endsWith(".tsx") || node.name.endsWith(".js")) return <FileCode className="w-3 h-3 text-violet-400" />;
    if (node.name.endsWith(".md") || node.name.endsWith(".txt")) return <FileText className="w-3 h-3 text-amber-400" />;
    return <File className="w-3 h-3 text-white/60" />;
  }

  function selectFile(path: string) {
    setSelectedFile(path);
    setEditing(null);
  }

  function startEdit() {
    if (!selectedFile) return;
    setEditContent(vfs.readFile(selectedFile) || "");
    setEditing(selectedFile);
  }

  function saveEdit() {
    if (editing) {
      vfs.writeFile(editing, editContent);
      setEditing(null);
    }
  }

  function createNew(type: "file" | "folder") {
    if (!newName.trim() || !creating) return;
    const parent = creating.parent;
    const fullPath = parent === "/" ? `/${newName.trim()}` : `${parent}/${newName.trim()}`;
    if (type === "file") {
      vfs.createFile(fullPath, "");
    } else {
      vfs.createFolder(fullPath);
    }
    setExpanded(prev => new Set(prev).add(parent));
    setCreating(null);
    setNewName("");
  }

  function deleteFile(path: string) {
    vfs.deleteNode(path);
    if (selectedFile === path) setSelectedFile(null);
  }

  function renderTree(path: string, depth: number): React.ReactNode {
    const node = vfs.nodes[path];
    if (!node) return null;

    if (node.type === "folder") {
      const isOpen = expanded.has(path);
      const children = (node.children || [])
        .map(p => vfs.nodes[p])
        .filter(Boolean)
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

      return (
        <div key={path}>
          <div
            className="flex items-center gap-1 w-full text-left px-1 py-0.5 hover:bg-white/5 rounded text-[11px] text-white/80 cursor-pointer group"
            style={{ paddingLeft: depth * 12 + 4 }}
            onClick={() => { toggle(path); setCurrentPath(path); }}
          >
            {isOpen ? <ChevronDown className="w-2.5 h-2.5 text-white/40" /> : <ChevronRight className="w-2.5 h-2.5 text-white/40" />}
            {getIcon(node)}
            <span className="truncate flex-1">{node.name}</span>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
              <button title={t("common.newFile")} onClick={(e) => { e.stopPropagation(); setCreating({ type: "file", parent: path }); setNewName(""); }} className="text-white/40 hover:text-cyan-300">
                <FilePlus className="w-2.5 h-2.5" />
              </button>
              <button title={t("common.newFolder")} onClick={(e) => { e.stopPropagation(); setCreating({ type: "folder", parent: path }); setNewName(""); }} className="text-white/40 hover:text-cyan-300">
                <FolderPlus className="w-2.5 h-2.5" />
              </button>
              {path !== "/" && (
                <button title={t("common.delete")} onClick={(e) => { e.stopPropagation(); deleteFile(path); }} className="text-white/40 hover:text-rose-400">
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
          {creating && creating.parent === path && (
            <div className="flex items-center gap-1 px-1 py-0.5" style={{ paddingLeft: (depth + 1) * 12 + 4 }}>
              {creating.type === "file" ? <File className="w-3 h-3 text-white/40" /> : <Folder className="w-3 h-3 text-white/40" />}
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") createNew(creating.type); if (e.key === "Escape") setCreating(null); }}
                onBlur={() => { if (newName) createNew(creating.type); else setCreating(null); }}
                className="flex-1 bg-black/40 border border-cyan-400/30 rounded px-1 py-0.5 text-[11px] text-white outline-none"
                placeholder={creating.type === "file" ? "file.txt" : "folder"}
              />
            </div>
          )}
          {isOpen && children.map(child => renderTree(child.path, depth + 1))}
        </div>
      );
    }

    return (
      <div
        key={path}
        className={`flex items-center gap-1 w-full text-left px-1 py-0.5 rounded text-[11px] cursor-pointer group ${selectedFile === path ? "bg-cyan-500/20 text-cyan-200" : "text-white/70 hover:bg-white/5"}`}
        style={{ paddingLeft: depth * 12 + 16 }}
        onClick={() => selectFile(path)}
      >
        {getIcon(node)}
        <span className="truncate flex-1">{node.name}</span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
          <button title={t("common.edit")} onClick={(e) => { e.stopPropagation(); selectFile(path); startEdit(); }} className="text-white/40 hover:text-cyan-300">
            <Edit3 className="w-2.5 h-2.5" />
          </button>
          <button title={t("common.delete")} onClick={(e) => { e.stopPropagation(); deleteFile(path); }} className="text-white/40 hover:text-rose-400">
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    );
  }

  const selectedNode = selectedFile ? vfs.nodes[selectedFile] : null;
  const fileContent = selectedFile ? vfs.readFile(selectedFile) : null;

  return (
    <div className="flex h-full">
      <div className="w-1/2 border-r border-white/8 overflow-y-auto thin-scroll p-1.5">
        <div className="flex items-center justify-between px-2 py-1 mb-1">
          <span className="text-[10px] uppercase tracking-wider text-white/40">Explorer</span>
          <div className="flex gap-1">
            <button title={t("common.newFile")} onClick={() => { setCreating({ type: "file", parent: currentPath }); setNewName(""); }} className="text-white/40 hover:text-white">
              <FilePlus className="w-3 h-3" />
            </button>
            <button title={t("common.newFolder")} onClick={() => { setCreating({ type: "folder", parent: currentPath }); setNewName(""); }} className="text-white/40 hover:text-white">
              <FolderPlus className="w-3 h-3" />
            </button>
          </div>
        </div>
        {renderTree("/", 0)}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="px-3 py-1.5 border-b border-white/8 bg-black/30 flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/60 truncate">{selectedFile ?? "—"}</span>
          {selectedNode && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 uppercase">
              {selectedNode.name.split(".").pop() || "file"}
            </span>
          )}
          {fileContent != null && (
            <span className="text-[9px] font-mono text-white/35 whitespace-nowrap">
              {fileContent.length < 1024 ? `${fileContent.length} B` : `${(fileContent.length / 1024).toFixed(1)} KB`} · {fileContent.split("\n").length} lines
            </span>
          )}
          {selectedFile && !editing && (
            <button onClick={startEdit} className="ml-auto text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 flex items-center gap-1">
              <Edit3 className="w-2.5 h-2.5" /> Edit
            </button>
          )}
          {editing && (
            <div className="ml-auto flex gap-1">
              <button onClick={saveEdit} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> Save
              </button>
              <button onClick={() => setEditing(null)} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/60 hover:bg-white/10 flex items-center gap-1">
                <X className="w-2.5 h-2.5" /> Cancel
              </button>
            </div>
          )}
        </div>
        {editing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="flex-1 min-h-0 bg-black/40 text-[11px] font-mono text-white/90 outline-none resize-none p-3 thin-scroll"
            spellCheck={false}
          />
        ) : (
          <pre className="flex-1 min-h-0 overflow-auto thin-scroll p-3 text-[11px] font-mono text-white/80 whitespace-pre-wrap">
            {fileContent ?? <span className="text-white/40">Select a file to preview</span>}
          </pre>
        )}
      </div>
    </div>
  );
}
