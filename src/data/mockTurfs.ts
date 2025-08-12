import turf1 from "@/assets/turf-1.jpg";
import turf2 from "@/assets/turf-2.jpg";
import type { Turf } from "@/types";

export const turfs: Turf[] = [
  {
    id: "turf-elite-downtown",
    name: "Elite Sports Turf - Downtown",
    location: "Downtown City Center",
    description:
      "Premium FIFA-size synthetic turf with LED floodlights, perfect for 5v5 and 7v7. Clean changing rooms and ample parking.",
    images: [turf1],
    pricePerHour: 1200,
    operatingHours: { open: "06:00", close: "22:00" },
    amenities: ["Parking", "Changing Room", "Drinking Water", "Washrooms"],
  },

  {
    id: "saps",
    name: "SAPS PALA",
    location: "Pala",
    description:
      "7s Size Synthetic turf with LED floodlights, perfect for 5v5 and 7v7. Clean changing rooms and ample parking.",
    images: [turf1],
    pricePerHour: 800,
    operatingHours: { open: "06:00", close: "22:00" },
    amenities: ["Parking", "Changing Room", "Drinking Water", "Washrooms", "Swimming Pool"],
  },
  {
    id: "turf-riverside",
    name: "Riverside Arena Turf",
    location: "Riverside Complex",
    description:
      "Scenic riverside turf with pro-grade surface and tall netting. Great for evening games under lights.",
    images: [turf2],
    pricePerHour: 1000,
    operatingHours: { open: "06:00", close: "23:00" },
    amenities: ["Parking", "Cafeteria", "First Aid"],
  },
];