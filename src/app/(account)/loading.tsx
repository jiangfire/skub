export default function AccountLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-20 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
          <div className="h-20 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
        </div>
        <div className="space-y-2">
          <div className="h-16 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
          <div className="h-16 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
