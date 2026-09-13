import type { NormalizedSpot, TravelTimeProvider } from "./types";

export class EstimatedClusterTravelTimeProvider implements TravelTimeProvider {
  between(from: NormalizedSpot, to: NormalizedSpot) {
    let driveMinutes = 25;
    if (from.island !== to.island) driveMinutes = 240;
    else if (from.cluster !== to.cluster) driveMinutes = 75;
    else if (from.id === to.id) driveMinutes = 0;
    return {
      fromSpotId: from.id,
      toSpotId: to.id,
      driveMinutes,
      estimated: true,
    };
  }
}
