import { useMemo, useState } from "react";

interface Props {
  operatingHours: { open: string; close: string };
  bookedTimes?: string[]; // ["14:00", "15:00"] for the chosen date
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

export default function TimeSlotPicker({ operatingHours, bookedTimes = [], onSelect }: Props) {
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

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

  console.log('Current selection:', selectedSlots); // Debug log

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-9">
      {slots.map((t, idx) => {
        // Disable if booked or lapsed
        let isDisabled = bookedTimes.includes(t);
        // Disable lapsed slots for today
        const now = new Date();
        const slotHour = parseInt(t.split(":")[0], 10);
        const slotMinute = parseInt(t.split(":")[1], 10);
        const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), slotHour, slotMinute);
        if (slotDate < now) {
          isDisabled = true;
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
              console.log('Clicked slot:', t, 'at index:', idx); // Debug log
              if (isDisabled) return;
              if (selectedSlots.length === 0) {
                console.log('First selection:', t);
                const newSelection = [t];
                setSelectedSlots(newSelection);
                onSelect(newSelection);
              } else if (selectedSlots.length === 1) {
                const firstSlotIdx = slots.indexOf(selectedSlots[0]);
                console.log('Second selection. First was at:', firstSlotIdx, 'Second at:', idx);
                if (firstSlotIdx === idx) {
                  // Same slot clicked again - do nothing or reset
                  return;
                }
                const range = createRange(firstSlotIdx, idx);
                console.log('Created range:', range);
                // Check if any slot in the range is already booked or lapsed
                const hasBookedOrLapsedSlot = range.some(s => {
                  const booked = bookedTimes.includes(s);
                  const hour = parseInt(s.split(":")[0], 10);
                  const minute = parseInt(s.split(":")[1], 10);
                  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
                  return booked || date < now;
                });
                if (hasBookedOrLapsedSlot) {
                  console.log('Range contains booked/lapsed slots, ignoring');
                  return;
                }
                console.log('Setting selection to:', range);
                setSelectedSlots(range);
                onSelect(range);
              } else {
                // Reset to single slot
                console.log('Reset to single selection:', t);
                const newSelection = [t];
                setSelectedSlots(newSelection);
                onSelect(newSelection);
              }
            }}
            className={`rounded-md border px-10 py-4 text-[11px] font-semibold w-full whitespace-nowrap overflow-hidden text-ellipsis flex items-center justify-center transition-all
              ${isDisabled
                ? "cursor-not-allowed bg-muted text-muted-foreground"
                : isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-secondary bg-white text-gray-800 border-gray-300"}
            `}
          >
            {slotLabel}
          </button>
        );
      })}
    </div>
  );
}