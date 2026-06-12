-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Services indexes
CREATE INDEX IF NOT EXISTS idx_services_profile_id ON public.services(profile_id);
CREATE INDEX IF NOT EXISTS idx_services_profile_active ON public.services(profile_id, is_active);

-- Working hours indexes
CREATE INDEX IF NOT EXISTS idx_working_hours_profile_id ON public.working_hours(profile_id);
CREATE INDEX IF NOT EXISTS idx_working_hours_profile_day ON public.working_hours(profile_id, day_of_week);

-- Blocked times indexes
CREATE INDEX IF NOT EXISTS idx_blocked_times_profile_id ON public.blocked_times(profile_id);
CREATE INDEX IF NOT EXISTS idx_blocked_times_range ON public.blocked_times(profile_id, start_time, end_time);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_profile_id ON public.appointments(profile_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON public.appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_time ON public.appointments(profile_id, start_time, end_time) WHERE status != 'cancelled' AND status != 'no_show';
CREATE INDEX IF NOT EXISTS idx_appointments_search_optimized ON public.appointments(profile_id, status, start_time) WHERE status = 'confirmed';

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_appointment_id ON public.notifications(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status, sent_at);
CREATE INDEX IF NOT EXISTS idx_notifications_email ON public.notifications(recipient_email);
