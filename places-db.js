// ============================================
// Click2Xplore — Famous Places Database
// Instant local search (< 1ms) for well-known places
// ============================================

const FAMOUS_PLACES = [
    // ══════════════════════════════════════
    // INDIA — Maharashtra (Extra Detail)
    // ══════════════════════════════════════
    { name: "Mumbai", detail: "Maharashtra, India", lat: 19.0760, lon: 72.8777, type: "City", icon: "🏙️" },
    { name: "Pune", detail: "Maharashtra, India", lat: 18.5204, lon: 73.8567, type: "City", icon: "🏙️" },
    { name: "Nagpur", detail: "Maharashtra, India", lat: 21.1458, lon: 79.0882, type: "City", icon: "🏙️" },
    { name: "Nashik", detail: "Maharashtra, India", lat: 19.9975, lon: 73.7898, type: "City", icon: "🏙️" },
    { name: "Aurangabad", detail: "Maharashtra, India", lat: 19.8762, lon: 75.3433, type: "City", icon: "🏙️" },
    { name: "Solapur", detail: "Maharashtra, India", lat: 17.6599, lon: 75.9064, type: "City", icon: "🏙️" },
    { name: "Kolhapur", detail: "Maharashtra, India", lat: 16.7050, lon: 74.2433, type: "City", icon: "🏙️" },
    { name: "Thane", detail: "Maharashtra, India", lat: 19.2183, lon: 72.9781, type: "City", icon: "🏙️" },
    { name: "Navi Mumbai", detail: "Maharashtra, India", lat: 19.0330, lon: 73.0297, type: "City", icon: "🏙️" },
    { name: "Sangli", detail: "Maharashtra, India", lat: 16.8524, lon: 74.5815, type: "City", icon: "🏙️" },
    { name: "Amravati", detail: "Maharashtra, India", lat: 20.9320, lon: 77.7523, type: "City", icon: "🏙️" },
    { name: "Jalgaon", detail: "Maharashtra, India", lat: 21.0077, lon: 75.5626, type: "City", icon: "🏙️" },
    { name: "Akola", detail: "Maharashtra, India", lat: 20.7002, lon: 77.0082, type: "City", icon: "🏙️" },
    { name: "Latur", detail: "Maharashtra, India", lat: 18.3916, lon: 76.5604, type: "City", icon: "🏙️" },
    { name: "Dhule", detail: "Maharashtra, India", lat: 20.9042, lon: 74.7749, type: "City", icon: "🏙️" },
    { name: "Ahmednagar", detail: "Maharashtra, India", lat: 19.0952, lon: 74.7490, type: "City", icon: "🏙️" },
    { name: "Chandrapur", detail: "Maharashtra, India", lat: 19.9615, lon: 79.2961, type: "City", icon: "🏙️" },
    { name: "Parbhani", detail: "Maharashtra, India", lat: 19.2610, lon: 76.7718, type: "City", icon: "🏙️" },
    { name: "Satara", detail: "Maharashtra, India", lat: 17.6805, lon: 74.0183, type: "City", icon: "🏙️" },
    { name: "Ratnagiri", detail: "Maharashtra, India", lat: 16.9902, lon: 73.3120, type: "City", icon: "🏙️" },
    { name: "Osmanabad", detail: "Maharashtra, India", lat: 18.1860, lon: 76.0444, type: "City", icon: "🏙️" },
    { name: "Nanded", detail: "Maharashtra, India", lat: 19.1383, lon: 77.3210, type: "City", icon: "🏙️" },
    { name: "Wardha", detail: "Maharashtra, India", lat: 20.7453, lon: 78.5960, type: "City", icon: "🏙️" },
    { name: "Yavatmal", detail: "Maharashtra, India", lat: 20.3888, lon: 78.1204, type: "City", icon: "🏙️" },
    { name: "Beed", detail: "Maharashtra, India", lat: 18.9891, lon: 75.7601, type: "City", icon: "🏙️" },
    { name: "Gondia", detail: "Maharashtra, India", lat: 21.4624, lon: 80.1940, type: "City", icon: "🏙️" },
    { name: "Washim", detail: "Maharashtra, India", lat: 20.1114, lon: 77.1337, type: "City", icon: "🏙️" },
    { name: "Hingoli", detail: "Maharashtra, India", lat: 19.7173, lon: 77.1515, type: "City", icon: "🏙️" },
    { name: "Sindhudurg", detail: "Maharashtra, India", lat: 16.3489, lon: 73.7557, type: "City", icon: "🏙️" },
    { name: "Jalna", detail: "Maharashtra, India", lat: 19.8347, lon: 75.8816, type: "City", icon: "🏙️" },
    { name: "Buldhana", detail: "Maharashtra, India", lat: 20.5293, lon: 76.1842, type: "City", icon: "🏙️" },
    { name: "Gadchiroli", detail: "Maharashtra, India", lat: 20.1857, lon: 80.0012, type: "City", icon: "🏙️" },
    { name: "Bhandara", detail: "Maharashtra, India", lat: 21.1669, lon: 79.6508, type: "City", icon: "🏙️" },
    { name: "Palghar", detail: "Maharashtra, India", lat: 19.6968, lon: 72.7651, type: "City", icon: "🏙️" },
    { name: "Raigad", detail: "Maharashtra, India", lat: 18.5158, lon: 73.1822, type: "City", icon: "🏙️" },
    { name: "Lonavala", detail: "Maharashtra, India", lat: 18.7546, lon: 73.4062, type: "Town", icon: "🏘️" },
    { name: "Mahabaleshwar", detail: "Maharashtra, India", lat: 17.9237, lon: 73.6586, type: "Town", icon: "🏘️" },
    { name: "Alibaug", detail: "Maharashtra, India", lat: 18.6414, lon: 72.8722, type: "Town", icon: "🏘️" },
    { name: "Shirdi", detail: "Maharashtra, India", lat: 19.7666, lon: 74.4778, type: "Town", icon: "🏘️" },
    { name: "Pandharpur", detail: "Maharashtra, India", lat: 17.6783, lon: 75.3279, type: "Town", icon: "🏘️" },
    { name: "Ajanta Caves", detail: "Aurangabad, Maharashtra, India", lat: 20.5519, lon: 75.7033, type: "Landmark", icon: "🏛️", tags: ["cave", "heritage", "unesco", "famous"] },
    { name: "Ellora Caves", detail: "Aurangabad, Maharashtra, India", lat: 20.0269, lon: 75.1779, type: "Landmark", icon: "🏛️", tags: ["cave", "heritage", "unesco", "famous"] },
    { name: "Gateway of India", detail: "Mumbai, Maharashtra, India", lat: 18.9220, lon: 72.8347, type: "Landmark", icon: "🏛️", tags: ["landmark", "heritage", "famous", "monument"] },
    { name: "Shaniwar Wada", detail: "Pune, Maharashtra, India", lat: 18.5195, lon: 73.8553, type: "Landmark", icon: "🏛️", tags: ["fort", "heritage", "famous", "monument"] },
    { name: "Maharashtra", detail: "State, India", lat: 19.6633, lon: 75.3003, type: "State", icon: "🏛️", tags: ["state"] },

    // ══════════════════════════════════════
    // MAHARASHTRA — WATERFALLS (Famous + Hidden Gems)
    // ══════════════════════════════════════
    { name: "Zenith Waterfall", detail: "Khopoli, Maharashtra", lat: 18.7883, lon: 73.3447, type: "Waterfall", icon: "💧", tags: ["waterfall", "hidden", "nature", "monsoon", "adventure"] },
    { name: "Thoseghar Waterfall", detail: "Satara, Maharashtra", lat: 17.6474, lon: 73.8653, type: "Waterfall", icon: "💧", tags: ["waterfall", "famous", "nature", "monsoon", "hidden gem"] },
    { name: "Lingmala Waterfall", detail: "Mahabaleshwar, Maharashtra", lat: 17.9138, lon: 73.6476, type: "Waterfall", icon: "💧", tags: ["waterfall", "famous", "nature", "monsoon", "trekking"] },
    { name: "Randha Falls", detail: "Bhandardara, Maharashtra", lat: 19.5250, lon: 73.7458, type: "Waterfall", icon: "💧", tags: ["waterfall", "hidden", "nature", "monsoon", "hidden gem"] },
    { name: "Umbrella Falls", detail: "Bhandardara, Maharashtra", lat: 19.5186, lon: 73.7553, type: "Waterfall", icon: "💧", tags: ["waterfall", "hidden", "nature", "monsoon", "hidden gem", "adventure"] },
    { name: "Kune Waterfalls", detail: "Lonavala, Maharashtra", lat: 18.7600, lon: 73.3990, type: "Waterfall", icon: "💧", tags: ["waterfall", "famous", "nature", "monsoon", "scenic"] },
    { name: "Bhivpuri Waterfall", detail: "Karjat, Maharashtra", lat: 18.8850, lon: 73.3292, type: "Waterfall", icon: "💧", tags: ["waterfall", "hidden", "nature", "monsoon", "trekking"] },
    { name: "Pandavkada Falls", detail: "Navi Mumbai, Maharashtra", lat: 19.0410, lon: 73.0753, type: "Waterfall", icon: "💧", tags: ["waterfall", "famous", "nature", "monsoon"] },
    { name: "Dudhsagar Waterfall", detail: "Sindhudurg, Maharashtra", lat: 15.3144, lon: 74.3143, type: "Waterfall", icon: "💧", tags: ["waterfall", "hidden", "nature", "monsoon", "hidden gem"] },
    { name: "Dhobi Waterfall", detail: "Sawantwadi, Maharashtra", lat: 15.9098, lon: 73.8183, type: "Waterfall", icon: "💧", tags: ["waterfall", "hidden", "nature", "monsoon", "hidden gem"] },
    { name: "Ashoka Waterfall", detail: "Igatpuri, Maharashtra", lat: 19.6860, lon: 73.5536, type: "Waterfall", icon: "💧", tags: ["waterfall", "hidden", "nature", "monsoon", "adventure"] },
    { name: "Vajrai Waterfall", detail: "Satara, Maharashtra", lat: 17.6700, lon: 73.8550, type: "Waterfall", icon: "💧", tags: ["waterfall", "famous", "nature", "tallest", "monsoon"] },
    { name: "Devkund Waterfall", detail: "Tamhini, Maharashtra", lat: 18.4437, lon: 73.4306, type: "Waterfall", icon: "💧", tags: ["waterfall", "hidden", "nature", "monsoon", "trekking", "hidden gem"] },
    { name: "Savdav Waterfall", detail: "Chiplun, Maharashtra", lat: 17.5304, lon: 73.5135, type: "Waterfall", icon: "💧", tags: ["waterfall", "hidden", "nature", "monsoon", "hidden gem"] },
    { name: "Chinaman Waterfall", detail: "Amboli, Maharashtra", lat: 15.9632, lon: 74.0004, type: "Waterfall", icon: "💧", tags: ["waterfall", "hidden", "nature", "monsoon", "hidden gem"] },
    { name: "Someshwar Waterfall", detail: "Nashik, Maharashtra", lat: 19.9428, lon: 73.8039, type: "Waterfall", icon: "💧", tags: ["waterfall", "nature", "monsoon"] },
    { name: "Bhagirath Waterfall", detail: "Vashind, Maharashtra", lat: 19.4381, lon: 73.2661, type: "Waterfall", icon: "💧", tags: ["waterfall", "hidden", "nature", "monsoon", "hidden gem"] },
    { name: "Kataldhar Waterfall", detail: "Tamhini Ghat, Maharashtra", lat: 18.4622, lon: 73.3964, type: "Waterfall", icon: "💧", tags: ["waterfall", "hidden", "trekking", "nature", "monsoon", "adventure"] },
    { name: "Madhe Ghat Waterfall", detail: "Bhor, Maharashtra", lat: 18.1475, lon: 73.7806, type: "Waterfall", icon: "💧", tags: ["waterfall", "hidden", "nature", "monsoon", "hidden gem"] },
    { name: "Kondeshwar Waterfall", detail: "Khandala, Maharashtra", lat: 18.7675, lon: 73.3815, type: "Waterfall", icon: "💧", tags: ["waterfall", "hidden", "nature", "monsoon"] },

    // ══════════════════════════════════════
    // MAHARASHTRA — FORTS
    // ══════════════════════════════════════
    { name: "Raigad Fort", detail: "Raigad, Maharashtra", lat: 18.2342, lon: 73.4481, type: "Fort", icon: "🏰", tags: ["fort", "heritage", "trekking", "shivaji", "famous"] },
    { name: "Sinhagad Fort", detail: "Pune, Maharashtra", lat: 18.3662, lon: 73.7558, type: "Fort", icon: "🏰", tags: ["fort", "heritage", "trekking", "famous", "weekend"] },
    { name: "Pratapgad Fort", detail: "Satara, Maharashtra", lat: 17.9351, lon: 73.5770, type: "Fort", icon: "🏰", tags: ["fort", "heritage", "trekking", "shivaji"] },
    { name: "Rajmachi Fort", detail: "Lonavala, Maharashtra", lat: 18.8315, lon: 73.3975, type: "Fort", icon: "🏰", tags: ["fort", "heritage", "trekking", "hidden gem", "adventure"] },
    { name: "Torna Fort", detail: "Pune, Maharashtra", lat: 18.2751, lon: 73.6244, type: "Fort", icon: "🏰", tags: ["fort", "heritage", "trekking", "shivaji", "adventure"] },
    { name: "Lohagad Fort", detail: "Lonavala, Maharashtra", lat: 18.7089, lon: 73.4687, type: "Fort", icon: "🏰", tags: ["fort", "heritage", "trekking", "famous", "weekend"] },
    { name: "Visapur Fort", detail: "Lonavala, Maharashtra", lat: 18.7219, lon: 73.4644, type: "Fort", icon: "🏰", tags: ["fort", "heritage", "trekking", "adventure"] },
    { name: "Daulatabad Fort", detail: "Aurangabad, Maharashtra", lat: 19.9441, lon: 75.2212, type: "Fort", icon: "🏰", tags: ["fort", "heritage", "famous", "monument"] },
    { name: "Murud Janjira Fort", detail: "Murud, Maharashtra", lat: 18.2928, lon: 72.9660, type: "Fort", icon: "🏰", tags: ["fort", "heritage", "sea fort", "famous", "hidden gem"] },
    { name: "Tikona Fort", detail: "Kamshet, Maharashtra", lat: 18.6684, lon: 73.4923, type: "Fort", icon: "🏰", tags: ["fort", "trekking", "weekend", "adventure"] },
    { name: "Harishchandragad", detail: "Ahmednagar, Maharashtra", lat: 19.3860, lon: 73.7800, type: "Fort", icon: "🏰", tags: ["fort", "trekking", "adventure", "hidden gem", "famous"] },
    { name: "Kalsubai Peak", detail: "Ahmednagar, Maharashtra", lat: 19.6019, lon: 73.7083, type: "Nature", icon: "🏔️", tags: ["peak", "trekking", "highest", "nature", "adventure"] },

    // ══════════════════════════════════════
    // MAHARASHTRA — WATERPARKS & FUN
    // ══════════════════════════════════════
    { name: "Imagica Theme Park", detail: "Khopoli, Maharashtra", lat: 18.8207, lon: 73.3847, type: "Waterpark", icon: "🎢", tags: ["waterpark", "amusement", "fun", "family", "theme park"] },
    { name: "Wet N Joy Waterpark", detail: "Lonavala, Maharashtra", lat: 18.7539, lon: 73.4182, type: "Waterpark", icon: "🎢", tags: ["waterpark", "fun", "family", "water slides", "amusement"] },

    // ══════════════════════════════════════
    // MAHARASHTRA — HIDDEN GEMS & DEEP EXPLORATION
    // ══════════════════════════════════════
    { name: "Kaas Pathar", detail: "Satara, Maharashtra", lat: 17.7214, lon: 73.8167, type: "Nature", icon: "🌸", tags: ["valley of flowers", "nature", "plateau", "unesco", "scenic"] },
    { name: "Sandhan Valley", detail: "Bhandardara, Maharashtra", lat: 19.5262, lon: 73.7142, type: "Nature", icon: "⛰️", tags: ["trekking", "adventure", "valley of shadows", "canyon", "hidden gem"] },
    { name: "Pawna Lake", detail: "Lonavala, Maharashtra", lat: 18.6656, lon: 73.4735, type: "Lake", icon: "⛺", tags: ["camping", "lake", "weekend", "scenic", "tent"] },
    { name: "Tarkarli Beach", detail: "Sindhudurg, Maharashtra", lat: 16.0354, lon: 73.4839, type: "Beach", icon: "🏖️", tags: ["beach", "scuba diving", "water sports", "konkan", "scenic"] },
    { name: "Velas", detail: "Ratnagiri, Maharashtra", lat: 17.9542, lon: 73.0305, type: "Beach", icon: "🐢", tags: ["beach", "turtles", "festival", "konkan", "hidden gem"] },
    { name: "Malshej Ghat", detail: "Pune District, Maharashtra", lat: 19.3366, lon: 73.7744, type: "Nature", icon: "🌫️", tags: ["ghat", "monsoon", "scenic", "waterfalls", "nature"] },
    { name: "Naneghat", detail: "Junnar, Maharashtra", lat: 19.2842, lon: 73.6653, type: "Nature", icon: "⛰️", tags: ["pass", "trekking", "historical", "cave", "adventure"] },
    { name: "Rajgad Fort", detail: "Pune, Maharashtra", lat: 18.2464, lon: 73.6822, type: "Fort", icon: "🏰", tags: ["fort", "shivaji", "capital", "trekking"] },
    { name: "Korigad Fort", detail: "Aamby Valley, Maharashtra", lat: 18.6186, lon: 73.3858, type: "Fort", icon: "🏰", tags: ["fort", "trekking", "easy trek", "scenic"] },
    { name: "Amboli", detail: "Sindhudurg, Maharashtra", lat: 15.9610, lon: 73.9997, type: "Hill Station", icon: "🏘️", tags: ["hill station", "monsoon", "biodiversity", "waterfalls"] },
    { name: "Bhandardara", detail: "Ahmednagar, Maharashtra", lat: 19.5446, lon: 73.7663, type: "Nature", icon: "⛺", tags: ["lake", "camping", "fireflies", "nature", "scenic"] },
    { name: "Panchgani", detail: "Satara, Maharashtra", lat: 17.9238, lon: 73.8016, type: "Hill Station", icon: "🍓", tags: ["hill station", "strawberry", "scenic", "table land"] },
    { name: "Harihareshwar", detail: "Raigad, Maharashtra", lat: 18.0051, lon: 73.0189, type: "Beach", icon: "🏖️", tags: ["beach", "temple", "konkan", "weekend"] },
    { name: "Kamshet", detail: "Pune, Maharashtra", lat: 18.7735, lon: 73.5410, type: "Adventure", icon: "🪂", tags: ["paragliding", "adventure", "lake", "weekend"] },
    { name: "Igatpuri", detail: "Nashik, Maharashtra", lat: 19.6953, lon: 73.5516, type: "Hill Station", icon: "🏘️", tags: ["hill station", "vipassana", "monsoon", "scenic"] },
    { name: "Aqua Imagica", detail: "Khopoli, Maharashtra", lat: 18.8190, lon: 73.3830, type: "Waterpark", icon: "🎢", tags: ["waterpark", "fun", "family", "water slides"] },
    { name: "Tikuji-ni-Wadi", detail: "Thane, Maharashtra", lat: 19.2474, lon: 72.9920, type: "Waterpark", icon: "🎢", tags: ["waterpark", "fun", "family", "amusement", "resort"] },
    { name: "Shangrila Resort Waterpark", detail: "Pune, Maharashtra", lat: 18.6372, lon: 73.7556, type: "Waterpark", icon: "🎢", tags: ["waterpark", "fun", "family", "resort"] },
    { name: "Great Escape Waterpark", detail: "Virar, Maharashtra", lat: 19.4608, lon: 72.7888, type: "Waterpark", icon: "🎢", tags: ["waterpark", "fun", "family", "water slides"] },
    { name: "Diamond Water Park", detail: "Lohegaon, Pune", lat: 18.5974, lon: 73.9185, type: "Waterpark", icon: "🎢", tags: ["waterpark", "fun", "family", "pune"] },
    { name: "Kumar Resort Waterpark", detail: "Lonavala, Maharashtra", lat: 18.7458, lon: 73.4066, type: "Waterpark", icon: "🎢", tags: ["waterpark", "fun", "family", "resort"] },
    { name: "Suraj Water Park", detail: "Thane, Maharashtra", lat: 19.1834, lon: 72.9613, type: "Waterpark", icon: "🎢", tags: ["waterpark", "fun", "family"] },
    { name: "Anand Sagar Resort", detail: "Ambernath, Maharashtra", lat: 19.1983, lon: 73.1780, type: "Waterpark", icon: "🎢", tags: ["waterpark", "fun", "family", "resort", "amusement"] },
    { name: "EsselWorld", detail: "Gorai, Mumbai, Maharashtra", lat: 19.2323, lon: 72.8074, type: "Amusement", icon: "🎡", tags: ["amusement", "fun", "family", "theme park", "famous"] },
    { name: "Water Kingdom", detail: "Gorai, Mumbai, Maharashtra", lat: 19.2333, lon: 72.8063, type: "Waterpark", icon: "🎢", tags: ["waterpark", "fun", "family", "famous", "water slides"] },

    // ══════════════════════════════════════
    // MAHARASHTRA — BEACHES
    // ══════════════════════════════════════
    { name: "Juhu Beach", detail: "Mumbai, Maharashtra", lat: 19.0988, lon: 72.8267, type: "Beach", icon: "🏖️", tags: ["beach", "famous", "scenic", "mumbai"] },
    { name: "Marine Drive", detail: "Mumbai, Maharashtra", lat: 18.9435, lon: 72.8235, type: "Beach", icon: "🏖️", tags: ["beach", "famous", "scenic", "mumbai", "promenade"] },
    { name: "Ganpatipule Beach", detail: "Ratnagiri, Maharashtra", lat: 17.1449, lon: 73.2694, type: "Beach", icon: "🏖️", tags: ["beach", "hidden gem", "scenic", "clean", "temple"] },
    { name: "Tarkarli Beach", detail: "Sindhudurg, Maharashtra", lat: 16.0188, lon: 73.4636, type: "Beach", icon: "🏖️", tags: ["beach", "hidden gem", "scuba", "snorkeling", "clean"] },
    { name: "Diveagar Beach", detail: "Raigad, Maharashtra", lat: 18.1698, lon: 72.9903, type: "Beach", icon: "🏖️", tags: ["beach", "hidden gem", "scenic", "clean", "weekend"] },
    { name: "Kashid Beach", detail: "Raigad, Maharashtra", lat: 18.4282, lon: 72.9097, type: "Beach", icon: "🏖️", tags: ["beach", "famous", "scenic", "white sand", "weekend"] },
    { name: "Alibaug Beach", detail: "Raigad, Maharashtra", lat: 18.6414, lon: 72.8722, type: "Beach", icon: "🏖️", tags: ["beach", "famous", "scenic", "weekend", "accessible"] },
    { name: "Vengurla Beach", detail: "Sindhudurg, Maharashtra", lat: 15.8620, lon: 73.6310, type: "Beach", icon: "🏖️", tags: ["beach", "hidden gem", "scenic", "clean"] },
    { name: "Harihareshwar Beach", detail: "Raigad, Maharashtra", lat: 17.9916, lon: 73.0198, type: "Beach", icon: "🏖️", tags: ["beach", "hidden gem", "temple", "scenic"] },
    { name: "Murud Beach", detail: "Raigad, Maharashtra", lat: 18.3248, lon: 72.9606, type: "Beach", icon: "🏖️", tags: ["beach", "hidden gem", "scenic", "fort"] },

    // ══════════════════════════════════════
    // MAHARASHTRA — HILL STATIONS & NATURE
    // ══════════════════════════════════════
    { name: "Matheran", detail: "Raigad, Maharashtra", lat: 18.9866, lon: 73.2699, type: "Hill Station", icon: "🏔️", tags: ["hill station", "nature", "no vehicles", "scenic", "weekend", "famous"] },
    { name: "Panchgani", detail: "Satara, Maharashtra", lat: 17.9254, lon: 73.7987, type: "Hill Station", icon: "🏔️", tags: ["hill station", "nature", "scenic", "weekend", "famous"] },
    { name: "Amboli", detail: "Sindhudurg, Maharashtra", lat: 15.9633, lon: 74.0035, type: "Hill Station", icon: "🏔️", tags: ["hill station", "hidden gem", "nature", "monsoon", "scenic"] },
    { name: "Bhandardara", detail: "Ahmednagar, Maharashtra", lat: 19.5221, lon: 73.7624, type: "Hill Station", icon: "🏔️", tags: ["hill station", "hidden gem", "nature", "lake", "fireflies", "camping"] },
    { name: "Malshej Ghat", detail: "Pune, Maharashtra", lat: 19.3498, lon: 73.7835, type: "Nature", icon: "🌿", tags: ["nature", "hidden gem", "monsoon", "flamingos", "scenic", "ghat"] },
    { name: "Tamhini Ghat", detail: "Pune, Maharashtra", lat: 18.4620, lon: 73.4240, type: "Nature", icon: "🌿", tags: ["nature", "hidden gem", "monsoon", "scenic", "ghat", "waterfall"] },
    { name: "Lavasa", detail: "Pune, Maharashtra", lat: 18.4054, lon: 73.5067, type: "Hill Station", icon: "🏔️", tags: ["hill station", "planned city", "nature", "scenic", "weekend"] },
    { name: "Tadoba Tiger Reserve", detail: "Chandrapur, Maharashtra", lat: 20.2190, lon: 79.3750, type: "Wildlife", icon: "🐅", tags: ["wildlife", "tiger", "nature", "safari", "famous", "national park"] },
    { name: "Kas Plateau", detail: "Satara, Maharashtra", lat: 17.7236, lon: 73.8142, type: "Nature", icon: "🌺", tags: ["nature", "flowers", "unesco", "hidden gem", "seasonal", "famous"] },
    { name: "Lonar Crater Lake", detail: "Buldhana, Maharashtra", lat: 19.9756, lon: 76.5069, type: "Nature", icon: "🌋", tags: ["nature", "hidden gem", "crater", "lake", "unique", "geological"] },
    { name: "Panshet Dam", detail: "Pune, Maharashtra", lat: 18.3231, lon: 73.6717, type: "Nature", icon: "🏞️", tags: ["nature", "dam", "lake", "water sports", "weekend", "scenic"] },
    { name: "Pawna Lake", detail: "Lonavala, Maharashtra", lat: 18.6307, lon: 73.4861, type: "Nature", icon: "🏞️", tags: ["nature", "lake", "camping", "scenic", "weekend", "famous"] },

    // ══════════════════════════════════════
    // MAHARASHTRA — TEMPLES & SPIRITUAL
    // ══════════════════════════════════════
    { name: "Siddhivinayak Temple", detail: "Mumbai, Maharashtra", lat: 19.0169, lon: 72.8306, type: "Temple", icon: "🛕", tags: ["temple", "famous", "spiritual", "ganesh"] },
    { name: "Trimbakeshwar Temple", detail: "Nashik, Maharashtra", lat: 19.9325, lon: 73.5309, type: "Temple", icon: "🛕", tags: ["temple", "famous", "spiritual", "jyotirlinga"] },
    { name: "Bhimashankar Temple", detail: "Pune, Maharashtra", lat: 19.0703, lon: 73.5354, type: "Temple", icon: "🛕", tags: ["temple", "famous", "spiritual", "jyotirlinga", "trekking"] },
    { name: "Ashtavinayak", detail: "Maharashtra", lat: 18.6350, lon: 73.8950, type: "Temple", icon: "🛕", tags: ["temple", "famous", "spiritual", "ganesh", "pilgrimage"] },
    { name: "Grishneshwar Temple", detail: "Aurangabad, Maharashtra", lat: 20.0258, lon: 75.1790, type: "Temple", icon: "🛕", tags: ["temple", "famous", "spiritual", "jyotirlinga"] },

    // ══════════════════════════════════════
    // MAHARASHTRA — HIDDEN GEMS & ADVENTURE
    // ══════════════════════════════════════
    { name: "Sandhan Valley", detail: "Igatpuri, Maharashtra", lat: 19.5175, lon: 73.6833, type: "Adventure", icon: "🧗", tags: ["adventure", "hidden gem", "trekking", "canyon", "rappelling", "nature"] },
    { name: "Duke's Nose", detail: "Lonavala, Maharashtra", lat: 18.7180, lon: 73.3560, type: "Adventure", icon: "🧗", tags: ["adventure", "trekking", "scenic", "viewpoint", "weekend"] },
    { name: "Andharban Trek", detail: "Tamhini, Maharashtra", lat: 18.4400, lon: 73.4200, type: "Adventure", icon: "🧗", tags: ["adventure", "hidden gem", "trekking", "dense forest", "monsoon", "nature"] },
    { name: "Rajmachi Fireflies", detail: "Lonavala, Maharashtra", lat: 18.8315, lon: 73.3975, type: "Nature", icon: "✨", tags: ["nature", "hidden gem", "fireflies", "seasonal", "night", "unique"] },
    { name: "Koyna Wildlife Sanctuary", detail: "Satara, Maharashtra", lat: 17.4553, lon: 73.7370, type: "Wildlife", icon: "🦌", tags: ["wildlife", "nature", "hidden gem", "sanctuary", "trekking"] },
    { name: "Kolad River Rafting", detail: "Raigad, Maharashtra", lat: 18.4105, lon: 73.3283, type: "Adventure", icon: "🚣", tags: ["adventure", "water sports", "rafting", "fun", "weekend", "famous"] },
    { name: "Della Adventure Park", detail: "Lonavala, Maharashtra", lat: 18.7522, lon: 73.3953, type: "Adventure", icon: "🪂", tags: ["adventure", "fun", "amusement", "bungee", "zipline", "family"] },

    // ══════════════════════════════════════
    // INDIA — Other Major Cities & States
    // ══════════════════════════════════════
    { name: "New Delhi", detail: "Delhi, India", lat: 28.6139, lon: 77.2090, type: "City", icon: "🏙️" },
    { name: "Delhi", detail: "India", lat: 28.7041, lon: 77.1025, type: "City", icon: "🏙️" },
    { name: "Bangalore", detail: "Karnataka, India", lat: 12.9716, lon: 77.5946, type: "City", icon: "🏙️" },
    { name: "Hyderabad", detail: "Telangana, India", lat: 17.3850, lon: 78.4867, type: "City", icon: "🏙️" },
    { name: "Chennai", detail: "Tamil Nadu, India", lat: 13.0827, lon: 80.2707, type: "City", icon: "🏙️" },
    { name: "Kolkata", detail: "West Bengal, India", lat: 22.5726, lon: 88.3639, type: "City", icon: "🏙️" },
    { name: "Ahmedabad", detail: "Gujarat, India", lat: 23.0225, lon: 72.5714, type: "City", icon: "🏙️" },
    { name: "Jaipur", detail: "Rajasthan, India", lat: 26.9124, lon: 75.7873, type: "City", icon: "🏙️" },
    { name: "Lucknow", detail: "Uttar Pradesh, India", lat: 26.8467, lon: 80.9462, type: "City", icon: "🏙️" },
    { name: "Chandigarh", detail: "Punjab/Haryana, India", lat: 30.7333, lon: 76.7794, type: "City", icon: "🏙️" },
    { name: "Bhopal", detail: "Madhya Pradesh, India", lat: 23.2599, lon: 77.4126, type: "City", icon: "🏙️" },
    { name: "Indore", detail: "Madhya Pradesh, India", lat: 22.7196, lon: 75.8577, type: "City", icon: "🏙️" },
    { name: "Patna", detail: "Bihar, India", lat: 25.6093, lon: 85.1376, type: "City", icon: "🏙️" },
    { name: "Surat", detail: "Gujarat, India", lat: 21.1702, lon: 72.8311, type: "City", icon: "🏙️" },
    { name: "Vadodara", detail: "Gujarat, India", lat: 22.3072, lon: 73.1812, type: "City", icon: "🏙️" },
    { name: "Goa", detail: "India", lat: 15.2993, lon: 74.1240, type: "State", icon: "🏛️" },
    { name: "Kerala", detail: "India", lat: 10.8505, lon: 76.2711, type: "State", icon: "🏛️" },
    { name: "Rajasthan", detail: "India", lat: 27.0238, lon: 74.2179, type: "State", icon: "🏛️" },
    { name: "Tamil Nadu", detail: "India", lat: 11.1271, lon: 78.6569, type: "State", icon: "🏛️" },
    { name: "Uttar Pradesh", detail: "India", lat: 26.8468, lon: 80.9462, type: "State", icon: "🏛️" },
    { name: "Karnataka", detail: "India", lat: 15.3173, lon: 75.7139, type: "State", icon: "🏛️" },
    { name: "Gujarat", detail: "India", lat: 22.2587, lon: 71.1924, type: "State", icon: "🏛️" },
    { name: "West Bengal", detail: "India", lat: 22.9868, lon: 87.8550, type: "State", icon: "🏛️" },
    { name: "Kashmir", detail: "India", lat: 34.0837, lon: 74.7973, type: "Region", icon: "🏔️" },
    { name: "Shimla", detail: "Himachal Pradesh, India", lat: 31.1048, lon: 77.1734, type: "City", icon: "🏙️" },
    { name: "Manali", detail: "Himachal Pradesh, India", lat: 32.2396, lon: 77.1887, type: "Town", icon: "🏘️" },
    { name: "Varanasi", detail: "Uttar Pradesh, India", lat: 25.3176, lon: 83.0064, type: "City", icon: "🏙️" },
    { name: "Agra", detail: "Uttar Pradesh, India", lat: 27.1767, lon: 78.0081, type: "City", icon: "🏙️" },
    { name: "Udaipur", detail: "Rajasthan, India", lat: 24.5854, lon: 73.7125, type: "City", icon: "🏙️" },
    { name: "Jodhpur", detail: "Rajasthan, India", lat: 26.2389, lon: 73.0243, type: "City", icon: "🏙️" },
    { name: "Mysore", detail: "Karnataka, India", lat: 12.2958, lon: 76.6394, type: "City", icon: "🏙️" },
    { name: "Kochi", detail: "Kerala, India", lat: 9.9312, lon: 76.2673, type: "City", icon: "🏙️" },
    { name: "Coimbatore", detail: "Tamil Nadu, India", lat: 11.0168, lon: 76.9558, type: "City", icon: "🏙️" },
    { name: "Visakhapatnam", detail: "Andhra Pradesh, India", lat: 17.6868, lon: 83.2185, type: "City", icon: "🏙️" },
    { name: "Guwahati", detail: "Assam, India", lat: 26.1445, lon: 91.7362, type: "City", icon: "🏙️" },
    { name: "Bhubaneswar", detail: "Odisha, India", lat: 20.2961, lon: 85.8245, type: "City", icon: "🏙️" },
    { name: "Ranchi", detail: "Jharkhand, India", lat: 23.3441, lon: 85.3096, type: "City", icon: "🏙️" },
    { name: "Dehradun", detail: "Uttarakhand, India", lat: 30.3165, lon: 78.0322, type: "City", icon: "🏙️" },
    { name: "Rishikesh", detail: "Uttarakhand, India", lat: 30.0869, lon: 78.2676, type: "City", icon: "🏙️" },
    { name: "Darjeeling", detail: "West Bengal, India", lat: 27.0410, lon: 88.2663, type: "Town", icon: "🏘️" },

    // Indian Landmarks
    { name: "Taj Mahal", detail: "Agra, India", lat: 27.1751, lon: 78.0421, type: "Landmark", icon: "🕌" },
    { name: "Red Fort", detail: "Delhi, India", lat: 28.6562, lon: 77.2410, type: "Landmark", icon: "🏛️" },
    { name: "Qutub Minar", detail: "Delhi, India", lat: 28.5245, lon: 77.1855, type: "Landmark", icon: "🏛️" },
    { name: "India Gate", detail: "Delhi, India", lat: 28.6129, lon: 77.2295, type: "Landmark", icon: "🏛️" },
    { name: "Hawa Mahal", detail: "Jaipur, India", lat: 26.9239, lon: 75.8267, type: "Landmark", icon: "🏛️" },
    { name: "Golden Temple", detail: "Amritsar, India", lat: 31.6200, lon: 74.8765, type: "Landmark", icon: "🏛️" },

    // ══════════════════════════════════════
    // WORLD CAPITALS & MAJOR CITIES
    // ══════════════════════════════════════
    { name: "Tokyo", detail: "Japan", lat: 35.6762, lon: 139.6503, type: "City", icon: "🏙️" },
    { name: "London", detail: "United Kingdom", lat: 51.5074, lon: -0.1278, type: "City", icon: "🏙️" },
    { name: "Paris", detail: "France", lat: 48.8566, lon: 2.3522, type: "City", icon: "🏙️" },
    { name: "New York", detail: "United States", lat: 40.7128, lon: -74.0060, type: "City", icon: "🏙️" },
    { name: "Los Angeles", detail: "California, USA", lat: 34.0522, lon: -118.2437, type: "City", icon: "🏙️" },
    { name: "San Francisco", detail: "California, USA", lat: 37.7749, lon: -122.4194, type: "City", icon: "🏙️" },
    { name: "Chicago", detail: "Illinois, USA", lat: 41.8781, lon: -87.6298, type: "City", icon: "🏙️" },
    { name: "Washington DC", detail: "United States", lat: 38.9072, lon: -77.0369, type: "City", icon: "🏙️" },
    { name: "Dubai", detail: "United Arab Emirates", lat: 25.2048, lon: 55.2708, type: "City", icon: "🏙️" },
    { name: "Abu Dhabi", detail: "United Arab Emirates", lat: 24.4539, lon: 54.3773, type: "City", icon: "🏙️" },
    { name: "Singapore", detail: "Singapore", lat: 1.3521, lon: 103.8198, type: "City", icon: "🏙️" },
    { name: "Hong Kong", detail: "China", lat: 22.3193, lon: 114.1694, type: "City", icon: "🏙️" },
    { name: "Shanghai", detail: "China", lat: 31.2304, lon: 121.4737, type: "City", icon: "🏙️" },
    { name: "Beijing", detail: "China", lat: 39.9042, lon: 116.4074, type: "City", icon: "🏙️" },
    { name: "Seoul", detail: "South Korea", lat: 37.5665, lon: 126.9780, type: "City", icon: "🏙️" },
    { name: "Bangkok", detail: "Thailand", lat: 13.7563, lon: 100.5018, type: "City", icon: "🏙️" },
    { name: "Sydney", detail: "Australia", lat: -33.8688, lon: 151.2093, type: "City", icon: "🏙️" },
    { name: "Melbourne", detail: "Australia", lat: -37.8136, lon: 144.9631, type: "City", icon: "🏙️" },
    { name: "Berlin", detail: "Germany", lat: 52.5200, lon: 13.4050, type: "City", icon: "🏙️" },
    { name: "Rome", detail: "Italy", lat: 41.9028, lon: 12.4964, type: "City", icon: "🏙️" },
    { name: "Madrid", detail: "Spain", lat: 40.4168, lon: -3.7038, type: "City", icon: "🏙️" },
    { name: "Barcelona", detail: "Spain", lat: 41.3874, lon: 2.1686, type: "City", icon: "🏙️" },
    { name: "Amsterdam", detail: "Netherlands", lat: 52.3676, lon: 4.9041, type: "City", icon: "🏙️" },
    { name: "Moscow", detail: "Russia", lat: 55.7558, lon: 37.6173, type: "City", icon: "🏙️" },
    { name: "Istanbul", detail: "Turkey", lat: 41.0082, lon: 28.9784, type: "City", icon: "🏙️" },
    { name: "Cairo", detail: "Egypt", lat: 30.0444, lon: 31.2357, type: "City", icon: "🏙️" },
    { name: "Toronto", detail: "Canada", lat: 43.6532, lon: -79.3832, type: "City", icon: "🏙️" },
    { name: "Vancouver", detail: "Canada", lat: 49.2827, lon: -123.1207, type: "City", icon: "🏙️" },
    { name: "São Paulo", detail: "Brazil", lat: -23.5505, lon: -46.6333, type: "City", icon: "🏙️" },
    { name: "Rio de Janeiro", detail: "Brazil", lat: -22.9068, lon: -43.1729, type: "City", icon: "🏙️" },
    { name: "Mexico City", detail: "Mexico", lat: 19.4326, lon: -99.1332, type: "City", icon: "🏙️" },
    { name: "Buenos Aires", detail: "Argentina", lat: -34.6037, lon: -58.3816, type: "City", icon: "🏙️" },
    { name: "Cape Town", detail: "South Africa", lat: -33.9249, lon: 18.4241, type: "City", icon: "🏙️" },
    { name: "Nairobi", detail: "Kenya", lat: -1.2921, lon: 36.8219, type: "City", icon: "🏙️" },
    { name: "Lisbon", detail: "Portugal", lat: 38.7223, lon: -9.1393, type: "City", icon: "🏙️" },
    { name: "Vienna", detail: "Austria", lat: 48.2082, lon: 16.3738, type: "City", icon: "🏙️" },
    { name: "Prague", detail: "Czech Republic", lat: 50.0755, lon: 14.4378, type: "City", icon: "🏙️" },
    { name: "Athens", detail: "Greece", lat: 37.9838, lon: 23.7275, type: "City", icon: "🏙️" },
    { name: "Stockholm", detail: "Sweden", lat: 59.3293, lon: 18.0686, type: "City", icon: "🏙️" },
    { name: "Oslo", detail: "Norway", lat: 59.9139, lon: 10.7522, type: "City", icon: "🏙️" },
    { name: "Copenhagen", detail: "Denmark", lat: 55.6761, lon: 12.5683, type: "City", icon: "🏙️" },
    { name: "Helsinki", detail: "Finland", lat: 60.1699, lon: 24.9384, type: "City", icon: "🏙️" },
    { name: "Zurich", detail: "Switzerland", lat: 47.3769, lon: 8.5417, type: "City", icon: "🏙️" },
    { name: "Geneva", detail: "Switzerland", lat: 46.2044, lon: 6.1432, type: "City", icon: "🏙️" },
    { name: "Kuala Lumpur", detail: "Malaysia", lat: 3.1390, lon: 101.6869, type: "City", icon: "🏙️" },
    { name: "Jakarta", detail: "Indonesia", lat: -6.2088, lon: 106.8456, type: "City", icon: "🏙️" },
    { name: "Manila", detail: "Philippines", lat: 14.5995, lon: 120.9842, type: "City", icon: "🏙️" },
    { name: "Kathmandu", detail: "Nepal", lat: 27.7172, lon: 85.3240, type: "City", icon: "🏙️" },
    { name: "Colombo", detail: "Sri Lanka", lat: 6.9271, lon: 79.8612, type: "City", icon: "🏙️" },
    { name: "Dhaka", detail: "Bangladesh", lat: 23.8103, lon: 90.4125, type: "City", icon: "🏙️" },
    { name: "Islamabad", detail: "Pakistan", lat: 33.6844, lon: 73.0479, type: "City", icon: "🏙️" },
    { name: "Lahore", detail: "Pakistan", lat: 31.5204, lon: 74.3587, type: "City", icon: "🏙️" },
    { name: "Karachi", detail: "Pakistan", lat: 24.8607, lon: 67.0011, type: "City", icon: "🏙️" },
    { name: "Riyadh", detail: "Saudi Arabia", lat: 24.7136, lon: 46.6753, type: "City", icon: "🏙️" },
    { name: "Doha", detail: "Qatar", lat: 25.2854, lon: 51.5310, type: "City", icon: "🏙️" },
    { name: "Tehran", detail: "Iran", lat: 35.6892, lon: 51.3890, type: "City", icon: "🏙️" },
    { name: "Hanoi", detail: "Vietnam", lat: 21.0278, lon: 105.8342, type: "City", icon: "🏙️" },
    { name: "Ho Chi Minh City", detail: "Vietnam", lat: 10.8231, lon: 106.6297, type: "City", icon: "🏙️" },

    // ══════════════════════════════════════
    // COUNTRIES
    // ══════════════════════════════════════
    { name: "India", detail: "South Asia", lat: 20.5937, lon: 78.9629, type: "Country", icon: "🇮🇳" },
    { name: "United States", detail: "North America", lat: 37.0902, lon: -95.7129, type: "Country", icon: "🇺🇸" },
    { name: "United Kingdom", detail: "Europe", lat: 55.3781, lon: -3.4360, type: "Country", icon: "🇬🇧" },
    { name: "China", detail: "East Asia", lat: 35.8617, lon: 104.1954, type: "Country", icon: "🇨🇳" },
    { name: "Japan", detail: "East Asia", lat: 36.2048, lon: 138.2529, type: "Country", icon: "🇯🇵" },
    { name: "France", detail: "Europe", lat: 46.2276, lon: 2.2137, type: "Country", icon: "🇫🇷" },
    { name: "Germany", detail: "Europe", lat: 51.1657, lon: 10.4515, type: "Country", icon: "🇩🇪" },
    { name: "Italy", detail: "Europe", lat: 41.8719, lon: 12.5674, type: "Country", icon: "🇮🇹" },
    { name: "Australia", detail: "Oceania", lat: -25.2744, lon: 133.7751, type: "Country", icon: "🇦🇺" },
    { name: "Brazil", detail: "South America", lat: -14.2350, lon: -51.9253, type: "Country", icon: "🇧🇷" },
    { name: "Canada", detail: "North America", lat: 56.1304, lon: -106.3468, type: "Country", icon: "🇨🇦" },
    { name: "Russia", detail: "Europe/Asia", lat: 61.5240, lon: 105.3188, type: "Country", icon: "🇷🇺" },
    { name: "South Korea", detail: "East Asia", lat: 35.9078, lon: 127.7669, type: "Country", icon: "🇰🇷" },
    { name: "Spain", detail: "Europe", lat: 40.4637, lon: -3.7492, type: "Country", icon: "🇪🇸" },
    { name: "Mexico", detail: "North America", lat: 23.6345, lon: -102.5528, type: "Country", icon: "🇲🇽" },
    { name: "Thailand", detail: "Southeast Asia", lat: 15.8700, lon: 100.9925, type: "Country", icon: "🇹🇭" },
    { name: "Indonesia", detail: "Southeast Asia", lat: -0.7893, lon: 113.9213, type: "Country", icon: "🇮🇩" },
    { name: "Turkey", detail: "Europe/Asia", lat: 38.9637, lon: 35.2433, type: "Country", icon: "🇹🇷" },
    { name: "Saudi Arabia", detail: "Middle East", lat: 23.8859, lon: 45.0792, type: "Country", icon: "🇸🇦" },
    { name: "Egypt", detail: "North Africa", lat: 26.8206, lon: 30.8025, type: "Country", icon: "🇪🇬" },
    { name: "South Africa", detail: "Africa", lat: -30.5595, lon: 22.9375, type: "Country", icon: "🇿🇦" },
    { name: "Nigeria", detail: "West Africa", lat: 9.0820, lon: 8.6753, type: "Country", icon: "🇳🇬" },
    { name: "Pakistan", detail: "South Asia", lat: 30.3753, lon: 69.3451, type: "Country", icon: "🇵🇰" },
    { name: "Bangladesh", detail: "South Asia", lat: 23.6850, lon: 90.3563, type: "Country", icon: "🇧🇩" },
    { name: "Nepal", detail: "South Asia", lat: 28.3949, lon: 84.1240, type: "Country", icon: "🇳🇵" },
    { name: "Sri Lanka", detail: "South Asia", lat: 7.8731, lon: 80.7718, type: "Country", icon: "🇱🇰" },
    { name: "Malaysia", detail: "Southeast Asia", lat: 4.2105, lon: 101.9758, type: "Country", icon: "🇲🇾" },
    { name: "Philippines", detail: "Southeast Asia", lat: 12.8797, lon: 121.7740, type: "Country", icon: "🇵🇭" },
    { name: "Vietnam", detail: "Southeast Asia", lat: 14.0583, lon: 108.2772, type: "Country", icon: "🇻🇳" },
    { name: "Iran", detail: "Middle East", lat: 32.4279, lon: 53.6880, type: "Country", icon: "🇮🇷" },
    { name: "Argentina", detail: "South America", lat: -38.4161, lon: -63.6167, type: "Country", icon: "🇦🇷" },
    { name: "Switzerland", detail: "Europe", lat: 46.8182, lon: 8.2275, type: "Country", icon: "🇨🇭" },
    { name: "Sweden", detail: "Europe", lat: 60.1282, lon: 18.6435, type: "Country", icon: "🇸🇪" },
    { name: "Norway", detail: "Europe", lat: 60.4720, lon: 8.4689, type: "Country", icon: "🇳🇴" },
    { name: "Portugal", detail: "Europe", lat: 39.3999, lon: -8.2245, type: "Country", icon: "🇵🇹" },
    { name: "Greece", detail: "Europe", lat: 39.0742, lon: 21.8243, type: "Country", icon: "🇬🇷" },
    { name: "New Zealand", detail: "Oceania", lat: -40.9006, lon: 174.8860, type: "Country", icon: "🇳🇿" },

    // ══════════════════════════════════════
    // WORLD LANDMARKS & WONDERS
    // ══════════════════════════════════════
    { name: "Eiffel Tower", detail: "Paris, France", lat: 48.8584, lon: 2.2945, type: "Landmark", icon: "🗼" },
    { name: "Statue of Liberty", detail: "New York, USA", lat: 40.6892, lon: -74.0445, type: "Landmark", icon: "🗽" },
    { name: "Great Wall of China", detail: "Beijing, China", lat: 40.4319, lon: 116.5704, type: "Landmark", icon: "🏯" },
    { name: "Colosseum", detail: "Rome, Italy", lat: 41.8902, lon: 12.4922, type: "Landmark", icon: "🏟️" },
    { name: "Machu Picchu", detail: "Peru", lat: -13.1631, lon: -72.5450, type: "Landmark", icon: "🏛️" },
    { name: "Christ the Redeemer", detail: "Rio de Janeiro, Brazil", lat: -22.9519, lon: -43.2105, type: "Landmark", icon: "⛪" },
    { name: "Petra", detail: "Jordan", lat: 30.3285, lon: 35.4444, type: "Landmark", icon: "🏛️" },
    { name: "Pyramids of Giza", detail: "Cairo, Egypt", lat: 29.9792, lon: 31.1342, type: "Landmark", icon: "🔺" },
    { name: "Sydney Opera House", detail: "Sydney, Australia", lat: -33.8568, lon: 151.2153, type: "Landmark", icon: "🎭" },
    { name: "Burj Khalifa", detail: "Dubai, UAE", lat: 25.1972, lon: 55.2744, type: "Landmark", icon: "🏗️" },
    { name: "Big Ben", detail: "London, UK", lat: 51.5007, lon: -0.1246, type: "Landmark", icon: "🕰️" },
    { name: "Leaning Tower of Pisa", detail: "Pisa, Italy", lat: 43.7230, lon: 10.3966, type: "Landmark", icon: "🏛️" },
    { name: "Stonehenge", detail: "Wiltshire, UK", lat: 51.1789, lon: -1.8262, type: "Landmark", icon: "🪨" },
    { name: "Angkor Wat", detail: "Cambodia", lat: 13.4125, lon: 103.8670, type: "Landmark", icon: "🏛️" },
    { name: "Mount Fuji", detail: "Japan", lat: 35.3606, lon: 138.7274, type: "Nature", icon: "🗻" },
    { name: "Grand Canyon", detail: "Arizona, USA", lat: 36.1069, lon: -112.1129, type: "Nature", icon: "🏜️" },
    { name: "Niagara Falls", detail: "Ontario, Canada", lat: 43.0896, lon: -79.0849, type: "Nature", icon: "🌊" },
    { name: "Mount Everest", detail: "Nepal/China", lat: 27.9881, lon: 86.9250, type: "Nature", icon: "🏔️" },
    { name: "Amazon Rainforest", detail: "South America", lat: -3.4653, lon: -62.2159, type: "Nature", icon: "🌿" },
    { name: "Great Barrier Reef", detail: "Australia", lat: -18.2871, lon: 147.6992, type: "Nature", icon: "🪸" },
    { name: "Santorini", detail: "Greece", lat: 36.3932, lon: 25.4615, type: "Place", icon: "🏝️" },
    { name: "Maldives", detail: "South Asia", lat: 3.2028, lon: 73.2207, type: "Country", icon: "🏝️" },
    { name: "Bali", detail: "Indonesia", lat: -8.3405, lon: 115.0920, type: "Place", icon: "🏝️" },
    { name: "Hawaii", detail: "United States", lat: 19.8968, lon: -155.5828, type: "Place", icon: "🏝️" },
    { name: "Times Square", detail: "New York, USA", lat: 40.7580, lon: -73.9855, type: "Landmark", icon: "🎯" },
    { name: "Hollywood", detail: "Los Angeles, USA", lat: 34.0928, lon: -118.3287, type: "Place", icon: "🎬" },
    { name: "Silicon Valley", detail: "California, USA", lat: 37.3875, lon: -122.0575, type: "Place", icon: "💻" },
    { name: "Wall Street", detail: "New York, USA", lat: 40.7074, lon: -74.0113, type: "Place", icon: "💰" },
    { name: "Vatican City", detail: "Rome, Italy", lat: 41.9029, lon: 12.4534, type: "Place", icon: "⛪" },
    { name: "Buckingham Palace", detail: "London, UK", lat: 51.5014, lon: -0.1419, type: "Landmark", icon: "🏰" },
    { name: "Kremlin", detail: "Moscow, Russia", lat: 55.7520, lon: 37.6175, type: "Landmark", icon: "🏰" },
    { name: "Forbidden City", detail: "Beijing, China", lat: 39.9163, lon: 116.3972, type: "Landmark", icon: "🏯" },
    { name: "Hagia Sophia", detail: "Istanbul, Turkey", lat: 41.0086, lon: 28.9802, type: "Landmark", icon: "🕌" },
    { name: "Chichen Itza", detail: "Mexico", lat: 20.6843, lon: -88.5678, type: "Landmark", icon: "🏛️" },
];

// ══════════════════════════════════════════
// Category Search — maps natural language queries to tag filters
// ══════════════════════════════════════════
const CATEGORY_KEYWORDS = {
    // Waterfalls
    "waterfall": { tags: ["waterfall"], label: "💧 Waterfalls" },
    "waterfalls": { tags: ["waterfall"], label: "💧 Waterfalls" },
    "hidden waterfall": { tags: ["waterfall", "hidden"], label: "💧 Hidden Waterfalls" },
    "hidden waterfalls": { tags: ["waterfall", "hidden"], label: "💧 Hidden Waterfalls" },
    "best waterfall": { tags: ["waterfall", "famous"], label: "💧 Best Waterfalls" },
    "best waterfalls": { tags: ["waterfall", "famous"], label: "💧 Best Waterfalls" },
    "monsoon waterfall": { tags: ["waterfall", "monsoon"], label: "💧 Monsoon Waterfalls" },

    // Waterparks
    "waterpark": { tags: ["waterpark"], label: "🎢 Waterparks" },
    "waterparks": { tags: ["waterpark"], label: "🎢 Waterparks" },
    "water park": { tags: ["waterpark"], label: "🎢 Waterparks" },
    "water parks": { tags: ["waterpark"], label: "🎢 Waterparks" },
    "theme park": { tags: ["amusement"], label: "🎡 Theme Parks" },
    "amusement park": { tags: ["amusement"], label: "🎡 Amusement Parks" },

    // Forts
    "fort": { tags: ["fort"], label: "🏰 Forts" },
    "forts": { tags: ["fort"], label: "🏰 Forts" },
    "best forts": { tags: ["fort", "famous"], label: "🏰 Famous Forts" },
    "trekking forts": { tags: ["fort", "trekking"], label: "🏰 Trekking Forts" },

    // Beaches
    "beach": { tags: ["beach"], label: "🏖️ Beaches" },
    "beaches": { tags: ["beach"], label: "🏖️ Beaches" },
    "hidden beach": { tags: ["beach", "hidden gem"], label: "🏖️ Hidden Beaches" },
    "hidden beaches": { tags: ["beach", "hidden gem"], label: "🏖️ Hidden Beaches" },
    "best beach": { tags: ["beach", "famous"], label: "🏖️ Best Beaches" },
    "best beaches": { tags: ["beach", "famous"], label: "🏖️ Best Beaches" },

    // Nature
    "hill station": { tags: ["hill station"], label: "🏔️ Hill Stations" },
    "hill stations": { tags: ["hill station"], label: "🏔️ Hill Stations" },
    "hidden gem": { tags: ["hidden gem"], label: "💎 Hidden Gems" },
    "hidden gems": { tags: ["hidden gem"], label: "💎 Hidden Gems" },
    "nature": { tags: ["nature"], label: "🌿 Nature Spots" },
    "camping": { tags: ["camping"], label: "⛺ Camping Spots" },
    "lake": { tags: ["lake"], label: "🏞️ Lakes" },
    "lakes": { tags: ["lake"], label: "🏞️ Lakes" },

    // Adventure
    "adventure": { tags: ["adventure"], label: "🧗 Adventure" },
    "trekking": { tags: ["trekking"], label: "🥾 Trekking" },
    "trek": { tags: ["trekking"], label: "🥾 Trekking" },
    "treks": { tags: ["trekking"], label: "🥾 Trekking" },
    "rafting": { tags: ["rafting"], label: "🚣 Rafting" },
    "water sports": { tags: ["water sports"], label: "🏄 Water Sports" },

    // Temples
    "temple": { tags: ["temple"], label: "🛕 Temples" },
    "temples": { tags: ["temple"], label: "🛕 Temples" },
    "jyotirlinga": { tags: ["jyotirlinga"], label: "🛕 Jyotirlingas" },
    "spiritual": { tags: ["spiritual"], label: "🙏 Spiritual Places" },

    // Wildlife
    "wildlife": { tags: ["wildlife"], label: "🐅 Wildlife" },
    "safari": { tags: ["safari"], label: "🦁 Safari" },
    "national park": { tags: ["national park"], label: "🌳 National Parks" },

    // Fun
    "fun": { tags: ["fun"], label: "🎉 Fun Places" },
    "family": { tags: ["family"], label: "👨‍👩‍👧‍👦 Family Fun" },
    "weekend": { tags: ["weekend"], label: "🌤️ Weekend Getaways" },
    "weekend getaway": { tags: ["weekend"], label: "🌤️ Weekend Getaways" },

    // Heritage
    "heritage": { tags: ["heritage"], label: "🏛️ Heritage Sites" },
    "unesco": { tags: ["unesco"], label: "🏛️ UNESCO Sites" },
    "cave": { tags: ["cave"], label: "🕳️ Caves" },
    "caves": { tags: ["cave"], label: "🕳️ Caves" },
};

/**
 * Search places by category tags
 * Returns all matching places (not just 6)
 */
function searchByCategory(query) {
    const q = query.toLowerCase().trim();

    // Try exact match first, then partial
    let matched = CATEGORY_KEYWORDS[q];

    if (!matched) {
        // Try to find a keyword within the query
        const keys = Object.keys(CATEGORY_KEYWORDS).sort((a, b) => b.length - a.length);
        for (const key of keys) {
            if (q.includes(key)) {
                matched = CATEGORY_KEYWORDS[key];
                break;
            }
        }
    }

    if (!matched) return null;

    // Filter places by ALL required tags
    const results = FAMOUS_PLACES.filter(p => {
        if (!p.tags) return false;
        return matched.tags.every(tag => p.tags.includes(tag));
    });

    return {
        label: matched.label,
        places: results,
        isCategory: true
    };
}
