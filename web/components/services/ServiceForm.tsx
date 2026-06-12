import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Service } from '../../types/database';

interface ServiceFormProps {
  profileId: string;
  service?: Service;
  onSaved: () => void;
  onCancel: () => void;
}

export default function ServiceForm({ profileId, service, onSaved, onCancel }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    duration_minutes: service?.duration_minutes || 30,
    price: service?.price || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'duration_minutes') {
      setFormData({ ...formData, [name]: parseInt(value) || 0 });
    } else if (name === 'price') {
      setFormData({ ...formData, [name]: value === '' ? '' : parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name.trim()) {
      setError('El nombre del servicio es requerido');
      setLoading(false);
      return;
    }

    if (formData.duration_minutes <= 0) {
      setError('La duración debe ser mayor a 0');
      setLoading(false);
      return;
    }

    try {
      if (service) {
        // Actualizar
        const { error: updateError } = await supabase
          .from('services')
          .update({
            name: formData.name,
            description: formData.description,
            duration_minutes: formData.duration_minutes,
            price: formData.price || null,
          })
          .eq('id', service.id);

        if (updateError) throw updateError;
      } else {
        // Crear
        const { error: insertError } = await supabase
          .from('services')
          .insert({
            profile_id: profileId,
            name: formData.name,
            description: formData.description,
            duration_minutes: formData.duration_minutes,
            price: formData.price || null,
            color: '#3b82f6',
          });

        if (insertError) throw insertError;
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar servicio');
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej: Corte de cabello"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe brevemente el servicio"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duración (minutos) *
          </label>
          <input
            type="number"
            name="duration_minutes"
            value={formData.duration_minutes}
            onChange={handleChange}
            min="15"
            step="15"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="Ej: 1500"
            step="0.01"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
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
