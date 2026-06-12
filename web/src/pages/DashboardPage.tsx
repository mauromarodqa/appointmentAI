import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Appointment, Service } from '../types/database';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;

    const loadData = async () => {
      setLoading(true);

      // Cargar servicios
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      // Cargar próximos turnos con datos de servicios
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*, services(name)')
        .eq('profile_id', profile.id);

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
      }

      // Filter in client-side to show only appointments in next 30 days
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const filtered = (appointmentsData || [])
        .filter(apt => apt.status === 'confirmed')
        .filter(apt => {
          const aptDate = new Date(apt.start_time);
          aptDate.setHours(0, 0, 0, 0);
          return aptDate >= now && aptDate <= thirtyDaysLater;
        });

      setServices(servicesData || []);
      setAppointments(filtered);
      setLoading(false);
    };

    loadData();
  }, [profile]);

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  const hasProfile = profile && profile.business_name;

  if (!hasProfile) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">
          Completa tu perfil primero
        </h3>
        <p className="text-yellow-700 mb-6">
          Necesitas configurar tu negocio y servicios para comenzar a recibir turnos.
        </p>
        <button
          onClick={() => navigate('/dashboard/configuracion')}
          className="px-6 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Ir a Configuración
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Bienvenido a TurnoYa, {profile.business_name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-semibold uppercase">Próximos Turnos</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">{appointments.length}</p>
          <p className="text-gray-500 text-sm mt-1">En los próximos 30 días</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-semibold uppercase">Servicios</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{services.length}</p>
          <p className="text-gray-500 text-sm mt-1">Activos</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-semibold uppercase">Tu Link</h3>
          <p className="text-lg font-bold text-purple-600 mt-2 break-all">
            turnoya.com/{profile.slug}
          </p>
          <button className="text-purple-600 hover:text-purple-700 text-sm mt-1">
            Copiar
          </button>
        </div>
      </div>

      {/* Próximos Turnos */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Próximos Turnos</h2>
        </div>
        <div className="overflow-x-auto">
          {appointments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No hay turnos confirmados en los próximos 30 días
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt: any) => {
                  const aptDate = new Date(apt.start_time);

                  // Formato manual para evitar bug en toLocaleString()
                  const day = String(aptDate.getDate()).padStart(2, '0');
                  const month = String(aptDate.getMonth() + 1).padStart(2, '0');
                  const year = aptDate.getFullYear();
                  const hours = String(aptDate.getHours()).padStart(2, '0');
                  const minutes = String(aptDate.getMinutes()).padStart(2, '0');
                  const seconds = String(aptDate.getSeconds()).padStart(2, '0');
                  const formattedDate = `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;

                  return (
                  <tr key={apt.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <p className="font-medium">{apt.customer_id?.substring(0, 8) || 'Cliente'}</p>
                      <p className="text-gray-500 text-xs">{apt.id.substring(0, 8)}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {apt.services?.name || 'Servicio'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formattedDate}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        Confirmado
                      </span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
