"use client";

export default function AccountError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h2 className="text-lg font-semibold text-gray-900">页面加载失败</h2>
      <p className="mt-2 text-sm text-gray-500">数据加载时出现问题，请稍后重试。</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        重试
      </button>
    </div>
  );
}
