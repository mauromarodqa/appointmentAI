import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ScheduleForm from '../../components/schedule/ScheduleForm';
import type { WorkingHours } from '../../types/database';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function SchedulePage() {
  const { profile } = useAuth();
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingDay, setEditingDay] = useState<number | null>(null);

  const loadSchedule = async () => {
    if (!profile) return;

    try {
      const { data, error: queryError } = await supabase
        .from('working_hours')
        .select('*')
        .eq('profile_id', profile.id)
        .order('day_of_week', { ascending: true });

      if (queryError) throw queryError;
      setWorkingHours(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar horarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [profile]);

  const getHoursForDay = (dayOfWeek: number) => {
    return workingHours.find((h) => h.day_of_week === dayOfWeek);
  };

  const handleSaved = () => {
    setEditingDay(null);
    loadSchedule();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este horario?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('working_hours')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      loadSchedule();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar horario');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando horarios...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Horarios</h1>
        <p className="text-gray-600 mt-2">Configura tu disponibilidad semanal</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Formulario para editar */}
      {editingDay !== null && profile && (
        <div className="bg-white rounded-lg shadow p-8 max-w-md">
          <h2 className="text-xl font-bold mb-6 text-gray-900">
            {DAYS[editingDay]}
          </h2>
          <ScheduleForm
            profileId={profile.id}
            dayOfWeek={editingDay}
            existingHours={getHoursForDay(editingDay)}
            onSaved={handleSaved}
            onCancel={() => setEditingDay(null)}
          />
        </div>
      )}

      {/* Grid de días */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DAYS.map((day, index) => {
          const hours = getHoursForDay(index);

          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{day}</h3>
                {hours && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      hours.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {hours.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                )}
              </div>

              {hours ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Horario laboral</p>
                    <p className="font-medium text-gray-900">
                      {hours.start_time} - {hours.end_time}
                    </p>
                  </div>

                  {hours.break_start && hours.break_end && (
                    <div>
                      <p className="text-sm text-gray-600">Break</p>
                      <p className="font-medium text-gray-900">
                        {hours.break_start} - {hours.break_end}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => setEditingDay(index)}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => hours && handleDelete(hours.id)}
                      className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">No configurado</p>
                  <button
                    onClick={() => setEditingDay(index)}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
                  >
                    Configurar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumen */}
      {workingHours.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Resumen de Horarios</h3>
          <p className="text-sm text-blue-700">
            {workingHours.filter((h) => h.is_active).length} días de trabajo configurados
          </p>
        </div>
      )}
    </div>
  );
}
