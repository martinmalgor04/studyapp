'use client';

import { useEffect, useState } from 'react';
import { getSubjects } from '@/lib/actions/subjects';
import { SubjectList } from '@/components/features/subjects/subject-list';
import { SubjectDialog } from '@/components/features/subjects/subject-dialog';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAprobadas, setShowAprobadas] = useState(false);

  const loadSubjects = async () => {
    setLoading(true);
    const data = await getSubjects(showAprobadas);
    setSubjects(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSubjects();
  }, [showAprobadas]);

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

      {/* Filtro para mostrar/ocultar aprobadas */}
      <div className="mb-4 flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={showAprobadas}
            onChange={(e) => setShowAprobadas(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Mostrar materias aprobadas</span>
        </label>
        <span className="text-xs text-gray-500">
          ({subjects.length} {subjects.length === 1 ? 'materia' : 'materias'})
        </span>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Cargando...</div>
      ) : (
        <SubjectList subjects={subjects} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      <SubjectDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        subject={editingSubject}
      />
    </div>
  );
}
