import type { PlannerResult, PlannerSpot } from "./types";

type IslandLabelMap = Record<string, string>;

export function plannerResultToTravelPlanPage(
  result: PlannerResult,
  spots: PlannerSpot[],
  islandLabels: IslandLabelMap,
) {
  const spotById = new Map(spots.map((spot) => [spot.id, spot]));
  const days = result.days.map((day) => {
    const spotItems = day.items.filter((item) => item.spotId);
    const locationNames = spotItems
      .map((item) => spotById.get(item.spotId!)?.name)
      .filter((name): name is string => Boolean(name));
    const driveHours = Math.floor(day.planningMeta.drivingMinutes / 60);
    const driveMinutes = day.planningMeta.drivingMinutes % 60;
    const drivingText = driveHours
      ? `${driveHours}小时${driveMinutes ? `${driveMinutes}分` : ""}`
      : `${driveMinutes}分`;
    return {
      id: `day-${day.day}`,
      day: day.day,
      date: day.date,
      title: day.theme,
      locations: [islandLabels[day.island] || day.island, ...locationNames],
      summary: `${spotItems.length} stops · ${drivingText} driving · Balanced`,
      schedule: day.items.map((item, itemIndex) => ({
        id: `schedule-${day.day}-${itemIndex + 1}`,
        time: item.startTime,
        type: item.type,
        text: item.title,
        ...(item.spotId ? { placeId: item.spotId } : {}),
        isAnchor: item.isAnchor || false,
        bookingLocked: item.bookingLocked || false,
        ticketIds:
          item.spotId && item.bookingLocked ? [`ticket-${item.spotId}`] : [],
      })),
      notes: day.explanation,
    };
  });
  const plannedRoadLegs = result.days.flatMap((day) =>
    day.items
      .filter((item) => item.type === "drive")
      .map((item) => ({
        id: item.id,
        day: day.day,
        date: day.date,
        durationMinutes: item.durationMinutes,
        estimated: true,
        note: "分区降级估算；当天以实时导航为准。",
      })),
  );
  return {
    days,
    places: spots.map((spot) => ({
      id: spot.id,
      nameZh: spot.name,
      name: spot.en,
      googleMapsQuery: spot.map,
      island: spot.island,
    })),
    plannedRoadLegs,
    map: {
      schemaVersion: "1.0-lite",
      mapMode: "template-auto",
      templateId: "auto",
      disclaimer:
        "路线顺序由确定性规划器生成；驾车时间为估算，实际驾驶请使用当天导航。",
      places: [],
      routes: [],
      dailyRoutes: result.days.map((day) => ({
        day: day.day,
        date: day.date,
        island: day.island,
        placeIds: day.items
          .map((item) => item.spotId)
          .filter((id): id is string => Boolean(id)),
      })),
    },
    planner: result,
  };
}
