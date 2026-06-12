-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can view and edit their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- SERVICES: Users can view and manage services of their profile
CREATE POLICY "Users can view own services"
  ON public.services FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert services"
  ON public.services FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update services"
  ON public.services FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete services"
  ON public.services FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- WORKING_HOURS: Users can manage working hours of their profile
CREATE POLICY "Users can view own working hours"
  ON public.working_hours FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert working hours"
  ON public.working_hours FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update working hours"
  ON public.working_hours FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- BLOCKED_TIMES: Users can manage blocked times of their profile
CREATE POLICY "Users can view own blocked times"
  ON public.blocked_times FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert blocked times"
  ON public.blocked_times FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update blocked times"
  ON public.blocked_times FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- CUSTOMERS: Users can view customers of their profile
CREATE POLICY "Users can view own customers"
  ON public.customers FOR SELECT
  USING (
    id IN (
      SELECT customer_id FROM public.appointments
      WHERE profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- APPOINTMENTS: Users can view and manage appointments of their profile
CREATE POLICY "Users can view own appointments"
  ON public.appointments FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update appointments"
  ON public.appointments FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- NOTIFICATIONS: Users can view notifications of their appointments
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (
    appointment_id IN (
      SELECT id FROM public.appointments
      WHERE profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- PUBLIC ACCESS POLICIES FOR BOOKING
-- Allow anonymous access to view public profile and services
CREATE POLICY "Anyone can view active profiles"
  ON public.profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view active services"
  ON public.services FOR SELECT
  USING (
    is_active = true
    AND profile_id IN (
      SELECT id FROM public.profiles WHERE is_active = true
    )
  );

CREATE POLICY "Anyone can view working hours"
  ON public.working_hours FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE is_active = true
    )
  );

CREATE POLICY "Anyone can view blocked times"
  ON public.blocked_times FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE is_active = true
    )
  );

-- Allow anyone to create appointments (for public booking)
CREATE POLICY "Anyone can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (true);

-- Allow anyone to create customers (for public booking)
CREATE POLICY "Anyone can create customers"
  ON public.customers FOR INSERT
  WITH CHECK (true);

-- Allow viewing appointments in public booking (via customer or profile)
CREATE POLICY "Anyone can view appointments for booking"
  ON public.appointments FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE is_active = true
    )
  );
