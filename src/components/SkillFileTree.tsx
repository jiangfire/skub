"use client";

import { useState } from "react";

interface FileNode {
  name: string;
  path?: string;
  children?: FileNode[];
  isDir: boolean;
  size?: number;
  mimeType?: string;
}

interface SkillFileTreeProps {
  files: FileNode[];
  skillSlug: string;
}

export default function SkillFileTree({ files, skillSlug }: SkillFileTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);

  function toggleDir(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  async function viewFile(path: string) {
    setLoadingFile(true);
    setViewingFile(path);
    try {
      const res = await fetch(`/api/skills/${skillSlug}/files/${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content);
      } else {
        setFileContent(null);
      }
    } catch {
      setFileContent(null);
    } finally {
      setLoadingFile(false);
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  function renderTree(nodes: FileNode[], depth = 0): React.ReactNode {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = node.path ? expanded.has(node.path) : false;

      return (
        <div key={node.name + (node.path ?? "")}>
          <div
            className={`flex items-center gap-1 rounded px-1 py-1 hover:bg-gray-50`}
            style={{ paddingLeft: `${depth * 16 + 4}px` }}
          >
            {node.isDir ? (
              <button
                onClick={() => node.path && toggleDir(node.path)}
                className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
              >
                <span
                  className={`inline-block w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                >
                  ▶
                </span>
                <span>📁</span>
                <span className="font-medium">{node.name}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-4" />
                <span>📄</span>
                <button
                  onClick={() => node.path && viewFile(node.path)}
                  className="text-left hover:text-blue-600 hover:underline"
                  title={node.path}
                >
                  {node.name}
                </button>
                {node.size !== undefined && (
                  <span className="text-xs text-gray-400">{formatSize(node.size)}</span>
                )}
              </div>
            )}
          </div>
          {node.isDir && hasChildren && isExpanded && (
            <div>{renderTree(node.children!, depth + 1)}</div>
          )}
        </div>
      );
    });
  }

  return (
    <div className="space-y-4">
      {/* File Tree */}
      {files.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
            📂 文件列表 ({files.length} 个文件)
          </div>
          <div className="p-3">{renderTree(files)}</div>
        </div>
      )}

      {/* File Content Viewer */}
      {viewingFile && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
            <span className="text-sm font-medium text-gray-700">{viewingFile}</span>
            <button
              onClick={() => {
                setViewingFile(null);
                setFileContent(null);
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ✕ 关闭
            </button>
          </div>
          <div className="p-4">
            {loadingFile ? (
              <p className="text-sm text-gray-400">加载中...</p>
            ) : fileContent ? (
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm text-gray-800">
                {fileContent}
              </pre>
            ) : (
              <p className="text-sm text-gray-400">无法显示此文件内容（可能是二进制文件）</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
