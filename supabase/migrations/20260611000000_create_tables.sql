-- Create profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  price NUMERIC(10, 2),
  color TEXT NOT NULL DEFAULT '#3b82f6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_profile_id FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create working_hours table
CREATE TABLE IF NOT EXISTS public.working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_profile_id FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT check_times CHECK (start_time < end_time),
  CONSTRAINT check_break CHECK (break_start IS NULL OR (break_start < break_end AND break_start >= start_time AND break_end <= end_time))
);

-- Create blocked_times table
CREATE TABLE IF NOT EXISTS public.blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_profile_id FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT check_range CHECK (start_time < end_time)
);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  service_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'no_show', 'completed')),
  notes TEXT,
  reminder_24h_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_2h_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_profile_id FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_service_id FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE RESTRICT,
  CONSTRAINT fk_customer_id FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE,
  CONSTRAINT check_times CHECK (start_time < end_time)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('confirmation', 'reminder_24h', 'reminder_2h', 'cancellation')),
  recipient_email TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'pending', 'failed', 'bounced')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_appointment_id FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE
);

-- Add comments
COMMENT ON TABLE public.profiles IS 'Perfil del comercio/profesional';
COMMENT ON TABLE public.services IS 'Servicios ofrecidos por el profesional';
COMMENT ON TABLE public.working_hours IS 'Horarios de atención regulares';
COMMENT ON TABLE public.blocked_times IS 'Bloques de tiempo no disponibles';
COMMENT ON TABLE public.customers IS 'Clientes que realizan reservas';
COMMENT ON TABLE public.appointments IS 'Turnos/citas confirmadas';
COMMENT ON TABLE public.notifications IS 'Registro de notificaciones enviadas';
