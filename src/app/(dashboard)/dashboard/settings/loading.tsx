export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-gray-200" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-6 space-y-3">
          <div className="h-6 w-40 rounded bg-gray-200" />
          <div className="h-4 w-72 rounded bg-gray-200" />
          <div className="h-10 w-32 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}
