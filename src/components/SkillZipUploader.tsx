"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import JSZip from "jszip";

interface SkillZipUploaderProps {
  onExtract: (skillMd: string, file: File) => void;
  onClear?: () => void;
}

const MAX_ZIP_SIZE = 50; // MB

export default function SkillZipUploader({ onExtract, onClear }: SkillZipUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    setError("");
    setUploading(true);
    setFileName("");

    try {
      if (file.size > MAX_ZIP_SIZE * 1024 * 1024) {
        throw new Error(`文件大小不能超过 ${MAX_ZIP_SIZE}MB`);
      }

      if (!file.name.toLowerCase().endsWith(".zip")) {
        throw new Error("请上传 .zip 格式的文件");
      }

      const zip = await JSZip.loadAsync(file);

      // 查找 SKILL.md（不区分大小写，支持根目录或子目录）
      const skillMdEntry =
        Object.values(zip.files).find(
          (entry) => !entry.dir && entry.name.toLowerCase() === "skill.md",
        ) ||
        Object.values(zip.files).find(
          (entry) => !entry.dir && entry.name.toLowerCase().endsWith("/skill.md"),
        );

      if (!skillMdEntry) {
        throw new Error("ZIP 包中缺少 SKILL.md，请确保文件存在");
      }

      const skillMd = await skillMdEntry.async("string");
      if (!skillMd.trim()) {
        throw new Error("SKILL.md 内容为空");
      }

      setFileName(file.name);
      onExtract(skillMd, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ZIP 解析失败");
      onClear?.();
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      void processFile(file);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleClear() {
    setFileName("");
    setError("");
    onClear?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragOver
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          className="hidden"
        />
        {uploading ? (
          <div className="space-y-2">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
            <p className="text-sm text-gray-600">正在解析 ZIP...</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-gray-600">点击或拖拽 Skill ZIP 包到此处</p>
            <p className="text-xs text-gray-400">最大 {MAX_ZIP_SIZE}MB，需包含 SKILL.md</p>
          </div>
        )}
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {fileName && (
        <div className="flex items-center justify-between rounded-md bg-green-50 p-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📦</span>
            <span className="text-sm font-medium text-green-800">{fileName}</span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-red-600 hover:text-red-800"
          >
            移除
          </button>
        </div>
      )}
    </div>
  );
}
