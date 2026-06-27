"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [inputSchema, setInputSchema] = useState('{\n  "type": "object",\n  "properties": {}\n}');
  const [outputSchema, setOutputSchema] = useState('{\n  "type": "object",\n  "properties": {}\n}');

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
      // Parse JSON schemas
      let parsedInput: Record<string, unknown>;
      let parsedOutput: Record<string, unknown>;
      try {
        parsedInput = JSON.parse(inputSchema);
        parsedOutput = JSON.parse(outputSchema);
      } catch {
        throw new Error("输入/输出 Schema 不是有效的 JSON");
      }

      // Validate digital employee fields if enabled
      if (isDigitalEmployee) {
        if (!personaName || !avatarUrl || !personaIntro || !welcomeMessage || !roleDesc) {
          throw new Error("数字员工人设信息未填写完整");
        }
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
        inputSchema: parsedInput,
        outputSchema: parsedOutput,
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
      router.push(`/studio/${data.skill.id}`);
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
          <h2 className="mb-2 text-sm font-semibold text-gray-900">SKILL.md</h2>
          <p className="mb-2 text-xs text-gray-500">
            遵循 WorkBuddy SKILL.md 规范：YAML frontmatter + Markdown 正文
          </p>
          <textarea
            value={skillMd}
            onChange={(e) => setSkillMd(e.target.value)}
            required
            rows={10}
            className="w-full rounded-md border border-gray-300 p-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Schemas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">输入 Schema（JSON Schema）</h2>
            <textarea
              value={inputSchema}
              onChange={(e) => setInputSchema(e.target.value)}
              required
              rows={8}
              className="w-full rounded-md border border-gray-300 p-2 font-mono text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">输出 Schema（JSON Schema）</h2>
            <textarea
              value={outputSchema}
              onChange={(e) => setOutputSchema(e.target.value)}
              required
              rows={8}
              className="w-full rounded-md border border-gray-300 p-2 font-mono text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
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
                  <label className="mb-1 block text-xs font-medium text-gray-700">头像 URL *</label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    required={isDigitalEmployee}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="https://..."
                  />
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
