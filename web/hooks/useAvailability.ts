import { useState, useCallback } from 'react';
import { getAvailableSlots, checkSlotAvailable } from '../lib/availability';

interface AvailableSlot {
  start: Date;
  end: Date;
}

interface UseAvailabilityReturn {
  slots: AvailableSlot[];
  loading: boolean;
  error: string | null;
  fetchSlots: (profileId: string, serviceId: string, date: Date) => Promise<void>;
  isSlotAvailable: (profileId: string, startTime: Date, endTime: Date) => Promise<boolean>;
}

export function useAvailability(): UseAvailabilityReturn {
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async (profileId: string, serviceId: string, date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const availableSlots = await getAvailableSlots(profileId, serviceId, date);
      setSlots(availableSlots);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar horarios disponibles';
      setError(message);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const isSlotAvailable = useCallback(async (profileId: string, startTime: Date, endTime: Date) => {
    try {
      return await checkSlotAvailable(profileId, startTime, endTime);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al verificar disponibilidad';
      setError(message);
      return false;
    }
  }, []);

  return {
    slots,
    loading,
    error,
    fetchSlots,
    isSlotAvailable,
  };
}
