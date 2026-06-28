"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";
import SkillZipUploader from "@/components/SkillZipUploader";

export default function CreateSkillPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state — basic
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [skillMd, setSkillMd] = useState("---\nname: \ndescription: \n---\n\n# \n\n");

  // SKILL.md 输入方式：manual 手动编辑 / zip 上传 ZIP 包
  const [inputMode, setInputMode] = useState<"manual" | "zip">("manual");
  const [zipFile, setZipFile] = useState<File | null>(null);

  // Digital employee toggle + persona fields
  const [isDigitalEmployee, setIsDigitalEmployee] = useState(false);
  const [personaName, setPersonaName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [personaIntro, setPersonaIntro] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [roleDesc, setRoleDesc] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ZIP 模式下必须已上传 ZIP 并成功解析出 SKILL.md
      if (inputMode === "zip" && !zipFile) {
        throw new Error("请先上传包含 SKILL.md 的 ZIP 包");
      }
      if (inputMode === "zip" && !skillMd.trim()) {
        throw new Error("ZIP 包中 SKILL.md 内容为空");
      }

      const body: Record<string, unknown> = {
        slug,
        name,
        summary,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        endpointUrl: endpointUrl || null,
        skillMd,
      };

      if (isDigitalEmployee) {
        body.digitalEmployee = {
          personaName,
          avatarUrl,
          personaIntro,
          welcomeMessage,
          roleDesc,
        };
      }

      const res = await fetch("/api/studio/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "创建失败");
      }

      const data = await res.json();
      const skillId = data.skill.id;

      // 如果选择了 ZIP 上传，创建成功后继续上传 ZIP 包
      if (inputMode === "zip" && zipFile) {
        const formData = new FormData();
        formData.append("file", zipFile);

        const uploadRes = await fetch(`/api/studio/skills/${skillId}/upload-zip`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json().catch(() => null);
          // 技能已创建，但 ZIP 上传失败，提示用户并跳转
          throw new Error(
            uploadData?.message ?? "技能已创建，但 ZIP 上传失败，请前往 Studio 手动上传",
          );
        }
      }

      router.push(`/studio/${skillId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">发布新技能</h1>

      {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">基础信息</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Slug（URL 标识，小写 kebab-case）
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="contract-extractor"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="合同条款抽取"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">摘要</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="一句话描述技能的用途"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                标签（逗号分隔）
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="legal, nlp"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Endpoint URL（可选）
              </label>
              <input
                type="url"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="http://skill-service:8080/invoke"
              />
            </div>
          </div>
        </div>

        {/* SKILL.md */}
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">SKILL.md</h2>
            <div className="flex rounded-md bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setInputMode("manual")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  inputMode === "manual"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                手动编辑
              </button>
              <button
                type="button"
                onClick={() => setInputMode("zip")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  inputMode === "zip"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                上传 ZIP 包
              </button>
            </div>
          </div>

          {inputMode === "manual" ? (
            <>
              <p className="mb-2 text-xs text-gray-500">
                遵循 WorkBuddy SKILL.md 规范：YAML frontmatter + Markdown 正文
              </p>
              <textarea
                value={skillMd}
                onChange={(e) => setSkillMd(e.target.value)}
                required={inputMode === "manual"}
                rows={10}
                className="w-full rounded-md border border-gray-300 p-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                上传包含 SKILL.md 的 ZIP 包，系统将自动解析并作为技能内容
              </p>
              <SkillZipUploader
                onExtract={(extracted, file) => {
                  setSkillMd(extracted);
                  setZipFile(file);
                }}
                onClear={() => {
                  setZipFile(null);
                  setSkillMd("---\nname: \ndescription: \n---\n\n# \n\n");
                }}
              />
              {skillMd.trim() && zipFile && (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <p className="mb-2 text-xs font-medium text-gray-700">
                    已解析 SKILL.md 预览（只读）
                  </p>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-gray-200 bg-white p-3 text-xs text-gray-700">
                    {skillMd}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Digital Employee Toggle */}
        <div className="rounded-lg border border-gray-200 p-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isDigitalEmployee}
              onChange={(e) => setIsDigitalEmployee(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm font-semibold text-gray-900">绑定为数字员工</span>
            <span className="text-xs text-gray-400">
              （在 Skill 基础上叠加人设层：名字、头像、欢迎语等）
            </span>
          </label>

          {/* Digital Employee Persona Fields */}
          {isDigitalEmployee && (
            <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">人设名称 *</label>
                  <input
                    type="text"
                    value={personaName}
                    onChange={(e) => setPersonaName(e.target.value)}
                    required={isDigitalEmployee}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="小李法务助手"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">头像 *</label>
                  {avatarUrl ? (
                    <div className="space-y-2">
                      <Image
                        src={avatarUrl}
                        alt="Avatar preview"
                        width={64}
                        height={64}
                        className="rounded-full object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => setAvatarUrl("")}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        删除头像
                      </button>
                    </div>
                  ) : (
                    <FileUpload
                      onUpload={(url) => setAvatarUrl(url)}
                      accept="image/*"
                      label=""
                      description="上传头像图片（JPG/PNG/GIF/WEBP）"
                      showPreview={false}
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">角色定位 *</label>
                <input
                  type="text"
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  required={isDigitalEmployee}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="企业法务顾问，擅长合同审查与条款抽取"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">欢迎语 *</label>
                <input
                  type="text"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  required={isDigitalEmployee}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="你好，我是小李，有什么法务问题可以帮你？"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">人设简介 *</label>
                <textarea
                  value={personaIntro}
                  onChange={(e) => setPersonaIntro(e.target.value)}
                  required={isDigitalEmployee}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="拥有 10 年企业法务经验，精通合同法、公司法..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "创建中..." : "创建草稿"}
          </button>
        </div>
      </form>
    </div>
  );
}
