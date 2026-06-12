export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  business_name: string;
  description?: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  timezone: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  profile_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkingHours {
  id: string;
  profile_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start?: string;
  break_end?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlockedTime {
  id: string;
  profile_id: string;
  start_time: string;
  end_time: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  profile_id: string;
  service_id: string;
  customer_id: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'cancelled' | 'no_show' | 'completed';
  notes?: string;
  reminder_24h_sent: boolean;
  reminder_2h_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  appointment_id: string;
  type: 'confirmation' | 'reminder_24h' | 'reminder_2h' | 'cancellation';
  recipient_email: string;
  subject?: string;
  body?: string;
  sent_at: string;
  status: 'sent' | 'pending' | 'failed' | 'bounced';
  error_message?: string;
  created_at: string;
}
