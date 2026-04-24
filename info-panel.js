/**
 * LocationInfoPanel v6 — Professional Overhaul
 *
 * FIXES from v5:
 *  ✅ Photos  — Single image source (no duplicate hero bg + carousel)
 *  ✅ Images  — Better URL construction with fallbacks for loading failures
 *  ✅ Dedup   — No duplicate Capital rows, no repeated country in subtitle
 *  ✅ Nearby  — Full row is clickable, not just the arrow button
 *  ✅ Layout  — Clean professional sections with zero data repetition
 *  ✅ Extract — Wikipedia REST summary for clean, reliable text
 *  ✅ Cache   — LRU 80 entries, 10-min TTL
 */

// ─── LRU Cache ────────────────────────────────────────────────────────────────
const _cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;
function cacheGet(k) {
    if (!_cache.has(k)) return undefined;           // ← FIX: return undefined, not null
    const e = _cache.get(k);
    if (Date.now() - e.ts > CACHE_TTL) { _cache.delete(k); return undefined; }
    return e.val;
}
function cacheSet(k, v) {
    if (_cache.size >= 80) {
        // Evict oldest entry — first key from iterator
        const oldest = _cache.keys().next();
        if (!oldest.done) _cache.delete(oldest.value);
    }
    _cache.set(k, { val: v, ts: Date.now() });
}

// ─── HTML escape helper (prevents XSS in dynamic content) ────────────────────
function _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ─── Country Database ─────────────────────────────────────────────────────────
const COUNTRY_META = {
    IN: { flag:'🇮🇳', continent:'Asia',         capital:'New Delhi',       currency:{name:'Indian Rupee',    symbol:'₹'},  languages:['Hindi','English'],          tz:'IST UTC+5:30', heroGrad:'160deg,#0f2027 0%,#203a43 50%,#2c5364 100%', cuisine:{food:['Biryani','Butter Chicken','Dosa','Samosa','Chai'],         spec:'Aromatic spices & slow-cooked curries'} },
    US: { flag:'🇺🇸', continent:'N. America',   capital:'Washington D.C.', currency:{name:'US Dollar',       symbol:'$'},  languages:['English'],                  tz:'EST UTC-5',    heroGrad:'160deg,#0d1b2a 0%,#1b2838 50%,#1e3a5f 100%', cuisine:{food:['Burger','BBQ Ribs','Apple Pie','Lobster Roll','Tacos'],   spec:'Melting pot of world cuisines'} },
    GB: { flag:'🇬🇧', continent:'Europe',        capital:'London',          currency:{name:'Pound Sterling',  symbol:'£'},  languages:['English'],                  tz:'GMT UTC+0',    heroGrad:'160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%', cuisine:{food:["Fish & Chips",'Sunday Roast',"Shepherd's Pie",'Scones','Sticky Toffee Pudding'], spec:'Hearty British comfort food'} },
    FR: { flag:'🇫🇷', continent:'Europe',        capital:'Paris',           currency:{name:'Euro',            symbol:'€'},  languages:['French'],                   tz:'CET UTC+1',    heroGrad:'160deg,#1a1a2e 0%,#2a1a3e 50%,#1a2a4e 100%', cuisine:{food:['Croissant','Baguette','Coq au Vin','Crêpes','Macarons'],  spec:'Fine dining & gourmet pastries'} },
    IT: { flag:'🇮🇹', continent:'Europe',        capital:'Rome',            currency:{name:'Euro',            symbol:'€'},  languages:['Italian'],                  tz:'CET UTC+1',    heroGrad:'160deg,#0d1f12 0%,#1a3a22 50%,#2d5a30 100%', cuisine:{food:['Pizza','Pasta','Gelato','Risotto','Tiramisu'],            spec:'Mediterranean flavours & olive oil'} },
    JP: { flag:'🇯🇵', continent:'Asia',          capital:'Tokyo',           currency:{name:'Japanese Yen',    symbol:'¥'},  languages:['Japanese'],                 tz:'JST UTC+9',    heroGrad:'160deg,#2d0a0a 0%,#4a1515 50%,#6b2020 100%', cuisine:{food:['Sushi','Ramen','Tempura','Mochi','Yakitori'],             spec:'Fresh seafood & umami mastery'} },
    CN: { flag:'🇨🇳', continent:'Asia',          capital:'Beijing',         currency:{name:'Renminbi',        symbol:'¥'},  languages:['Mandarin'],                 tz:'CST UTC+8',    heroGrad:'160deg,#2d0000 0%,#4a0000 50%,#6b1a1a 100%', cuisine:{food:['Dim Sum','Peking Duck','Dumplings','Hot Pot','Baozi'],    spec:'Diverse regional cuisines'} },
    DE: { flag:'🇩🇪', continent:'Europe',        capital:'Berlin',          currency:{name:'Euro',            symbol:'€'},  languages:['German'],                   tz:'CET UTC+1',    heroGrad:'160deg,#1a1a0d 0%,#2a2a15 50%,#1a2a0d 100%', cuisine:{food:['Bratwurst','Schnitzel','Pretzel','Black Forest Cake','Beer'], spec:'Hearty meat dishes & beer culture'} },
    BR: { flag:'🇧🇷', continent:'S. America',   capital:'Brasília',        currency:{name:'Brazilian Real',  symbol:'R$'}, languages:['Portuguese'],               tz:'BRT UTC-3',    heroGrad:'160deg,#0d2a0d 0%,#1a4a1a 50%,#0d3d1a 100%', cuisine:{food:['Feijoada','Churrasco','Açaí','Pão de Queijo','Brigadeiro'], spec:'Grilled meats & tropical fruits'} },
    MX: { flag:'🇲🇽', continent:'N. America',   capital:'Mexico City',     currency:{name:'Mexican Peso',    symbol:'$'},  languages:['Spanish'],                  tz:'CST UTC-6',    heroGrad:'160deg,#1a0d00 0%,#2a1a00 50%,#1a2a00 100%', cuisine:{food:['Tacos','Enchiladas','Guacamole','Churros','Tamales'],     spec:'Bold flavours & fresh ingredients'} },
    ES: { flag:'🇪🇸', continent:'Europe',        capital:'Madrid',          currency:{name:'Euro',            symbol:'€'},  languages:['Spanish'],                  tz:'CET UTC+1',    heroGrad:'160deg,#2a0d00 0%,#4a1a00 50%,#2a2a00 100%', cuisine:{food:['Paella','Tapas','Gazpacho','Jamón Ibérico','Churros'],    spec:'Mediterranean seafood & tapas'} },
    RU: { flag:'🇷🇺', continent:'Europe/Asia',   capital:'Moscow',          currency:{name:'Ruble',           symbol:'₽'},  languages:['Russian'],                  tz:'MSK UTC+3',    heroGrad:'160deg,#0d0d2a 0%,#1a1a3a 50%,#0d1a2a 100%', cuisine:{food:['Borscht','Beef Stroganoff','Pelmeni','Blini','Caviar'],   spec:'Hearty Eastern European fare'} },
    AU: { flag:'🇦🇺', continent:'Oceania',       capital:'Canberra',        currency:{name:'AUD',             symbol:'A$'}, languages:['English'],                  tz:'AEST UTC+10',  heroGrad:'160deg,#0d1f2a 0%,#0d2a3a 50%,#0a1f2a 100%', cuisine:{food:['Meat Pie','Barramundi','Vegemite','Lamington','Tim Tam'],  spec:'Fresh seafood & BBQ culture'} },
    EG: { flag:'🇪🇬', continent:'Africa',        capital:'Cairo',           currency:{name:'Egyptian Pound',  symbol:'E£'}, languages:['Arabic'],                   tz:'EET UTC+2',    heroGrad:'160deg,#2a1a00 0%,#3a2a00 50%,#2a1500 100%', cuisine:{food:['Koshari','Falafel','Ful Medames','Baklava','Kofta'],     spec:'Middle Eastern flavours'} },
    GR: { flag:'🇬🇷', continent:'Europe',        capital:'Athens',          currency:{name:'Euro',            symbol:'€'},  languages:['Greek'],                    tz:'EET UTC+2',    heroGrad:'160deg,#0d1f3a 0%,#1a2a4a 50%,#0d2a3a 100%', cuisine:{food:['Gyros','Moussaka','Souvlaki','Baklava','Spanakopita'],   spec:'Olive oil & Mediterranean herbs'} },
    TH: { flag:'🇹🇭', continent:'Asia',          capital:'Bangkok',         currency:{name:'Baht',            symbol:'฿'},  languages:['Thai'],                     tz:'ICT UTC+7',    heroGrad:'160deg,#1a0d2a 0%,#2a1a3a 50%,#1a2a0d 100%', cuisine:{food:['Pad Thai','Tom Yum','Green Curry','Mango Rice','Som Tum'], spec:'Sweet, sour, salty & spicy'} },
    TR: { flag:'🇹🇷', continent:'Asia/Europe',   capital:'Ankara',          currency:{name:'Turkish Lira',    symbol:'₺'},  languages:['Turkish'],                  tz:'TRT UTC+3',    heroGrad:'160deg,#2a0d00 0%,#3a1500 50%,#2a1a00 100%', cuisine:{food:['Kebab','Baklava','Meze','Börek','Lahmacun'],             spec:'Rich spices & grilled meats'} },
    PT: { flag:'🇵🇹', continent:'Europe',        capital:'Lisbon',          currency:{name:'Euro',            symbol:'€'},  languages:['Portuguese'],               tz:'WET UTC+0',    heroGrad:'160deg,#0d1a2a 0%,#1a2a3a 50%,#0d2a1a 100%', cuisine:{food:['Pastéis de Nata','Bacalhau','Bifanas','Caldo Verde','Sardinhas'], spec:'Atlantic seafood & pastries'} },
    NL: { flag:'🇳🇱', continent:'Europe',        capital:'Amsterdam',       currency:{name:'Euro',            symbol:'€'},  languages:['Dutch'],                    tz:'CET UTC+1',    heroGrad:'160deg,#0d0d1a 0%,#1a1a2a 50%,#0d1a2a 100%', cuisine:{food:['Stroopwafel','Haring','Bitterballen','Poffertjes','Gouda'], spec:'Dairy delights & street food'} },
    CH: { flag:'🇨🇭', continent:'Europe',        capital:'Bern',            currency:{name:'Swiss Franc',     symbol:'CHF'},languages:['German','French','Italian'],tz:'CET UTC+1',    heroGrad:'160deg,#1a0d0d 0%,#2a1a1a 50%,#1a2a1a 100%', cuisine:{food:['Fondue','Raclette','Rösti','Swiss Chocolate','Zürcher Geschnetzeltes'], spec:'Alpine comfort food'} },
    CA: { flag:'🇨🇦', continent:'N. America',   capital:'Ottawa',          currency:{name:'Canadian Dollar', symbol:'CA$'},languages:['English','French'],         tz:'EST UTC-5',    heroGrad:'160deg,#2a0d0d 0%,#3a1a1a 50%,#2a1a0d 100%', cuisine:{food:['Poutine','Butter Tarts','BeaverTails','Maple Syrup','Nanaimo Bar'], spec:'Multicultural fusion'} },
    AE: { flag:'🇦🇪', continent:'Asia',          capital:'Abu Dhabi',       currency:{name:'Dirham',          symbol:'AED'},languages:['Arabic'],                  tz:'GST UTC+4',    heroGrad:'160deg,#0d1a0d 0%,#1a2a0d 50%,#0d0d1a 100%', cuisine:{food:['Shawarma','Harees','Luqaimat','Machboos','Fatteh'],       spec:'Arabic hospitality & spices'} },
    ZA: { flag:'🇿🇦', continent:'Africa',        capital:'Pretoria',        currency:{name:'Rand',            symbol:'R'},  languages:['Zulu','Xhosa','Afrikaans'], tz:'SAST UTC+2',   heroGrad:'160deg,#1a0d00 0%,#2a1500 50%,#0d1a0d 100%', cuisine:{food:['Braai','Bobotie','Biltong','Bunny Chow','Koeksister'],    spec:'Braai culture & Cape Malay spices'} },
    AR: { flag:'🇦🇷', continent:'S. America',   capital:'Buenos Aires',    currency:{name:'Peso',            symbol:'$'},  languages:['Spanish'],                  tz:'ART UTC-3',    heroGrad:'160deg,#0d1a2a 0%,#1a2a3a 50%,#0d2a2a 100%', cuisine:{food:['Asado','Empanadas','Dulce de Leche','Alfajores','Medialunas'], spec:'World-class beef & wine'} },
    ID: { flag:'🇮🇩', continent:'Asia',          capital:'Jakarta',         currency:{name:'Rupiah',          symbol:'Rp'}, languages:['Indonesian'],               tz:'WIB UTC+7',    heroGrad:'160deg,#1a0d00 0%,#2a1500 50%,#1a1a00 100%', cuisine:{food:['Nasi Goreng','Satay','Rendang','Gado-gado','Soto'],       spec:'Rich spices & tropical flavours'} },
    KR: { flag:'🇰🇷', continent:'Asia',          capital:'Seoul',           currency:{name:'Won',             symbol:'₩'},  languages:['Korean'],                   tz:'KST UTC+9',    heroGrad:'160deg,#0d0d2a 0%,#1a1a4a 50%,#2a0d2a 100%', cuisine:{food:['Bibimbap','Kimchi','Korean BBQ','Japchae','Tteokbokki'],  spec:'Fermented & grilled delights'} },
    PK: { flag:'🇵🇰', continent:'Asia',          capital:'Islamabad',       currency:{name:'Rupee',           symbol:'₨'},  languages:['Urdu','English'],           tz:'PKT UTC+5',    heroGrad:'160deg,#0d1a00 0%,#1a2a00 50%,#0d1500 100%', cuisine:{food:['Nihari','Biryani','Karahi','Haleem','Seekh Kebab'],       spec:'Rich spices & slow-cooked curries'} },
    SA: { flag:'🇸🇦', continent:'Asia',          capital:'Riyadh',          currency:{name:'Riyal',           symbol:'﷼'},  languages:['Arabic'],                   tz:'AST UTC+3',    heroGrad:'160deg,#1a1000 0%,#2a2000 50%,#1a1800 100%', cuisine:{food:['Kabsa','Mutabbaq','Jareesh','Dates','Saleeg'],            spec:'Spiced rice & Bedouin hospitality'} },
    NG: { flag:'🇳🇬', continent:'Africa',        capital:'Abuja',           currency:{name:'Naira',           symbol:'₦'},  languages:['English'],                  tz:'WAT UTC+1',    heroGrad:'160deg,#001a00 0%,#002a00 50%,#001500 100%', cuisine:{food:['Jollof Rice','Egusi Soup','Suya','Puff Puff','Akara'],    spec:'Bold West African flavours'} },
    PE: { flag:'🇵🇪', continent:'S. America',   capital:'Lima',            currency:{name:'Sol',             symbol:'S/'}, languages:['Spanish'],                  tz:'PET UTC-5',    heroGrad:'160deg,#1a0d00 0%,#2a1a00 50%,#0d1a0d 100%', cuisine:{food:['Ceviche','Lomo Saltado','Anticuchos','Causa','Ají de Gallina'], spec:'Fusion of indigenous & Spanish'} },
};

function getCountryMeta(code) {
    return COUNTRY_META[code?.toUpperCase()] || {
        flag:'🌍', continent:'Earth', capital:'', currency:{name:'',symbol:'—'}, languages:[],
        tz:'UTC', heroGrad:'160deg,#0f172a 0%,#1e293b 50%,#0c4a6e 100%',
        cuisine:{food:['Local Dishes'], spec:'Regional specialties'}
    };
}

// ─── Weather codes ────────────────────────────────────────────────────────────
const WMO = {
    0:['Clear sky','☀️'],1:['Mainly clear','🌤️'],2:['Partly cloudy','⛅'],3:['Overcast','☁️'],
    45:['Fog','🌫️'],48:['Icy fog','🌫️'],51:['Light drizzle','🌦️'],53:['Drizzle','🌦️'],
    55:['Heavy drizzle','🌧️'],56:['Light freezing drizzle','🌧️'],57:['Freezing drizzle','🌧️'],
    61:['Light rain','🌧️'],63:['Rain','🌧️'],65:['Heavy rain','🌧️'],
    66:['Light freezing rain','🌧️'],67:['Freezing rain','🌧️'],
    71:['Light snow','❄️'],73:['Snow','❄️'],75:['Heavy snow','❄️'],77:['Sleet','🌨️'],
    80:['Rain showers','🌦️'],81:['Showers','🌦️'],82:['Heavy showers','⛈️'],
    85:['Snow showers','🌨️'],86:['Heavy snow showers','🌨️'],
    95:['Thunderstorm','⛈️'],96:['Thunderstorm + hail','⛈️'],99:['Severe thunderstorm','⛈️']
};
const wmoInfo = c => WMO[c] ?? ['Unknown','🌡️'];
const windDir = d => ['N','NE','E','SE','S','SW','W','NW'][Math.round((d||0)/45)%8];

// ─── Country code guesser ─────────────────────────────────────────────────────
function guessCC(lat, lng) {
    if (lat>=8&&lat<=37&&lng>=68&&lng<=97)      return 'IN';
    if (lat>=24&&lat<=50&&lng>=-125&&lng<=-66)  return 'US';
    if (lat>=49&&lat<=61&&lng>=-8&&lng<=2)      return 'GB';
    if (lat>=42&&lat<=51&&lng>=-5&&lng<=10)     return 'FR';
    if (lat>=36&&lat<=47&&lng>=6&&lng<=19)      return 'IT';
    if (lat>=30&&lat<=46&&lng>=128&&lng<=146)   return 'JP';
    if (lat>=18&&lat<=53&&lng>=73&&lng<=135)    return 'CN';
    if (lat>=47&&lat<=55&&lng>=6&&lng<=15)      return 'DE';
    if (lat>=-34&&lat<=6&&lng>=-74&&lng<=-34)   return 'BR';
    if (lat>=14&&lat<=33&&lng>=-118&&lng<=-86)  return 'MX';
    if (lat>=36&&lat<=44&&lng>=-9&&lng<=4)      return 'ES';
    if (lat>=41&&lat<=82&&lng>=27&&lng<=180)    return 'RU';
    if (lat>=-44&&lat<=-10&&lng>=113&&lng<=154) return 'AU';
    if (lat>=22&&lat<=32&&lng>=25&&lng<=37)     return 'EG';
    if (lat>=35&&lat<=42&&lng>=20&&lng<=30)     return 'GR';
    if (lat>=5&&lat<=21&&lng>=97&&lng<=106)     return 'TH';
    if (lat>=36&&lat<=42&&lng>=26&&lng<=45)     return 'TR';
    if (lat>=45&&lat<=48&&lng>=5&&lng<=11)      return 'CH';
    if (lat>=42&&lat<=72&&lng>=-141&&lng<=-52)  return 'CA';
    if (lat>=23&&lat<=26&&lng>=51&&lng<=56)     return 'AE';
    if (lat>=-35&&lat<=-22&&lng>=16&&lng<=33)   return 'ZA';
    if (lat>=-55&&lat<=-21&&lng>=-74&&lng<=-53) return 'AR';
    if (lat>=-11&&lat<=6&&lng>=95&&lng<=141)    return 'ID';
    if (lat>=33&&lat<=38&&lng>=125&&lng<=130)   return 'KR';
    if (lat>=24&&lat<=37&&lng>=60&&lng<=77)     return 'PK';
    if (lat>=16&&lat<=32&&lng>=36&&lng<=56)     return 'SA';
    if (lat>=4&&lat<=14&&lng>=3&&lng<=15)       return 'NG';
    return '';
}

// ─── API Fetchers ─────────────────────────────────────────────────────────────

async function fetchNominatim(lat, lng) {
    const k = `nom_${lat.toFixed(3)}_${lng.toFixed(3)}`;
    const c = cacheGet(k); if (c !== undefined) return c;
    try {
        const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en`,
            { 
                signal: AbortSignal.timeout(3000),
                headers: { 'User-Agent': 'Click2xplore-App/1.0 (contact@example.com)' }
            }
        );
        if (!r.ok) return null;
        const d = await r.json(); cacheSet(k, d); return d;
    } catch (e) {
        return null;
    }
}

async function fetchWeather(lat, lng) {
    const k = `wx_${lat.toFixed(2)}_${lng.toFixed(2)}`;
    const c = cacheGet(k); if (c !== undefined) return c;
    try {
        const r = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
            `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weathercode,apparent_temperature` +
            `&wind_speed_unit=kmh&temperature_unit=celsius&timezone=auto`,
            { signal: AbortSignal.timeout(3000) }
        );
        const d = await r.json(); cacheSet(k, d); return d;
    } catch { return null; }
}

async function fetchElevation(lat, lng) {
    const k = `elev_${lat.toFixed(3)}_${lng.toFixed(3)}`;
    const c = cacheGet(k); if (c !== undefined) return c;
    try {
        const r = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`,
            { signal: AbortSignal.timeout(2500) });
        const d = await r.json();
        const v = d.elevation?.[0] ?? null; cacheSet(k, v); return v;
    } catch { return null; }
}

// Wikipedia REST API — summary (extract + thumbnail, reliable)
async function fetchWikiSummary(title) {
    const k = `wsum_${title}`;
    const c = cacheGet(k); if (c !== undefined) return c;
    try {
        const r = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
            { headers:{'Accept':'application/json'}, signal: AbortSignal.timeout(3000) }
        );
        if (!r.ok) { cacheSet(k, null); return null; }
        const d = await r.json(); cacheSet(k, d); return d;
    } catch { cacheSet(k, null); return null; }
}

// Wikipedia REST API — media-list (all images with real dimensions)
async function fetchWikiMedia(title) {
    const k = `wmedia_${title}`;
    const c = cacheGet(k); if (c !== undefined) return c;
    try {
        const r = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title)}`,
            { headers:{'Accept':'application/json'}, signal: AbortSignal.timeout(3000) }
        );
        if (!r.ok) return [];
        const d = await r.json();
        const items = (d.items || [])
            .filter(it => {
                if (it.type !== 'image') return false;
                const src = (it.original?.source || it.srcset?.[0]?.src || '').toLowerCase();
                if (src.endsWith('.svg')) return false;
                if (/(flag|logo|icon|seal|coa|emblem|locator|map[-_]|symbol|coat.of.arms|signature|stamp|blank|commons-logo|wikidata|question|edit[-_]|red[-_]pencil|increase|decrease|steady)/i.test(src)) return false;
                return (it.original?.width || 0) >= 280;
            })
            .sort((a, b) => (b.original?.width || 0) - (a.original?.width || 0))
            .map(it => {
                // Use SMALL thumbnails (320px) for instant loading
                let thumbUrl = '';
                const apiThumb = it.thumbnail?.source;
                if (apiThumb) {
                    thumbUrl = apiThumb.replace(/\/\d+px-/, '/320px-');
                }
                if (!thumbUrl) {
                    const sorted = (it.srcset || []).slice().sort((a, b) => (b.scale || 1) - (a.scale || 1));
                    const best = sorted[0];
                    if (best?.src) {
                        thumbUrl = best.src.startsWith('//') ? 'https:' + best.src : best.src;
                    }
                }
                if (!thumbUrl) {
                    thumbUrl = it.original.source;
                }
                const caption = (it.description?.text || it.title || '')
                    .replace(/^File:/i,'').replace(/_/g,' ').replace(/\.[^.]+$/,'').trim();
                return { url: thumbUrl, thumb: apiThumb || thumbUrl, w: it.original.width || 0, caption };
            })
            .slice(0, 5);
        // Preload all thumbnails in parallel for instant display
        items.forEach(img => {
            const pre = new Image();
            pre.referrerPolicy = 'no-referrer';
            pre.src = img.url;
        });
        cacheSet(k, items); return items;
    } catch { return []; }
}

// Search Wikipedia for the best article title matching a place name
async function searchWikiTitle(name, lat, lng) {
    const k = `wsearch_${name.slice(0,30)}`;
    const c = cacheGet(k); if (c !== undefined) return c;
    try {
        const r = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&srlimit=3&format=json&origin=*`,
            { signal: AbortSignal.timeout(3000) }
        );
        const d = await r.json();
        const hit = d.query?.search?.[0]?.title || null;
        cacheSet(k, hit); return hit;
    } catch { return null; }
}

// ─── Haversine distance (meters) ──────────────────────────────────────────────
function _haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function _fmtDist(m) { return m < 1000 ? `${Math.round(m)} m` : `${(m/1000).toFixed(1)} km`; }

// ─── Source 1: Local FAMOUS_PLACES database via PlacesDB (instant, offline) ───
function fetchNearbyLocal(lat, lng, radiusKm = 80, limit = 10) {
    // Use PlacesDB.near() for optimized access; fallback to raw array if unavailable
    if (typeof PlacesDB !== 'undefined') {
        return PlacesDB.near(lat, lng, radiusKm)
            .filter(p => p.distance > 0.1) // exclude self (<100m)
            .slice(0, limit)
            .map(p => ({
                title: p.name, lat: p.lat, lng: p.lon,
                distM: p.distance * 1000, // PlacesDB returns km, convert to meters
                type: p.type || '', icon: p.icon || '📍', source: 'db',
                dist: _fmtDist(p.distance * 1000)
            }));
    }
    if (typeof FAMOUS_PLACES === 'undefined') return [];
    const maxM = radiusKm * 1000;
    return FAMOUS_PLACES
        .map(p => {
            const d = _haversine(lat, lng, p.lat, p.lon);
            return { title: p.name, lat: p.lat, lng: p.lon, distM: d, type: p.type || '', icon: p.icon || '📍', source: 'db' };
        })
        .filter(p => p.distM > 100 && p.distM <= maxM)
        .sort((a, b) => a.distM - b.distM)
        .slice(0, limit)
        .map(p => ({ ...p, dist: _fmtDist(p.distM) }));
}

// ─── Source 2: Wikipedia geosearch (wider radius, retry) ──────────────────────
async function fetchNearbyWiki(lat, lng) {
    const k = `nearby_wiki_${lat.toFixed(2)}_${lng.toFixed(2)}`;
    const c = cacheGet(k); if (c !== undefined) return c;

    // Try with progressively wider radius if first attempt returns few results
    for (const radius of [10000, 30000]) {
        try {
            const r = await fetch(
                `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lng}&gsradius=${radius}&gslimit=12&format=json&origin=*`,
                { signal: AbortSignal.timeout(4000) }
            );
            if (!r.ok) continue;
            const d = await r.json();
            const results = (d.query?.geosearch || []).map(p => ({
                title: p.title,
                lat: p.lat, lng: p.lon,
                distM: p.dist,
                dist: _fmtDist(p.dist),
                type: 'Wikipedia',
                icon: '📖',
                source: 'wiki'
            }));
            if (results.length >= 3 || radius >= 30000) {
                cacheSet(k, results); return results;
            }
            // Too few results — try wider radius
        } catch { /* continue to next radius */ }
    }
    return [];
}

// ─── Source 3: Overpass API (OpenStreetMap POIs) ──────────────────────────────
async function fetchNearbyOSM(lat, lng) {
    const k = `nearby_osm_${lat.toFixed(2)}_${lng.toFixed(2)}`;
    const c = cacheGet(k); if (c !== undefined) return c;
    try {
        // Query for notable POIs: tourism, historic, leisure, amenity landmarks
        const query = `
[out:json][timeout:5];
(
  node["tourism"~"attraction|viewpoint|museum|artwork"](around:15000,${lat},${lng});
  node["historic"~"monument|memorial|castle|ruins|fort"](around:15000,${lat},${lng});
  node["leisure"~"park|garden|nature_reserve"](around:15000,${lat},${lng});
  node["amenity"~"place_of_worship"](around:10000,${lat},${lng});
  node["natural"~"peak|waterfall|beach|cave_entrance"](around:15000,${lat},${lng});
);
out body 15;
`.trim();
        const r = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            signal: AbortSignal.timeout(5000)
        });
        if (!r.ok) return [];
        const d = await r.json();

        const TYPE_ICONS = {
            attraction: '🎯', viewpoint: '👁️', museum: '🏛️', artwork: '🎨',
            monument: '🗿', memorial: '🏛️', castle: '🏰', ruins: '🏚️', fort: '🏰',
            park: '🌳', garden: '🌺', nature_reserve: '🌿',
            place_of_worship: '🛕',
            peak: '⛰️', waterfall: '💧', beach: '🏖️', cave_entrance: '🕳️'
        };

        const results = (d.elements || [])
            .filter(e => e.tags?.name) // must have a name
            .map(e => {
                const distM = _haversine(lat, lng, e.lat, e.lon);
                const subtype = e.tags.tourism || e.tags.historic || e.tags.leisure || e.tags.amenity || e.tags.natural || '';
                return {
                    title: e.tags.name,
                    lat: e.lat, lng: e.lon,
                    distM,
                    dist: _fmtDist(distM),
                    type: subtype.replace(/_/g, ' '),
                    icon: TYPE_ICONS[subtype] || '📍',
                    source: 'osm'
                };
            })
            .filter(p => p.distM > 50) // skip self
            .sort((a, b) => a.distM - b.distM)
            .slice(0, 10);
        cacheSet(k, results); return results;
    } catch (e) {
        console.warn('[IP] OSM nearby error:', e.message);
        return [];
    }
}

// ─── Merge + Deduplicate all nearby sources ───────────────────────────────────
async function fetchNearbyMulti(lat, lng) {
    const k = `nearby_multi_${lat.toFixed(2)}_${lng.toFixed(2)}`;
    const c = cacheGet(k); if (c !== undefined) return c;

    // Fetch all sources in parallel
    const [localResults, wikiResults, osmResults] = await Promise.all([
        Promise.resolve(fetchNearbyLocal(lat, lng)),
        fetchNearbyWiki(lat, lng).catch(() => []),
        fetchNearbyOSM(lat, lng).catch(() => [])
    ]);

    // Merge all into one array
    const all = [...wikiResults, ...osmResults, ...localResults];

    // Deduplicate: if two results are within 300m and have similar names, keep the first
    const deduped = [];
    for (const item of all) {
        const isDupe = deduped.some(existing => {
            // Same area (within 300m)
            const nearEnough = _haversine(existing.lat, existing.lng, item.lat, item.lng) < 300;
            if (!nearEnough) return false;
            // Similar name (case-insensitive, fuzzy)
            const a = existing.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            const b = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            return a === b || a.includes(b) || b.includes(a);
        });
        if (!isDupe) deduped.push(item);
    }

    // Sort by distance and take top 8
    deduped.sort((a, b) => (a.distM || 0) - (b.distM || 0));
    const results = deduped.slice(0, 8);
    cacheSet(k, results);
    return results;
}

// Geo fallback: get closest Wikipedia article title
async function geoTitle(lat, lng) {
    const k = `geotitle_${lat.toFixed(2)}_${lng.toFixed(2)}`;
    const c = cacheGet(k); if (c !== undefined) return c;
    try {
        const r = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lng}&gsradius=10000&gslimit=1&format=json&origin=*`,
            { signal: AbortSignal.timeout(3000) }
        );
        const d = await r.json();
        const t = d.query?.geosearch?.[0]?.title || null;
        cacheSet(k, t); return t;
    } catch { return null; }
}

// ─── Cesium fly-to helper ─────────────────────────────────────────────────────
function cameraFlyTo(lat, lng, altMeters = 8000, name = '') {
    try {
        // Place red marker pin via app.js global function
        if (typeof addMarker === 'function') {
            addMarker(lat, lng, name || 'Selected Location');
        }

        // Direct camera fly
        const v = window.viewer || window.locationInfoPanel?._viewer;
        if (!v) return;
        v.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lng, lat, altMeters),
            duration: 2.0,
            easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
        });
    } catch (e) { console.warn('[IP] fly failed', e); }
}

// ─── Helper: build a clean, non-repeating location subtitle ───────────────────
function buildSubtitle(place) {
    const parts = [];
    const name = (place.name || '').toLowerCase();
    // Add sub-regions only if they differ from the place name
    const candidates = [
        place.suburb || place.district,
        place.county,
        place.state
    ];
    for (const p of candidates) {
        if (p && !name.includes(p.toLowerCase()) && !parts.some(x => x.toLowerCase() === p.toLowerCase())) {
            parts.push(p);
        }
    }
    // Country is NOT added here — it's already shown in the hero badge
    return parts.join(', ');
}

// ─── Main Class ───────────────────────────────────────────────────────────────
class LocationInfoPanel {
    constructor(panelId) {
        this.panel  = document.getElementById(panelId);
        this._key   = null;
        this._intv  = null;
        this._css();
        // Expose viewer reference used by cameraFlyTo
        this._viewer = null;
    }

    setViewer(v) { this._viewer = v; }

    // ── show ──────────────────────────────────────────────────────────────────
    async show(lat, lng, explicitName = null) {
        const key = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
        this._key = key;
        this._stopCarousel();
        const dc = this.panel.querySelector('.detail-content');
        if (dc) dc.innerHTML = '';
        this.panel.classList.add('visible');
        document.querySelector('.app-container')?.classList.add('detail-open');

        // Phase 1 — instant (0ms) — skeleton
        const cc   = guessCC(lat, lng);
        const meta = getCountryMeta(cc);
        this._renderSkeleton(lat, lng, meta);

        try {
            // ── FIRE ALL API CALLS IN PARALLEL ──
            const nomPromise     = fetchNominatim(lat, lng);
            const wxPromise      = fetchWeather(lat, lng);
            const elevPromise    = fetchElevation(lat, lng);
            const nearbyPromise  = fetchNearbyMulti(lat, lng);

            // If explicit name given, start wiki search immediately
            const earlyWikiPromise = explicitName
                ? searchWikiTitle(explicitName, lat, lng)
                : null;

            // Phase 2 — Core data (~100-300ms) — render as soon as ready
            const [nom, wx, elev] = await Promise.all([nomPromise, wxPromise, elevPromise]);
            if (this._key !== key) return;

            const realCC = nom?.address?.country_code?.toUpperCase() || cc;
            const m = getCountryMeta(realCC);
            const placeName = this._pickName(explicitName, nom, lat, lng);
            const place = {
                name: placeName,
                country:  nom?.address?.country  || '',
                state:    nom?.address?.state     || '',
                county:   nom?.address?.county    || '',
                district: nom?.address?.district  || '',
                suburb:   nom?.address?.suburb    || '',
                postcode: nom?.address?.postcode  || '',
                cc: realCC
            };

            this._renderCore(lat, lng, place, m, wx, elev);

            // ── Resolve wiki title: prioritize explicit name ──
            let wikiTitle = null;

            // 1) If explicit name was searched early, use that result
            if (earlyWikiPromise) {
                wikiTitle = await earlyWikiPromise;
            }

            // 2) If no result yet, try the Nominatim-derived name
            if (!wikiTitle && placeName) {
                wikiTitle = await searchWikiTitle(placeName, lat, lng);
            }

            // 3) Last resort: geo fallback (ONLY if no name-based search worked)
            if (!wikiTitle) {
                wikiTitle = await geoTitle(lat, lng);
            }

            // Phase 3 — Nearby renders independently (non-blocking)
            nearbyPromise.then(nearby => {
                if (this._key !== key) return;
                const filtered = (nearby || []).filter(p =>
                    p.title.toLowerCase() !== placeName.toLowerCase()
                );
                this._renderNearby(filtered);
            }).catch(() => {});

            if (this._key !== key) return;

            if (wikiTitle) {
                const [summary, media] = await Promise.all([
                    fetchWikiSummary(wikiTitle),
                    fetchWikiMedia(wikiTitle)
                ]);
                if (this._key !== key) return;
                await this._renderWiki(summary, media, place);
            } else {
                this._setNoImages();
                this._setNoExtract();
            }

        } catch (e) {
            if (e.name === 'AbortError') return;
            console.warn('[InfoPanel]', e.message);
        }
    }

    hide() {
        this.panel.classList.remove('visible');
        this._stopCarousel();
        this._key = null;
        document.querySelector('.app-container')?.classList.remove('detail-open');
    }

    _pickName(explicit, nom, lat, lng) {
        const bad = ['Selected Location','This Location','Unknown Location',''];
        if (explicit && !bad.includes(explicit)) return explicit;

        // ★ Secondary defense: check if coordinates match a known database place
        // This catches cases where the globe click handler didn't pass a name
        if (typeof PlacesDB !== 'undefined' && lat != null && lng != null) {
            const nearby = PlacesDB.near(lat, lng, 0.5); // 500m snap radius
            if (nearby.length > 0) return nearby[0].name;
        }

        return nom?.name
            || nom?.address?.village
            || nom?.address?.town
            || nom?.address?.city
            || nom?.address?.suburb
            || nom?.address?.county
            || nom?.address?.state
            || 'This Location';
    }

    // ── Phase 1: skeleton ────────────────────────────────────────────────────
    _renderSkeleton(lat, lng, meta) {
        const c = this.panel.querySelector('.detail-content');
        c.innerHTML = `
        <div class="ip-loc-header" id="ip-loc-header">
            <div class="ip-loc-flag">${meta.flag}</div>
            <div class="ip-loc-title">
                <div class="ip-sk ip-sk-h2"></div>
                <div class="ip-sk ip-sk-sub"></div>
            </div>
        </div>

        <div class="ip-stats" id="ip-stats">
            ${['🌤️','⛰️','🕒','💰'].map(ic=>`
            <div class="ip-stat ip-stat--skel">
                <div class="ip-stat-icon">${ic}</div>
                <div><div class="ip-sk" style="width:52px;height:15px;margin-bottom:4px"></div>
                <div class="ip-sk" style="width:72px;height:10px"></div></div>
            </div>`).join('')}
        </div>

        <div class="ip-nav-row">
            <button class="ip-nav-btn" id="ip-nav-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L19.5 19L12 15.5L4.5 19L12 2Z"/></svg>
                Navigate Here
            </button>
            <a class="ip-coord-pill"
               href="https://www.google.com/maps?q=${lat.toFixed(5)},${lng.toFixed(5)}"
               target="_blank" rel="noopener" title="Open in Google Maps">
               📌 ${lat.toFixed(4)}°, ${lng.toFixed(4)}°
            </a>
        </div>

        <div class="ip-section" id="ip-about" style="display:none"></div>

        <div class="ip-section ip-img-section" id="ip-img-section">
            <div class="ip-img-loading">
                <div class="ip-dots"><span></span><span></span><span></span></div>
                <span>Loading photos…</span>
            </div>
        </div>

        <div class="ip-section" id="ip-details-sec" style="display:none">
            <div class="ip-sec-hd"><span>📋</span>Location Details</div>
            <div class="ip-info-table" id="ip-info-table"></div>
        </div>

        <div class="ip-section" id="ip-cuisine" style="display:none">
            <div class="ip-sec-hd"><span>🍽️</span>Local Cuisine</div>
            <p class="ip-desc"></p>
            <div class="ip-chips" id="ip-food"></div>
        </div>

        <div class="ip-section" id="ip-nearby-sec">
            <div class="ip-sec-hd"><span>📍</span>Nearby Highlights</div>
            <div id="ip-nearby">
                ${[1,2,3].map(()=>`<div class="ip-nb-skel"><div class="ip-sk" style="width:58%;height:12px;border-radius:5px"></div><div class="ip-sk" style="width:34%;height:9px;border-radius:4px;margin-top:6px"></div></div>`).join('')}
            </div>
        </div>

        <div class="ip-wiki-row" id="ip-wiki-row" style="display:none"></div>
        `;
        this._wireNav(lat, lng, 'This Location');
    }

    // ── Phase 2: core render ─────────────────────────────────────────────────
    _renderCore(lat, lng, place, meta, wx, elev) {
        const c = this.panel.querySelector('.detail-content');
        if (!c) return;

        // Location header — compact name display
        const header = c.querySelector('#ip-loc-header');
        if (header) {
            const subtitle = buildSubtitle(place);
            header.querySelector('.ip-loc-flag').textContent = meta.flag;
            header.querySelector('.ip-loc-title').innerHTML = `
                <h2 class="ip-loc-name">${_esc(place.name)}</h2>
                ${subtitle ? `<p class="ip-loc-sub">${_esc(subtitle)}</p>` : ''}
                ${place.country ? `<span class="ip-loc-country">${meta.flag} ${_esc(place.country)}</span>` : ''}
            `;
        }

        // Stats
        const statsEl = c.querySelector('#ip-stats');
        if (statsEl) {
            const cur = wx?.current;
            const [wxLabel, wxIcon] = cur ? wmoInfo(cur.weathercode) : ['—', '🌡️'];
            const temp   = cur ? `${Math.round(cur.temperature_2m)}°C` : '—';
            const feels  = cur ? `Feels ${Math.round(cur.apparent_temperature)}°C` : '';
            const wind   = cur ? `${Math.round(cur.wind_speed_10m)} km/h ${windDir(cur.wind_direction_10m)}` : '';
            const hum    = cur ? `${cur.relative_humidity_2m}% RH` : '';
            const elevTx = (elev !== null && elev !== undefined) ? `${Math.round(elev).toLocaleString()} m` : '—';
            const tzAbbr = wx?.timezone_abbreviation || meta.tz.split(' ')[0];

            statsEl.innerHTML = `
            <div class="ip-stat">
                <div class="ip-stat-icon">${wxIcon}</div>
                <div><div class="ip-stat-val">${temp}</div>
                <div class="ip-stat-sub">${wxLabel}${feels?' · '+feels:''}</div></div>
            </div>
            <div class="ip-stat">
                <div class="ip-stat-icon">⛰️</div>
                <div><div class="ip-stat-val">${elevTx}</div>
                <div class="ip-stat-sub">Elevation${wind?' · '+wind:''}</div></div>
            </div>
            <div class="ip-stat">
                <div class="ip-stat-icon">🕒</div>
                <div><div class="ip-stat-val">${tzAbbr}</div>
                <div class="ip-stat-sub">${meta.tz}${hum?' · '+hum:''}</div></div>
            </div>
            <div class="ip-stat">
                <div class="ip-stat-icon">💰</div>
                <div><div class="ip-stat-val">${meta.currency.symbol}</div>
                <div class="ip-stat-sub">${meta.currency.name}</div></div>
            </div>`;
        }

        // Location Details section — actual location-specific data
        const detailsSec = c.querySelector('#ip-details-sec');
        if (detailsSec) {
            const rows = [];
            if (place.country) {
                rows.push(`<div class="ip-kv"><span>🌍 Country</span><b>${_esc(place.country)}</b></div>`);
            }
            if (place.state) {
                rows.push(`<div class="ip-kv"><span>🗺️ State / Region</span><b>${_esc(place.state)}</b></div>`);
            }
            if (place.county) {
                rows.push(`<div class="ip-kv"><span>🏘️ County / District</span><b>${_esc(place.county)}</b></div>`);
            }
            if (place.district || place.suburb) {
                const area = place.district || place.suburb;
                rows.push(`<div class="ip-kv"><span>📍 Area</span><b>${_esc(area)}</b></div>`);
            }
            if (place.postcode) {
                rows.push(`<div class="ip-kv"><span>📮 Postcode</span><b>${_esc(place.postcode)}</b></div>`);
            }
            // Coordinates
            rows.push(`<div class="ip-kv"><span>🧭 Coordinates</span><b>${lat.toFixed(5)}°, ${lng.toFixed(5)}°</b></div>`);
            // Elevation if available
            if (elev !== null && elev !== undefined) {
                rows.push(`<div class="ip-kv"><span>⛰️ Elevation</span><b>${Math.round(elev).toLocaleString()} m</b></div>`);
            }
            if (meta.capital) {
                rows.push(`<div class="ip-kv"><span>🏛️ Capital</span><b>${_esc(meta.capital)}</b></div>`);
            }
            if (meta.languages.length > 0) {
                rows.push(`<div class="ip-kv"><span>🗣️ Languages</span><b>${_esc(meta.languages.join(', '))}</b></div>`);
            }

            const table = detailsSec.querySelector('#ip-info-table');
            if (table) table.innerHTML = rows.join('');
            // Always show — we always have at least coordinates
            detailsSec.style.display = '';
        }

        // Cuisine section
        const cuisineSec = c.querySelector('#ip-cuisine');
        if (cuisineSec && meta.cuisine.food.length > 0 && meta.cuisine.food[0] !== 'Local Dishes') {
            cuisineSec.style.display = '';
            const descEl = cuisineSec.querySelector('.ip-desc');
            if (descEl) descEl.textContent = meta.cuisine.spec;
            const foodEl = c.querySelector('#ip-food');
            if (foodEl) foodEl.innerHTML = meta.cuisine.food.map(f=>`<span class="ip-chip ip-chip--food">${f}</span>`).join('');
        }

        // Re-wire nav button with real name
        this._wireNav(lat, lng, place.name);
    }

    // ── Phase 3a: Nearby ──────────────────────────────────────────────────────
    _renderNearby(nearby) {
        const sec = this.panel.querySelector('#ip-nearby-sec');
        const el = this.panel.querySelector('#ip-nearby');
        if (!el) return;
        if (!nearby?.length) {
            el.innerHTML = `<p class="ip-empty">No nearby highlights found.</p>`;
            return;
        }
        // Ensure section is visible
        if (sec) sec.style.display = '';
        el.innerHTML = nearby.map((p, i) => `
        <div class="ip-nb" style="animation-delay:${i*55}ms"
             data-lat="${p.lat}" data-lng="${p.lng}" data-name="${_esc(p.title)}"
             role="button" tabindex="0" title="Fly to ${_esc(p.title)}">
            <div class="ip-nb-num">${p.icon || (i+1)}</div>
            <div class="ip-nb-info">
                <span class="ip-nb-name">${_esc(p.title)}</span>
                <span class="ip-nb-meta">
                    ${p.type ? `<span class="ip-nb-type">${_esc(p.type)}</span>` : ''}
                    <span class="ip-nb-dist">📍 ${_esc(p.dist)}</span>
                </span>
            </div>
            <div class="ip-fly-icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
        </div>`).join('');

        // Whole row is clickable — fly + show info
        el.querySelectorAll('.ip-nb').forEach(row => {
            const doFly = (e) => {
                e.stopPropagation();
                // Highlight active row
                el.querySelectorAll('.ip-nb').forEach(r => r.classList.remove('ip-nb--active'));
                row.classList.add('ip-nb--active');
                const la = parseFloat(row.dataset.lat);
                const lo = parseFloat(row.dataset.lng);
                const nm = row.dataset.name;

                // Place red marker pin immediately for visual feedback
                if (typeof addMarker === 'function') {
                    addMarker(la, lo, nm);
                }

                // Fly camera to the location (cameraFlyTo also handles marker as fallback)
                cameraFlyTo(la, lo, 12000, nm);

                // Show info for nearby place after camera arrives
                setTimeout(() => window.locationInfoPanel?.show(la, lo, nm), 2200);
            };
            row.addEventListener('click', doFly);
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doFly(e); }
            });
        });
    }

    // ── Phase 3b: Wikipedia ───────────────────────────────────────────────────
    async _renderWiki(summary, media, place) {
        const c = this.panel.querySelector('.detail-content');
        if (!c) return;

        // Extract / About
        if (summary?.extract) {
            let text = summary.extract.replace(/\n+/g, ' ').trim();
            if (text.length > 400) text = text.slice(0, 400) + '…';
            const sec = c.querySelector('#ip-about');
            if (sec) {
                sec.style.display = '';
                sec.innerHTML = `
                    <div class="ip-sec-hd"><span>📖</span>About ${_esc(place.name)}</div>
                    <p class="ip-about-text">${_esc(text)}</p>
                `;
            }
        }

        // ── Build image list — using filename-based dedup (not URL) ──
        let images = [];
        const seenFiles = new Set();

        // Extract filename from any Wikipedia/Wikimedia URL
        const _getFilename = (u) => {
            if (!u) return '';
            const parts = u.split('/');
            return parts[parts.length - 1].replace(/^\d+px-/, '').toLowerCase();
        };

        // 1) Summary hero image
        const heroSrc = summary?.thumbnail?.source || summary?.originalimage?.source;
        if (heroSrc) {
            let heroUrl = heroSrc.includes('/thumb/')
                ? heroSrc.replace(/\/\d+px-/, '/320px-')
                : heroSrc;
            const fn = _getFilename(heroUrl);
            if (!seenFiles.has(fn)) {
                seenFiles.add(fn);
                images.push({ url: heroUrl, caption: summary?.title || place.name });
            }
        }

        // 2) Media-list images — add all unique ones
        (media || []).forEach(m => {
            const fn = _getFilename(m.url);
            if (fn && !seenFiles.has(fn)) {
                seenFiles.add(fn);
                images.push({ url: m.url, caption: m.caption });
            }
        });

        // 3) If still < 3 images, fetch extra from Wikipedia images API
        if (images.length < 3 && summary?.title) {
            try {
                const extraR = await fetch(
                    `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(summary.title)}&prop=images&imlimit=20&format=json&origin=*`,
                    { signal: AbortSignal.timeout(2000) }
                );
                const extraD = await extraR.json();
                const pages = extraD?.query?.pages || {};
                const imgTitles = Object.values(pages)[0]?.images || [];
                // Filter to actual photos
                const photoTitles = imgTitles
                    .map(i => i.title)
                    .filter(t => /\.(jpg|jpeg|png|webp)$/i.test(t))
                    .filter(t => !/(flag|logo|icon|seal|coa|emblem|map|symbol|coat|signature|stamp|blank|commons|wikidata|question|edit|pencil|increase|decrease|steady|arrow)/i.test(t))
                    .slice(0, 6);

                if (photoTitles.length > 0) {
                    // Fetch thumb URLs for these image titles
                    const thumbR = await fetch(
                        `https://en.wikipedia.org/w/api.php?action=query&titles=${photoTitles.map(encodeURIComponent).join('|')}&prop=imageinfo&iiprop=url|size&iiurlwidth=320&format=json&origin=*`,
                        { signal: AbortSignal.timeout(2000) }
                    );
                    const thumbD = await thumbR.json();
                    const thumbPages = thumbD?.query?.pages || {};
                    Object.values(thumbPages).forEach(p => {
                        const info = p?.imageinfo?.[0];
                        if (!info || (info.width || 0) < 200) return;
                        const url = info.thumburl || info.url;
                        const fn = _getFilename(url);
                        if (fn && !seenFiles.has(fn)) {
                            seenFiles.add(fn);
                            const cap = (p.title || '').replace(/^File:/i, '').replace(/_/g, ' ').replace(/\.[^.]+$/, '').trim();
                            images.push({ url, caption: cap });
                        }
                    });
                }
            } catch { /* extra images are optional */ }
        }

        images = images.slice(0, 8); // gather extra candidates, we'll filter broken ones

        // Validate images — only show ones that actually load
        const _testImage = (url) => new Promise(resolve => {
            const img = new Image();
            img.referrerPolicy = 'no-referrer';
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
            // Timeout after 1.5s — treat as broken
            setTimeout(() => resolve(false), 1500);
        });

        const results = await Promise.all(images.map(img => _testImage(img.url)));
        const validImages = images.filter((_, i) => results[i]).slice(0, 6);
        console.log(`[IP] 📸 ${validImages.length}/${images.length} images valid for carousel`);

        // Render carousel or no-image state — this is the ONLY place images appear
        const imgSec = c.querySelector('#ip-img-section');
        if (imgSec) {
            if (validImages.length > 0) {
                imgSec.innerHTML = this._buildCarousel(validImages);
                this._initCarousel(imgSec, validImages.length);
            } else {
                imgSec.innerHTML = `<div class="ip-no-photo">📷 No photos found for this location</div>`;
            }
        }

        // NO hero background image — carousel is the single image display

        // Wikipedia link row
        const wikiRow = c.querySelector('#ip-wiki-row');
        if (wikiRow && summary?.content_urls?.desktop?.page) {
            wikiRow.style.display = '';
            wikiRow.innerHTML = `
            <a href="${summary.content_urls.desktop.page}" target="_blank" rel="noopener" class="ip-wiki-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
                Read on Wikipedia
            </a>
            <span class="ip-wiki-title">${summary.title || ''}</span>`;
        }
    }

    _setNoImages() {
        const el = this.panel.querySelector('#ip-img-section');
        if (el) el.innerHTML = `<div class="ip-no-photo">📷 No photos available</div>`;
    }
    _setNoExtract() {
        const el = this.panel.querySelector('#ip-about');
        if (el) el.style.display = 'none';
    }

    // ── Carousel ──────────────────────────────────────────────────────────────
    _buildCarousel(imgs) {
        return `
        <div class="ip-car" id="ip-car">
            <div class="ip-car-track">
                ${imgs.map((img, i) => `
                <div class="ip-car-slide">
                    <img src="${img.url}" alt="${_esc(img.caption||'')}" loading="eager"
                         decoding="async" ${i===0?'fetchpriority="high"':''}
                         referrerpolicy="no-referrer"
                         onerror="this.closest('.ip-car-slide').classList.add('ip-slide-error')">
                    ${img.caption ? `<div class="ip-car-cap">${_esc(img.caption)}</div>` : ''}
                </div>`).join('')}
            </div>
            ${imgs.length > 1 ? `
            <button class="ip-car-arrow ip-car-prev" id="ip-car-prev" aria-label="Previous image">❮</button>
            <button class="ip-car-arrow ip-car-next" id="ip-car-next" aria-label="Next image">❯</button>
            <div class="ip-car-bar">
                <div class="ip-car-dots">${imgs.map((_,i)=>`<span class="ip-car-dot${i===0?' on':''}" data-i="${i}"></span>`).join('')}</div>
                <span class="ip-car-cnt">1 / ${imgs.length}</span>
            </div>` : ''}
        </div>`;
    }

    _initCarousel(container, total) {
        const car   = container.querySelector('#ip-car');
        if (!car || total < 2) return;
        const track = car.querySelector('.ip-car-track');
        const dots  = car.querySelectorAll('.ip-car-dot');
        const cnt   = car.querySelector('.ip-car-cnt');
        let cur = 0;

        const go = idx => {
            cur = ((idx % total) + total) % total;
            track.style.transform = `translateX(-${cur * 100}%)`;
            dots.forEach((d,i) => d.classList.toggle('on', i===cur));
            if (cnt) cnt.textContent = `${cur+1} / ${total}`;
        };

        car.querySelector('#ip-car-prev')?.addEventListener('click', () => { this._stopCarousel(); go(cur-1); });
        car.querySelector('#ip-car-next')?.addEventListener('click', () => { this._stopCarousel(); go(cur+1); });
        dots.forEach(d => d.addEventListener('click', () => { this._stopCarousel(); go(+d.dataset.i); }));

        // Touch swipe
        let tx = 0;
        car.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, {passive:true});
        car.addEventListener('touchend', e => {
            const dx = tx - e.changedTouches[0].clientX;
            if (Math.abs(dx) > 40) { this._stopCarousel(); go(cur + (dx > 0 ? 1 : -1)); }
        }, {passive:true});

        // Auto-advance
        car.addEventListener('mouseenter', () => this._stopCarousel());
        car.addEventListener('mouseleave', () => this._startAuto(go, total, () => cur));
        this._startAuto(go, total, () => cur);
    }

    _startAuto(go, total, getCur) {
        this._stopCarousel();
        this._intv = setInterval(() => go(getCur() + 1), 4800);
    }
    _stopCarousel() { if (this._intv) { clearInterval(this._intv); this._intv = null; } }

    _wireNav(lat, lng, name) {
        const btn = this.panel.querySelector('#ip-nav-btn');
        if (!btn) return;
        const nb = btn.cloneNode(true);
        btn.parentNode.replaceChild(nb, btn);
        nb.addEventListener('click', () => {
            if (window.navSystem?.show) {
                window.navSystem.show(lat, lng, name);
                this.hide();
            }
        });
    }

    // ── CSS injection (once) ──────────────────────────────────────────────────
    _css() {
        if (document.getElementById('ip-v6')) return;
        // Remove old v5 styles if present
        const oldStyle = document.getElementById('ip-v5');
        if (oldStyle) oldStyle.remove();

        // Preconnect to Wikipedia CDN for instant image loads
        ['https://upload.wikimedia.org', 'https://en.wikipedia.org'].forEach(origin => {
            if (!document.querySelector(`link[href="${origin}"]`)) {
                const link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = origin;
                link.crossOrigin = '';
                document.head.appendChild(link);
            }
        });

        const s = document.createElement('style');
        s.id = 'ip-v6';
        s.textContent = `
/* ══════════════════════════════════════════
   INFO PANEL v7 — STUNNING Premium styles
   ══════════════════════════════════════════ */
@keyframes ip-glow-pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
@keyframes ip-gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

/* Panel container */
.detail-panel {
    position: fixed !important;
    top: 70px !important;
    right: 14px !important;
    bottom: auto !important;
    left: auto !important;
    width: clamp(310px, 27vw, 420px) !important;
    max-height: calc(100dvh - 126px) !important;
    overflow-x: hidden !important;
    overflow-y: hidden !important;
    z-index: 400;
    border-radius: 22px !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.05) !important;
    opacity: 0;
    transform: translateX(calc(100% + 20px));
    transition: opacity 0.3s ease, transform 0.45s cubic-bezier(0.22,1,0.36,1) !important;
    pointer-events: none;
    display: flex !important;
    flex-direction: column !important;
}
.detail-panel.visible {
    opacity: 1 !important;
    transform: translateX(0) !important;
    pointer-events: all !important;
    overflow-y: auto !important;
}

/* Mobile bottom-sheet */
@media (max-width: 520px) {
    .detail-panel {
        width: 100vw !important;
        left: 0 !important; right: 0 !important;
        bottom: 0 !important; top: auto !important;
        max-height: 80dvh !important;
        border-radius: 20px 20px 0 0 !important;
        transform: translateY(110%) !important;
    }
    .detail-panel.visible { transform: translateY(0) !important; }
}

.detail-panel::-webkit-scrollbar { width: 5px; }
.detail-panel::-webkit-scrollbar-track { background: transparent; }
.detail-panel::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(99,102,241,0.2), rgba(34,211,238,0.15));
    border-radius: 4px;
}

/* Unset overflow on content container — panel itself scrolls */
.detail-content { overflow: visible !important; padding: 0 !important; }

/* ── HEADER ──────────────────────────── */
.detail-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px;
    border-bottom: none;
    position: sticky; top: 0; z-index: 10;
    backdrop-filter: blur(24px) saturate(1.4);
    background: linear-gradient(135deg, rgba(15,15,30,0.92), rgba(20,10,40,0.9));
    flex-shrink: 0;
    position: relative;
}
.detail-header::after {
    content: '';
    position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #6366f1);
    background-size: 300% 100%;
    animation: ip-gradient-shift 4s ease infinite;
}
.detail-header h3 {
    font-size: 0.82rem; font-weight: 800;
    margin: 0; letter-spacing: 0.5px;
    background: linear-gradient(135deg, #e0e7ff 0%, #a78bfa 40%, #f0abfc 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* ── LOCATION HEADER (compact name) ──── */
.ip-loc-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 20px 18px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    flex-shrink: 0;
    position: relative;
    background: linear-gradient(160deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.06) 50%, rgba(236,72,153,0.04) 100%);
}
.ip-loc-header::before {
    content: '';
    position: absolute; top: -40px; right: -40px; width: 120px; height: 120px;
    background: radial-gradient(circle, rgba(168,85,247,0.12), transparent 70%);
    pointer-events: none;
}
.ip-loc-header::after {
    content: '';
    position: absolute; bottom: 0; left: 16px; right: 16px; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(168,85,247,0.4), rgba(236,72,153,0.3), transparent);
}
.ip-loc-flag {
    font-size: 1.9rem;
    flex-shrink: 0;
    line-height: 1;
    width: 48px; height: 48px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(145deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1));
    border: 1px solid rgba(168,85,247,0.2);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.08);
    transition: transform 0.3s, box-shadow 0.3s;
}
.ip-loc-header:hover .ip-loc-flag { transform: scale(1.1) rotate(3deg); box-shadow: 0 6px 28px rgba(168,85,247,0.3); }
.ip-loc-title {
    flex: 1;
    min-width: 0;
}
.ip-loc-name {
    font-size: clamp(1.1rem, 3.5vw, 1.3rem);
    font-weight: 800;
    margin: 0;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.4px;
    background: linear-gradient(135deg, #fff 0%, #e0e7ff 50%, #c4b5fd 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
}
.ip-loc-sub {
    font-size: 0.74rem;
    color: rgba(200,180,255,0.5);
    margin: 4px 0 0;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.ip-loc-country {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: rgba(240,171,252,0.9);
    background: linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.1));
    border: 1px solid rgba(168,85,247,0.25);
    border-radius: 20px;
    padding: 4px 12px;
    margin-top: 6px;
    transition: all 0.25s;
}
.ip-loc-country:hover { background: rgba(168,85,247,0.25); border-color: rgba(168,85,247,0.4); box-shadow: 0 0 12px rgba(168,85,247,0.15); }

/* ── STATS GRID 2×2 ──────────────────── */
.ip-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px; flex-shrink: 0;
    background: rgba(255,255,255,0.02);
    border-bottom: 1px solid rgba(255,255,255,0.04);
    padding: 2px;
}
.ip-stat {
    display:flex; align-items:center; gap:10px;
    padding: 14px 14px;
    background: rgba(12,12,24,0.6);
    min-width:0; overflow:hidden;
    transition: all 0.25s;
    position: relative;
    border-radius: 4px;
}
.ip-stat::before {
    content:''; position:absolute; inset:0;
    opacity:0; transition:opacity 0.25s; border-radius: inherit;
}
.ip-stat:nth-child(1)::before { background:linear-gradient(135deg, rgba(251,191,36,0.1), transparent); }
.ip-stat:nth-child(2)::before { background:linear-gradient(135deg, rgba(52,211,153,0.1), transparent); }
.ip-stat:nth-child(3)::before { background:linear-gradient(135deg, rgba(168,85,247,0.1), transparent); }
.ip-stat:nth-child(4)::before { background:linear-gradient(135deg, rgba(251,113,133,0.1), transparent); }
.ip-stat:hover { transform:scale(1.02); }
.ip-stat:hover::before { opacity:1; }
.ip-stat--skel { cursor: default; }
.ip-stat-icon {
    font-size:1.35rem; flex-shrink:0; line-height:1;
    width:38px; height:38px;
    display:flex; align-items:center; justify-content:center;
    border-radius:12px;
    transition: transform 0.25s, box-shadow 0.25s;
}
.ip-stat:nth-child(1) .ip-stat-icon { background:rgba(251,191,36,0.12); border:1px solid rgba(251,191,36,0.15); }
.ip-stat:nth-child(2) .ip-stat-icon { background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.12); }
.ip-stat:nth-child(3) .ip-stat-icon { background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.12); }
.ip-stat:nth-child(4) .ip-stat-icon { background:rgba(251,113,133,0.1); border:1px solid rgba(251,113,133,0.12); }
.ip-stat:hover .ip-stat-icon { transform:scale(1.12); }
.ip-stat > div { display:flex; flex-direction:column; min-width:0; position:relative; z-index:1; }
.ip-stat-val {
    font-size:0.95rem; font-weight:800; color:#fff;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    letter-spacing:-0.2px;
}
.ip-stat-sub {
    font-size:0.6rem; color:rgba(255,255,255,0.38); margin-top:2px;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}

/* ── NAV ROW ─────────────────────────── */
@keyframes ip-btn-shimmer { 0%{left:-100%} 100%{left:200%} }
.ip-nav-row {
    display:flex; align-items:center; gap:10px;
    padding: 14px 18px;
    border-bottom:1px solid rgba(255,255,255,0.04);
    flex-shrink:0;
    background:linear-gradient(180deg, rgba(168,85,247,0.03), transparent);
}
.ip-nav-btn {
    flex:1; display:inline-flex; align-items:center; justify-content:center; gap:8px;
    padding:12px 16px;
    background:linear-gradient(135deg, #7c3aed, #a855f7, #ec4899);
    background-size:200% 200%;
    animation: ip-gradient-shift 5s ease infinite;
    border:none; border-radius:14px;
    color:#fff; font-family:inherit; font-size:0.88rem; font-weight:700;
    cursor:pointer; white-space:nowrap;
    box-shadow:0 4px 20px rgba(168,85,247,0.35), inset 0 1px 0 rgba(255,255,255,0.15);
    transition:transform 0.18s, box-shadow 0.25s;
    letter-spacing:0.3px;
    position:relative; overflow:hidden;
}
.ip-nav-btn::after {
    content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
    background:linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    animation: ip-btn-shimmer 3s ease infinite;
}
.ip-nav-btn svg { flex-shrink:0; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3)); position:relative; z-index:1; }
.ip-nav-btn:hover {
    transform:translateY(-2px) scale(1.01);
    box-shadow:0 8px 32px rgba(168,85,247,0.5), 0 0 20px rgba(236,72,153,0.2);
}
.ip-nav-btn:active { transform:scale(0.97); }
.ip-coord-pill {
    flex-shrink:0; display:inline-flex; align-items:center; gap:5px;
    padding:8px 11px; background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.08); border-radius:12px;
    color:rgba(255,255,255,0.4); font-size:0.63rem;
    font-family:'Courier New',monospace; text-decoration:none; white-space:nowrap;
    transition:all 0.22s; backdrop-filter:blur(4px);
}
.ip-coord-pill:hover {
    background:rgba(34,211,238,0.08); color:#22d3ee;
    border-color:rgba(34,211,238,0.2);
    box-shadow:0 2px 10px rgba(34,211,238,0.1);
}

/* ── SECTIONS ────────────────────────── */
.ip-section {
    padding:16px 18px;
    border-bottom:1px solid rgba(255,255,255,0.05);
    animation: ip-fadein 0.4s ease both;
}
@keyframes ip-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
.ip-section:last-child { border-bottom:none; }
.ip-img-section { padding:0; }

.ip-sec-hd {
    display:flex; align-items:center; gap:8px;
    font-size:0.68rem; font-weight:800; letter-spacing:0.7px;
    text-transform:uppercase; margin-bottom:14px;
    position:relative; padding-bottom:10px;
    background: linear-gradient(90deg, rgba(200,180,252,0.7), rgba(240,171,252,0.5));
    -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    background-clip:text;
}
.ip-sec-hd::after {
    content:''; position:absolute; bottom:0; left:0; width:40px; height:2px;
    background:linear-gradient(90deg, #a855f7, #ec4899, transparent);
    border-radius:2px;
}
.ip-sec-hd span {
    font-size:0.95rem;
    filter:drop-shadow(0 2px 4px rgba(168,85,247,0.25));
    -webkit-text-fill-color:initial;
}

/* About text */
.ip-about-text {
    font-size:0.8rem; line-height:1.82; color:rgba(220,210,240,0.6); margin:8px 0 0;
    background:linear-gradient(135deg, rgba(168,85,247,0.04), rgba(236,72,153,0.02));
    border-radius:14px; padding:14px 16px;
    border-left:3px solid;
    border-image:linear-gradient(180deg, #a855f7, #ec4899) 1;
}

/* Cuisine desc */
.ip-desc { font-size:0.78rem; color:rgba(200,180,252,0.45); font-style:italic; margin:0 0 10px; line-height:1.5; }

/* ── CHIPS ────────────────────────────── */
.ip-chips { display:flex; flex-wrap:wrap; gap:7px; }
.ip-chip {
    padding:6px 13px; border-radius:20px; font-size:0.73rem; font-weight:600;
    background:rgba(168,85,247,0.08); border:1px solid rgba(168,85,247,0.18);
    color:rgba(216,180,254,0.9); transition:all 0.25s; cursor:default;
    backdrop-filter:blur(4px);
}
.ip-chip:hover {
    background:rgba(168,85,247,0.2); border-color:rgba(168,85,247,0.35);
    transform:translateY(-2px); box-shadow:0 4px 12px rgba(168,85,247,0.15);
}
.ip-chip--food { background:rgba(251,146,60,0.08); border-color:rgba(251,146,60,0.2); color:#fdba74; }
.ip-chip--food:hover { background:rgba(251,146,60,0.2); border-color:rgba(251,146,60,0.35); box-shadow:0 4px 12px rgba(251,146,60,0.12); }

/* ── INFO TABLE (Location Details) ───── */
.ip-info-table {
    margin-top:0;
    background:linear-gradient(135deg, rgba(168,85,247,0.03), rgba(236,72,153,0.02));
    border-radius:16px;
    border:1px solid rgba(168,85,247,0.08);
    padding:4px 0;
    overflow:hidden;
}
.ip-kv {
    display:flex; justify-content:space-between; align-items:center; gap:10px;
    padding:11px 16px;
    font-size:0.78rem;
    transition:all 0.2s;
    position:relative;
}
.ip-kv:not(:last-child)::after {
    content:''; position:absolute; bottom:0; left:16px; right:16px; height:1px;
    background:linear-gradient(90deg, transparent, rgba(168,85,247,0.1), transparent);
}
.ip-kv:hover { background:rgba(168,85,247,0.06); }
.ip-kv span {
    color:rgba(200,180,252,0.5); white-space:nowrap;
    font-weight:500; display:flex; align-items:center; gap:5px;
}
.ip-kv b {
    font-weight:700; color:rgba(255,255,255,0.9); text-align:right;
    font-variant-numeric:tabular-nums;
}

/* ── NEARBY ──────────────────────────── */
.ip-nb-skel { display:flex; flex-direction:column; gap:6px; padding:7px 0; }
.ip-nb {
    display:flex; align-items:center; gap:12px;
    padding:11px 13px;
    background:rgba(255,255,255,0.025);
    border:1px solid rgba(255,255,255,0.06);
    border-radius:14px; margin-bottom:6px;
    animation: ip-slidein 0.35s ease both;
    transition:all 0.22s;
    cursor:pointer;
    user-select:none;
    position:relative;
    overflow:hidden;
}
.ip-nb::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.05));
    opacity:0; transition:opacity 0.22s;
    border-radius:inherit;
}
@keyframes ip-slidein { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:none} }
.ip-nb:hover {
    background:rgba(168,85,247,0.08);
    border-color:rgba(168,85,247,0.25);
    transform:translateX(4px);
    box-shadow:0 4px 18px rgba(168,85,247,0.12);
}
.ip-nb:hover::before { opacity:1; }
.ip-nb:focus-visible { outline:2px solid #a855f7; outline-offset:-2px; }
.ip-nb-num {
    width:34px; height:34px; flex-shrink:0;
    background:linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.06));
    border:1px solid rgba(168,85,247,0.15);
    border-radius:11px; font-size:1.05rem; line-height:1;
    display:flex; align-items:center; justify-content:center;
    position:relative; z-index:1;
    transition:all 0.25s;
}
.ip-nb:hover .ip-nb-num { transform:scale(1.1); background:rgba(168,85,247,0.2); box-shadow:0 0 10px rgba(168,85,247,0.15); }
.ip-nb-info { flex:1; min-width:0; position:relative; z-index:1; }
.ip-nb-name {
    display:block; font-size:0.82rem; font-weight:700; color:rgba(255,255,255,0.9);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    letter-spacing:-0.1px;
}
.ip-nb-meta {
    display:flex; align-items:center; gap:7px; margin-top:3px;
}
.ip-nb-type {
    font-size:0.57rem; font-weight:700; letter-spacing:0.4px;
    text-transform:capitalize;
    color:rgba(216,180,254,0.9);
    background:rgba(168,85,247,0.1);
    border:1px solid rgba(168,85,247,0.18);
    border-radius:8px;
    padding:2px 7px;
    white-space:nowrap;
}
.ip-nb-dist { font-size:0.66rem; color:rgba(200,180,252,0.4); font-weight:500; }
.ip-fly-icon {
    width:28px; height:28px; flex-shrink:0;
    color:rgba(200,180,252,0.25);
    display:flex; align-items:center; justify-content:center;
    border-radius:50%;
    background:rgba(168,85,247,0.04);
    transition:all 0.25s;
    position:relative; z-index:1;
}
.ip-nb:hover .ip-fly-icon {
    color:#d8b4fe;
    background:rgba(168,85,247,0.15);
    transform:translateX(3px);
    box-shadow:0 0 12px rgba(168,85,247,0.2);
}
.ip-nb--active {
    background:rgba(168,85,247,0.12) !important;
    border-color:rgba(168,85,247,0.3) !important;
    box-shadow:0 0 22px rgba(168,85,247,0.15), inset 0 0 0 1px rgba(168,85,247,0.08) !important;
}
.ip-nb--active .ip-nb-num {
    background:linear-gradient(135deg, #a855f7, #ec4899);
    border-color:transparent;
    box-shadow:0 0 14px rgba(168,85,247,0.5);
    color:#fff;
}
.ip-nb--active .ip-nb-name { color:#e9d5ff; }
.ip-empty { font-size:0.75rem; color:rgba(255,255,255,0.28); padding:8px 0; }

/* ── CAROUSEL ────────────────────────── */
.ip-car {
    position:relative; width:100%; overflow:hidden;
    background:#060610; height:220px;
}
@media (max-width:520px) { .ip-car { height:185px; } }
.ip-car-track {
    display:flex; width:100%; height:100%;
    transition:transform 0.5s cubic-bezier(0.22,0.61,0.36,1);
    will-change:transform;
}
.ip-car-slide {
    min-width:100%; height:100%; flex-shrink:0;
    position:relative; overflow:hidden;
    background:rgba(255,255,255,0.02);
}
.ip-car-slide img {
    width:100%; height:100%; object-fit:cover; display:block;
    transition:transform 6s ease, opacity 0.4s ease;
}
.ip-car-slide:hover img { transform:scale(1.06); }
/* Error state for failed images — hide them gracefully */
.ip-slide-error img { display:none; }
.ip-slide-error::after {
    content:'📷 Image unavailable';
    position:absolute; inset:0;
    display:flex; align-items:center; justify-content:center;
    font-size:0.75rem; color:rgba(255,255,255,0.22);
    background:linear-gradient(135deg, rgba(99,102,241,0.04), rgba(255,255,255,0.01));
}
.ip-car-cap {
    position:absolute; bottom:0; left:0; right:0;
    background:linear-gradient(transparent 0%, rgba(0,0,0,0.82) 100%);
    padding:28px 14px 10px;
    font-size:0.7rem; color:rgba(255,255,255,0.88);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    pointer-events:none; font-weight:500;
}
.ip-car-arrow {
    position:absolute; top:50%; transform:translateY(-50%);
    width:32px; height:32px; border-radius:50%;
    background:rgba(0,0,0,0.5); backdrop-filter:blur(10px) saturate(1.2);
    border:1px solid rgba(255,255,255,0.15); color:#fff;
    font-size:0.95rem; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    padding:0; z-index:6; opacity:0.7;
    transition:all 0.22s;
}
.ip-car-arrow:hover {
    opacity:1;
    background:rgba(168,85,247,0.65);
    border-color:rgba(168,85,247,0.35);
    box-shadow:0 0 18px rgba(168,85,247,0.35);
    transform:translateY(-50%) scale(1.1);
}
.ip-car-prev { left:8px; }
.ip-car-next { right:8px; }
.ip-car-bar {
    position:absolute; bottom:8px; left:0; right:0;
    display:flex; align-items:center; justify-content:center; gap:8px; z-index:5;
}
.ip-car-dots { display:flex; gap:5px; }
.ip-car-dot {
    width:7px; height:7px; border-radius:50%;
    background:rgba(255,255,255,0.2); cursor:pointer;
    transition:all 0.3s; flex-shrink:0;
}
.ip-car-dot.on { background:linear-gradient(135deg, #a855f7, #ec4899); transform:scale(1.6); box-shadow:0 0 8px rgba(168,85,247,0.4); }
.ip-car-cnt {
    font-size:0.59rem; font-weight:600; color:rgba(255,255,255,0.75);
    background:rgba(0,0,0,0.52); backdrop-filter:blur(4px);
    padding:2px 7px; border-radius:8px;
}
.ip-img-loading {
    display:flex; align-items:center; justify-content:center; gap:10px;
    min-height:120px; background:rgba(255,255,255,0.015);
}
.ip-dots { display:flex; gap:7px; }
.ip-dots span {
    width:8px; height:8px; border-radius:50%;
    background:linear-gradient(135deg, #a855f7, #ec4899);
    animation: ip-bounce 1.2s ease infinite;
}
.ip-dots span:nth-child(2){animation-delay:.2s}
.ip-dots span:nth-child(3){animation-delay:.4s}
@keyframes ip-bounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-8px);opacity:1} }
.ip-img-loading span { font-size:0.73rem; color:rgba(255,255,255,0.3); }
.ip-no-photo { text-align:center; padding:22px; font-size:0.76rem; color:rgba(255,255,255,0.28); }

/* ── WIKI LINK ROW ───────────────────── */
.ip-wiki-row {
    display:flex; align-items:center; justify-content:space-between; gap:8px;
    padding:12px 18px;
    border-top:1px solid rgba(168,85,247,0.08);
    background:linear-gradient(180deg, transparent, rgba(168,85,247,0.02));
}
.ip-wiki-link {
    display:inline-flex; align-items:center; gap:6px;
    color:#d8b4fe; font-size:0.78rem; font-weight:600;
    text-decoration:none; transition:all 0.2s;
}
.ip-wiki-link:hover { color:#f0abfc; text-shadow:0 0 8px rgba(168,85,247,0.3); }
.ip-wiki-title {
    font-size:0.66rem; color:rgba(255,255,255,0.25);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    max-width:120px;
}

/* ── SKELETONS ───────────────────────── */
.ip-sk {
    background:linear-gradient(90deg,
        rgba(168,85,247,0.04) 25%,
        rgba(168,85,247,0.12) 50%,
        rgba(168,85,247,0.04) 75%);
    background-size:200% 100%;
    animation:ip-shimmer 1.5s ease infinite; border-radius:6px;
}
@keyframes ip-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.ip-sk-h2  { width:62%; height:22px; display:block; margin-bottom:6px; }
.ip-sk-sub { width:45%; height:13px; display:block; }

/* ── DRAG PILL (mobile) ──────────────── */
.ip-drag-handle { display:none; justify-content:center; padding:10px 0 4px; }
.ip-drag-pill { width:40px; height:4px; background:rgba(255,255,255,0.15); border-radius:2px; }
@media (max-width:520px) { .ip-drag-handle{display:flex;} }
        `;
        document.head.appendChild(s);
    }
}

window.LocationInfoPanel = LocationInfoPanel;
