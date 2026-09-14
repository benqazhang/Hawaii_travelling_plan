<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { extraPlaces } from "./data/extra-spots";
import { lonelyPlanetGuides } from "./data/lonely-planet-guides";
import {
  detailForLegacySpot,
  type SpotDetailContent,
} from "./data/spot-detail-content";
import { plannerResultToTravelPlanPage } from "./planner/adapter";
import { planTrip } from "./planner/engine";

function assetUrl(path: string) {
  if (/^(?:https?:|data:|blob:)/.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}

type IslandId = "oahu" | "maui" | "big" | "kauai";
type Place = {
  id: string;
  island: IslandId;
  name: string;
  en: string;
  note: string;
  image: string;
  map: string;
  duration: "半天" | "全天" | "夜间";
  booking: string;
  tag: string;
  stars?: number;
  guide?: {
    summary: string;
    tips: string[];
    page: string;
  };
  detail?: SpotDetailContent;
};
const islands: Record<
  IslandId,
  { name: string; en: string; subtitle: string; color: string }
> = {
  oahu: {
    name: "欧胡岛",
    en: "OʻAHU",
    subtitle: "海湾、雨林与城市文化",
    color: "#df7057",
  },
  maui: {
    name: "茂宜岛",
    en: "MAUI",
    subtitle: "火山日出与传奇公路",
    color: "#dba53e",
  },
  big: {
    name: "夏威夷大岛",
    en: "HAWAIʻI ISLAND",
    subtitle: "熔岩、星空与魔鬼鱼",
    color: "#335f57",
  },
  kauai: {
    name: "可爱岛",
    en: "KAUAʻI",
    subtitle: "峡谷、峭壁与原始海岸",
    color: "#708b5d",
  },
};
const homeIslandCards = [
  {
    id: "oahu" as IslandId,
    name: "Oʻahu",
    tagline: "Surf · City · Culture",
    image: "/places/waikiki.jpg",
  },
  {
    id: "maui" as IslandId,
    name: "Maui",
    tagline: "Beaches · Road trips · Waterfalls",
    image: "/places/hana.jpg",
  },
  {
    id: "big" as IslandId,
    name: "Hawaiʻi (Big Island)",
    tagline: "Volcanoes · Stargazing · Diving",
    image: "/places/volcanoes.jpg",
  },
  {
    id: "kauai" as IslandId,
    name: "Kauaʻi",
    tagline: "Cliffs · Hiking · Nature",
    image: "/places/napali.jpg",
  },
  {
    id: null,
    name: "Lānaʻi",
    tagline: "Secluded · Luxury · Off the grid",
    image: "/places/kaena.jpg",
  },
  {
    id: null,
    name: "Molokaʻi",
    tagline: "Authentic Hawaiʻi · Culture · Untouched",
    image: "/places/waipio.jpg",
  },
] as const;
type ActivityId =
  | "all"
  | "hiking"
  | "beaches"
  | "water"
  | "drive"
  | "wildlife"
  | "culture"
  | "food";
const activityFilters: {
  id: ActivityId;
  label: string;
  icon: string;
  keywords: string[];
}[] = [
  { id: "all", label: "All", icon: "▦", keywords: [] },
  {
    id: "hiking",
    label: "Hiking",
    icon: "△",
    keywords: ["徒步", "峡谷", "山谷", "雨林", "trail"],
  },
  {
    id: "beaches",
    label: "Beaches",
    icon: "☂",
    keywords: ["海滩", "黑沙滩", "海岸", "beach"],
  },
  {
    id: "water",
    label: "Water",
    icon: "≋",
    keywords: ["浮潜", "夜潜", "海龟", "kayak", "冲浪"],
  },
  {
    id: "drive",
    label: "Scenic Drive",
    icon: "▱",
    keywords: ["自驾", "公路", "road", "drive"],
  },
  {
    id: "wildlife",
    label: "Wildlife",
    icon: "♧",
    keywords: ["观鸟", "海龟", "魔鬼鱼", "wildlife"],
  },
  {
    id: "culture",
    label: "Culture",
    icon: "✿",
    keywords: ["历史", "文化", "植物", "古迹"],
  },
  {
    id: "food",
    label: "Food & Drink",
    icon: "◒",
    keywords: ["咖啡", "餐厅", "美食", "food", "drink"],
  },
];
const islandPresentation: Record<
  IslandId,
  { title: string; image: string; description: string }
> = {
  oahu: {
    title: "Oʻahu",
    image: "/places/diamond.jpg",
    description: "Surf breaks, mountain trails and Honolulu energy.",
  },
  maui: {
    title: "Maui",
    image: "/places/hana.jpg",
    description: "Volcanic sunrise, rainforest roads and open-water days.",
  },
  big: {
    title: "Hawaiʻi",
    image: "/places/volcanoes.jpg",
    description:
      "Living volcanoes, deep-blue bays and the clearest night skies.",
  },
  kauai: {
    title: "Kauaʻi",
    image: "/places/napali.jpg",
    description: "Dramatic cliffs, lush valleys and a wilder side of Hawaiʻi.",
  },
};
const islandTips: Record<
  IslandId,
  { title: string; items: { text: string; source: string }[] }
> = {
  oahu: {
    title: "这座岛怎么安排更舒服",
    items: [
      {
        text: "北岸环岛适合留一整天：威基基出发，经 Pali Highway、风向海岸、Kualoa、北岸再返回，全程不足约 100 英里。",
        source: "孤独星球 p.32",
      },
      {
        text: "9 月信风回归、气温仍适宜，通常比暑期清静；马诺阿谷的天气可能与海滩完全不同。",
        source: "孤独星球 p.31, p.102",
      },
      {
        text: "租车内不要留下任何可见物品；到停车点前就把行李收好，而不是抵达后再整理后备厢。",
        source: "孤独星球 p.307",
      },
    ],
  },
  maui: {
    title: "山路与海岸的节奏",
    items: [
      {
        text: "哈纳之路只挑 4-6 个重点停靠点，提前下载离线地图，日落前结束驾驶。",
        source: "Google Maps 游客经验",
      },
      {
        text: "哈雷阿卡拉山顶温差大；日出预约、入园规则和当日天气需在出发前复核。",
        source: "Google Maps + 公园提示",
      },
    ],
  },
  big: {
    title: "把距离和海拔算进去",
    items: [
      {
        text: "科纳与希洛之间驾驶距离长，火山公园、绿沙滩和魔鬼鱼不要硬塞进同一天。",
        source: "Google Maps 路线经验",
      },
      {
        text: "冒纳凯亚游客中心已处高海拔，先适应、保暖；山顶道路与租车限制必须当天确认。",
        source: "Google Maps + 现场规则",
      },
    ],
  },
  kauai: {
    title: "为天气留出弹性",
    items: [
      {
        text: "纳帕利海岸船班优先选清晨；易晕船者提前服药，并准备因海况取消的备选日。",
        source: "Google Maps 游客经验",
      },
      {
        text: "威美亚峡谷云雾变化快，早出发并把多个观景台串成一条线。",
        source: "Google Maps 游客经验",
      },
    ],
  },
};
const places: Place[] = [
  {
    id: "sharks",
    island: "oahu",
    name: "鲨鱼湾浮潜",
    en: "Shark’s Cove",
    note: "北岸熔岩礁形成的天然潮池，夏季水况平稳时适合浮潜。没有救生员，冬季大浪时不要下水。",
    image: "/places/sharks.JPG",
    map: "Shark's Cove Oahu",
    duration: "半天",
    booking: "免费 · 看浪况",
    tag: "浮潜",
    guide: {
      summary:
        "孤独星球把它列入北岸亮点：熔岩礁为海龟和鱼群提供了丰富栖息地，海况平静时尤其适合探索。",
      tips: [
        "只在夏季或海面平静时下水，冬季北岸大浪时改为岸上观景。",
        "珊瑚和火山岩锋利，务必穿水鞋；洞穴潜水只应跟随熟悉当地水域的专业人士。",
      ],
      page: "p.248, p.256",
    },
  },
  {
    id: "manoa",
    island: "oahu",
    name: "马诺阿瀑布",
    en: "Mānoa Falls",
    note: "从檀香山驶入葱郁雨林，轻徒步抵达约 45 米高的瀑布。雨后泥泞，建议穿抓地鞋。",
    image: "/places/manoa.jpg",
    map: "Manoa Falls Trail",
    duration: "半天",
    booking: "停车付费",
    tag: "雨林",
    guide: {
      summary:
        "孤独星球称它为檀香山最值得走的短途路线：约 1.6 英里往返，沿溪床穿过高大林木抵达瀑布。",
      tips: [
        "马诺阿谷即使威基基晴朗也可能下雨，步道常泥泞湿滑。",
        "不要越过观景区或进入瀑布水池，需留意落石与钩端螺旋体病风险。",
      ],
      page: "p.15, p.102",
    },
  },
  {
    id: "lyon",
    island: "oahu",
    name: "里昂树木园",
    en: "Harold L. Lyon Arboretum",
    note: "你提到的“哈罗德树植物园”：藏在马诺阿谷里的热带植物秘境，可与马诺阿瀑布顺路安排。",
    image: "/places/lyon.jpg",
    map: "Lyon Arboretum",
    duration: "半天",
    booking: "建议预约",
    tag: "植物",
    guide: {
      summary:
        "这是一座由夏威夷大学管理的约 200 英亩成熟林地式树木园，不是修剪规整的传统热带花园。",
      tips: [
        "停车位很少，尽量早到；书中也建议搭乘公交后步行进入。",
        "想参加导览需至少提前 24 小时联系，现场可买驱虫剂。",
      ],
      page: "p.99",
    },
  },
  {
    id: "diamond",
    island: "oahu",
    name: "钻石头山",
    en: "Diamond Head State Monument",
    note: "沿火山凝灰岩内壁登顶，俯瞰威基基与南岸。路段包含楼梯、隧道和暴晒坡面，早场更舒服。",
    image: "/places/diamond.jpg",
    map: "Diamond Head State Monument",
    duration: "半天",
    booking: "非居民需预约",
    tag: "徒步",
    guide: {
      summary:
        "孤独星球将钻石头山视为欧胡岛标志：从古老火山口内部短促爬升，山顶可获得威基基与东南岸全景。",
      tips: ["尽量一早出发，正午会很热；预留楼梯、隧道与拥挤路段的时间。"],
      page: "p.14, p.198",
    },
  },
  {
    id: "lanikai",
    island: "oahu",
    name: "拉尼凯海滩",
    en: "Lanikai Beach",
    note: "细白沙与莫库鲁阿双子岛构成欧胡岛经典海景。位于住宅区，没有公共停车场，请安静步行进入。",
    image: "/places/lanikai.jpg",
    map: "Lanikai Beach",
    duration: "半天",
    booking: "免费 · 停车困难",
    tag: "海滩",
    guide: {
      summary:
        "书中描写这里是面向莫库鲁阿双岛的粉白沙海滩，藏在高端住宅区之间，景色像明信片。",
      tips: [
        "仅能从 Mokulua Dr 的狭窄公共通道步行进入。",
        "没有洗手间和救生员；更完善的设施在相邻的 Kailua Beach Park。",
      ],
      page: "p.221",
    },
  },
  {
    id: "pearl",
    island: "oahu",
    name: "珍珠港国家纪念馆",
    en: "Pearl Harbor National Memorial",
    note: "从亚利桑那号纪念馆理解太平洋战争历史。免费参观区域很多，但热门船票建议提前预订。",
    image: "/places/pearl.jpg",
    map: "Pearl Harbor National Memorial",
    duration: "半天",
    booking: "部分项目需预约",
    tag: "历史",
    guide: {
      summary:
        "孤独星球建议为珍珠港留出至少一天，依次理解纪念馆、亚利桑那号、密苏里号、潜艇与航空博物馆。",
      tips: ["这是庄重的历史场所，不适合匆忙打卡；热门纪念馆船班应提前确认。"],
      page: "p.34, p.175-176",
    },
  },
  {
    id: "haleakala",
    island: "maui",
    name: "哈雷阿卡拉国家公园",
    en: "Haleakalā National Park",
    note: "巨型盾状火山侵蚀形成的火山洼地，红褐锥丘与云海带来近似月面的超现实景观。日出入园需要预约。",
    image: "/places/haleakala.jpg",
    map: "Haleakala National Park Summit",
    duration: "全天",
    booking: "门票 · 日出另预约",
    tag: "火山",
  },
  {
    id: "hana",
    island: "maui",
    name: "哈纳之路",
    en: "Road to Hāna",
    note: "约 103 公里的雨林海岸公路，瀑布、竹林与黑沙滩一路展开。弯道和窄桥密集，请带晕车药并避免摸黑返程。",
    image: "/places/hana.jpg",
    map: "Road to Hana Maui",
    duration: "全天",
    booking: "部分站点需预约",
    tag: "自驾",
  },
  {
    id: "waianapanapa",
    island: "maui",
    name: "怀阿纳帕纳帕黑沙滩",
    en: "Waiʻānapanapa State Park",
    note: "哈纳附近的黑沙、熔岩洞和海蚀拱门集中在一处。海浪可能很强，预约时段不要迟到。",
    image: "/places/waianapanapa.jpg",
    map: "Waiʻānapanapa State Park",
    duration: "半天",
    booking: "非居民需预约",
    tag: "黑沙滩",
  },
  {
    id: "iao",
    island: "maui",
    name: "伊奥山谷",
    en: "ʻĪao Valley State Monument",
    note: "短步道通向云雾雨林与伊奥针峰，路程轻松但湿度高。适合在机场进出日安排。",
    image: "/places/iao.jpg",
    map: "Iao Valley State Monument",
    duration: "半天",
    booking: "非居民需预约",
    tag: "山谷",
  },
  {
    id: "volcanoes",
    island: "big",
    name: "夏威夷火山国家公园",
    en: "Hawaiʻi Volcanoes",
    note: "沿火山口、熔岩隧道与黑色熔岩原野理解这座仍在生长的岛；出发前查看喷发与道路公告。",
    image: "/places/volcanoes.jpg",
    map: "Hawaii Volcanoes National Park",
    duration: "全天",
    booking: "国家公园门票",
    tag: "熔岩",
  },
  {
    id: "maunakea",
    island: "big",
    name: "冒纳凯亚山观星",
    en: "Maunakea Stargazing",
    note: "游客信息站海拔约 2,800 米，日落后星空通透。注意高反和保暖，山顶路段常要求四驱车。",
    image: "/places/maunakea.jpg",
    map: "Mauna Kea Visitor Information Station",
    duration: "夜间",
    booking: "免费 · 看天气",
    tag: "星空",
  },
  {
    id: "green",
    island: "big",
    name: "帕帕科雷亚绿沙滩",
    en: "Papakōlea Green Sand Beach",
    note: "橄榄石晶体染绿的稀有沙滩。往返徒步暴晒且无补给，请勿带走沙子或驶入受保护地貌。",
    image: "/places/green.jpg",
    map: "Papakolea Green Sand Beach",
    duration: "半天",
    booking: "免费",
    tag: "海滩",
  },
  {
    id: "manta",
    island: "big",
    name: "夜间浮潜看魔鬼鱼",
    en: "Manta Ray Night Snorkel",
    note: "在科纳海岸借灯光观察蝠鲼进食。选择重视动物距离与安全简报的持证运营商。",
    image: "/places/manta.jpg",
    map: "Manta Ray Village Hawaii",
    duration: "夜间",
    booking: "活动需预订",
    tag: "夜潜",
  },
  {
    id: "punaluu",
    island: "big",
    name: "普纳鲁吾黑沙滩",
    en: "Punaluʻu Black Sand Beach",
    note: "棕榈树下的黑色玄武岩沙滩常有绿海龟休息。保持距离、不触摸，也不要带走黑沙。",
    image: "/places/punaluu.jpg",
    map: "Punalu'u Black Sand Beach",
    duration: "半天",
    booking: "免费",
    tag: "海龟",
  },
  {
    id: "akaka",
    island: "big",
    name: "阿卡卡瀑布",
    en: "ʻAkaka Falls State Park",
    note: "铺装环形步道穿过竹林与热带植物，抵达约 135 米高的瀑布，是希洛一侧轻松而高回报的停靠点。",
    image: "/places/akaka.jpg",
    map: "Akaka Falls State Park",
    duration: "半天",
    booking: "入园 / 停车付费",
    tag: "瀑布",
  },
  {
    id: "napali",
    island: "kauai",
    name: "纳帕利海岸",
    en: "Nā Pali Coast",
    note: "刀锋般的翠绿海崖直落太平洋。可选乘船或直升机；晕船者优先清晨航次并提前服药。",
    image: "/places/napali.jpg",
    map: "Na Pali Coast State Wilderness Park",
    duration: "半天",
    booking: "项目需预订",
    tag: "海岸",
  },
  {
    id: "waimea",
    island: "kauai",
    name: "威美亚峡谷",
    en: "Waimea Canyon",
    note: "被称作“太平洋大峡谷”，沿 550 号公路串联观景台，适合与 Kōkeʻe 州立公园合并游览。",
    image: "/places/waimea.jpg",
    map: "Waimea Canyon State Park",
    duration: "半天",
    booking: "停车 / 入园付费",
    tag: "峡谷",
  },
  {
    id: "hanalei",
    island: "kauai",
    name: "哈纳雷湾",
    en: "Hanalei Bay",
    note: "山海相拥的月牙形海湾，适合用一段慢节奏日落结束可爱岛旅程；冬季注意浪况。",
    image: "/places/hanalei.JPG",
    map: "Hanalei Bay",
    duration: "半天",
    booking: "免费",
    tag: "日落",
  },
  {
    id: "kilauea",
    island: "kauai",
    name: "基拉韦厄灯塔",
    en: "Kīlauea Point Wildlife Refuge",
    note: "历史灯塔立在北岸海崖上，是观察信天翁、军舰鸟与海景的安静地点；开放日有限。",
    image: "/places/kilauea.jpg",
    map: "Kilauea Point National Wildlife Refuge",
    duration: "半天",
    booking: "需预约",
    tag: "观鸟",
  },
  {
    id: "wailua",
    island: "kauai",
    name: "怀卢阿瀑布",
    en: "Wailua Falls",
    note: "双股瀑布从公路观景台即可看到，适合与东岸行程顺路停靠。停车空间很小，避免阻塞道路。",
    image: "/places/wailua.jpg",
    map: "Wailua Falls Kauai",
    duration: "半天",
    booking: "免费",
    tag: "瀑布",
  },
];
const allPlaces = [...places, ...(extraPlaces as Place[])].map((place) => {
  const guide = lonelyPlanetGuides[place.id];
  const detail = detailForLegacySpot(place.id);
  if (place.island === "oahu" || !guide) return { ...place, detail };
  return {
    ...place,
    detail,
    guide: {
      summary: guide.summary,
      tips: [`适合：${guide.fit}`],
      page: "Lonely Planet Hawaii · 中文意译",
    },
  };
});

const feedback: Record<
  string,
  { rating: string; count: string; text: string }
> = {
  sharks: {
    rating: "4.7",
    count: "5,321",
    text: "高频提到鱼群、潮池和海龟；水鞋、防晒与早点到停车几乎是共识。",
  },
  manoa: {
    rating: "4.7",
    count: "5,409",
    text: "游客喜欢沉浸式雨林，但反复提醒泥泞、蚊虫和驱虫剂。",
  },
  lyon: {
    rating: "4.7",
    count: "868",
    text: "安静、植物丰富、步道舒服；驱虫剂和与瀑布顺路安排被多次提及。",
  },
  diamond: {
    rating: "4.7",
    count: "17,282",
    text: "顶峰视野很值，隧道和楼梯比想象中累；防晒、饮水和早出发是高频建议。",
  },
  lanikai: {
    rating: "4.8",
    count: "2,153",
    text: "日出、细沙和双子岛景观评价极高；住宅区停车与保持安静是主要提醒。",
  },
  pearl: {
    rating: "4.8",
    count: "27,516",
    text: "普遍认为庄重且值得预留半天；提前订船票、少带包能让入场更顺畅。",
  },
  haleakala: {
    rating: "4.8",
    count: "35,000+",
    text: "云海、火山色彩和日出最受赞赏；寒冷、山路和预约是最常见提醒。",
  },
  hana: {
    rating: "4.8",
    count: "10,000+",
    text: "瀑布和雨林令人惊喜，但大家都建议少设停靠点、带晕车药并在天黑前结束。",
  },
  waianapanapa: {
    rating: "4.7",
    count: "4,988",
    text: "黑沙、熔岩管和海蚀景观最受欢迎；风浪、预约时段和礁石鞋需注意。",
  },
  iao: {
    rating: "4.6",
    count: "5,492",
    text: "雨林溪流和短步道适合轻松游；云雾变化快，楼梯湿滑时要慢行。",
  },
  volcanoes: {
    rating: "4.8",
    count: "13,600",
    text: "火山口、熔岩管、蒸汽口最常被称赞；园区很大，游客建议提前下载地图。",
  },
  maunakea: {
    rating: "4.7",
    count: "139+",
    text: "日落和星空震撼；四驱限制、停车、低温和高反是核心提醒。",
  },
  green: {
    rating: "4.6",
    count: "2,127",
    text: "绿色沙湾独特，但暴晒和徒步强度常被低估；不要开车碾压脆弱地貌。",
  },
  manta: {
    rating: "4.9",
    count: "多家运营商",
    text: "近距离看蝠鲼常被形容为难忘；怕冷者要选有潜水服、流程清楚的运营商。",
  },
  punaluu: {
    rating: "4.7",
    count: "1,476",
    text: "黑沙与绿海龟是最大亮点；水鞋、保持动物距离和不带走沙子被反复提醒。",
  },
  akaka: {
    rating: "4.6",
    count: "8,667",
    text: "瀑布和竹林环线很上镜；台阶湿滑、入口收费方式和蚊虫是常见提醒。",
  },
  napali: {
    rating: "4.8",
    count: "2,050",
    text: "海崖尺度让人震撼；乘船者普遍建议吃晕船药，清晨海况往往更友好。",
  },
  waimea: {
    rating: "4.9",
    count: "7,155",
    text: "峡谷层次和观景台回报很高；云雾会迅速遮挡视野，建议早到并准备雨具。",
  },
  hanalei: {
    rating: "4.8",
    count: "406",
    text: "山景、日落和开阔海湾最受喜欢；冬季风浪较强，游泳前先看警示旗。",
  },
  kilauea: {
    rating: "4.7",
    count: "1,000+",
    text: "灯塔、海崖和观鸟体验评价稳定；开放日和预约名额需要提前确认。",
  },
  wailua: {
    rating: "4.5",
    count: "1,101",
    text: "无需徒步就能看到瀑布很方便；停车位少、路肩拥挤是最常见抱怨。",
  },
};
function feedbackFor(place: Place) {
  return (
    feedback[place.id] || {
      rating: place.stars ? `${place.stars}.0 推荐` : "攻略推荐",
      count: "新增地点",
      text: "已按旅行清单补入。评分、营业和预约状态可能变化，出发前请在 Google Maps 查看近期反馈。",
    }
  );
}

const initialRoute = location.hash.slice(1) || "home";
const page = ref(
  initialRoute.includes("/spot/")
    ? initialRoute.split("/spot/")[0]
    : initialRoute,
);
const selected = ref<string[]>([
  "sharks",
  "manoa",
  "lyon",
  "haleakala",
  "hana",
  "volcanoes",
  "maunakea",
  "manta",
  "napali",
  "waimea",
]);
const mapPlace = ref<Place | null>(null);
const detailPlace = ref<Place | null>(null);
const selectedActivity = ref<ActivityId>("all");
const copiedSpotId = ref<string | null>(null);
let copyResetTimer: ReturnType<typeof setTimeout> | undefined;
const todos = ref([
  { id: 1, text: "办理 ESTA，确认护照有效期", done: false },
  { id: 2, text: "预约火山日出和热门活动", done: false },
  { id: 3, text: "准备晕车药、浮潜装备和薄羽绒", done: false },
]);
const islandId = computed(() =>
  page.value in islands ? (page.value as IslandId) : null,
);
const islandPlaces = computed(() =>
  islandId.value ? allPlaces.filter((p) => p.island === islandId.value) : [],
);
const islandSelectedPlaces = computed(() =>
  islandPlaces.value.filter((p) => selected.value.includes(p.id)),
);
const filteredIslandPlaces = computed(() => {
  const activity = activityFilters.find(
    (item) => item.id === selectedActivity.value,
  );
  if (!activity || activity.id === "all") return islandPlaces.value;
  return islandPlaces.value.filter((place) => {
    const haystack =
      `${place.tag} ${place.name} ${place.en} ${place.note}`.toLowerCase();
    return activity.keywords.some((keyword) =>
      haystack.includes(keyword.toLowerCase()),
    );
  });
});
const chosen = computed(() =>
  allPlaces.filter((p) => selected.value.includes(p.id)),
);
function relatedPlacesFor(place: Place) {
  const relatedIds = new Set(place.detail?.related_spots || []);
  return allPlaces.filter(
    (candidate) =>
      candidate.id !== place.id &&
      candidate.detail &&
      relatedIds.has(candidate.detail.identity.id),
  );
}
function go(to: string) {
  detailPlace.value = null;
  page.value = to;
  location.hash = to;
  scrollTo({ top: 0, behavior: "smooth" });
}
function openSpotDetail(place: Place) {
  detailPlace.value = place;
  page.value = place.island;
  location.hash = `${place.island}/spot/${place.id}`;
  scrollTo({ top: 0, behavior: "smooth" });
}
function closeSpotDetail() {
  if (!detailPlace.value) return;
  const island = detailPlace.value.island;
  detailPlace.value = null;
  page.value = island;
  location.hash = island;
  scrollTo({ top: 0, behavior: "smooth" });
}
function syncRouteFromHash() {
  const next = location.hash.slice(1) || "home";
  const [routePage, spotId] = next.split("/spot/");
  if (spotId) {
    const place = allPlaces.find(
      (item) => item.id === spotId && item.island === routePage,
    );
    if (place) {
      page.value = place.island;
      detailPlace.value = place;
      return;
    }
  }
  detailPlace.value = null;
  page.value = next === "plan" ? "oahu" : next;
}
function toggle(id: string) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((x) => x !== id)
    : [...selected.value, id];
}
function spotSearchText(place: Place) {
  return `${islands[place.island].name} ${place.name} ${place.en}`;
}
function copyTextSynchronously(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}
async function copySpotName(place: Place) {
  const text = `${place.name} · ${place.en}`;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    copyTextSynchronously(text);
  }
  copiedSpotId.value = place.id;
  if (copyResetTimer) clearTimeout(copyResetTimer);
  copyResetTimer = setTimeout(() => {
    copiedSpotId.value = null;
  }, 1800);
}
function xiaohongshuSearchUrl(place: Place) {
  const keyword = encodeURIComponent(spotSearchText(place));
  return `xhsdiscover://search/result?keyword=${keyword}&target_search=notes&source=deeplink`;
}
function prepareXiaohongshu(place: Place) {
  copyTextSynchronously(spotSearchText(place));
  copiedSpotId.value = place.id;
  if (copyResetTimer) clearTimeout(copyResetTimer);
  copyResetTimer = setTimeout(() => {
    copiedSpotId.value = null;
  }, 1800);
}
function openGeneratedPlan() {
  const plannerResult = planTrip({
    trip: {
      startDate: "2026-09-26",
      endDate: "2026-10-05",
      planningDates: [
        "2026-09-27",
        "2026-09-28",
        "2026-09-29",
        "2026-09-30",
        "2026-10-01",
        "2026-10-02",
        "2026-10-03",
        "2026-10-04",
      ],
      islandOrder: Object.keys(islands),
      arrivalIsland: "oahu",
      departureIsland: "oahu",
    },
    selectedSpots: chosen.value.map((item) => ({
      ...item,
      priority: item.stars,
    })),
    preferences: {
      pace: "balanced",
      interests: [],
      maxDrivingMinutesPerDay: 180,
      hikingTolerance: "medium",
      earlyStartTolerance: "medium",
      avoidBackToBackHardDays: true,
    },
  });
  if (!plannerResult.validation.valid) {
    alert(
      `行程未通过可行性校验：${plannerResult.validation.errors.map((issue) => issue.message).join("；")}`,
    );
    return;
  }
  const adaptedPlan = plannerResultToTravelPlanPage(
    plannerResult,
    chosen.value,
    Object.fromEntries(
      Object.entries(islands).map(([id, island]) => [id, island.name]),
    ),
  );
  const generatedDays = adaptedPlan.days;
  const ticketItems = chosen.value
    .filter(
      (item) =>
        /预约|门票|预订/.test(item.booking) &&
        plannerResult.decisions.find((decision) => decision.spotId === item.id)
          ?.status === "planned",
    )
    .map((item) => {
      const dayIndex = generatedDays.findIndex((day) =>
        day.schedule.some(
          (schedule) => "placeId" in schedule && schedule.placeId === item.id,
        ),
      );
      return {
        id: `ticket-${item.id}`,
        day: dayIndex + 1,
        dayId: `day-${dayIndex + 1}`,
        name: item.name,
        requirement: "advance-required",
        guidance: [item.booking],
        purchaseStatus: "pending",
      };
    });
  const data = {
    schemaVersion: "2.0-lite",
    config: {
      schemaVersion: "1.0.0",
      modules: {
        flights: true,
        overview: false,
        itinerary: true,
        todo: true,
        driving: true,
        ledger: false,
      },
      language: "zh-CN",
      persistence: { mode: "local" },
    },
    metadata: {
      tripId: "hawaii-for-two-2026",
      title: "夏威夷旅行计划",
      language: "zh-CN",
      timeZone: "Pacific/Honolulu",
      assets: {},
    },
    trip: {
      status: "draft",
      startDate: "2026-09-26",
      endDate: "2026-10-07",
      dayCount: generatedDays.length,
      nightCountAway: 9,
      countries: [{ code: "US", nameZh: "夏威夷", nameEn: "HAWAIʻI" }],
      primaryDestinationCountries: ["US"],
      citiesAndAreas: [
        ...new Set(
          plannerResult.days.map((day) => islands[day.island as IslandId].name),
        ),
      ],
      routeSummary: "香港 → 洛杉矶 → 夏威夷群岛 → 旧金山 → 香港",
      groupSize: 2,
      heroTitle: "夏威夷旅行计划",
      heroEyebrow: "HAWAIʻI TRIP PLAN",
    },
    flightJourneys: [{ id: "outbound" }, { id: "return" }],
    flights: [
      {
        id: "ua153",
        journeyId: "outbound",
        sequence: 1,
        airline: { nameZh: "美国联合航空" },
        flightNumber: "UA153",
        departure: {
          airportCode: "HKG",
          city: "香港",
          date: "2026-09-26",
          time: "12:40",
          utcOffset: "+08:00",
        },
        arrival: {
          airportCode: "LAX",
          city: "洛杉矶",
          date: "2026-09-26",
          time: "11:10",
          utcOffset: "-07:00",
        },
      },
      {
        id: "ua1224",
        journeyId: "outbound",
        sequence: 2,
        airline: { nameZh: "美国联合航空" },
        flightNumber: "UA1224",
        departure: {
          airportCode: "LAX",
          city: "洛杉矶",
          date: "2026-09-26",
          time: "13:15",
          utcOffset: "-07:00",
        },
        arrival: {
          airportCode: "HNL",
          city: "檀香山",
          date: "2026-09-26",
          time: "16:09",
          utcOffset: "-10:00",
        },
      },
      {
        id: "ua1947",
        journeyId: "return",
        sequence: 1,
        airline: { nameZh: "美国联合航空" },
        flightNumber: "UA1947",
        departure: {
          airportCode: "HNL",
          city: "檀香山",
          date: "2026-10-05",
          time: "14:10",
          utcOffset: "-10:00",
        },
        arrival: {
          airportCode: "SFO",
          city: "旧金山",
          date: "2026-10-05",
          time: "22:25",
          utcOffset: "-07:00",
        },
      },
      {
        id: "ua877",
        journeyId: "return",
        sequence: 2,
        airline: { nameZh: "美国联合航空" },
        flightNumber: "UA877",
        departure: {
          airportCode: "SFO",
          city: "旧金山",
          date: "2026-10-05",
          time: "23:30",
          utcOffset: "-07:00",
        },
        arrival: {
          airportCode: "HKG",
          city: "香港",
          date: "2026-10-07",
          time: "05:00",
          utcOffset: "+08:00",
        },
      },
    ],
    accommodations: [],
    groundTransport: {
      rentalCar: {
        company: "分岛租车 · 待预订",
        rentalPeriodDays: 8,
        vehicle: { example: "中型 SUV", class: "适合双人行李" },
        unlimitedKilometers: true,
        price: { currency: "USD", payAtCounter: 0 },
        insurance: ["确认碰撞险与道路救援", "核实非铺装道路限制"],
        pickup: {
          date: "2026-09-27",
          time: "08:00",
          location: "檀香山机场",
          address: "Daniel K. Inouye International Airport",
          utcOffset: "-10:00",
        },
        dropoff: {
          date: "2026-10-05",
          time: "11:00",
          timeZoneLabel: "夏威夷时间",
          vehicleReturnPoint: "檀香山机场租车中心",
          deadlineWarning: "跨岛时各岛独立取还车，不要把车辆带上飞机。",
          recommendedArrivalTime: "10:30",
          utcOffset: "-10:00",
        },
      },
      rentalChecklist: [
        "取车时拍摄车身与油表",
        "确认保险、驾驶员和道路限制",
        "每次跨岛前完成还车",
      ],
      drivingNotes: [
        "右侧通行，红灯右转前完全停车",
        "全员系安全带，驾驶时不要手持手机",
        "哈纳之路避免摸黑，冒纳凯亚先核实四驱要求",
      ],
      drivingReferenceLinks: [
        {
          label: "夏威夷官方驾驶资料",
          url: "https://hidot.hawaii.gov/highways/library/motor-vehicle-safety-office/",
        },
      ],
      plannedRoadLegs: adaptedPlan.plannedRoadLegs,
      publicTransitAndRail: [],
    },
    days: generatedDays,
    places: adaptedPlan.places,
    restaurants: [],
    bookingsAndTickets: [],
    ticketPlanning: {
      statusStorage: "local",
      statusStorageNote: "购票状态只保存在当前浏览器。",
      items: ticketItems,
    },
    preTrip: {
      packingItems: todos.value.map((todo) => ({
        id: String(todo.id),
        text: todo.text,
        completed: todo.done,
      })),
      preparationsExplicitlyMentioned: [],
      missingNote: "",
    },
    mapLinks: {
      providedGoogleMapsLinks: [],
      note: "地点按钮会在页面内打开 Google Maps。",
      cityLevelNavigationDisabled: false,
      navigationPolicy: {
        noNavigationTypes: ["flight", "note", "rest", "transfer"],
        selfNavigationTypes: [
          "drive",
          "restaurant",
          "attraction",
          "walk",
          "hike",
        ],
      },
      navigationPlaces: [],
    },
    issuesAndUncertainties: [
      "岛间航班、住宿和租车订单仍待确认；出发前请复核预约与道路状态。",
      "当前驾车时间为分区降级估算，尚未接入实时路由。",
    ],
    map: adaptedPlan.map,
    planner: adaptedPlan.planner,
  };
  localStorage.setItem("hawaii-generated-trip-data", JSON.stringify(data));
  window.location.href = `${import.meta.env.BASE_URL}generated-plan/index.html`;
}
onMounted(() => {
  try {
    const s = JSON.parse(localStorage.getItem("our-hawaii-plan") || "{}");
    if (s.selected) selected.value = s.selected;
    if (s.todos) todos.value = s.todos;
  } catch {
    // Ignore malformed legacy local state and continue with clean defaults.
  }
  if (page.value === "plan") go("oahu");
  else syncRouteFromHash();
  addEventListener("hashchange", syncRouteFromHash);
});
watch(
  [selected, todos],
  () =>
    localStorage.setItem(
      "our-hawaii-plan",
      JSON.stringify({ selected: selected.value, todos: todos.value }),
    ),
  { deep: true },
);
watch(islandId, () => {
  selectedActivity.value = "all";
});
</script>

<template>
  <header
    class="topbar"
    :class="{
      'home-topbar': page === 'home',
      'island-topbar': Boolean(islandId),
    }"
  >
    <button class="logo" @click="go('home')">
      <i>H</i
      ><span><b>夏威夷旅行计划</b><small>HAWAIʻI TRIP PLANNER</small></span>
    </button>
    <nav class="chapter-nav" aria-label="岛屿章节">
      <button
        class="home-link"
        :class="{ active: page === 'home' }"
        @click="go('home')"
      >
        <span>00</span>首页
      </button>
      <button
        v-for="(x, id) in islands"
        :key="id"
        :class="{ active: page === id }"
        @click="go(id)"
      >
        <span>0{{ Object.keys(islands).indexOf(id) + 1 }}</span
        >{{ x.name }}
      </button>
    </nav>
    <button class="plan-link" @click="openGeneratedPlan">
      <span><small>FINAL PLAN</small>生成计划</span
      ><em>{{ selected.length }}</em
      ><i>→</i>
    </button>
  </header>

  <main v-if="page === 'home'" class="home-page">
    <section class="hero">
      <div>
        <p class="eyebrow">EXPLORE THE ISLANDS</p>
        <h1>Hawaii</h1>
        <p class="lead">Six islands. Endless adventures.</p>
      </div>
    </section>
    <section class="section-title">
      <p>CHOOSE YOUR ISLAND</p>
      <h2>Choose an island to start planning</h2>
    </section>
    <section class="island-grid">
      <button
        v-for="card in homeIslandCards"
        :key="card.name"
        class="island-card"
        :class="{ 'island-card-static': !card.id }"
        :aria-disabled="!card.id"
        @click="card.id && go(card.id)"
      >
        <img :src="assetUrl(card.image)" :alt="`${card.name} island`" />
        <span>
          <h3>{{ card.name }}</h3>
          <p>{{ card.tagline }}</p>
        </span>
      </button>
    </section>
    <aside class="island-compare" aria-label="Island comparison">
      <img :src="assetUrl('/places/lanikai.jpg')" alt="Hawaii island coast" />
      <span>
        <b>Not sure which island?</b>
        <small>Compare islands and find your perfect fit</small>
      </span>
      <i aria-hidden="true">›</i>
    </aside>
  </main>

  <main v-else-if="detailPlace" class="spot-detail-page">
    <section
      class="spot-detail-hero"
      :style="{
        backgroundImage: `linear-gradient(180deg, rgba(0,28,38,.04) 22%, rgba(0,30,40,.94) 100%), url(${assetUrl(detailPlace.image)})`,
      }"
    >
      <button
        class="detail-back"
        aria-label="返回景点列表"
        @click="closeSpotDetail"
      >
        ‹
      </button>
      <div class="detail-hero-copy">
        <span class="detail-island-chip">{{
          islands[detailPlace.island].name
        }}</span>
        <h1>{{ detailPlace.name }}</h1>
        <h2>{{ detailPlace.detail?.hero?.tagline || detailPlace.note }}</h2>
        <div class="detail-facts">
          <span
            ><b>{{ detailPlace.tag }}</b
            ><small>Experience</small></span
          >
          <span
            ><b>{{ detailPlace.duration }}</b
            ><small>Duration</small></span
          >
          <span v-if="detailPlace.booking"
            ><b>{{ detailPlace.booking }}</b
            ><small>Access</small></span
          >
        </div>
        <button
          class="detail-add"
          :class="{ picked: selected.includes(detailPlace.id) }"
          @click="toggle(detailPlace.id)"
        >
          {{
            selected.includes(detailPlace.id) ? "✓ 已加入行程" : "+ 加入行程"
          }}
        </button>
        <div class="detail-quick-actions">
          <button @click="copySpotName(detailPlace)">
            {{ copiedSpotId === detailPlace.id ? "✓ 已复制" : "复制名称" }}
          </button>
          <a
            :href="xiaohongshuSearchUrl(detailPlace)"
            @click="prepareXiaohongshu(detailPlace)"
            >小红书攻略 ↗</a
          >
        </div>
      </div>
    </section>

    <nav class="detail-nav" aria-label="景点详情导航">
      <a href="#detail-overview">Overview</a>
      <a href="#detail-photos">Photos</a>
      <a v-if="feedback[detailPlace.id]" href="#detail-reviews">Reviews</a>
      <a v-if="detailPlace.guide?.tips.length" href="#detail-tips">Tips</a>
      <button @click="mapPlace = detailPlace">Map</button>
    </nav>

    <div class="detail-content">
      <section id="detail-overview" class="why-go">
        <header>
          <h2>Why go</h2>
          <a
            v-if="detailPlace.detail?.why_go?.source_url"
            :href="detailPlace.detail.why_go.source_url"
            target="_blank"
            rel="noreferrer"
            >{{ detailPlace.detail.why_go.source }} ↗</a
          >
          <span v-else-if="detailPlace.guide"
            >孤独星球 · {{ detailPlace.guide.page }}</span
          >
        </header>
        <p>
          {{
            detailPlace.detail?.why_go?.text ||
            detailPlace.guide?.summary ||
            detailPlace.note
          }}
        </p>
      </section>

      <section class="experience-attributes" aria-label="体验特点">
        <span><i>◌</i>{{ detailPlace.tag }}</span>
        <span><i>◷</i>{{ detailPlace.duration }}</span>
        <span
          v-for="item in detailPlace.detail?.quick_facts?.best_for?.slice(
            0,
            3,
          ) || []"
          :key="item"
          ><i>☆</i>{{ item }}</span
        >
      </section>

      <section
        v-if="detailPlace.detail?.best_moments?.length"
        class="best-moments"
      >
        <header><h2>Best moments</h2></header>
        <div>
          <article
            v-for="moment in detailPlace.detail.best_moments"
            :key="moment.title"
          >
            <img
              v-if="moment.image"
              :src="assetUrl(moment.image)"
              :alt="moment.title"
            />
            <span
              ><b>{{ moment.title }}</b
              ><small>{{ moment.description }}</small></span
            >
          </article>
        </div>
      </section>

      <section id="detail-photos" class="detail-photos">
        <header><h2>Spot photo</h2></header>
        <img :src="assetUrl(detailPlace.image)" :alt="detailPlace.name" />
      </section>

      <section
        v-if="detailPlace.detail?.ratings?.length || feedback[detailPlace.id]"
        id="detail-reviews"
        class="detail-reviews"
      >
        <header>
          <div>
            <h2>Ratings & reviews</h2>
            <p>Sources are shown separately</p>
          </div>
        </header>
        <div class="rating-cards">
          <a
            v-for="rating in detailPlace.detail?.ratings || []"
            :key="`${rating.source}-${rating.url}`"
            class="rating-card"
            :href="rating.url"
            target="_blank"
            rel="noreferrer"
          >
            <span class="source-mark">{{ rating.source.slice(0, 1) }}</span>
            <div>
              <b>{{ rating.source }}</b>
              <strong v-if="rating.rating">{{ rating.rating }} ★</strong>
              <small v-if="rating.review_count"
                >{{ rating.review_count.toLocaleString() }} reviews</small
              >
              <small v-if="rating.difficulty">{{ rating.difficulty }}</small>
              <p v-if="rating.summary">{{ rating.summary }}</p>
              <em>Read reviews →</em>
            </div>
          </a>
          <a
            v-if="feedback[detailPlace.id]"
            class="rating-card"
            :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detailPlace.map)}`"
            target="_blank"
            rel="noreferrer"
          >
            <span class="google-mark">G</span>
            <div>
              <b>Google Maps</b>
              <strong>{{ feedback[detailPlace.id].rating }} ★</strong>
              <small>{{ feedback[detailPlace.id].count }} reviews</small>
              <p>{{ feedback[detailPlace.id].text }}</p>
              <em>Read reviews →</em>
            </div>
          </a>
        </div>
      </section>

      <section
        v-if="
          detailPlace.detail?.traveler_consensus?.positives?.length ||
          detailPlace.detail?.traveler_consensus?.warnings?.length ||
          feedback[detailPlace.id]
        "
        class="traveler-consensus"
      >
        <header>
          <h2>What travelers say</h2>
          <p>Source-backed summaries</p>
        </header>
        <div
          v-if="detailPlace.detail?.traveler_consensus?.positives?.length"
          class="consensus-love"
        >
          <b>✓ What people love</b>
          <ul>
            <li
              v-for="item in detailPlace.detail.traveler_consensus.positives"
              :key="item"
            >
              {{ item }}
            </li>
          </ul>
        </div>
        <div
          v-if="detailPlace.detail?.traveler_consensus?.warnings?.length"
          class="consensus-warnings"
        >
          <b>! Things to know</b>
          <ul>
            <li
              v-for="item in detailPlace.detail.traveler_consensus.warnings"
              :key="item"
            >
              {{ item }}
            </li>
          </ul>
        </div>
        <div
          v-if="detailPlace.detail?.community?.length"
          class="community-cards"
        >
          <a
            v-for="item in detailPlace.detail.community"
            :key="`${item.source}-${item.url}`"
            :href="item.url"
            target="_blank"
            rel="noreferrer"
          >
            <b>{{ item.source }}</b>
            <p>{{ item.summary }}</p>
            <span>Open source →</span>
          </a>
        </div>
      </section>

      <section class="practical-info">
        <h2>Practical information</h2>
        <div>
          <span
            ><i>◷</i><b>Duration</b
            ><small>{{
              detailPlace.detail?.quick_facts?.duration || detailPlace.duration
            }}</small></span
          >
          <span v-if="detailPlace.detail?.quick_facts?.difficulty"
            ><i>△</i><b>Difficulty</b
            ><small>{{
              detailPlace.detail.quick_facts.difficulty
            }}</small></span
          >
          <span v-if="detailPlace.detail?.quick_facts?.distance"
            ><i>↔</i><b>Distance</b
            ><small>{{ detailPlace.detail.quick_facts.distance }}</small></span
          >
          <a
            v-if="detailPlace.detail?.quick_facts?.official_access_url"
            :href="detailPlace.detail.quick_facts.official_access_url"
            target="_blank"
            rel="noreferrer"
            ><i>◇</i><b>Access</b
            ><small>{{
              detailPlace.detail.quick_facts.reservation || detailPlace.booking
            }}</small></a
          >
          <span v-else
            ><i>◇</i><b>Access</b
            ><small>{{
              detailPlace.detail?.quick_facts?.reservation ||
              detailPlace.booking
            }}</small></span
          >
          <span v-if="detailPlace.detail?.quick_facts?.best_time"
            ><i>☀</i><b>Best time</b
            ><small>{{ detailPlace.detail.quick_facts.best_time }}</small></span
          >
          <button @click="mapPlace = detailPlace">
            <i>⌖</i><b>Location</b><small>View map</small>
          </button>
        </div>
        <p
          v-if="detailPlace.detail?.quick_facts?.what_to_bring?.length"
          class="bring-list"
        >
          <b>What to bring:</b>
          {{ detailPlace.detail.quick_facts.what_to_bring.join(" · ") }}
        </p>
      </section>

      <section
        v-if="detailPlace.guide?.tips.length"
        id="detail-tips"
        class="detail-tips"
      >
        <h2>Things to know</h2>
        <ul>
          <li v-for="tip in detailPlace.guide.tips" :key="tip">{{ tip }}</li>
        </ul>
      </section>

      <section v-if="detailPlace.detail?.fit" class="detail-fit">
        <h2>Is this for you?</h2>
        <div>
          <article v-if="detailPlace.detail.fit.great_for?.length">
            <b>✓ Great for</b>
            <ul>
              <li v-for="item in detailPlace.detail.fit.great_for" :key="item">
                {{ item }}
              </li>
            </ul>
          </article>
          <article v-if="detailPlace.detail.fit.avoid_if?.length">
            <b>! Maybe skip if</b>
            <ul>
              <li v-for="item in detailPlace.detail.fit.avoid_if" :key="item">
                {{ item }}
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section
        v-if="relatedPlacesFor(detailPlace).length"
        class="related-spots"
      >
        <h2>Related spots nearby</h2>
        <div>
          <button
            v-for="related in relatedPlacesFor(detailPlace)"
            :key="related.id"
            @click="openSpotDetail(related)"
          >
            <img :src="assetUrl(related.image)" :alt="related.name" /><span
              ><b>{{ related.name }}</b
              ><small>{{ related.tag }}</small></span
            >
          </button>
        </div>
      </section>

      <section
        v-if="detailPlace.detail?.sources?.length"
        class="detail-sources"
      >
        <h2>Sources</h2>
        <div>
          <a
            v-for="source in detailPlace.detail.sources"
            :key="`${source.name}-${source.url}`"
            :href="source.url"
            target="_blank"
            rel="noreferrer"
            >{{ source.name }} ↗</a
          >
        </div>
      </section>
    </div>

    <div class="detail-bottom-cta">
      <button @click="mapPlace = detailPlace">Map</button>
      <button
        :class="{ picked: selected.includes(detailPlace.id) }"
        @click="toggle(detailPlace.id)"
      >
        {{ selected.includes(detailPlace.id) ? "✓ 已加入" : "+ 加入行程" }}
      </button>
    </div>
  </main>

  <main v-else-if="islandId" class="island-page spot-picker-page">
    <section
      class="island-hero"
      :style="{
        '--accent': islands[islandId].color,
        backgroundImage: `linear-gradient(180deg, rgba(0,33,45,.04) 24%, rgba(0,31,41,.9) 100%), url(${assetUrl(islandPresentation[islandId].image)})`,
      }"
    >
      <button class="island-back" aria-label="返回首页" @click="go('home')">
        ‹
      </button>
      <div class="island-hero-copy">
        <p>HAWAIʻI ISLANDS</p>
        <h1>{{ islandPresentation[islandId].title }}</h1>
        <h2>{{ islandPresentation[islandId].description }}</h2>
        <div class="island-summary">
          <span
            ><b>{{ islandPlaces.length }}</b
            ><small>featured spots</small></span
          >
          <span
            ><b>{{ islandSelectedPlaces.length }}</b
            ><small>selected</small></span
          >
        </div>
      </div>
    </section>
    <section class="activity-panel">
      <h2>
        What do you want to do in {{ islandPresentation[islandId].title }}?
      </h2>
      <div class="activity-grid" role="tablist" aria-label="活动筛选">
        <button
          v-for="activity in activityFilters"
          :key="activity.id"
          :class="{ active: selectedActivity === activity.id }"
          role="tab"
          :aria-selected="selectedActivity === activity.id"
          @click="selectedActivity = activity.id"
        >
          <i aria-hidden="true">{{ activity.icon }}</i>
          <span>{{ activity.label }}</span>
        </button>
      </div>
    </section>
    <section
      class="spot-results"
      :class="{ compact: selectedActivity !== 'all' }"
    >
      <header>
        <h2>
          {{
            selectedActivity === "all"
              ? `Top experiences in ${islandPresentation[islandId].title}`
              : `${activityFilters.find((x) => x.id === selectedActivity)?.label} in ${islandPresentation[islandId].title}`
          }}
        </h2>
        <span>{{ filteredIslandPlaces.length }} spots</span>
      </header>
      <div v-if="filteredIslandPlaces.length" class="spot-list">
        <article
          v-for="p in filteredIslandPlaces"
          :key="p.id"
          role="button"
          tabindex="0"
          :aria-label="`查看 ${p.name} 详情`"
          @click="openSpotDetail(p)"
          @keydown.enter.self="openSpotDetail(p)"
        >
          <img :src="assetUrl(p.image)" :alt="p.name" />
          <div class="spot-copy">
            <span class="spot-tag">{{ p.tag }}</span>
            <h3>{{ p.name }}</h3>
            <p>{{ p.note }}</p>
            <blockquote>
              “{{ p.guide?.summary || feedbackFor(p).text }}”
              <small v-if="p.guide">— 孤独星球 · {{ p.guide.page }}</small>
              <small v-else>— Google Maps 游客反馈</small>
            </blockquote>
            <div class="spot-source-actions">
              <button class="spot-map-link" @click.stop="mapPlace = p">
                Google Maps ↗
              </button>
              <button @click.stop="copySpotName(p)">
                {{ copiedSpotId === p.id ? "✓ 已复制" : "复制名称" }}
              </button>
              <a
                :href="xiaohongshuSearchUrl(p)"
                @click.stop="prepareXiaohongshu(p)"
                >小红书攻略 ↗</a
              >
            </div>
          </div>
          <button
            class="spot-select"
            :class="{ picked: selected.includes(p.id) }"
            :aria-label="
              selected.includes(p.id) ? `取消选择 ${p.name}` : `选择 ${p.name}`
            "
            @click.stop="toggle(p.id)"
          >
            {{ selected.includes(p.id) ? "✓" : "+" }}
          </button>
        </article>
      </div>
      <p v-else class="spot-empty">当前活动下暂无地点，试试其他分类。</p>
    </section>
    <details class="island-field-notes">
      <summary>{{ islandTips[islandId].title }}</summary>
      <ul>
        <li v-for="tip in islandTips[islandId].items" :key="tip.text">
          {{ tip.text }} <small>{{ tip.source }}</small>
        </li>
      </ul>
    </details>
    <div v-if="selected.length" class="dock spot-picker-dock">
      <div>
        <span
          ><b>{{ selected.length }}</b> places selected</span
        >
        <span class="selected-thumbs">
          <img
            v-for="p in chosen.slice(0, 3)"
            :key="p.id"
            :src="assetUrl(p.image)"
            :alt="p.name"
          />
        </span>
      </div>
      <button
        v-if="islandSelectedPlaces[0]"
        @click="mapPlace = islandSelectedPlaces[0]"
      >
        View map
      </button>
      <button @click="openGeneratedPlan">Plan →</button>
    </div>
  </main>

  <footer>
    <div class="logo">
      <i>☀</i><span><b>夏威夷旅行计划</b></span>
    </div>
    <p>尊重土地、海洋与当地社区。开放和预约信息可能变化，出发前请再次核实。</p>
    <button @click="go('home')">回到开头 ↑</button>
  </footer>
  <div
    v-if="mapPlace"
    class="modal"
    role="dialog"
    aria-modal="true"
    @click.self="mapPlace = null"
  >
    <div class="map-modal">
      <button class="x" @click="mapPlace = null">×</button>
      <div>
        <small>{{ islands[mapPlace.island].en }} · {{ mapPlace.tag }}</small>
        <h2>{{ mapPlace.name }}</h2>
        <p>{{ mapPlace.note }}</p>
        <div v-if="mapPlace.guide" class="guide-note">
          <header>
            <span>LP</span><b>孤独星球</b
            ><small>{{ mapPlace.guide.page }}</small>
          </header>
          <p>{{ mapPlace.guide.summary }}</p>
          <ul>
            <li v-for="tip in mapPlace.guide.tips" :key="tip">{{ tip }}</li>
          </ul>
        </div>
        <blockquote class="review-note">
          <span
            >★ {{ feedbackFor(mapPlace).rating }} ·
            {{ feedbackFor(mapPlace).count }}</span
          >
          {{ feedbackFor(mapPlace).text }}
        </blockquote>
        <a
          :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapPlace.map)}`"
          target="_blank"
          >在 Google Maps 打开 ↗</a
        >
      </div>
      <iframe
        :src="`https://maps.google.com/maps?q=${encodeURIComponent(mapPlace.map)}&output=embed`"
        title="地点地图"
        loading="lazy"
      ></iframe>
    </div>
  </div>
</template>
