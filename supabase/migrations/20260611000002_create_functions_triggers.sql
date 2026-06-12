-- Función para validar solapamiento de turnos
CREATE OR REPLACE FUNCTION public.check_appointment_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE profile_id = NEW.profile_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status NOT IN ('cancelled', 'no_show')
      AND (start_time, end_time) OVERLAPS (NEW.start_time, NEW.end_time)
  ) THEN
    RAISE EXCEPTION 'Appointment overlaps with existing booking';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar solapamiento
DROP TRIGGER IF EXISTS appointment_overlap_check ON public.appointments;
CREATE TRIGGER appointment_overlap_check
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_appointment_overlap();

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_working_hours_updated_at ON public.working_hours;
CREATE TRIGGER update_working_hours_updated_at
  BEFORE UPDATE ON public.working_hours
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_blocked_times_updated_at ON public.blocked_times;
CREATE TRIGGER update_blocked_times_updated_at
  BEFORE UPDATE ON public.blocked_times
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
