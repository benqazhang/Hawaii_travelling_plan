import { clusterFor, energyFor, preferredStartFor } from "./constants";
import type { NormalizedSpot, PlannerSpot } from "./types";

function durationMinutes(spot: PlannerSpot) {
  if (spot.duration === "全天") return 480;
  if (spot.duration === "夜间") return 150;
  const raw = spot.detail?.quick_facts?.duration || "";
  const hours = [
    ...raw.matchAll(/(\d+(?:\.\d+)?)\s*(?:–|[-—])?\s*(\d+(?:\.\d+)?)?\s*h/gi),
  ];
  if (hours[0]) return Math.round(Number(hours[0][2] || hours[0][1]) * 60);
  return 210;
}

export function normalizeSpots(spots: PlannerSpot[]): NormalizedSpot[] {
  const seen = new Set<string>();
  return spots.flatMap((spot) => {
    if (!spot.id || seen.has(spot.id)) return [];
    seen.add(spot.id);
    const reservationText = String(
      spot.detail?.quick_facts?.reservation || spot.booking || "",
    );
    return [
      {
        ...spot,
        cluster: clusterFor(spot.id, spot.island),
        durationMinutes: durationMinutes(spot),
        energy: energyFor(
          spot.tag,
          spot.duration,
          spot.detail?.quick_facts?.difficulty,
        ),
        preferredStart: preferredStartFor(spot.tag, spot.id),
        parkingBufferMinutes: 20,
        reservationRequired: /required|需预约|需预订|门票|预约/i.test(
          reservationText,
        ),
        editorialPriority: Math.max(
          1,
          Math.min(5, spot.detail?.identity?.priority || spot.priority || 3),
        ),
      },
    ];
  });
}
