interface AvailableSlot {
  start: Date;
  end: Date;
}

interface TimeSlotsProps {
  slots: AvailableSlot[];
  loading: boolean;
  selectedSlot: AvailableSlot | null;
  onSlotSelect: (slot: AvailableSlot) => void;
  error?: string;
}

export default function TimeSlots({
  slots,
  loading,
  selectedSlot,
  onSlotSelect,
  error,
}: TimeSlotsProps) {
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">Cargando horarios disponibles...</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-700">
          No hay horarios disponibles para esta fecha. Intenta con otra fecha.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Selecciona una hora
      </label>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot, index) => {
          const isSelected = selectedSlot && selectedSlot.start.getTime() === slot.start.getTime();
          const timeStr = slot.start.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <button
              key={index}
              onClick={() => onSlotSelect(slot)}
              className={`p-3 rounded-lg border-2 transition font-medium ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                  : 'border-gray-200 hover:border-indigo-300 text-gray-900'
              }`}
            >
              {timeStr}
            </button>
          );
        })}
      </div>
    </div>
  );
}
