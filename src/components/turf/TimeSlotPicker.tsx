import { useMemo, useState, useRef, useEffect } from "react";

interface Props {
  operatingHours: { open: string; close: string };
  bookedTimes?: string[]; // ["14:00", "15:00"] for the chosen date
  selectedDate: Date;
  onSelect: (times: string[]) => void;
}

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function toTime(m: number) {
  const h = Math.floor(m / 60).toString().padStart(2, "0");
  const mm = (m % 60).toString().padStart(2, "0");
  return `${h}:${mm}`;
}

export default function TimeSlotPicker({ operatingHours, bookedTimes = [], selectedDate, onSelect }: Props) {
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  // Reset selected slots when date changes
  const prevDate = useRef<Date>();
  useEffect(() => {
    if (prevDate.current && selectedDate && 
        prevDate.current.toDateString() !== selectedDate.toDateString()) {
      setSelectedSlots([]);
      onSelect([]);
    }
    prevDate.current = selectedDate;
  }, [selectedDate, onSelect]);

  const slots = useMemo(() => {
    const start = toMinutes(operatingHours.open);
    const end = toMinutes(operatingHours.close);
    const res: string[] = [];
    // If close is less than or equal to open, treat as overnight (e.g., 23:00 to 05:00)
    if (end <= start) {
      // Add slots from open to midnight
      for (let t = start; t < 24 * 60; t += 60) res.push(toTime(t));
      // Add slots from midnight to close
      for (let t = 0; t < end; t += 60) res.push(toTime(t));
    } else {
      for (let t = start; t < end; t += 60) res.push(toTime(t));
    }
    return res;
  }, [operatingHours]);

  const isOvernightOperation = useMemo(() => {
    return toMinutes(operatingHours.close) <= toMinutes(operatingHours.open);
  }, [operatingHours]);

  // Create a continuous range between two slot indices, supporting overnight wrap
  const createRange = (idx1: number, idx2: number): string[] => {
    if (idx1 === idx2) return [slots[idx1]];
    if (!isOvernightOperation) {
      // Simple case - no overnight
      const startIdx = Math.min(idx1, idx2);
      const endIdx = Math.max(idx1, idx2);
      return slots.slice(startIdx, endIdx + 1);
    }
    // Overnight: treat slots as circular array
    const totalSlots = slots.length;
    if (idx2 > idx1) {
      return slots.slice(idx1, idx2 + 1);
    } else {
      return [...slots.slice(idx1, totalSlots), ...slots.slice(0, idx2 + 1)];
    }
  };

  console.log('TimeSlotPicker - Current selection:', selectedSlots, 'Selected date:', selectedDate?.toDateString());

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {slots.map((t, idx) => {
        // Disable if booked or lapsed
        let isDisabled = bookedTimes.includes(t);
        
        // Only disable lapsed slots if selectedDate is today
        const now = new Date();
        const isToday = selectedDate && selectedDate.toDateString() === now.toDateString();
        
        if (isToday) {
          const slotHour = parseInt(t.split(":")[0], 10);
          const slotMinute = parseInt(t.split(":")[1], 10);
          const slotDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), slotHour, slotMinute);
          
          if (slotDate <= now) {
            isDisabled = true;
          }
        }
        const isSelected = selectedSlots.includes(t);
        // Format slot as "HH:mm - HH:mm"
        const start = t;
        const nextSlotMinutes = toMinutes(t) + 60;
        const end = nextSlotMinutes >= 24 * 60 ? toTime(nextSlotMinutes - 24 * 60) : toTime(nextSlotMinutes);
        const slotLabel = `${start} - ${end}`;
        return (
          <button
            key={t}
            onClick={() => {
              if (isDisabled) return;
              
              if (isSelected) {
                // If slot is already selected, remove it from selection
                const newSelection = selectedSlots.filter(slot => slot !== t);
                setSelectedSlots(newSelection);
                onSelect(newSelection);
              } else {
                // If no slots are selected, start a new selection
                if (selectedSlots.length === 0) {
                  const newSelection = [t];
                  setSelectedSlots(newSelection);
                  onSelect(newSelection);
                } else if (selectedSlots.length === 1) {
                  // If one slot is selected, try to create a range
                  const firstSlotIdx = slots.indexOf(selectedSlots[0]);
                  if (firstSlotIdx === idx) {
                    // Same slot clicked again - deselect it
                    setSelectedSlots([]);
                    onSelect([]);
                    return;
                  }
                  
                  const range = createRange(firstSlotIdx, idx);
                  // Check if any slot in the range is already booked or lapsed
                  const hasBookedOrLapsedSlot = range.some(s => {
                    const booked = bookedTimes.includes(s);
                    const hour = parseInt(s.split(":")[0], 10);
                    const minute = parseInt(s.split(":")[1], 10);
                    const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hour, minute);
                    return booked || (isToday && date < now);
                  });
                  
                  if (hasBookedOrLapsedSlot) {
                    // If range has booked slots, just select the current slot
                    const newSelection = [t];
                    setSelectedSlots(newSelection);
                    onSelect(newSelection);
                  } else {
                    // Select the range
                    setSelectedSlots(range);
                    onSelect(range);
                  }
                } else {
                  // Multiple slots selected - reset to single slot
                  const newSelection = [t];
                  setSelectedSlots(newSelection);
                  onSelect(newSelection);
                }
              }
            }}
            className={`rounded-md border px-3 py-2 text-xs font-semibold w-full whitespace-nowrap overflow-hidden text-ellipsis flex items-center justify-center transition-all min-h-[2.5rem]
              ${isDisabled
                ? "cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200"
                : isSelected
                ? "bg-green-500 text-white border-green-500 shadow-md"
                : "hover:bg-gray-50 bg-white text-gray-700 border-gray-300 hover:border-gray-400"}
            `}
          >
            {slotLabel}
          </button>
        );
      })}
    </div>
  );
}