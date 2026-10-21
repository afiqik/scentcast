function calcSkinTemp(ambient) {
  return Number((Number(ambient) + 2.8).toFixed(1));
}

function calcEvaporationRate(temp, windSpeed = 10) {
  const base = temp / 25;
  const windFactor = 1 + (windSpeed / 50);
  return Number((base * windFactor).toFixed(1));
}

function calcProjectionHold(temp, humidity) {
  const t = Number(temp);
  if (t < 20) return '7 - 10 Jam';
  if (t > 27) return '4 - 6 Jam';
  return '6 - 8 Jam';
}

function calcRecFamily(temp, humidity) {
  const t = Number(temp);
  if (t < 20) return 'Amber / Woody / Warm Spicy';
  if (t > 27) return 'Aquatic Marine / Fresh Citrus';
  return 'Floral / Aromatic / Fresh Spicy';
}

function calcSprayAdvice(temp, humidity) {
  if (humidity > 80) {
    return 'Kelembapan tinggi (>80% RH): Sembur pada kolar atau fabrik pakaian untuk elak molekul dihanyutkan peluh.';
  } else if (humidity < 50) {
    return 'Udara agak kering: Lembapkan kulit dengan losyen tanpa bau sebelum menyembur untuk unjuran optimum.';
  } else if (temp >= 33) {
    return 'Cuaca panas terik: Hadkan 3-4 semburan pada titik nadi (leher & pergelangan tangan).';
  }
  return 'Semburan standard 4-5 semburan pada nadi dan pakaian.';
}

const RAW_CITIES = [
  { id: 'kl', name: 'Kuala Lumpur', region: 'Semenanjung', temp: 32, humidity: 78, windSpeed: 11, condition: 'Terik Lembap', uvIndex: 9.2, heatIndex: 38 },
  { id: 'putrajaya', name: 'Putrajaya', region: 'Semenanjung', temp: 32, humidity: 77, windSpeed: 10, condition: 'Panas Tropika', uvIndex: 9.0, heatIndex: 38 },
  { id: 'labuan', name: 'Labuan', region: 'Sabah', temp: 30, humidity: 83, windSpeed: 14, condition: 'Lembap Pesisir', uvIndex: 8.5, heatIndex: 36 },
  { id: 'shah-alam', name: 'Shah Alam', region: 'Semenanjung', temp: 32, humidity: 80, windSpeed: 9, condition: 'Lembap Hujan Tropika', uvIndex: 8.9, heatIndex: 39 },
  { id: 'petaling-jaya', name: 'Petaling Jaya', region: 'Semenanjung', temp: 33, humidity: 76, windSpeed: 10, condition: 'Haba Bandar Terik', uvIndex: 9.3, heatIndex: 40 },
  { id: 'klang', name: 'Klang', region: 'Semenanjung', temp: 31, humidity: 82, windSpeed: 13, condition: 'Angin Muara Lembap', uvIndex: 8.6, heatIndex: 37 },
  { id: 'george-town', name: 'George Town', region: 'Semenanjung', temp: 31, humidity: 82, windSpeed: 15, condition: 'Angin Pantai & Lembap', uvIndex: 8.8, heatIndex: 37 },
  { id: 'bayan-lepas', name: 'Bayan Lepas', region: 'Semenanjung', temp: 31, humidity: 83, windSpeed: 16, condition: 'Bayu Laut Pesisir', uvIndex: 8.7, heatIndex: 37 },
  { id: 'johor-bahru', name: 'Johor Bahru', region: 'Semenanjung', temp: 32, humidity: 79, windSpeed: 12, condition: 'Panas Tropika Selatan', uvIndex: 9.1, heatIndex: 38 },
  { id: 'batu-pahat', name: 'Batu Pahat', region: 'Semenanjung', temp: 31, humidity: 82, windSpeed: 10, condition: 'Tropika Pesisir Selat', uvIndex: 8.7, heatIndex: 37 },
  { id: 'melaka', name: 'Melaka', region: 'Semenanjung', temp: 31, humidity: 81, windSpeed: 12, condition: 'Hangat Pesisir Selat', uvIndex: 8.8, heatIndex: 37 },
  { id: 'seremban', name: 'Seremban', region: 'Semenanjung', temp: 31, humidity: 80, windSpeed: 8, condition: 'Hangat Lembap Pedalaman', uvIndex: 8.8, heatIndex: 37 },
  { id: 'ipoh', name: 'Ipoh', region: 'Semenanjung', temp: 33, humidity: 74, windSpeed: 7, condition: 'Haba Lembah Kinta', uvIndex: 9.4, heatIndex: 39 },
  { id: 'alor-setar', name: 'Alor Setar', region: 'Semenanjung', temp: 32, humidity: 79, windSpeed: 11, condition: 'Panas Terik Dataran', uvIndex: 9.0, heatIndex: 38 },
  { id: 'langkawi', name: 'Langkawi', region: 'Semenanjung', temp: 30, humidity: 84, windSpeed: 18, condition: 'Bayu Kepulauan Tropika', uvIndex: 8.7, heatIndex: 36 },
  { id: 'kangar', name: 'Kangar', region: 'Semenanjung', temp: 32, humidity: 78, windSpeed: 10, condition: 'Panas Terik Utara', uvIndex: 9.0, heatIndex: 38 },
  { id: 'kota-bharu', name: 'Kota Bharu', region: 'Semenanjung', temp: 30, humidity: 85, windSpeed: 13, condition: 'Lembap Pantai Timur', uvIndex: 8.4, heatIndex: 36 },
  { id: 'kuala-terengganu', name: 'Kuala Terengganu', region: 'Semenanjung', temp: 30, humidity: 84, windSpeed: 15, condition: 'Bayu Laut Tropika', uvIndex: 8.5, heatIndex: 36 },
  { id: 'kuantan', name: 'Kuantan', region: 'Semenanjung', temp: 31, humidity: 82, windSpeed: 12, condition: 'Lembap Pesisir Timur', uvIndex: 8.7, heatIndex: 37 },
  { id: 'genting-highlands', name: 'Genting Highlands', region: 'Tanah Tinggi', temp: 21, humidity: 88, windSpeed: 14, condition: 'Dingin & Berkabus', uvIndex: 6.0, heatIndex: 21 },
  { id: 'cameron-highlands', name: 'Cameron Highlands', region: 'Tanah Tinggi', temp: 18, humidity: 90, windSpeed: 9, condition: 'Dingin Segar Pergunungan', uvIndex: 5.5, heatIndex: 18 },
  { id: 'kota-kinabalu', name: 'Kota Kinabalu', region: 'Sabah', temp: 30, humidity: 80, windSpeed: 12, condition: 'Lembap Pesisir Borneo', uvIndex: 8.5, heatIndex: 36 },
  { id: 'sandakan', name: 'Sandakan', region: 'Sabah', temp: 31, humidity: 82, windSpeed: 13, condition: 'Bayu Laut Sulu', uvIndex: 8.6, heatIndex: 37 },
  { id: 'tawau', name: 'Tawau', region: 'Sabah', temp: 31, humidity: 81, windSpeed: 11, condition: 'Tropika Lembap Timur', uvIndex: 8.6, heatIndex: 37 },
  { id: 'kuching', name: 'Kuching', region: 'Sarawak', temp: 30, humidity: 84, windSpeed: 10, condition: 'Hujan Tropika Lembap', uvIndex: 8.3, heatIndex: 36 },
  { id: 'miri', name: 'Miri', region: 'Sarawak', temp: 31, humidity: 82, windSpeed: 14, condition: 'Pesisir Laut China Selatan', uvIndex: 8.7, heatIndex: 37 },
  { id: 'sibu', name: 'Sibu', region: 'Sarawak', temp: 31, humidity: 83, windSpeed: 8, condition: 'Lembap Sungai Rajang', uvIndex: 8.6, heatIndex: 37 }
];

const processedCities = {};
RAW_CITIES.forEach(c => {
  const rateVal = calcEvaporationRate(c.temp, c.windSpeed);
  const cityObj = {
    id: c.id,
    cityId: c.id,
    name: c.name,
    cityName: c.name,
    region: c.region,
    temp: c.temp,
    temperature: c.temp,
    humidity: c.humidity,
    windSpeed: c.windSpeed,
    condition: c.condition,
    heatIndex: c.heatIndex,
    uvIndex: c.uvIndex,
    skinTemp: calcSkinTemp(c.temp),
    evaporationRate: `${rateVal.toFixed(1)}x`,
    evaporationRateVal: rateVal,
    projectionHold: calcProjectionHold(c.temp, c.humidity),
    recommendedFamily: calcRecFamily(c.temp, c.humidity),
    sprayAdvice: calcSprayAdvice(c.temp, c.humidity),
    statusMessage: `Cuaca ${c.name} ${c.temp}°C, ${c.humidity}% RH. ${calcSprayAdvice(c.temp, c.humidity)}`,
    cachedAt: Date.now(),
    updatedAt: new Date().toISOString(),
    ttlMs: 45 * 60 * 1000
  };
  processedCities[c.id] = cityObj;
});

// Backward-compatible aliases
processedCities['penang'] = processedCities['george-town'];
processedCities['jb'] = processedCities['johor-bahru'];
processedCities['kk'] = processedCities['kota-kinabalu'];
processedCities['genting'] = processedCities['genting-highlands'];
processedCities['kuala-lumpur'] = processedCities['kl'];

export const initialWeatherData = {
  cities: processedCities,
  activeCity: 'kl',
  activeSensorsCount: 27,
  liveUsersCount: 48,
  lastGlobalSync: new Date().toISOString()
};

export const initialPerfumes = [
  {
    id: "turathi-blue",
    name: "Turathi Blue Eau de Parfum",
    brand: "Afnan Perfumes",
    origin: "UAE",
    type: "100ml EDP",
    gender: "male",
    originalDesignerRef: "Bvlgari Tygar",
    matchPercentage: 94,
    rating: 4.8,
    reviewCount: 342,
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuD3jpdjR1-jN4k95RKMnbmQv3KSxbJAisoPxl0IAXal2m4gfmo0DB9tdbP_7hUI7exVMfaIxHwqdlz2M8I8O3-Gho9wEEVT5QF91P5YJe9kMAamYXM8XWppdIYivYwTmDxTC2lRzotbBVWn-N4HpZQpzl2lIc5FCWdenqmbWOeIPLeUr1FpxBEh4tFEUjtNqRJEU2TkRZ6EkzHI2nkDIUHR0PuGwBbq3zJ37p7aN1us5v0EkTxPdgEORw",
    shopeeUrl: "https://shopee.com.my/search?keyword=Afnan%20Turathi%20Blue",
    tiktokUrl: "https://www.tiktok.com/search?q=Afnan%20Turathi%20Blue",
    climateScore: 98,
    sweatResistancePct: 94,
    complimentPct: 92,
    headacheSafePct: 89,
    evaporationVol: "14%",
    batchCode: "MY-2024",
    longevity: "8 - 10 Jam",
    sillageDistance: "2.0 Meter",
    sweatTolerantRating: "9.4 / 10",
    tempZone: "28°C - 36°C",
    accords: ["Citrus", "Amber", "Woody", "Musky"],
    mainAccords: [
      { name: "Citrus", percentage: 88 },
      { name: "Amber", percentage: 72 },
      { name: "Woody", percentage: 65 },
      { name: "Musky", percentage: 55 }
    ],
    bestWeather: ["Terik Lembap", "Kuliah & Kasual", "Pejabat Berhawa Dingin"],
    whenToWear: {
      time: ["Versatile"],
      weather: ["Terik Lembap", "Panas Tropika"],
      occasions: ["Pejabat", "Kasual", "Harian"]
    },
    notes: {
      top: ["Limau Gedang Segar (Grapefruit)", "Bergamot Sicily", "Mandarin"],
      mid: ["Kecacang Kayu Manis", "Rempah Sejuk", "Hedione"],
      base: ["Ambroxan Pekat", "Kayu Gaharu Lembut", "Nilam (Patchouli)", "White Musk"]
    },
    evaporationTiming: {
      top: "0 - 45 min",
      mid: "45 min - 4 jam",
      base: "4 - 10 jam"
    },
    dupesEquivalent: [
      { id: "theoreme", name: "Theoreme Pour Homme", brand: "Rue Broca", match: "95% DNA Match" },
      { id: "al-qiam", name: "Al Qiam Silver", brand: "Lattafa Pride", match: "92% DNA Match" },
      { id: "urban-man-elixir", name: "Urban Man Elixir", brand: "Armaf Club de Nuit", match: "88% Hibrid Match" }
    ],
    searchTokens: [
      "turathi", "blue", "eau", "de", "parfum", "afnan", "perfumes", "male", "lelaki",
      "bvlgari", "tygar", "citrus", "amber", "woody", "musky", "limau", "gedang",
      "grapefruit", "bergamot", "sicily", "mandarin", "ambroxan", "patchouli", "uae"
    ]
  },
  {
    id: "cdnim",
    name: "Club de Nuit Intense Man",
    brand: "Armaf",
    origin: "UAE",
    type: "105ml EDT / EDP",
    gender: "male",
    originalDesignerRef: "Creed Aventus",
    matchPercentage: 92,
    rating: 4.9,
    reviewCount: 1240,
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuD4_UUUDGSTIvXgyR_LWr2H8R26dO3G2pDT_YFYThla2tsg8HD6JOSK3DoyTH0TIJ84Uf46F9ZocU-I_6oPw5ltkNJYDRQW-ToxMO9hszjvXsyNuaX_QcIm2Z-O_rfEKt_6BuW73PJFpI5VU651SOCdJWnUqux8rn5tcldlBKOwgEHzlSD0qWDQsYl9waKX1TRehkrWY9gqfJkRTh2jJQhJKloREzxEuE7GeQdrdfm0rJpfJOFIVUE6nw",
    shopeeUrl: "https://shopee.com.my/search?keyword=Armaf%20Club%20De%20Nuit%20Intense%20Man",
    tiktokUrl: "https://www.tiktok.com/search?q=Armaf%20Club%20De%20Nuit%20Intense%20Man",
    climateScore: 96,
    sweatResistancePct: 96,
    complimentPct: 95,
    headacheSafePct: 84,
    evaporationVol: "11%",
    batchCode: "UAE-2024",
    longevity: "10+ Jam Panas Terik",
    sillageDistance: "2.8 Meter",
    sweatTolerantRating: "9.7 / 10",
    tempZone: "26°C - 38°C",
    accords: ["Fruity Smoky", "Woody", "Leather", "Citrus"],
    mainAccords: [
      { name: "Citrus", percentage: 85 },
      { name: "Fruity Smoky", percentage: 82 },
      { name: "Woody", percentage: 78 },
      { name: "Leather", percentage: 60 }
    ],
    bestWeather: ["Panas Terik", "Aktiviti Luar", "Kuliah & Kasual"],
    whenToWear: {
      time: ["Versatile"],
      weather: ["Panas Terik", "Lembap"],
      occasions: ["Aktiviti Luar", "Malam", "Pejabat"]
    },
    notes: {
      top: ["Lemon Calabria", "Nanas Berasap (Smoky Pineapple)", "Blackcurrant", "Epal"],
      mid: ["Kayu Birch", "Jasmine", "Rose"],
      base: ["Ambergris", "Musk", "Patchouli", "Vanilla"]
    },
    evaporationTiming: {
      top: "0 - 30 min",
      mid: "30 min - 5 jam",
      base: "5 - 12 jam"
    },
    dupesEquivalent: [
      { id: "turathi-blue", name: "Turathi Blue", brand: "Afnan", match: "86% Vibe Segar" },
      { id: "urban-man-elixir", name: "Urban Man Elixir", brand: "Armaf", match: "90% Sauvage x Aventus" }
    ],
    searchTokens: [
      "club", "de", "nuit", "intense", "man", "cdnim", "armaf", "male", "lelaki",
      "creed", "aventus", "lemon", "pineapple", "nanas", "smoky", "birch",
      "leather", "ambergris", "citrus", "woody", "uae"
    ]
  },
  {
    id: "khamrah",
    name: "Khamrah Eau de Parfum",
    brand: "Lattafa Perfumes",
    origin: "UAE",
    type: "100ml EDP",
    gender: "unisex",
    originalDesignerRef: "Kilian Angels' Share",
    matchPercentage: 90,
    rating: 4.6,
    reviewCount: 540,
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOyxjhFy3ptNS0lmhonwEkK5ZukLhjoRpzDRR2tG1Ik0KsytaP5OaY4irqDopFcY0ivQRkxDUPblXP3ykkSyymJGNFh74YGPV_XDJPwHd4o-l_0aC0wU_7KXyvjA8GxgjvaPP8xZHlP9P_FZ5WZAXJzaOVteYMbK7pQgcOZ067qyoxRhTecqr8jo5VSKpjjXruPh9z0ft9v8vHrUszpfRaxswr29GA_qtA5IhV-h018eIW7W7-Ozn58w",
    shopeeUrl: "https://shopee.com.my/search?keyword=Lattafa%20Khamrah",
    tiktokUrl: "https://www.tiktok.com/search?q=Lattafa%20Khamrah",
    climateScore: 82,
    sweatResistancePct: 78,
    complimentPct: 96,
    headacheSafePct: 82,
    evaporationVol: "9%",
    batchCode: "DXB-2024",
    longevity: "7 Jam (AC Mall/Offis)",
    sillageDistance: "1.8 Meter",
    sweatTolerantRating: "7.5 / 10",
    tempZone: "18°C - 26°C",
    accords: ["Gourmand", "Warm Spicy", "Sweet", "Woody"],
    mainAccords: [
      { name: "Warm Spicy", percentage: 90 },
      { name: "Sweet", percentage: 85 },
      { name: "Gourmand", percentage: 80 },
      { name: "Woody", percentage: 65 }
    ],
    bestWeather: ["Pejabat Berhawa Dingin", "Temu Janji Malam", "Dingin & Berkabus"],
    whenToWear: {
      time: ["Night"],
      weather: ["Dingin & Berkabus", "Malam Sejuk"],
      occasions: ["Pejabat Berhawa Dingin", "Temu Janji Malam"]
    },
    notes: {
      top: ["Kayu Manis (Cinnamon)", "Buah Pala (Nutmeg)", "Bergamot"],
      mid: ["Kurma Manis (Dates)", "Praline", "Tuberose", "Mahonial"],
      base: ["Vanilla Madagaskar", "Tonka Bean", "Benzoin", "Amberwood"]
    },
    evaporationTiming: {
      top: "0 - 1 jam",
      mid: "1 - 4 jam",
      base: "4 - 10 jam"
    },
    dupesEquivalent: [
      { id: "choco-musk", name: "Choco Musk", brand: "Al-Rehab", match: "84% Gourmand Vibe" }
    ],
    searchTokens: [
      "khamrah", "eau", "de", "parfum", "lattafa", "perfumes", "unisex",
      "kilian", "angels", "share", "dates", "kurma", "cinnamon", "kayu",
      "manis", "praline", "vanilla", "gourmand", "spicy", "uae"
    ]
  },
  {
    id: "choco-musk",
    name: "Choco Musk 50ml EDP",
    brand: "Al-Rehab",
    origin: "Arab Saudi",
    type: "50ml EDP / Minyak Wangi",
    gender: "unisex",
    originalDesignerRef: "Montale Chocolate Greedy",
    matchPercentage: 91,
    rating: 4.7,
    reviewCount: 890,
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAq3T9327_KUi403gqJZDgIQDAgYF513foL2_3OW-U2OXxgK0o8o_hrcsQnoTQjMkzWA3kfY16ybfkHVindVTcZO5J1EqBuyya7m7xROi5gkykms1T044xubCzIb1CJw_4dzbQaU2_YRjDmXtBKRKX0OX8tqIPyS4OLgSQTUzRlUayiYT1Qh6A_DpEsN57a618DDTbKeYgESqsxp6Y-RWbUGL8cCPGjewk7guzjY7X0LSstyh3tzsWnHQ",
    shopeeUrl: "https://shopee.com.my/search?keyword=Al%20Rehab%20Choco%20Musk",
    tiktokUrl: "https://www.tiktok.com/search?q=Al%20Rehab%20Choco%20Musk",
    climateScore: 85,
    sweatResistancePct: 82,
    complimentPct: 91,
    headacheSafePct: 94,
    evaporationVol: "16%",
    batchCode: "KSA-2024",
    longevity: "6+ Jam (Harian)",
    sillageDistance: "1.4 Meter",
    sweatTolerantRating: "8.0 / 10",
    tempZone: "22°C - 30°C",
    accords: ["Chocolate", "Vanilla", "Musk", "Sweet"],
    mainAccords: [
      { name: "Chocolate", percentage: 92 },
      { name: "Vanilla", percentage: 88 },
      { name: "Sweet", percentage: 80 },
      { name: "Musk", percentage: 70 }
    ],
    bestWeather: ["Kuliah & Kasual", "Pejabat Berhawa Dingin"],
    whenToWear: {
      time: ["Night"],
      weather: ["Nyaman", "Hawa Dingin"],
      occasions: ["Kuliah", "Kasual", "Pejabat"]
    },
    notes: {
      top: ["Coklat Susu", "Gula Hangat"],
      mid: ["Vanilla Pods", "Kayu Manis"],
      base: ["White Musk", "Amber Lembut", "Cendana"]
    },
    evaporationTiming: {
      top: "0 - 30 min",
      mid: "30 min - 3 jam",
      base: "3 - 8 jam"
    },
    dupesEquivalent: [
      { id: "khamrah", name: "Khamrah", brand: "Lattafa", match: "85% Manis Pejabat" }
    ],
    searchTokens: [
      "choco", "musk", "al-rehab", "rehab", "unisex", "montale", "chocolate",
      "greedy", "vanilla", "sweet", "coklat", "milk", "marshmallow", "cendana"
    ]
  },
  {
    id: "zara-lisboa",
    name: "Lisboa Colombo Eau de Toilette",
    brand: "Zara",
    origin: "Sepanyol",
    type: "100ml EDT",
    gender: "male",
    originalDesignerRef: "Giorgio Armani Acqua Di Gio",
    matchPercentage: 91,
    rating: 4.5,
    reviewCount: 420,
    imageUrl: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500&auto=format&fit=crop&q=80",
    shopeeUrl: "https://shopee.com.my/search?keyword=Zara%20Lisboa%20Colombo",
    tiktokUrl: "https://www.tiktok.com/search?q=Zara%20Lisboa%20Colombo",
    climateScore: 92,
    sweatResistancePct: 88,
    complimentPct: 89,
    headacheSafePct: 95,
    evaporationVol: "18%",
    batchCode: "SPN-2024",
    longevity: "4 - 5 Jam",
    sillageDistance: "1.5 Meter",
    sweatTolerantRating: "8.8 / 10",
    tempZone: "28°C - 35°C",
    accords: ["Aquatic", "Citrus", "Aromatic", "Fresh Marine"],
    mainAccords: [
      { name: "Citrus", percentage: 86 },
      { name: "Aquatic", percentage: 84 },
      { name: "Fresh Marine", percentage: 75 },
      { name: "Aromatic", percentage: 68 }
    ],
    bestWeather: ["Terik Lembap", "Aktiviti Panas Terik", "Kuliah & Kasual"],
    whenToWear: {
      time: ["Day"],
      weather: ["Terik Lembap", "Panas Terik"],
      occasions: ["Sukan", "Harian", "Aktiviti Luar"]
    },
    notes: {
      top: ["Lemon", "Grapefruit", "Orange"],
      mid: ["Sea Notes", "Clary Sage"],
      base: ["Cedarwood", "Musk"]
    },
    evaporationTiming: {
      top: "0 - 30 min",
      mid: "30 min - 2 jam",
      base: "2 - 5 jam"
    },
    dupesEquivalent: [
      { id: "turathi-blue", name: "Turathi Blue", brand: "Afnan", match: "91% Ketahanan Lebih Tinggi" }
    ],
    searchTokens: [
      "lisboa", "colombo", "eau", "de", "toilette", "zara", "male", "lelaki",
      "giorgio", "armani", "acqua", "di", "gio", "lemon", "grapefruit",
      "marine", "aquatic", "citrus"
    ]
  },
  {
    id: "evoke-gold",
    name: "Evoke Gold For Him",
    brand: "Ajmal Perfumes",
    origin: "UAE",
    type: "90ml EDP",
    gender: "male",
    originalDesignerRef: "Prada L'Homme",
    matchPercentage: 94,
    rating: 4.8,
    reviewCount: 310,
    imageUrl: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500&auto=format&fit=crop&q=80",
    shopeeUrl: "https://shopee.com.my/search?keyword=Ajmal%20Evoke%20Gold",
    tiktokUrl: "https://www.tiktok.com/search?q=Ajmal%20Evoke%20Gold",
    climateScore: 95,
    sweatResistancePct: 90,
    complimentPct: 94,
    headacheSafePct: 96,
    evaporationVol: "12%",
    batchCode: "UAE-2024",
    longevity: "7 - 9 Jam",
    sillageDistance: "1.8 Meter",
    sweatTolerantRating: "9.2 / 10",
    tempZone: "20°C - 32°C",
    accords: ["Clean Powdery", "Iris", "Amber", "Soapy Fresh"],
    mainAccords: [
      { name: "Iris", percentage: 88 },
      { name: "Clean Powdery", percentage: 84 },
      { name: "Soapy Fresh", percentage: 80 },
      { name: "Amber", percentage: 65 }
    ],
    bestWeather: ["Pejabat Berhawa Dingin", "Temu Janji Malam", "Kuliah & Kasual"],
    whenToWear: {
      time: ["Versatile"],
      weather: ["Hawa Dingin Pejabat", "Nyaman"],
      occasions: ["Mesyuarat Korporat", "Pejabat", "Kasual Kemas"]
    },
    notes: {
      top: ["Neroli Bersih", "Lada Hitam"],
      mid: ["Iris Lembut", "Amber", "Geranium"],
      base: ["Cedarwood", "Patchouli"]
    },
    evaporationTiming: {
      top: "0 - 45 min",
      mid: "45 min - 4 jam",
      base: "4 - 8 jam"
    },
    dupesEquivalent: [
      { id: "turathi-blue", name: "Turathi Blue", brand: "Afnan", match: "88% Kemas Bersih" }
    ],
    searchTokens: [
      "evoke", "gold", "for", "him", "ajmal", "perfumes", "male", "lelaki",
      "prada", "l'homme", "homme", "iris", "neroli", "soapy", "clean",
      "powdery", "amber", "uae"
    ]
  },
  {
    id: "sea-salt-bergamot",
    name: "Sea Salt & Bergamot",
    brand: "The Scent Supply Co",
    origin: "Malaysia",
    type: "50ml Extrait",
    gender: "unisex",
    originalDesignerRef: "Jo Malone Wood Sage & Sea Salt",
    matchPercentage: 89,
    rating: 4.7,
    reviewCount: 280,
    imageUrl: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=500&auto=format&fit=crop&q=80",
    shopeeUrl: "https://shopee.com.my/search?keyword=The%20Scent%20Supply%20Co%20Sea%20Salt%20Bergamot",
    tiktokUrl: "https://www.tiktok.com/search?q=The%20Scent%20Supply%20Co%20Sea%20Salt%20Bergamot",
    climateScore: 97,
    sweatResistancePct: 91,
    complimentPct: 90,
    headacheSafePct: 98,
    evaporationVol: "15%",
    batchCode: "MY-ARTISAN",
    longevity: "5 - 6 Jam",
    sillageDistance: "1.6 Meter",
    sweatTolerantRating: "9.3 / 10",
    tempZone: "26°C - 36°C",
    accords: ["Marine Salty", "Aromatic Sage", "Citrus", "Artisanal"],
    mainAccords: [
      { name: "Marine Salty", percentage: 88 },
      { name: "Citrus", percentage: 80 },
      { name: "Aromatic Sage", percentage: 75 },
      { name: "Artisanal", percentage: 70 }
    ],
    bestWeather: ["Terik Lembap", "Kuliah & Kasual", "Aktiviti Luar"],
    whenToWear: {
      time: ["Day"],
      weather: ["Terik Lembap", "Angin Pantai"],
      occasions: ["Santai", "Harian", "Aktiviti Luar"]
    },
    notes: {
      top: ["Garam Laut Tropika", "Bergamot Segar"],
      mid: ["Clary Sage", "Driftwood"],
      base: ["Seaweed", "White Musk"]
    },
    evaporationTiming: {
      top: "0 - 40 min",
      mid: "40 min - 3 jam",
      base: "3 - 6 jam"
    },
    dupesEquivalent: [
      { id: "zara-lisboa", name: "Zara Lisboa", brand: "Zara", match: "87% Akuatik Segar" }
    ],
    searchTokens: [
      "sea", "salt", "bergamot", "the", "scent", "supply", "co", "unisex",
      "malaysia", "artisan", "jo", "malone", "wood", "sage", "marine",
      "garam", "laut", "pantai", "tempatan"
    ]
  },
  {
    id: "yara-pink",
    name: "Yara Eau de Parfum",
    brand: "Lattafa Perfumes",
    origin: "UAE",
    type: "100ml EDP",
    gender: "female",
    originalDesignerRef: "Pepe Jeans For Her",
    matchPercentage: 90,
    rating: 4.8,
    reviewCount: 712,
    imageUrl: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=500&auto=format&fit=crop&q=80",
    shopeeUrl: "https://shopee.com.my/search?keyword=Lattafa%20Yara",
    tiktokUrl: "https://www.tiktok.com/search?q=Lattafa%20Yara",
    climateScore: 91,
    sweatResistancePct: 86,
    complimentPct: 97,
    headacheSafePct: 92,
    evaporationVol: "13%",
    batchCode: "UAE-2024",
    longevity: "7 - 8 Jam",
    sillageDistance: "2.0 Meter",
    sweatTolerantRating: "8.9 / 10",
    tempZone: "22°C - 32°C",
    accords: ["Sweet", "Vanilla", "Fruity", "Tropical Floral"],
    mainAccords: [
      { name: "Sweet", percentage: 90 },
      { name: "Vanilla", percentage: 85 },
      { name: "Fruity", percentage: 80 },
      { name: "Tropical Floral", percentage: 72 }
    ],
    bestWeather: ["Kuliah & Kasual", "Pejabat Berhawa Dingin"],
    whenToWear: {
      time: ["Versatile"],
      weather: ["Nyaman", "Tropika"],
      occasions: ["Kuliah", "Temu Janji", "Kasual"]
    },
    notes: {
      top: ["Heliotrope", "Orchid", "Tangerine"],
      mid: ["Gourmand Accord", "Tropical Fruits"],
      base: ["Vanilla", "Sandalwood", "Musk"]
    },
    evaporationTiming: {
      top: "0 - 30 min",
      mid: "30 min - 3 jam",
      base: "3 - 8 jam"
    },
    dupesEquivalent: [
      { id: "choco-musk", name: "Choco Musk", brand: "Al-Rehab", match: "82% Manis Lembut" }
    ],
    searchTokens: [
      "yara", "pink", "lattafa", "perfumes", "female", "wanita", "pepe", "jeans",
      "strawberry", "vanilla", "sweet", "marshmallow", "tropical", "uae"
    ]
  },
  {
    id: "club-de-nuit-woman",
    name: "Club de Nuit Woman",
    brand: "Armaf",
    origin: "UAE",
    type: "105ml EDP",
    gender: "female",
    originalDesignerRef: "Chanel Coco Mademoiselle",
    matchPercentage: 93,
    rating: 4.7,
    reviewCount: 650,
    imageUrl: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=500&auto=format&fit=crop&q=80",
    shopeeUrl: "https://shopee.com.my/search?keyword=Armaf%20Club%20De%20Nuit%20Woman",
    tiktokUrl: "https://www.tiktok.com/search?q=Armaf%20Club%20De%20Nuit%20Woman",
    climateScore: 94,
    sweatResistancePct: 89,
    complimentPct: 95,
    headacheSafePct: 90,
    evaporationVol: "12%",
    batchCode: "UAE-2024",
    longevity: "8 - 10 Jam",
    sillageDistance: "2.2 Meter",
    sweatTolerantRating: "9.1 / 10",
    tempZone: "24°C - 34°C",
    accords: ["Citrus", "Floral", "Patchouli", "Fresh Spicy"],
    mainAccords: [
      { name: "Floral", percentage: 88 },
      { name: "Citrus", percentage: 82 },
      { name: "Patchouli", percentage: 76 },
      { name: "Fresh Spicy", percentage: 65 }
    ],
    bestWeather: ["Panas Lembap", "Pejabat Berhawa Dingin"],
    whenToWear: {
      time: ["Versatile"],
      weather: ["Panas Lembap", "Malam"],
      occasions: ["Pejabat", "Makan Malam", "Acara Rasmi"]
    },
    notes: {
      top: ["Oren", "Bergamot", "Grapefruit", "Peach"],
      mid: ["Rose", "Jasmine", "Litchi", "Geranium"],
      base: ["Patchouli", "Vanilla", "Musk", "Vetiver"]
    },
    evaporationTiming: {
      top: "0 - 45 min",
      mid: "45 min - 4 jam",
      base: "4 - 10 jam"
    },
    dupesEquivalent: [
      { id: "cdnim", name: "CDNIM", brand: "Armaf", match: "80% DNA Elegan" }
    ],
    searchTokens: [
      "club", "de", "nuit", "woman", "armaf", "female", "wanita", "chanel",
      "coco", "mademoiselle", "rose", "jasmine", "citrus", "patchouli", "floral", "uae"
    ]
  },
  {
    id: "santai-pantai",
    name: "Santai Pantai Extrait",
    brand: "The Scent Supply Co",
    origin: "Malaysia",
    type: "50ml Extrait",
    gender: "unisex",
    originalDesignerRef: "Tom Ford Soleil Blanc",
    matchPercentage: 88,
    rating: 4.8,
    reviewCount: 195,
    imageUrl: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=500&auto=format&fit=crop&q=80",
    shopeeUrl: "https://shopee.com.my/search?keyword=The%20Scent%20Supply%20Co%20Santai%20Pantai",
    tiktokUrl: "https://www.tiktok.com/search?q=The%20Scent%20Supply%20Co%20Santai%20Pantai",
    climateScore: 96,
    sweatResistancePct: 92,
    complimentPct: 93,
    headacheSafePct: 96,
    evaporationVol: "14%",
    batchCode: "MY-ARTISAN",
    longevity: "6 - 7 Jam",
    sillageDistance: "1.8 Meter",
    sweatTolerantRating: "9.4 / 10",
    tempZone: "26°C - 36°C",
    accords: ["Coconut", "White Floral", "Solar", "Warm Amber"],
    mainAccords: [
      { name: "Coconut", percentage: 88 },
      { name: "Solar", percentage: 85 },
      { name: "White Floral", percentage: 78 },
      { name: "Warm Amber", percentage: 70 }
    ],
    bestWeather: ["Panas Terik", "Lembap Pesisir"],
    whenToWear: {
      time: ["Day"],
      weather: ["Panas Terik", "Lembap Pesisir"],
      occasions: ["Pantai", "Santai Hujung Minggu", "Bercuti"]
    },
    notes: {
      top: ["Kelapa Muda", "Bergamot", "Cardamom", "Pistachio"],
      mid: ["Ylang-Ylang", "Tuberose", "Jasmine"],
      base: ["Amber", "Benzoin", "Tonka Bean", "Coconut Milk"]
    },
    evaporationTiming: {
      top: "0 - 45 min",
      mid: "45 min - 3 jam",
      base: "3 - 7 jam"
    },
    dupesEquivalent: [
      { id: "sea-salt-bergamot", name: "Sea Salt & Bergamot", brand: "The Scent Supply Co", match: "85% Nuansa Pantai" }
    ],
    searchTokens: [
      "santai", "pantai", "extrait", "the", "scent", "supply", "co", "unisex",
      "malaysia", "tempatan", "artisan", "tom", "ford", "soleil", "blanc",
      "coconut", "kelapa", "solar", "white", "floral"
    ]
  }
];

export const initialComments = {
  "turathi-blue": [
    {
      id: "comment-1",
      perfumeId: "turathi-blue",
      userId: "user-aiman-rahim",
      userName: "Aiman Rahim",
      userBadge: "Ahli Aktif • Kuala Lumpur",
      userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      rating: 5,
      weatherContext: "Ujian di Cyberjaya (Suhu 33°C, Lembap 82%)",
      tags: ["+6 Semburan", "Luar Panas Lembap", "Ujian LRT"],
      text: "Aroma pembukaan limau gedang memang tajam dan segar, sangat hampir dengan Tygar asli. Saya sembur 7 kali sebelum pergi solat Jumaat dalam cuaca panas terik, sillage bertahan teguh lebih 3 jam tanpa bertukar menjadi masam. Sangat berbaloi dengan prestasinya yang mantap!",
      helpfulCount: 28,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      replies: [
        {
          id: "reply-1-1",
          userId: "user-farhan-shah",
          userName: "Farhan Shah",
          userAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
          text: "Setuju bang! Dekat kulit saya tahan sampai 9 jam walaupun lepas berpeluh main badminton.",
          createdAt: new Date(Date.now() - 3600 * 1000).toISOString()
        }
      ]
    },
    {
      id: "comment-2",
      perfumeId: "turathi-blue",
      userId: "user-sarah-l",
      userName: "Sarah L.",
      userBadge: "Kolektor Wangian • Belian Sah",
      userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      rating: 4.5,
      weatherContext: "Penggunaan dalam Pejabat KLCC (AC Sejuk 21°C)",
      tags: ["Hawa Dingin Pejabat", "Mesra Unisex", "Kemas Bersih"],
      text: "Dry-down ambroxan dan woody dia sangat memikat. Di bilik mesyuarat berhawa dingin, projection dia lembut tapi sentiasa disedari. Tak buat rakan sebelah bersin seperti wangian oud berat.",
      helpfulCount: 45,
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      replies: []
    }
  ]
};
