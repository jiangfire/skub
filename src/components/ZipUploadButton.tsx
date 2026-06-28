"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ZipUploadButtonProps {
  skillId: string;
}

export default function ZipUploadButton({ skillId }: ZipUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/studio/skills/${skillId}/upload-zip`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message ?? "上传失败");
      }

      const data = await res.json();
      alert(`ZIP 处理完成，共 ${data.fileCount} 个文件`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <label className="inline-block cursor-pointer rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
        {uploading ? "上传中..." : "📦 上传 Skill ZIP"}
        <input
          type="file"
          accept=".zip"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
