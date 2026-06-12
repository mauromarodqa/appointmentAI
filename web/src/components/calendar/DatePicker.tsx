interface DatePickerProps {
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  minDate?: Date;
}

export default function DatePicker({ selectedDate, onDateChange, minDate }: DatePickerProps) {
  const min = minDate || new Date();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60); // Allow booking up to 60 days in advance

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Parse date as local timezone, not UTC
    const [year, month, day] = e.target.value.split('-').map(Number);
    const date = new Date(year, month - 1, day, 0, 0, 0, 0);
    onDateChange(date);
  };

  // Format dates as YYYY-MM-DD in local timezone
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const minDateStr = formatLocalDate(min);
  const maxDateStr = formatLocalDate(maxDate);
  const selectedDateStr = selectedDate ? formatLocalDate(selectedDate) : '';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Selecciona una fecha
      </label>
      <input
        type="date"
        value={selectedDateStr}
        onChange={handleDateChange}
        min={minDateStr}
        max={maxDateStr}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        required
      />
      {selectedDate && (
        <p className="text-sm text-gray-600 mt-2">
          {selectedDate.toLocaleDateString('es-AR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      )}
    </div>
  );
}
