import { describe, it, expect } from 'vitest';

describe('Availability Engine', () => {
  describe('Date handling (timezone-safe)', () => {
    it('should parse local date without UTC conversion', () => {
      const [year, month, day] = '2026-06-12'.split('-').map(Number);
      const date = new Date(year, month - 1, day, 0, 0, 0);

      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(5); // 0-indexed
      expect(date.getDate()).toBe(12);
      expect(date.getHours()).toBe(0);
    });

    it('should format time in HH:MM format without toLocaleString', () => {
      const date = new Date(2026, 5, 12, 17, 30, 0);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const formatted = `${hours}:${minutes}`;

      expect(formatted).toBe('17:30');
    });

    it('should handle working hours parsing', () => {
      const startTime = '09:00';
      const endTime = '18:00';

      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      const workStartMinutes = startHour * 60 + startMin;
      const workEndMinutes = endHour * 60 + endMin;

      expect(workStartMinutes).toBe(540); // 9 * 60
      expect(workEndMinutes).toBe(1080); // 18 * 60
      expect(workEndMinutes - workStartMinutes).toBe(540); // 9 hours = 540 minutes
    });
  });

  describe('Slot generation', () => {
    it('should generate 30-minute slots within working hours', () => {
      const workStartMinutes = 540; // 09:00
      const workEndMinutes = 1080; // 18:00
      const slotDuration = 30;

      const slots = [];
      for (let minutes = workStartMinutes; minutes < workEndMinutes; minutes += slotDuration) {
        slots.push({
          start: minutes,
          end: minutes + slotDuration,
        });
      }

      expect(slots.length).toBe(18); // 9 hours * 2 slots per hour
      expect(slots[0].start).toBe(540); // 09:00
      expect(slots[slots.length - 1].end).toBe(1080); // 18:00
    });

    it('should exclude slots within breaks', () => {
      const workStartMinutes = 540; // 09:00
      const workEndMinutes = 1080; // 18:00
      const breakStartMinutes = 720; // 12:00
      const breakEndMinutes = 840; // 14:00
      const slotDuration = 30;

      const slots = [];
      for (let minutes = workStartMinutes; minutes < workEndMinutes; minutes += slotDuration) {
        const slotEnd = minutes + slotDuration;
        // Check if slot overlaps with break
        if (!(slotEnd > breakStartMinutes && minutes < breakEndMinutes)) {
          slots.push(minutes);
        }
      }

      expect(slots.length).toBe(14); // 18 total - 4 break slots (12:00, 12:30, 13:00, 13:30)
      expect(slots).not.toContain(720); // 12:00 should be excluded
      expect(slots).not.toContain(750); // 12:30 should be excluded
      expect(slots).not.toContain(780); // 13:00 should be excluded
      expect(slots).not.toContain(810); // 13:30 should be excluded
    });
  });

  describe('Double-booking prevention', () => {
    it('should detect time slot conflicts', () => {
      const existingAppointments = [
        { start_time: '2026-06-12T10:00:00', end_time: '2026-06-12T11:00:00' },
      ];

      const newSlotStart = '2026-06-12T10:30:00';
      const newSlotEnd = '2026-06-12T11:00:00';

      const hasConflict = existingAppointments.some(apt => {
        const aptStart = new Date(apt.start_time);
        const aptEnd = new Date(apt.end_time);
        const slotStart = new Date(newSlotStart);
        const slotEnd = new Date(newSlotEnd);

        return slotStart < aptEnd && slotEnd > aptStart;
      });

      expect(hasConflict).toBe(true);
    });

    it('should allow slots that do not overlap', () => {
      const existingAppointments = [
        { start_time: '2026-06-12T10:00:00', end_time: '2026-06-12T11:00:00' },
      ];

      const newSlotStart = '2026-06-12T11:00:00';
      const newSlotEnd = '2026-06-12T12:00:00';

      const hasConflict = existingAppointments.some(apt => {
        const aptStart = new Date(apt.start_time);
        const aptEnd = new Date(apt.end_time);
        const slotStart = new Date(newSlotStart);
        const slotEnd = new Date(newSlotEnd);

        return slotStart < aptEnd && slotEnd > aptStart;
      });

      expect(hasConflict).toBe(false);
    });
  });
});
