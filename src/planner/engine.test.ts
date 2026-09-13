import { describe, expect, it } from "vitest";
import { planTrip } from "./engine";
import type { PlannerInput, PlannerSpot } from "./types";

function spot(
  id: string,
  island = "kauai",
  duration: PlannerSpot["duration"] = "半天",
  tag = "徒步",
): PlannerSpot {
  return {
    id,
    island,
    name: id,
    en: id,
    duration,
    tag,
    booking: "免费",
    map: id,
    priority: 5,
  };
}

function input(
  spots: PlannerSpot[],
  pace: PlannerInput["preferences"]["pace"] = "balanced",
): PlannerInput {
  return {
    trip: {
      startDate: "2026-09-26",
      endDate: "2026-10-05",
      planningDates: ["2026-09-27", "2026-09-28", "2026-09-29"],
      islandOrder: ["oahu", "kauai"],
      arrivalIsland: "oahu",
      departureIsland: "oahu",
    },
    selectedSpots: spots,
    preferences: {
      pace,
      hikingTolerance: "medium",
      earlyStartTolerance: "medium",
      avoidBackToBackHardDays: true,
    },
  };
}

describe("constraint-aware planner", () => {
  it("returns an explicit decision for every selected spot", () => {
    const selected = [
      spot("kalalau"),
      spot("haena"),
      spot("hanalei"),
      spot("waimea"),
      spot("kokee"),
      spot("polihale"),
    ];
    const result = planTrip(input(selected));
    expect(result.validation.valid).toBe(true);
    expect(result.decisions).toHaveLength(selected.length);
    expect(result.decisions.every((decision) => decision.status)).toBe(true);
    expect(result.summary.totalSelected).toBe(selected.length);
  });

  it("keeps a full-day anchor on its own", () => {
    const result = planTrip(
      input([spot("kalalau", "kauai", "全天"), spot("hanalei")]),
    );
    const anchorDay = result.days.find((day) => day.anchorSpotId === "kalalau");
    expect(anchorDay?.items.filter((item) => item.spotId)).toHaveLength(1);
  });

  it("treats an inter-island transition as a light day", () => {
    const result = planTrip(
      input([spot("waikiki", "oahu", "半天", "海滩"), spot("hanalei")]),
    );
    const transferDay = result.days.find((day) => day.transfer);
    expect(transferDay).toBeDefined();
    expect(transferDay?.items.some((item) => item.type === "transfer")).toBe(
      true,
    );
    expect(
      transferDay?.items.filter((item) => item.spotId).length,
    ).toBeLessThanOrEqual(1);
  });

  it("plans more or equal spots in packed mode than relaxed mode", () => {
    const selected = [
      "kalalau",
      "haena",
      "hanalei",
      "anini",
      "kilauea",
      "napali",
    ].map((id) => spot(id));
    const relaxed = planTrip(input(selected, "relaxed"));
    const packed = planTrip(input(selected, "packed"));
    expect(packed.summary.planned).toBeGreaterThanOrEqual(
      relaxed.summary.planned,
    );
  });
});
