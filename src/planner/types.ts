export type Pace = "relaxed" | "balanced" | "packed";
export type DecisionStatus = "planned" | "optional" | "not_recommended";

export type PlannerSpot = {
  id: string;
  island: string;
  name: string;
  en: string;
  tag: string;
  duration: "半天" | "全天" | "夜间";
  booking: string;
  map: string;
  priority?: number;
  detail?: {
    identity?: { priority?: number; primary_activity?: string };
    quick_facts?: {
      duration?: string;
      difficulty?: string;
      reservation?: boolean | string;
      planning_note?: string;
      official_access_url?: string;
    };
  };
};

export type FixedEvent = {
  id: string;
  spotId?: string;
  date: string;
  startTime: string;
  endTime?: string;
  title: string;
};

export type PlannerInput = {
  trip: {
    startDate: string;
    endDate: string;
    planningDates: string[];
    islandOrder: string[];
    arrivalIsland?: string;
    departureIsland?: string;
  };
  selectedSpots: PlannerSpot[];
  preferences: {
    pace: Pace;
    interests?: string[];
    maxDrivingMinutesPerDay?: number;
    hikingTolerance?: "low" | "medium" | "high";
    earlyStartTolerance?: "low" | "medium" | "high";
    avoidBackToBackHardDays?: boolean;
  };
  fixedEvents?: FixedEvent[];
};

export type NormalizedSpot = PlannerSpot & {
  cluster: string;
  durationMinutes: number;
  energy: 1 | 2 | 3 | 4 | 5;
  preferredStart: string;
  parkingBufferMinutes: number;
  reservationRequired: boolean;
  editorialPriority: number;
};

export type TravelLeg = {
  fromSpotId: string;
  toSpotId: string;
  driveMinutes: number;
  estimated: boolean;
};

export interface TravelTimeProvider {
  between(from: NormalizedSpot, to: NormalizedSpot): TravelLeg;
}

export type PlannedItem = {
  id: string;
  type: "drive" | "hike" | "attraction" | "transfer";
  spotId?: string;
  title: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  isAnchor?: boolean;
  bookingLocked?: boolean;
  notes?: string[];
};

export type PlannedDay = {
  day: number;
  date: string;
  island: string;
  theme: string;
  cluster: string;
  anchorSpotId?: string;
  transfer: boolean;
  items: PlannedItem[];
  explanation: string[];
  planningMeta: {
    activityMinutes: number;
    drivingMinutes: number;
    bufferMinutes: number;
    loadRatio: number;
    energyScore: number;
    constraintStatus: "valid" | "warning" | "invalid";
  };
};

export type SpotPlanningDecision = {
  spotId: string;
  spotName: string;
  status: DecisionStatus;
  reason?: string;
};

export type PlannerIssue = {
  code: string;
  message: string;
  day?: number;
  spotId?: string;
};

export type PlannerResult = {
  status: "success" | "partial" | "failed";
  days: PlannedDay[];
  decisions: SpotPlanningDecision[];
  validation: {
    valid: boolean;
    errors: PlannerIssue[];
    warnings: PlannerIssue[];
  };
  summary: {
    totalSelected: number;
    planned: number;
    optional: number;
    notRecommended: number;
    totalDrivingMinutes: number;
  };
};
