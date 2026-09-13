import { PACE_CAPACITY, PACE_MAX_STOPS } from "./constants";
import { normalizeSpots } from "./normalize";
import { EstimatedClusterTravelTimeProvider } from "./travel-time";
import type {
  NormalizedSpot,
  PlannedDay,
  PlannedItem,
  PlannerInput,
  PlannerIssue,
  PlannerResult,
  SpotPlanningDecision,
  TravelTimeProvider,
} from "./types";

function minutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function clock(value: number) {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, value));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

function spotValue(spot: NormalizedSpot, interests: string[]) {
  const interestMatch = interests.some((interest) =>
    `${spot.tag} ${spot.detail?.identity?.primary_activity || ""}`
      .toLowerCase()
      .includes(interest.toLowerCase()),
  );
  return 0.4 + (interestMatch ? 0.2 : 0) + (spot.editorialPriority / 5) * 0.25;
}

function orderSpots(
  spots: NormalizedSpot[],
  interests: string[],
  provider: TravelTimeProvider,
) {
  const remaining = [...spots].sort(
    (a, b) =>
      spotValue(b, interests) - spotValue(a, interests) ||
      b.energy - a.energy ||
      a.id.localeCompare(b.id),
  );
  const first = remaining.shift();
  if (!first) return [];
  const ordered = [first];
  while (remaining.length) {
    const previous = ordered[ordered.length - 1]!;
    remaining.sort((a, b) => {
      const travelDifference =
        provider.between(previous, a).driveMinutes -
        provider.between(previous, b).driveMinutes;
      return (
        travelDifference || spotValue(b, interests) - spotValue(a, interests)
      );
    });
    ordered.push(remaining.shift()!);
  }
  return ordered;
}

function allocateIslandDayCounts(
  spotsByIsland: Map<string, NormalizedSpot[]>,
  islandOrder: string[],
  totalDays: number,
  capacity: number,
) {
  const active = islandOrder.filter(
    (island) => spotsByIsland.get(island)?.length,
  );
  const counts = new Map(active.map((island) => [island, 1]));
  let remaining = Math.max(0, totalDays - active.length);
  while (remaining > 0 && active.length) {
    const island = [...active].sort((a, b) => {
      const pressure = (key: string) =>
        (spotsByIsland.get(key) || []).reduce(
          (sum, spot) => sum + spot.durationMinutes,
          0,
        ) /
        ((counts.get(key) || 1) * capacity);
      return pressure(b) - pressure(a);
    })[0];
    counts.set(island, (counts.get(island) || 0) + 1);
    remaining -= 1;
  }
  return counts;
}

function scheduleItems(
  spots: NormalizedSpot[],
  provider: TravelTimeProvider,
  transfer: boolean,
) {
  const items: PlannedItem[] = [];
  let cursor = transfer ? 13 * 60 : 8 * 60;
  if (transfer) {
    items.push({
      id: `transfer-${spots[0]?.island || "island"}`,
      type: "transfer",
      title: "跨岛航班、行李与取车",
      startTime: "08:30",
      endTime: "12:30",
      durationMinutes: 240,
      notes: ["跨岛日按半天成本预留，不安排长距离硬核活动。"],
    });
  }
  spots.forEach((spot, index) => {
    if (index > 0) {
      const leg = provider.between(spots[index - 1], spot);
      items.push({
        id: `drive-${spots[index - 1].id}-${spot.id}`,
        type: "drive",
        title: `驾车前往 ${spot.name}（估算 ${leg.driveMinutes} 分钟）`,
        startTime: clock(cursor),
        endTime: clock(cursor + leg.driveMinutes),
        durationMinutes: leg.driveMinutes,
        notes: ["时间为分区降级估算，当天请以实时导航为准。"],
      });
      cursor += leg.driveMinutes;
    }
    const preferred = minutes(spot.preferredStart);
    if (index === 0 && !transfer) cursor = Math.max(cursor, preferred);
    if (spot.duration === "夜间") cursor = Math.max(cursor, preferred);
    const duration = spot.durationMinutes;
    items.push({
      id: `spot-${spot.id}`,
      type: /徒步|峡谷|山谷/.test(spot.tag) ? "hike" : "attraction",
      spotId: spot.id,
      title: `${spot.name} · ${spot.booking}`,
      startTime: clock(cursor),
      endTime: clock(cursor + duration),
      durationMinutes: duration,
      isAnchor: index === 0,
      bookingLocked: spot.reservationRequired,
      notes: spot.detail?.quick_facts?.planning_note
        ? [spot.detail.quick_facts.planning_note]
        : [],
    });
    cursor += duration + spot.parkingBufferMinutes;
  });
  return items;
}

export function planTrip(
  input: PlannerInput,
  provider: TravelTimeProvider = new EstimatedClusterTravelTimeProvider(),
): PlannerResult {
  const spots = normalizeSpots(input.selectedSpots);
  const errors: PlannerIssue[] = [];
  const warnings: PlannerIssue[] = [];
  if (!input.trip.planningDates.length) {
    errors.push({ code: "NO_DATES", message: "没有可用的规划日期。" });
  }
  const spotsByIsland = new Map<string, NormalizedSpot[]>();
  spots.forEach((spot) => {
    const list = spotsByIsland.get(spot.island) || [];
    list.push(spot);
    spotsByIsland.set(spot.island, list);
  });
  const capacity = PACE_CAPACITY[input.preferences.pace];
  const maxStops = PACE_MAX_STOPS[input.preferences.pace];
  const dayCounts = allocateIslandDayCounts(
    spotsByIsland,
    input.trip.islandOrder,
    input.trip.planningDates.length,
    capacity,
  );
  const decisions: SpotPlanningDecision[] = spots.map((spot) => ({
    spotId: spot.id,
    spotName: spot.name,
    status: "optional",
    reason: "正在等待分配到可行日程。",
  }));
  const decisionById = new Map(
    decisions.map((decision) => [decision.spotId, decision]),
  );
  const days: PlannedDay[] = [];
  let dateIndex = 0;
  let previousEnergy = 0;
  const activeIslands = input.trip.islandOrder.filter((island) =>
    spotsByIsland.has(island),
  );

  activeIslands.forEach((island, islandIndex) => {
    const islandSpots = spotsByIsland.get(island) || [];
    const grouped = new Map<string, NormalizedSpot[]>();
    islandSpots.forEach((spot) => {
      const list = grouped.get(spot.cluster) || [];
      list.push(spot);
      grouped.set(spot.cluster, list);
    });
    const queue = [...grouped.entries()]
      .sort(
        (a, b) =>
          Math.max(...b[1].map((spot) => spot.editorialPriority)) -
          Math.max(...a[1].map((spot) => spot.editorialPriority)),
      )
      .flatMap(([, clusterSpots]) =>
        orderSpots(clusterSpots, input.preferences.interests || [], provider),
      );
    const allottedDays = dayCounts.get(island) || 0;
    for (
      let localDay = 0;
      localDay < allottedDays && dateIndex < input.trip.planningDates.length;
      localDay += 1
    ) {
      const transfer = islandIndex > 0 && localDay === 0;
      const energyRecovery =
        input.preferences.avoidBackToBackHardDays !== false &&
        input.preferences.pace !== "packed" &&
        previousEnergy >= 5;
      const usableCapacity = Math.round(
        capacity * (transfer ? 0.55 : 1) * (energyRecovery ? 0.72 : 1),
      );
      const picked: NormalizedSpot[] = [];
      let activityMinutes = 0;
      let drivingMinutes = 0;
      while (queue.length && picked.length < maxStops) {
        const candidate = queue[0];
        const leg = picked.length
          ? provider.between(picked[picked.length - 1]!, candidate).driveMinutes
          : 0;
        const incremental =
          candidate.durationMinutes + candidate.parkingBufferMinutes + leg;
        const fullDayConflict =
          candidate.duration === "全天" ||
          picked.some((spot) => spot.duration === "全天");
        if (
          picked.length &&
          (fullDayConflict ||
            activityMinutes + drivingMinutes + incremental > usableCapacity)
        ) {
          break;
        }
        if (
          !picked.length &&
          candidate.durationMinutes > usableCapacity &&
          transfer
        )
          break;
        queue.shift();
        picked.push(candidate);
        activityMinutes += candidate.durationMinutes;
        drivingMinutes += leg;
        const decision = decisionById.get(candidate.id)!;
        decision.status = "planned";
        decision.reason = `已按 ${candidate.cluster.replace(`${island}-`, "")} 分区并作为${picked.length === 1 ? "当日主锚点" : "顺路体验"}安排。`;
        if (candidate.duration === "全天") break;
      }
      const date = input.trip.planningDates[dateIndex++];
      if (!picked.length) {
        days.push({
          day: days.length + 1,
          date,
          island,
          theme: `${island.toUpperCase()} · TRANSFER & RESET`,
          cluster: `${island}-transfer`,
          transfer,
          items: scheduleItems([], provider, transfer),
          explanation: ["为跨岛交通、取车和酒店入住保留弹性。"],
          planningMeta: {
            activityMinutes: 0,
            drivingMinutes: 0,
            bufferMinutes: usableCapacity,
            loadRatio: 0,
            energyScore: 1,
            constraintStatus: "valid",
          },
        });
        previousEnergy = 1;
        continue;
      }
      const energyScore = Math.max(...picked.map((spot) => spot.energy));
      const used = activityMinutes + drivingMinutes;
      const loadRatio = used / Math.max(1, capacity);
      const cluster = picked[0].cluster;
      days.push({
        day: days.length + 1,
        date,
        island,
        theme: `${cluster.replace(`${island}-`, "").toUpperCase()} · ${picked[0].tag.toUpperCase()} DAY`,
        cluster,
        anchorSpotId: picked[0].id,
        transfer,
        items: scheduleItems(picked, provider, transfer),
        explanation: [
          `以${picked[0].name}为主锚点，先安排优先级与体力要求最高的体验。`,
          picked.length > 1
            ? `其余地点尽量保持在 ${cluster.replace(`${island}-`, "")} 分区，减少折返。`
            : "该日不额外堆叠远距离地点。",
          `已按 ${input.preferences.pace} 节奏保留停车、用餐和延误缓冲。`,
        ],
        planningMeta: {
          activityMinutes,
          drivingMinutes,
          bufferMinutes: Math.max(0, capacity - used),
          loadRatio,
          energyScore,
          constraintStatus: loadRatio > 0.9 ? "warning" : "valid",
        },
      });
      if (loadRatio > 0.9) {
        warnings.push({
          code: "HIGH_LOAD",
          day: days.length,
          message: `Day ${days.length} 负荷较高，请视当天交通和天气调整。`,
        });
      }
      previousEnergy = energyScore;
    }
    queue.forEach((spot, index) => {
      const decision = decisionById.get(spot.id)!;
      decision.status = index < 2 ? "optional" : "not_recommended";
      decision.reason =
        decision.status === "optional"
          ? `可作为 ${spot.cluster.replace(`${island}-`, "")} 分区的候补点，但已超出 ${input.preferences.pace} 节奏容量。`
          : `在当前天数与 ${input.preferences.pace} 节奏下无法可行安排，强行加入会压缩缓冲或增加折返。`;
    });
  });

  const plannedIds = new Set(
    days.flatMap((day) => day.items.map((item) => item.spotId).filter(Boolean)),
  );
  spots.forEach((spot) => {
    if (!decisionById.has(spot.id)) return;
    if (
      !plannedIds.has(spot.id) &&
      decisionById.get(spot.id)!.status === "planned"
    ) {
      errors.push({
        code: "MISSING_PLANNED_SPOT",
        spotId: spot.id,
        message: `${spot.name}被标记已计划但没有出现在日程中。`,
      });
    }
  });
  const planned = decisions.filter(
    (decision) => decision.status === "planned",
  ).length;
  const optional = decisions.filter(
    (decision) => decision.status === "optional",
  ).length;
  const notRecommended = decisions.filter(
    (decision) => decision.status === "not_recommended",
  ).length;
  const valid = errors.length === 0;
  return {
    status: !valid
      ? "failed"
      : optional || notRecommended
        ? "partial"
        : "success",
    days,
    decisions,
    validation: { valid, errors, warnings },
    summary: {
      totalSelected: spots.length,
      planned,
      optional,
      notRecommended,
      totalDrivingMinutes: days.reduce(
        (sum, day) => sum + day.planningMeta.drivingMinutes,
        0,
      ),
    },
  };
}
