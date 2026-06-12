import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getAvailableSlots, checkSlotAvailable } from '../lib/availability';
import DatePicker from '../components/calendar/DatePicker';
import TimeSlots from '../components/calendar/TimeSlots';
import CustomerForm from '../components/booking/CustomerForm';
import type { Profile, Service } from '../types/database';

type BookingStep = 'service' | 'datetime' | 'customer' | 'confirmation';

interface AvailableSlot {
  start: Date;
  end: Date;
}

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<BookingStep>('service');
  const [confirmationNumber, setConfirmationNumber] = useState('');

  // Load profile and services
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (profileError) {
          setError('Negocio no encontrado');
          setLoading(false);
          return;
        }

        setProfile(profileData);

        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('profile_id', profileData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        setServices(servicesData || []);
        if (servicesData && servicesData.length > 0) {
          setSelectedService(servicesData[0]);
        }
      } catch (err) {
        setError('Error al cargar el perfil');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadProfile();
    }
  }, [slug]);

  // Load available slots when date or service changes
  useEffect(() => {
    if (!selectedDate || !selectedService || !profile) return;

    const loadSlots = async () => {
      setSlotsLoading(true);
      setError('');
      try {
        const slots = await getAvailableSlots(profile.id, selectedService.id, selectedDate);
        setAvailableSlots(slots);
        if (slots.length === 0) {
          setError('No hay horarios disponibles para esta fecha');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar horarios');
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    loadSlots();
  }, [selectedDate, selectedService, profile]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedDate(null);
    setSelectedSlot(null);
    setStep('datetime');
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setAvailableSlots([]);
  };

  const handleSlotSelect = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
  };

  const handleBooking = async (customerData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  }) => {
    if (!profile || !selectedService || !selectedSlot) {
      setError('Faltan datos para completar la reserva');
      return;
    }

    setBookingLoading(true);
    setError('');

    try {
      // Generate customer ID upfront
      const customerId = crypto.randomUUID();

      // Create customer (always new, no duplicate check due to RLS)
      const { error: customerError } = await supabase
        .from('customers')
        .insert({
          id: customerId,
          ...customerData,
        });

      if (customerError) throw customerError;

      // Check slot is still available
      const isAvailable = await checkSlotAvailable(profile.id, selectedSlot.start, selectedSlot.end);
      if (!isAvailable) {
        setError('Este horario ya fue reservado. Por favor selecciona otro.');
        setSelectedSlot(null);
        return;
      }

      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          profile_id: profile.id,
          service_id: selectedService.id,
          customer_id: customerId,
          start_time: selectedSlot.start.toISOString(),
          end_time: selectedSlot.end.toISOString(),
          status: 'confirmed',
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      setConfirmationNumber(appointment.id);
      setStep('confirmation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la reserva');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando...
      </div>
    );
  }

  if (error && step === 'service' || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Negocio no encontrado'}
          </h1>
          <p className="text-gray-600">
            Verifica que el enlace sea correcto e intenta nuevamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-center">
          {profile.logo_url && (
            <img
              src={profile.logo_url}
              alt={profile.business_name}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            />
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {profile.business_name}
          </h1>
          {profile.description && (
            <p className="text-gray-600">{profile.description}</p>
          )}
          {profile.address && (
            <p className="text-sm text-gray-500 mt-2">📍 {profile.address}</p>
          )}
          {profile.phone && (
            <p className="text-sm text-gray-500">📞 {profile.phone}</p>
          )}
        </div>

        {/* Service Selection */}
        {step === 'service' && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Selecciona un servicio
            </h2>

            {services.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No hay servicios disponibles en este momento.
              </p>
            ) : (
              <div className="space-y-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className={`w-full p-4 rounded-lg border-2 transition text-left ${
                      selectedService?.id === service.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {service.description}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                          ⏱️ {service.duration_minutes} minutos
                        </p>
                      </div>
                      {service.price && (
                        <p className="font-bold text-indigo-600">
                          ${service.price}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Date & Time Selection */}
        {step === 'datetime' && selectedService && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Selecciona fecha y hora
            </h2>
            <p className="text-gray-600 mb-6">
              Servicio: <strong>{selectedService.name}</strong> ({selectedService.duration_minutes} min)
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-6 mb-6">
              <DatePicker selectedDate={selectedDate} onDateChange={handleDateChange} />

              {selectedDate && (
                <TimeSlots
                  slots={availableSlots}
                  loading={slotsLoading}
                  selectedSlot={selectedSlot}
                  onSlotSelect={handleSlotSelect}
                  error={error && slotsLoading === false ? error : undefined}
                />
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStep('service');
                  setSelectedSlot(null);
                  setSelectedDate(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-medium"
              >
                Atrás
              </button>
              <button
                onClick={() => setStep('customer')}
                disabled={!selectedSlot}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Customer Form */}
        {step === 'customer' && selectedService && selectedSlot && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Completa tus datos
            </h2>
            <p className="text-gray-600 mb-6">
              {selectedDate?.toLocaleDateString('es-AR')} - {selectedSlot.start.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>

            <CustomerForm
              onSubmit={handleBooking}
              loading={bookingLoading}
              error={error}
            />

            <button
              onClick={() => setStep('datetime')}
              className="w-full mt-4 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-medium"
            >
              Atrás
            </button>
          </div>
        )}

        {/* Confirmation */}
        {step === 'confirmation' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Reserva Confirmada!
            </h2>
            <p className="text-gray-600 mb-4">
              Tu turno ha sido reservado exitosamente
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-1">Número de confirmación</p>
              <p className="font-mono text-lg font-semibold text-gray-900 break-all">
                {confirmationNumber}
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Se ha enviado un email de confirmación.
              <br />
              Verifica tu bandeja de entrada.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
