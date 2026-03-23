export default function SessionsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="flex gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 w-28 rounded bg-gray-200" />
        ))}
      </div>
      <div className="h-96 rounded-lg bg-gray-200" />
    </div>
  );
}
