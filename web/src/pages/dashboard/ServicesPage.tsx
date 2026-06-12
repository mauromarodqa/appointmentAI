import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ServiceForm from '../../components/services/ServiceForm';
import type { Service } from '../../types/database';

export default function ServicesPage() {
  const { profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [error, setError] = useState('');

  const loadServices = async () => {
    if (!profile) return;

    try {
      const { data, error: queryError } = await supabase
        .from('services')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setServices(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [profile]);

  const handleSaved = () => {
    setShowForm(false);
    setEditingService(null);
    loadServices();
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const { error: updateError } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (updateError) throw updateError;
      loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar servicio');
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (deleteError) throw deleteError;
      loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar servicio');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando servicios...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Servicios</h1>
          <p className="text-gray-600 mt-2">Gestiona los servicios que ofreces</p>
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            setShowForm(true);
          }}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
        >
          + Nuevo Servicio
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Modal para crear/editar */}
      {showForm && profile && (
        <div className="bg-white rounded-lg shadow p-8 max-w-md">
          <h2 className="text-xl font-bold mb-6 text-gray-900">
            {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
          </h2>
          <ServiceForm
            profileId={profile.id}
            service={editingService || undefined}
            onSaved={handleSaved}
            onCancel={() => {
              setShowForm(false);
              setEditingService(null);
            }}
          />
        </div>
      )}

      {/* Tabla de servicios */}
      {services.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">Aún no tienes servicios creados</p>
          <button
            onClick={() => {
              setEditingService(null);
              setShowForm(true);
            }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Crear tu primer servicio
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Duración
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-gray-500">{service.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {service.duration_minutes} min
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {service.price ? `$${service.price}` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(service)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        service.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {service.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => {
                        setEditingService(service);
                        setShowForm(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
