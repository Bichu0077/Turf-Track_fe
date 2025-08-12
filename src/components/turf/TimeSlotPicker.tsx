import { useMemo, useState } from "react";

interface Props {
  operatingHours: { open: string; close: string };
  bookedTimes?: string[]; // ["14:00", "15:00"] for the chosen date
  onSelect: (time: string) => void;
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
  const [selected, setSelected] = useState<string | null>(null);

  const slots = useMemo(() => {
    const start = toMinutes(operatingHours.open);
    const end = toMinutes(operatingHours.close);
    const res: string[] = [];
    for (let t = start; t < end; t += 60) res.push(toTime(t));
    return res;
  }, [operatingHours]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {slots.map((t) => {
        const isDisabled = bookedTimes.includes(t);
        const isSelected = selected === t;
        return (
          <button
            key={t}
            onClick={() => {
              if (isDisabled) return;
              setSelected(t);
              onSelect(t);
            }}
            className={`rounded-md border px-3 py-2 text-sm ${
              isDisabled
                ? "cursor-not-allowed bg-muted text-muted-foreground"
                : isSelected
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary"
            }`}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}
