"use client";

import { useState } from "react";
import { generateOpenApiSnippet, generateCurlExample } from "@/lib/schema-utils";

interface ApiDocPanelProps {
  slug: string;
  name: string;
  summary: string;
  invokeUrl: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

type Tab = "curl" | "openapi" | "input" | "output";

export default function ApiDocPanel({
  slug,
  name,
  summary,
  invokeUrl,
  inputSchema,
  outputSchema,
}: ApiDocPanelProps) {
  const [tab, setTab] = useState<Tab>("curl");
  const [copied, setCopied] = useState(false);

  const curlExample = generateCurlExample(invokeUrl, inputSchema);
  const openApiSnippet = generateOpenApiSnippet({
    slug,
    name,
    summary,
    invokeUrl,
    inputSchema,
    outputSchema,
  });

  const content: Record<Tab, string> = {
    curl: curlExample,
    openapi: JSON.stringify(openApiSnippet, null, 2),
    input: JSON.stringify(inputSchema, null, 2),
    output: JSON.stringify(outputSchema, null, 2),
  };

  const tabLabels: Record<Tab, string> = {
    curl: "cURL",
    openapi: "OpenAPI 3.0",
    input: "Input Schema",
    output: "Output Schema",
  };

  async function copyToClipboard() {
    await navigator.clipboard.writeText(content[tab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">API 文档</h3>
        <button onClick={copyToClipboard} className="text-xs text-blue-600 hover:underline">
          {copied ? "已复制!" : "复制"}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-3 flex gap-1 border-b border-gray-200">
        {(Object.keys(tabLabels) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-1.5 text-sm transition ${
              tab === t
                ? "border-blue-600 font-medium text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {/* Content */}
      <pre className="max-h-96 overflow-auto rounded bg-gray-900 p-4 text-sm text-green-400">
        {content[tab]}
      </pre>
    </div>
  );
}
