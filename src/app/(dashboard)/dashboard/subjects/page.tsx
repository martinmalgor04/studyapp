'use client';

import { useEffect, useState } from 'react';
import { getSubjects } from '@/lib/actions/subjects';
import { SubjectList } from '@/components/features/subjects/subject-list';
import { SubjectDialog } from '@/components/features/subjects/subject-dialog';

interface SubjectRow {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  progress_percentage?: number;
  [key: string]: unknown;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<SubjectRow[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAprobadas, setShowAprobadas] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'fecha' | 'nombre' | 'progreso'>('fecha');

  const loadSubjects = async () => {
    setLoading(true);
    const data = await getSubjects(showAprobadas);
    setSubjects(data);
    setFilteredSubjects(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reload when showAprobadas changes
  }, [showAprobadas]);

  // Aplicar búsqueda y ordenamiento
  useEffect(() => {
    let filtered = [...subjects];

    // Búsqueda
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenamiento
    if (sortBy === 'nombre') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'progreso') {
      filtered.sort((a, b) => (b.progress_percentage || 0) - (a.progress_percentage || 0));
    } else {
      // Por fecha (default)
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredSubjects(filtered);
  }, [subjects, searchTerm, sortBy]);

  const handleEdit = async (id: string) => {
    const subject = subjects.find((s) => s.id === id);
    setEditingSubject(subject);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    loadSubjects(); // Recargar lista después de eliminar
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSubject(null);
    loadSubjects(); // Recargar lista
  };

  const handleNewSubject = () => {
    setEditingSubject(null);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Materias</h1>
          <p className="mt-1 text-sm text-gray-600">Gestiona las materias que estás cursando</p>
        </div>
        <button
          onClick={handleNewSubject}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Nueva Materia
        </button>
      </div>

      {/* Búsqueda y Filtros */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar materia..."
            className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {/* Filtros y Ordenamiento */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showAprobadas}
              onChange={(e) => setShowAprobadas(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Mostrar aprobadas</span>
          </label>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy((e.target as HTMLSelectElement).value as 'fecha' | 'nombre' | 'progreso')}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="fecha">Ordenar por Fecha</option>
            <option value="nombre">Ordenar por Nombre</option>
            <option value="progreso">Ordenar por Progreso</option>
          </select>
        </div>
      </div>

      {/* Contador de resultados */}
      {searchTerm && (
        <div className="mb-4 text-sm text-gray-600">
          Mostrando {filteredSubjects.length} de {subjects.length} materias
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500">Cargando...</div>
      ) : (
        <SubjectList subjects={filteredSubjects} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      <SubjectDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        subject={editingSubject}
      />
    </div>
  );
}
