import productionContent from "./spots.production.v6.json";

export type SpotDetailContent = {
  identity: {
    id: string;
    name: string;
    island: string;
    activities: string[];
    primary_activity?: string;
    priority?: number;
  };
  hero?: { tagline?: string | null };
  why_go?: {
    text?: string | null;
    source?: string | null;
    source_url?: string | null;
  };
  traveler_consensus?: {
    summary?: string | null;
    positives?: string[];
    warnings?: string[];
  };
  ratings?: Array<{
    source: string;
    rating?: number;
    review_count?: number;
    difficulty?: string;
    summary?: string;
    url: string;
  }>;
  community?: Array<{ source: string; summary: string; url: string }>;
  quick_facts?: {
    duration?: string;
    difficulty?: string;
    distance?: string;
    location?: string;
    reservation?: boolean | string;
    best_time?: string;
    what_to_bring?: string[];
    parking?: string;
    best_for?: string[];
    planning_note?: string;
    official_access_url?: string;
  };
  best_moments?: Array<{
    title: string;
    description?: string;
    image?: string | null;
  }>;
  fit?: { great_for?: string[]; avoid_if?: string[] };
  related_spots?: string[];
  sources?: Array<{ name: string; url: string }>;
};

export const spotDetails = productionContent.spots as SpotDetailContent[];

export const legacySpotDetailIds: Record<string, string> = {
  waikiki: "oahu-waikiki",
  diamond: "oahu-diamond-head-leahi",
  hanauma: "oahu-hanauma-bay",
  northshore: "oahu-north-shore",
  lanikai: "oahu-kailua-lanikai",
  pearl: "oahu-pearl-harbor-national-memorial",
  makapuu: "oahu-makapuu-point-lighthouse-trail",
  kualoa: "oahu-kualoa-windward-coast",
  waimanalo: "oahu-waimanalo-beach",
  kaena: "oahu-kaena-point",
  sharks: "oahu-sharks-cove",
  volcanoes: "hawaii-big-island-hawaii-volcanoes-national-park",
  kilaueaiki: "hawaii-big-island-kilauea-iki-crater-rim-trail",
  chaincraters: "hawaii-big-island-chain-of-craters-road",
  maunakea: "hawaii-big-island-mauna-kea",
  manta: "hawaii-big-island-kona-manta-ray-night-snorkel-dive",
  kealakekua: "hawaii-big-island-kealakekua-bay",
  waipio: "hawaii-big-island-waipio-valley-lookout",
  punaluu: "hawaii-big-island-punaluu-black-sand-beach",
  green: "hawaii-big-island-papakolea-green-sand-beach",
  pololu: "hawaii-big-island-pololu-valley-lookout-trail",
  puuhonua: "hawaii-big-island-puuhonua-o-honaunau",
  makalawena: "hawaii-big-island-makalawena-beach",
  puako: "hawaii-big-island-puako-tide-pools",
  haleakala: "maui-haleakala-national-park",
  hana: "maui-road-to-hana",
  waianapanapa: "maui-waianapanapa-state-park",
  oheo: "maui-oheo-gulch-kipahulu",
  molokini: "maui-molokini",
  makena: "maui-makena-big-beach",
  honolua: "maui-honolua-bay",
  hookipa: "maui-hookipa",
  paia: "maui-paia",
  iao: "maui-iao-valley",
  napali: "kauai-napali-coast",
  kalalau: "kauai-kalalau-trail",
  waimea: "kauai-waimea-canyon",
  kokee: "kauai-kokee-state-park",
  hanalei: "kauai-hanalei-hanalei-bay",
  haena: "kauai-haena-state-park-kee-beach",
  anini: "kauai-anini-beach",
  poipu: "kauai-poipu-beach",
  mahaulepu: "kauai-mahaulepu-heritage-trail",
  wailuariver: "kauai-wailua-river",
  kilauea: "kauai-kilauea-north-shore",
  polihale: "kauai-polihale-state-park",
  portallen: "kauai-port-allen-napali-boat-departure",
};

const detailsById = new Map(
  spotDetails.map((spot) => [spot.identity.id, spot]),
);

export function detailForLegacySpot(id: string) {
  const productionId = legacySpotDetailIds[id];
  return productionId ? detailsById.get(productionId) : undefined;
}
