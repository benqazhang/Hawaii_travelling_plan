import type { Pace } from "./types";

export const PACE_CAPACITY: Record<Pace, number> = {
  relaxed: 420,
  balanced: 540,
  packed: 630,
};

export const PACE_MAX_STOPS: Record<Pace, number> = {
  relaxed: 2,
  balanced: 3,
  packed: 4,
};

const clusterGroups: Record<string, string[]> = {
  "oahu-honolulu": ["waikiki", "diamond", "manoa", "lyon", "pearl"],
  "oahu-windward": [
    "hanauma",
    "lanikai",
    "waimanalo",
    "makapuu",
    "kualoa",
    "windward",
  ],
  "oahu-north": ["northshore", "sharks", "haleiwa", "kaena"],
  "oahu-west": ["koolina"],
  "maui-haleakala": ["haleakala", "upcountry"],
  "maui-hana": ["hana", "waianapanapa", "oheo"],
  "maui-north": ["hookipa", "paia", "iao"],
  "maui-south": ["molokini", "makena", "wailea", "kihei"],
  "maui-west": ["honolua", "kapalua", "kahekili"],
  "big-volcano": [
    "volcanoes",
    "kilaueaiki",
    "chaincraters",
    "punaluu",
    "akaka",
  ],
  "big-kona": ["manta", "kealakekua", "puuhonua", "southpoint", "green"],
  "big-kohala": ["maunakea", "waipio", "pololu", "puako", "makalawena"],
  "big-hilo": ["hilo"],
  "kauai-north": ["napali", "kalalau", "hanalei", "haena", "anini", "kilauea"],
  "kauai-east": ["wailua", "wailuariver", "kuilau", "moalepe"],
  "kauai-south": ["poipu", "mahaulepu", "portallen"],
  "kauai-west": ["waimea", "kokee", "polihale"],
};

const clusterBySpot = new Map(
  Object.entries(clusterGroups).flatMap(([cluster, ids]) =>
    ids.map((id) => [id, cluster] as const),
  ),
);

export function clusterFor(spotId: string, island: string) {
  return clusterBySpot.get(spotId) || `${island}-other`;
}

export function energyFor(tag: string, duration: string, difficulty?: string) {
  const text = `${tag} ${difficulty || ""}`.toLowerCase();
  if (/hard|strenuous|硬核|高强度/.test(text)) return 5 as const;
  if (duration === "全天" || /徒步|潜水|夜潜|自驾|火山/.test(text))
    return 4 as const;
  if (/浮潜|峡谷|山谷|瀑布|moderate/.test(text)) return 3 as const;
  if (/海滩|小镇|日落|历史|植物/.test(text)) return 2 as const;
  return 2 as const;
}

export function preferredStartFor(tag: string, id: string) {
  if (id === "haleakala") return "06:00";
  if (id === "manta" || /夜潜|星空|日落/.test(tag)) return "18:30";
  if (/浮潜|徒步|峡谷|观鸟/.test(tag)) return "08:00";
  return "09:00";
}
