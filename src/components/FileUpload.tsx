"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import Image from "next/image";

interface FileUploadProps {
  onUpload: (url: string, name: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  description?: string;
  showPreview?: boolean;
}

export default function FileUpload({
  onUpload,
  accept = "image/*,.json,.yaml,.yml,.md",
  maxSize = 10,
  label = "上传文件",
  description,
  showPreview = true,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`文件大小不能超过 ${maxSize}MB`);
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");
    setPreviewUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "上传失败");
      }

      const data = await res.json();
      setSuccess(`上传成功: ${data.name}`);
      setPreviewUrl(showPreview ? data.url : null);
      onUpload(data.url, data.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
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

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-medium text-gray-700">{label}</label>}

      {description && <p className="text-xs text-gray-500">{description}</p>}

      {/* Drop zone */}
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
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-2">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
            <p className="text-sm text-gray-600">上传中...</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-gray-600">点击或拖拽文件到此处</p>
            <p className="text-xs text-gray-400">最大 {maxSize}MB</p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && <div className="rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</div>}

      {/* Success message */}
      {success && (
        <div className="space-y-2">
          <div className="rounded-md bg-green-50 p-2 text-sm text-green-600">{success}</div>
          {showPreview && previewUrl && (
            <div className="rounded-md border border-gray-200 p-2">
              <p className="mb-1 text-xs text-gray-500">预览:</p>
              <div className="relative mx-auto h-32 w-48 max-w-full">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="rounded-md object-contain"
                  unoptimized
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
