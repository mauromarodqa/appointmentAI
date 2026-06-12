import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { WorkingHours } from '../../types/database';

interface ScheduleFormProps {
  profileId: string;
  dayOfWeek: number;
  existingHours?: WorkingHours;
  onSaved: () => void;
  onCancel: () => void;
}

export default function ScheduleForm({
  profileId,
  dayOfWeek,
  existingHours,
  onSaved,
  onCancel,
}: ScheduleFormProps) {
  const [formData, setFormData] = useState({
    start_time: existingHours?.start_time || '09:00',
    end_time: existingHours?.end_time || '18:00',
    break_start: existingHours?.break_start || '',
    break_end: existingHours?.break_end || '',
    is_active: existingHours?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.start_time >= formData.end_time) {
      setError('La hora de inicio debe ser menor que la hora de fin');
      setLoading(false);
      return;
    }

    if (formData.break_start && formData.break_end) {
      if (formData.break_start >= formData.break_end) {
        setError('La hora de inicio del break debe ser menor que la hora de fin');
        setLoading(false);
        return;
      }
      if (formData.break_start < formData.start_time || formData.break_end > formData.end_time) {
        setError('El break debe estar dentro del horario laboral');
        setLoading(false);
        return;
      }
    }

    try {
      if (existingHours) {
        const { error: updateError } = await supabase
          .from('working_hours')
          .update({
            start_time: formData.start_time,
            end_time: formData.end_time,
            break_start: formData.break_start || null,
            break_end: formData.break_end || null,
            is_active: formData.is_active,
          })
          .eq('id', existingHours.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('working_hours')
          .insert({
            profile_id: profileId,
            day_of_week: dayOfWeek,
            start_time: formData.start_time,
            end_time: formData.end_time,
            break_start: formData.break_start || null,
            break_end: formData.break_end || null,
            is_active: formData.is_active,
          });

        if (insertError) throw insertError;
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar horario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hora de Inicio *
          </label>
          <input
            type="time"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hora de Fin *
          </label>
          <input
            type="time"
            name="end_time"
            value={formData.end_time}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
          <input type="checkbox" className="rounded" disabled />
          Break (Descanso)
        </label>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Inicio del Break (opcional)
            </label>
            <input
              type="time"
              name="break_start"
              value={formData.break_start}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Fin del Break (opcional)
            </label>
            <input
              type="time"
              name="break_end"
              value={formData.break_end}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          className="rounded"
        />
        <label className="text-sm font-medium text-gray-700">
          Activo (este día laboral)
        </label>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-medium"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
