'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSubjects } from '@/lib/actions/subjects';
import { SubjectList } from '@/components/features/subjects/subject-list';
import { SubjectDialog } from '@/components/features/subjects/subject-dialog';
import { MotivationalQuote } from '@/components/shared/motivational-quote';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SubjectRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  progress_percentage?: number;
}

interface SubjectsPageClientProps {
  initialSubjects: SubjectRow[];
}

export function SubjectsPageClient({ initialSubjects }: SubjectsPageClientProps) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectRow[]>(initialSubjects);
  const [filteredSubjects, setFilteredSubjects] = useState<SubjectRow[]>(initialSubjects);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAprobadas, setShowAprobadas] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'fecha' | 'nombre' | 'progreso'>('fecha');
  const isFirstRender = useRef(true);

  useEffect(() => {
    setSubjects(initialSubjects);
  }, [initialSubjects]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const fetchFiltered = async () => {
      setLoading(true);
      const data = await getSubjects(showAprobadas);
      setSubjects(data);
      setLoading(false);
    };
    fetchFiltered();
  }, [showAprobadas]);

  useEffect(() => {
    let filtered = [...subjects];

    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortBy === 'nombre') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'progreso') {
      filtered.sort((a, b) => (b.progress_percentage || 0) - (a.progress_percentage || 0));
    } else {
      filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    setFilteredSubjects(filtered);
  }, [subjects, searchTerm, sortBy]);

  const handleEdit = (id: string) => {
    const subject = subjects.find((s) => s.id === id);
    setEditingSubject(subject ?? null);
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    router.refresh();
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSubject(null);
    router.refresh();
  };

  const handleNewSubject = () => {
    setEditingSubject(null);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl text-on-surface">Materias</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Gestiona las materias que estás cursando</p>
        </div>
        <Button onClick={handleNewSubject}>
          + Nueva Materia
        </Button>
      </div>

      {/* Búsqueda y Filtros */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="material-symbols-rounded text-[20px] text-on-surface-variant/50">search</span>
          </div>
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar materia..."
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
            <input
              type="checkbox"
              checked={showAprobadas}
              onChange={(e) => setShowAprobadas(e.target.checked)}
              className="h-4 w-4 rounded border-outline-variant/30 text-secondary accent-secondary focus:ring-secondary/30"
            />
            <span>Mostrar aprobadas</span>
          </label>

          <select
            value={sortBy}
            onChange={(e) => setSortBy((e.target as HTMLSelectElement).value as 'fecha' | 'nombre' | 'progreso')}
            className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-tertiary focus:outline-none focus:ring-2 focus:ring-tertiary/30"
          >
            <option value="fecha">Ordenar por Fecha</option>
            <option value="nombre">Ordenar por Nombre</option>
            <option value="progreso">Ordenar por Progreso</option>
          </select>
        </div>
      </div>

      {searchTerm && (
        <div className="mb-4 text-sm text-on-surface-variant">
          Mostrando {filteredSubjects.length} de {subjects.length} materias
        </div>
      )}

      {loading ? (
        <div className="text-center text-on-surface-variant">Cargando...</div>
      ) : (
        <SubjectList subjects={filteredSubjects} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      <SubjectDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        subject={editingSubject ?? undefined}
      />

      <MotivationalQuote />
    </div>
  );
}
