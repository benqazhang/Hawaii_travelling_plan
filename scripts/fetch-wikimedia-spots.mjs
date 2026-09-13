import { mkdir, readFile, writeFile } from "node:fs/promises";

const spots = {
  waikiki: "Waikiki Beach Honolulu",
  hanauma: "Hanauma Bay Oahu",
  northshore: "North Shore Oahu Hawaii",
  windward: "Windward Coast Oahu Koolau",
  makapuu: "Makapuu Point Oahu",
  kualoa: "Kualoa Oahu mountains",
  haleiwa: "Haleiwa Oahu",
  waimanalo: "Waimanalo Beach Oahu",
  kaena: "Kaena Point Oahu",
  koolina: "Ko Olina lagoons Oahu",
  kilaueaiki: 'intitle:"Kilauea Iki" Hawaii crater',
  chaincraters: "Chain of Craters Road Hawaii",
  kealakekua: "Kealakekua Bay Hawaii",
  waipio: "Waipio Valley Hawaii",
  pololu: "Pololu Valley Hawaii",
  puuhonua: "Puuhonua o Honaunau",
  makalawena: 'intitle:"Makalawena" beach',
  puako: 'intitle:"Puako" Hawaii beach',
  southpoint: "South Point Hawaii Ka Lae",
  hilo: "Hilo Hawaii bay",
  oheo: 'intitle:"Oheo" pools Maui',
  molokini: 'intitle:"Molokini" Maui',
  makena: "Makena Big Beach Maui",
  honolua: "Honolua Bay Maui",
  hookipa: "Hookipa Beach Maui",
  paia: "Paia Maui",
  kapalua: "Kapalua Bay Maui",
  wailea: "Wailea Beach Maui",
  kahekili: "West Maui coast highway landscape",
  upcountry: "Makawao Maui landscape ranch",
  kihei: 'intitle:"Kihei" Maui beach',
  kalalau: "Kalalau Trail Kauai",
  kokee: 'intitle:"Kokee" Kauai landscape',
  haena: "Haena State Park Kauai",
  anini: "Anini Beach Kauai",
  poipu: "Poipu Beach Kauai",
  mahaulepu: "Mahaulepu Kauai",
  wailuariver: 'intitle:"Wailua River" Kauai',
  kuilau: "Kuilau Ridge Kauai landscape trail",
  polihale: "Polihale State Park Kauai",
  portallen: 'intitle:"Port Allen" Kauai harbor',
  moalepe: "Moalepe Trail Kauai",
};

await mkdir("public/places", { recursive: true });
let attribution = {};
try {
  attribution = JSON.parse(
    await readFile("public/places/attribution-expansion.json", "utf8"),
  );
} catch {}

const requested = new Set(process.argv.slice(2));
for (const [id, query] of Object.entries(spots).filter(
  ([key]) => requested.size === 0 || requested.has(key),
)) {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.search = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: "6",
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime",
    iiurlwidth: "960",
    format: "json",
    origin: "*",
  });
  let response;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    response = await fetch(api, {
      headers: { "user-agent": "PersonalHawaiiPlanner/1.0" },
    });
    if (response.ok) break;
    await new Promise((resolve) => setTimeout(resolve, 2500 * (attempt + 1)));
  }
  if (!response?.ok) {
    console.log(`MISS ${id}: API ${response?.status || "unavailable"}`);
    continue;
  }
  const payload = await response.json();
  const candidates = Object.values(payload.query?.pages || {}).filter(
    (page) => {
      const info = page.imageinfo?.[0];
      const license = info?.extmetadata?.LicenseShortName?.value || "";
      return (
        info?.thumburl &&
        info?.mime?.startsWith("image/") &&
        /CC|public domain/i.test(license)
      );
    },
  );
  const page = candidates[0];
  if (!page) {
    console.log(`MISS ${id}: ${query}`);
    continue;
  }
  const info = page.imageinfo[0];
  const bytes = Buffer.from(await (await fetch(info.thumburl)).arrayBuffer());
  await writeFile(`public/places/${id}.jpg`, bytes);
  const meta = info.extmetadata || {};
  attribution[id] = {
    title: page.title,
    source: info.descriptionurl,
    author: (meta.Artist?.value || "Wikimedia Commons contributor")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
    license: meta.LicenseShortName?.value || "See source",
    licenseUrl: meta.LicenseUrl?.value || info.descriptionurl,
  };
  console.log(`OK ${id}: ${page.title}`);
  await writeFile(
    "public/places/attribution-expansion.json",
    JSON.stringify(attribution, null, 2),
  );
  await new Promise((resolve) => setTimeout(resolve, 850));
}

await writeFile(
  "public/places/attribution-expansion.json",
  JSON.stringify(attribution, null, 2),
);
