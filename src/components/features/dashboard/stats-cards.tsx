'use client';

import Link from 'next/link';

interface StatsCardsProps {
  stats: {
    subjects: number;
    exams: number;
    topics: number;
    upcomingExams: number;
    todaySessions: number;
  };
}

const STAT_CARDS = [
  {
    key: 'subjects' as const,
    label: 'Materias',
    icon: 'menu_book',
    bg: 'bg-secondary-container/30',
    iconColor: 'text-secondary',
    href: '/dashboard/subjects',
  },
  {
    key: 'topics' as const,
    label: 'Temas',
    icon: 'sticky_note_2',
    bg: 'bg-tertiary-container/30',
    iconColor: 'text-tertiary',
  },
  {
    key: 'todaySessions' as const,
    label: 'Sesiones Hoy',
    icon: 'check_circle',
    bg: 'bg-secondary-container/30',
    iconColor: 'text-secondary',
  },
  {
    key: 'exams' as const,
    label: 'Exámenes',
    icon: 'assignment',
    bg: 'bg-primary-container/40',
    iconColor: 'text-primary',
  },
  {
    key: 'upcomingExams' as const,
    label: 'Próximos',
    icon: 'alarm',
    bg: 'bg-error-container/30',
    iconColor: 'text-error',
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {STAT_CARDS.map((card) => {
        const content = (
          <>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.bg}`}>
              <span className={`material-symbols-outlined text-[24px] ${card.iconColor}`}>
                {card.icon}
              </span>
            </div>
            <p className="mt-4 font-headline text-3xl text-on-surface">{stats[card.key]}</p>
            <p className="mt-1 text-sm text-on-surface-variant">{card.label}</p>
          </>
        );

        if (card.href) {
          return (
            <Link
              key={card.key}
              href={card.href}
              data-testid="stat-card"
              className={`h-44 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-card transition-all hover:border-tertiary/20 hover:shadow-subtle`}
            >
              {content}
            </Link>
          );
        }

        return (
          <div
            key={card.key}
            data-testid="stat-card"
            className="h-44 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-card"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
