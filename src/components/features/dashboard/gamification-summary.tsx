'use client';

interface GamificationSummaryProps {
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  achievementsUnlocked: number;
}

export function GamificationSummary({
  currentStreak,
  longestStreak,
  totalPoints,
  achievementsUnlocked,
}: GamificationSummaryProps) {
  const items = [
    {
      label: 'Racha actual',
      value: currentStreak,
      sub: longestStreak > 0 ? `Récord: ${longestStreak} días` : undefined,
      icon: 'local_fire_department',
      accent: 'text-error',
      bg: 'bg-error-container/25',
    },
    {
      label: 'Puntos totales',
      value: totalPoints,
      sub: 'Por sesiones completadas',
      icon: 'stars',
      accent: 'text-tertiary',
      bg: 'bg-tertiary-container/25',
    },
    {
      label: 'Logros',
      value: achievementsUnlocked,
      sub: 'Desbloqueados',
      icon: 'emoji_events',
      accent: 'text-secondary',
      bg: 'bg-secondary-container/25',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-4 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-card"
          data-testid="gamification-stat"
        >
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.bg}`}
          >
            <span className={`material-symbols-outlined text-[22px] ${item.accent}`}>
              {item.icon}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-headline text-2xl text-on-surface">{item.value}</p>
            <p className="text-sm font-medium text-on-surface">{item.label}</p>
            {item.sub ? (
              <p className="truncate text-xs text-on-surface-variant">{item.sub}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
