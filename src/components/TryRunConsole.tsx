"use client";

import { useState } from "react";
import type { FormField } from "@/lib/schema-utils";
import { schemaToFormFields, generateCurlExample } from "@/lib/schema-utils";

interface TryRunConsoleProps {
  slug: string;
  invokeUrl: string;
  inputSchema: Record<string, unknown>;
}

export default function TryRunConsole({ slug, invokeUrl, inputSchema }: TryRunConsoleProps) {
  const fields = schemaToFormFields(inputSchema);
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    // Initialize with defaults
    const defaults: Record<string, unknown> = {};
    for (const field of fields) {
      if (field.default !== undefined) {
        defaults[field.name] = field.default;
      } else if (field.type === "boolean") {
        defaults[field.name] = false;
      } else if (field.type === "number" || field.type === "integer") {
        defaults[field.name] = 0;
      } else {
        defaults[field.name] = "";
      }
    }
    return defaults;
  });
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCurl, setShowCurl] = useState(false);

  const curlExample = generateCurlExample(invokeUrl, inputSchema);

  function handleFieldChange(name: string, value: unknown) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleTryRun() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/v1/skills/${slug}/invoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // send session cookie for try-run
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? `请求失败 (${res.status})`);
      } else {
        setResult(JSON.stringify(data, null, 2));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">试运行控制台</h3>
        <button
          onClick={() => setShowCurl(!showCurl)}
          className="text-xs text-blue-600 hover:underline"
        >
          {showCurl ? "隐藏 cURL" : "查看 cURL"}
        </button>
      </div>

      {/* cURL Example */}
      {showCurl && (
        <div className="mb-4 rounded bg-gray-900 p-3">
          <pre className="overflow-x-auto text-xs text-green-400">{curlExample}</pre>
        </div>
      )}

      {/* Dynamic Form */}
      {fields.length === 0 ? (
        <p className="text-sm text-gray-500">此技能无输入参数</p>
      ) : (
        <div className="space-y-3">
          {fields.map((field) => (
            <FormFieldInput
              key={field.name}
              field={field}
              value={values[field.name]}
              onChange={(v) => handleFieldChange(field.name, v)}
            />
          ))}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleTryRun}
        disabled={loading}
        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "运行中..." : "试运行"}
      </button>

      {/* Result */}
      {result && (
        <div className="mt-4">
          <p className="mb-1 text-xs font-medium text-gray-500">输出结果：</p>
          <pre className="max-h-96 overflow-auto rounded bg-gray-900 p-3 text-sm text-green-400">
            {result}
          </pre>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}

function FormFieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const labelEl = (
    <label className="block text-xs font-medium text-gray-700">
      {field.label}
      {field.required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );

  const descEl = field.description && (
    <p className="mt-0.5 text-xs text-gray-400">{field.description}</p>
  );

  let inputEl: React.ReactNode;

  if (field.enum) {
    inputEl = (
      <select
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">请选择...</option>
        {field.enum.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  } else {
    switch (field.type) {
      case "boolean":
        inputEl = (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300"
          />
        );
        break;
      case "number":
      case "integer":
        inputEl = (
          <input
            type="number"
            value={Number(value ?? 0)}
            onChange={(e) => onChange(Number(e.target.value))}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        );
        break;
      case "object":
      case "array":
        inputEl = (
          <textarea
            value={typeof value === "string" ? value : JSON.stringify(value ?? null, null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                onChange(e.target.value);
              }
            }}
            rows={4}
            placeholder="输入 JSON..."
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm"
          />
        );
        break;
      default:
        inputEl = (
          <input
            type="text"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        );
    }
  }

  return (
    <div>
      {labelEl}
      {descEl}
      {inputEl}
    </div>
  );
}
