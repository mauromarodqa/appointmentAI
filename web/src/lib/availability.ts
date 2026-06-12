import { supabase } from './supabase';

interface AvailableSlot {
  start: Date;
  end: Date;
}

export async function getAvailableSlots(
  profileId: string,
  serviceId: string,
  date: Date,
  slotDurationMinutes: number = 30
): Promise<AvailableSlot[]> {
  try {
    // 1. Get service details
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration_minutes, is_active')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      throw new Error('Servicio no encontrado');
    }

    if (!service.is_active) {
      throw new Error('Servicio no disponible');
    }

    const serviceDuration = service.duration_minutes;

    // 2. Get working hours for the day
    const dayOfWeek = date.getDay();
    const { data: workingHours, error: hoursError } = await supabase
      .from('working_hours')
      .select('*')
      .eq('profile_id', profileId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single();

    if (hoursError || !workingHours) {
      return [];
    }

    // 3. Get profile timezone (TODO: implement timezone conversion for display)
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('timezone')
    //   .eq('id', profileId)
    //   .single();
    // const timezone = profile?.timezone || 'America/Argentina/Buenos_Aires';

    // 4. Parse working hours and convert to minutes
    const [startHour, startMin] = workingHours.start_time.split(':').map(Number);
    const [endHour, endMin] = workingHours.end_time.split(':').map(Number);
    const workStartMinutes = startHour * 60 + startMin;
    const workEndMinutes = endHour * 60 + endMin;

    // 5. Get appointments for this date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Create date range for the entire day in local time
    // Start: 00:00 local = 03:00 UTC (for UTC-3)
    // End: 23:59 local = 02:59 UTC next day (for UTC-3)
    const dayStart = new Date(year, parseInt(month) - 1, parseInt(day), 0, 0, 0);
    const dayEnd = new Date(year, parseInt(month) - 1, parseInt(day), 23, 59, 59);

    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('profile_id', profileId)
      .eq('status', 'confirmed')
      .gte('start_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString());

    if (appointmentsError) {
      throw appointmentsError;
    }

    // 6. Get blocked times for this date
    const { data: blockedTimes, error: blockedError } = await supabase
      .from('blocked_times')
      .select('start_time, end_time')
      .eq('profile_id', profileId)
      .gte('start_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString());

    if (blockedError) {
      throw blockedError;
    }

    // 7. Generate available slots in local timezone
    const slots: AvailableSlot[] = [];
    // Create a local midnight for this date
    const baseDate = new Date(year, parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);

    for (let minutes = workStartMinutes; minutes + serviceDuration <= workEndMinutes; minutes += slotDurationMinutes) {
      const slotStart = new Date(baseDate.getTime() + minutes * 60 * 1000);
      const slotEnd = new Date(baseDate.getTime() + (minutes + serviceDuration) * 60 * 1000);

      // 8. Check for conflicts with working hours break
      if (workingHours.break_start && workingHours.break_end) {
        const [breakStartHour, breakStartMin] = workingHours.break_start.split(':').map(Number);
        const [breakEndHour, breakEndMin] = workingHours.break_end.split(':').map(Number);
        const breakStartMinutes = breakStartHour * 60 + breakStartMin;
        const breakEndMinutes = breakEndHour * 60 + breakEndMin;

        if (!(minutes + serviceDuration <= breakStartMinutes || minutes >= breakEndMinutes)) {
          continue;
        }
      }

      // 9. Check for conflicts with appointments
      const hasAppointmentConflict = appointments?.some((apt) => {
        const aptStart = new Date(apt.start_time);
        const aptEnd = new Date(apt.end_time);
        return !(slotEnd <= aptStart || slotStart >= aptEnd);
      });

      if (hasAppointmentConflict) {
        continue;
      }

      // 10. Check for conflicts with blocked times
      const hasBlockedConflict = blockedTimes?.some((blocked) => {
        const blockedStart = new Date(blocked.start_time);
        const blockedEnd = new Date(blocked.end_time);
        return !(slotEnd <= blockedStart || slotStart >= blockedEnd);
      });

      if (hasBlockedConflict) {
        continue;
      }

      slots.push({
        start: slotStart,
        end: slotEnd,
      });
    }

    return slots;
  } catch (error) {
    console.error('Error calculating available slots:', error);
    throw error;
  }
}

export async function checkSlotAvailable(
  profileId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id')
      .eq('profile_id', profileId)
      .eq('status', 'confirmed')
      .gte('start_time', startTime.toISOString())
      .lt('end_time', endTime.toISOString())
      .limit(1);

    return !conflicts || conflicts.length === 0;
  } catch (error) {
    console.error('Error checking slot availability:', error);
    throw error;
  }
}
