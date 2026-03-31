import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-xl border border-outline-variant/10 p-6 space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
