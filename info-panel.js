/**
 * LocationInfoPanel v5 — Complete Overhaul
 *
 * FIXES:
 *  ✅ Photos  — Wikimedia REST media-list API (real high-res images, no SVGs)
 *  ✅ Carousel — flex-shrink:0 + proper sizing = exactly 1 image at a time
 *  ✅ Hero    — blurred photo backdrop when images arrive (magazine effect)
 *  ✅ Scroll  — removed overflow:hidden from .detail-content
 *  ✅ Nearby  — Wikipedia geosearch → Cesium camera fly-to on click
 *  ✅ Data    — Nominatim + Weather + Elevation fetched in parallel
 *  ✅ Extract — Wikipedia REST summary for clean, reliable extracts
 *  ✅ Cache   — LRU 80 entries, 10-min TTL for instant repeat renders
 */

// ─── LRU Cache ────────────────────────────────────────────────────────────────
const _cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;
function cacheGet(k) {
    const e = _cache.get(k);
    if (!e) return null;
    if (Date.now() - e.ts > CACHE_TTL) { _cache.delete(k); return null; }
    return e.val;
}
function cacheSet(k, v) {
    if (_cache.size >= 80) _cache.delete(_cache.keys().next().value);
    _cache.set(k, { val: v, ts: Date.now() });
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
    55:['Heavy drizzle','🌧️'],61:['Light rain','🌧️'],63:['Rain','🌧️'],65:['Heavy rain','🌧️'],
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
    const c = cacheGet(k); if (c) return c;
    const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en`,
        { signal: AbortSignal.timeout(8000) }
    );
    const d = await r.json(); cacheSet(k, d); return d;
}

async function fetchWeather(lat, lng) {
    const k = `wx_${lat.toFixed(2)}_${lng.toFixed(2)}`;
    const c = cacheGet(k); if (c) return c;
    try {
        const r = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
            `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weathercode,apparent_temperature` +
            `&wind_speed_unit=kmh&temperature_unit=celsius&timezone=auto`,
            { signal: AbortSignal.timeout(6000) }
        );
        const d = await r.json(); cacheSet(k, d); return d;
    } catch { return null; }
}

async function fetchElevation(lat, lng) {
    const k = `elev_${lat.toFixed(3)}_${lng.toFixed(3)}`;
    const c = cacheGet(k); if (c !== null) return c;
    try {
        const r = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`,
            { signal: AbortSignal.timeout(5000) });
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
            { headers:{'Accept':'application/json'}, signal: AbortSignal.timeout(7000) }
        );
        if (!r.ok) { cacheSet(k, null); return null; }
        const d = await r.json(); cacheSet(k, d); return d;
    } catch { cacheSet(k, null); return null; }
}

// Wikipedia REST API — media-list (all images with real dimensions)
async function fetchWikiMedia(title) {
    const k = `wmedia_${title}`;
    const c = cacheGet(k); if (c) return c;
    try {
        const r = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title)}`,
            { headers:{'Accept':'application/json'}, signal: AbortSignal.timeout(8000) }
        );
        if (!r.ok) return [];
        const d = await r.json();
        const items = (d.items || [])
            .filter(it => {
                if (it.type !== 'image') return false;
                const src = (it.original?.source || '').toLowerCase();
                if (src.endsWith('.svg')) return false;
                if (/(flag|logo|icon|seal|coa|emblem|locator|map|symbol|coat.of.arms|signature|stamp|blank|commons-logo|wikidata|question)/i.test(src)) return false;
                return (it.original?.width || 0) >= 280;
            })
            .sort((a, b) => (b.original?.width || 0) - (a.original?.width || 0)) // best first
            .map(it => ({
                url: it.original.source,
                thumb: it.thumbnail?.source || it.original.source,
                w: it.original.width || 0,
                caption: (it.description?.text || it.title || '')
                    .replace(/^File:/i,'').replace(/_/g,' ').replace(/\.[^.]+$/,'').trim()
            }))
            .slice(0, 7);
        cacheSet(k, items); return items;
    } catch { return []; }
}

// Search Wikipedia for the best article title matching a place name
async function searchWikiTitle(name, lat, lng) {
    const k = `wsearch_${name.slice(0,30)}`;
    const c = cacheGet(k); if (c !== undefined) return c;
    try {
        // Strategy 1: name search
        const r = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&srlimit=3&format=json&origin=*`,
            { signal: AbortSignal.timeout(6000) }
        );
        const d = await r.json();
        const hit = d.query?.search?.[0]?.title || null;
        cacheSet(k, hit); return hit;
    } catch { return null; }
}

// Nearby Wikipedia articles via geosearch
async function fetchNearby(lat, lng) {
    const k = `nearby_${lat.toFixed(2)}_${lng.toFixed(2)}`;
    const c = cacheGet(k); if (c) return c;
    try {
        const r = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lng}&gsradius=15000&gslimit=8&format=json&origin=*`,
            { signal: AbortSignal.timeout(7000) }
        );
        const d = await r.json();
        const results = (d.query?.geosearch || []).map(p => ({
            title: p.title,
            lat: p.lat, lng: p.lon,
            dist: p.dist < 1000
                ? `${Math.round(p.dist)} m`
                : `${(p.dist/1000).toFixed(1)} km`
        }));
        cacheSet(k, results); return results;
    } catch { return []; }
}

// Geo fallback: get closest Wikipedia article title
async function geoTitle(lat, lng) {
    const k = `geotitle_${lat.toFixed(2)}_${lng.toFixed(2)}`;
    const c = cacheGet(k); if (c !== undefined) return c;
    try {
        const r = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lng}&gsradius=10000&gslimit=1&format=json&origin=*`,
            { signal: AbortSignal.timeout(5000) }
        );
        const d = await r.json();
        const t = d.query?.geosearch?.[0]?.title || null;
        cacheSet(k, t); return t;
    } catch { return null; }
}

// ─── Cesium fly-to helper ─────────────────────────────────────────────────────
function cameraFlyTo(lat, lng, altMeters = 8000) {
    try {
        const v = window.viewer || window.locationInfoPanel?._viewer;
        if (!v) return;
        v.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lng, lat, altMeters),
            duration: 2.0,
            easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
        });
    } catch (e) { console.warn('[IP] fly failed', e); }
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
        this.panel.classList.add('visible');
        document.querySelector('.app-container')?.classList.add('detail-open');

        // Phase 1 — instant (0ms)
        const cc   = guessCC(lat, lng);
        const meta = getCountryMeta(cc);
        this._renderSkeleton(lat, lng, meta);

        try {
            // Phase 2 — core data in parallel (~200-500ms)
            const [nom, wx, elev] = await Promise.all([
                fetchNominatim(lat, lng),
                fetchWeather(lat, lng),
                fetchElevation(lat, lng)
            ]);
            if (this._key !== key) return;

            const realCC = nom?.address?.country_code?.toUpperCase() || cc;
            const m = getCountryMeta(realCC);

            const placeName = this._pickName(explicitName, nom);
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

            // Phase 3 — Wikipedia (parallel: search + nearby)
            const [wikiTitle, nearby] = await Promise.all([
                searchWikiTitle(placeName, lat, lng).then(t => t || geoTitle(lat, lng)),
                fetchNearby(lat, lng)
            ]);
            if (this._key !== key) return;

            // Render nearby immediately once we have it
            this._renderNearby(nearby);

            if (wikiTitle) {
                const [summary, media] = await Promise.all([
                    fetchWikiSummary(wikiTitle),
                    fetchWikiMedia(wikiTitle)
                ]);
                if (this._key !== key) return;
                this._renderWiki(summary, media, place);
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

    _pickName(explicit, nom) {
        const bad = ['Selected Location','This Location','Unknown Location',''];
        if (explicit && !bad.includes(explicit)) return explicit;
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
        <div class="ip-hero" id="ip-hero" style="background:linear-gradient(${meta.heroGrad})">
            <div class="ip-hero-shimmer"></div>
            <div class="ip-hero-fg"></div>
            <div class="ip-hero-content">
                <div class="ip-hero-badge">${meta.flag}&nbsp;${meta.continent}</div>
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

        <div class="ip-section" id="ip-cuisine">
            <div class="ip-sec-hd"><span>🍽️</span>Local Cuisine</div>
            <p class="ip-desc">${meta.cuisine.spec}</p>
            <div class="ip-chips" id="ip-food">
                ${meta.cuisine.food.map(f=>`<span class="ip-chip ip-chip--food">${f}</span>`).join('')}
            </div>
        </div>

        <div class="ip-section" id="ip-lang">
            <div class="ip-sec-hd"><span>🗣️</span>Language & Culture</div>
            <div class="ip-chips" id="ip-langs">
                ${meta.languages.map(l=>`<span class="ip-chip">${l}</span>`).join('')}
            </div>
            <div class="ip-info-table" id="ip-info-table">
                ${meta.capital?`<div class="ip-kv"><span>🏛️ Capital</span><b>${meta.capital}</b></div>`:''}
                <div class="ip-kv"><span>💰 Currency</span><b id="ip-curr">${meta.currency.symbol} ${meta.currency.name}</b></div>
                <div class="ip-kv"><span>🕒 Timezone</span><b id="ip-tz">${meta.tz}</b></div>
            </div>
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

        // Hero
        const hero = c.querySelector('#ip-hero');
        if (hero) {
            hero.style.background = `linear-gradient(${meta.heroGrad})`;
            hero.querySelector('.ip-hero-content').innerHTML = `
                <div class="ip-hero-badge">${meta.flag}&nbsp;${place.country || meta.continent}</div>
                <h2 class="ip-hero-name">${place.name}</h2>
                <p class="ip-hero-sub">${[place.suburb||place.county||place.district, place.state, place.country].filter(Boolean).join(', ')}</p>
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

        // Cuisine / Lang patches
        const foodEl = c.querySelector('#ip-food');
        if (foodEl) foodEl.innerHTML = meta.cuisine.food.map(f=>`<span class="ip-chip ip-chip--food">${f}</span>`).join('');
        const descEl = c.querySelector('#ip-cuisine .ip-desc');
        if (descEl) descEl.textContent = meta.cuisine.spec;
        const langEl = c.querySelector('#ip-langs');
        if (langEl) langEl.innerHTML = meta.languages.map(l=>`<span class="ip-chip">${l}</span>`).join('');

        // Info table
        const currEl = c.querySelector('#ip-curr');
        if (currEl) currEl.textContent = `${meta.currency.symbol} ${meta.currency.name}`;
        const tzEl = c.querySelector('#ip-tz');
        if (tzEl) tzEl.textContent = meta.tz;
        // Capital row
        const infoTable = c.querySelector('#ip-info-table');
        if (infoTable && meta.capital) {
            const capRow = infoTable.querySelector('.ip-kv');
            if (!capRow || !capRow.textContent.includes(meta.capital)) {
                infoTable.insertAdjacentHTML('afterbegin', `<div class="ip-kv"><span>🏛️ Capital</span><b>${meta.capital}</b></div>`);
            }
        }

        // Re-wire nav button with real name
        this._wireNav(lat, lng, place.name);
    }

    // ── Phase 3a: Nearby ──────────────────────────────────────────────────────
    _renderNearby(nearby) {
        const el = this.panel.querySelector('#ip-nearby');
        if (!el) return;
        if (!nearby?.length) {
            el.innerHTML = `<p class="ip-empty">No nearby highlights found.</p>`;
            return;
        }
        el.innerHTML = nearby.map((p, i) => `
        <div class="ip-nb" style="animation-delay:${i*55}ms"
             data-lat="${p.lat}" data-lng="${p.lng}" data-name="${p.title.replace(/"/g,'&quot;')}">
            <div class="ip-nb-num">${i+1}</div>
            <div class="ip-nb-info">
                <span class="ip-nb-name">${p.title}</span>
                <span class="ip-nb-dist">📍 ${p.dist}</span>
            </div>
            <button class="ip-fly-btn" title="Fly to ${p.title}">›</button>
        </div>`).join('');

        el.querySelectorAll('.ip-nb').forEach(row => {
            const doFly = () => {
                const la = parseFloat(row.dataset.lat);
                const lo = parseFloat(row.dataset.lng);
                const nm = row.dataset.name;
                cameraFlyTo(la, lo, 12000);
                // Show info for nearby place too
                setTimeout(() => window.locationInfoPanel?.show(la, lo, nm), 1800);
            };
            row.querySelector('.ip-fly-btn')?.addEventListener('click', doFly);
        });
    }

    // ── Phase 3b: Wikipedia ───────────────────────────────────────────────────
    _renderWiki(summary, media, place) {
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
                    <div class="ip-sec-hd"><span>📖</span>About ${place.name}</div>
                    <p class="ip-about-text">${text}</p>
                `;
            }
        }

        // Hero image blurred backdrop
        const heroThumb = summary?.thumbnail?.source;
        if (heroThumb) this._setHeroBg(heroThumb);

        // Build final image array: thumbnail first, then media-list images
        let images = [];
        if (heroThumb) {
            // Use larger version of thumbnail
            const bigThumb = heroThumb.replace(/\/\d+px-/, '/900px-');
            images.push({ url: bigThumb, caption: summary?.title || place.name });
        }
        // Add media-list images (already sorted by size, filtered)
        (media || []).forEach(m => {
            if (!images.find(i => i.url === m.url)) {
                images.push({ url: m.url, caption: m.caption });
            }
        });
        images = images.slice(0, 7);

        // Render carousel or no-image state
        const imgSec = c.querySelector('#ip-img-section');
        if (imgSec) {
            if (images.length > 0) {
                imgSec.innerHTML = this._buildCarousel(images);
                this._initCarousel(imgSec, images.length);
            } else {
                imgSec.innerHTML = `<div class="ip-no-photo">📷 No photos found for this location</div>`;
            }
        }

        // Wikipedia link row
        const wikiRow = c.querySelector('#ip-wiki-row');
        if (wikiRow && summary?.content_urls?.desktop?.page) {
            wikiRow.style.display = '';
            wikiRow.innerHTML = `
            <a href="${summary.content_urls.desktop.page}" target="_blank" rel="noopener" class="ip-wiki-link">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
                Read on Wikipedia
            </a>
            <span class="ip-wiki-title">${summary.title || ''}</span>`;
        }
    }

    _setHeroBg(imgUrl) {
        const hero = this.panel.querySelector('#ip-hero');
        if (!hero || !imgUrl) return;
        const img = new Image();
        img.onload = () => {
            hero.style.backgroundImage = `url('${imgUrl}')`;
            hero.style.backgroundSize   = 'cover';
            hero.style.backgroundPosition = 'center';
            hero.classList.add('ip-hero--photo');
        };
        img.onerror = () => {};
        img.src = imgUrl;
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
                    <img src="${img.url}" alt="${img.caption||''}" loading="${i===0?'eager':'lazy'}"
                         onerror="this.closest('.ip-car-slide').style.display='none'">
                    ${img.caption ? `<div class="ip-car-cap">${img.caption}</div>` : ''}
                </div>`).join('')}
            </div>
            ${imgs.length > 1 ? `
            <button class="ip-car-arrow ip-car-prev" id="ip-car-prev">❮</button>
            <button class="ip-car-arrow ip-car-next" id="ip-car-next">❯</button>
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

    // ── Nav button ────────────────────────────────────────────────────────────
    _wireNav(lat, lng, name) {
        const btn = this.panel.querySelector('#ip-nav-btn');
        if (!btn) return;
        const nb = btn.cloneNode(true);
        btn.parentNode.replaceChild(nb, btn);
        nb.addEventListener('click', () => {
            if (window.navSystem?.show) window.navSystem.show(lat, lng, name);
        });
    }

    // ── CSS injection (once) ──────────────────────────────────────────────────
    _css() {
        if (document.getElementById('ip-v5')) return;
        const s = document.createElement('style');
        s.id = 'ip-v5';
        s.textContent = `
/* ══════════════════════════════════════════
   INFO PANEL v5 — Self-contained styles
   ══════════════════════════════════════════ */

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
    border-radius: 18px !important;
    opacity: 0;
    transform: translateX(calc(100% + 20px));
    transition: opacity 0.3s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1) !important;
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

.detail-panel::-webkit-scrollbar { width: 4px; }
.detail-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

/* Unset overflow on content container — panel itself scrolls */
.detail-content { overflow: visible !important; padding: 0 !important; }

/* ── HEADER ──────────────────────────── */
.detail-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 13px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    position: sticky; top: 0; z-index: 10;
    backdrop-filter: blur(16px);
    background: rgba(12,12,24,0.85);
    flex-shrink: 0;
}
.detail-header h3 {
    font-size: 0.85rem; font-weight: 600;
    color: rgba(255,255,255,0.9); margin: 0;
}

/* ── HERO ────────────────────────────── */
.ip-hero {
    position: relative;
    min-height: 195px;
    overflow: hidden;
    flex-shrink: 0;
    background: linear-gradient(160deg,#0f172a,#1e293b,#0c4a6e);
    transition: background-image 0.5s ease;
}
@media (max-width:520px) { .ip-hero { min-height: 162px; } }

/* Radial atmospheric glow */
.ip-hero::before {
    content:''; position:absolute; inset:0; pointer-events:none;
    background:
        radial-gradient(ellipse at 20% 40%, rgba(99,102,241,0.28) 0%, transparent 65%),
        radial-gradient(ellipse at 80% 20%, rgba(34,211,238,0.22) 0%, transparent 55%),
        radial-gradient(ellipse at 55% 90%, rgba(168,85,247,0.18) 0%, transparent 55%);
}

/* When hero has a photo */
.ip-hero--photo::before { opacity: 0; }
.ip-hero--photo .ip-hero-fg {
    background: linear-gradient(to top, rgba(8,8,18,0.96) 0%, rgba(8,8,18,0.5) 55%, rgba(8,8,18,0.15) 100%) !important;
}

.ip-hero-shimmer {
    position:absolute; inset:0; pointer-events:none;
    background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.06) 50%, transparent 65%);
    background-size: 200% 100%;
    animation: ip-shim 2.4s ease-in-out infinite;
}
@keyframes ip-shim { 0%,100%{background-position:220% 0} 50%{background-position:-220% 0} }

.ip-hero-fg {
    position:absolute; inset:0; pointer-events:none;
    background: linear-gradient(to top, rgba(8,8,18,0.92) 0%, rgba(8,8,18,0.38) 55%, transparent 100%);
}
.ip-hero-content {
    position:absolute; bottom:0; left:0; right:0;
    padding: 14px 16px; z-index: 2;
}
.ip-hero-badge {
    display:inline-flex; align-items:center; gap:6px;
    font-size:0.67rem; font-weight:700; letter-spacing:0.5px;
    text-transform:uppercase; color:rgba(255,255,255,0.7);
    background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.13);
    backdrop-filter:blur(8px); border-radius:20px; padding:4px 10px 4px 8px;
    margin-bottom:8px;
}
.ip-hero-name {
    font-size: clamp(1.05rem,3.5vw,1.32rem); font-weight:700;
    color:#fff; line-height:1.18; margin:0 0 5px;
    text-shadow: 0 2px 12px rgba(0,0,0,0.75);
}
.ip-hero-sub {
    font-size:0.76rem; color:rgba(255,255,255,0.58); margin:0; line-height:1.45;
    text-shadow: 0 1px 5px rgba(0,0,0,0.6);
}

/* ── STATS GRID 2×2 ──────────────────── */
.ip-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px; flex-shrink: 0;
    background: rgba(255,255,255,0.04);
    border-bottom: 1px solid rgba(255,255,255,0.06);
}
.ip-stat {
    display:flex; align-items:center; gap:10px;
    padding: 11px 13px;
    background: rgba(7,7,16,0.7);
    min-width:0; overflow:hidden;
    transition: background 0.18s;
}
.ip-stat:hover { background: rgba(99,102,241,0.1); }
.ip-stat--skel { cursor: default; }
.ip-stat-icon { font-size:1.25rem; flex-shrink:0; line-height:1; }
.ip-stat > div { display:flex; flex-direction:column; min-width:0; }
.ip-stat-val {
    font-size:0.92rem; font-weight:700; color:#fff;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.ip-stat-sub {
    font-size:0.6rem; color:rgba(255,255,255,0.38); margin-top:2px;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}

/* ── NAV ROW ─────────────────────────── */
.ip-nav-row {
    display:flex; align-items:center; gap:8px;
    padding: 10px 13px;
    border-bottom:1px solid rgba(255,255,255,0.05);
    flex-shrink:0;
}
.ip-nav-btn {
    flex:1; display:inline-flex; align-items:center; justify-content:center; gap:8px;
    padding:10px 15px;
    background:linear-gradient(135deg,#6366f1,#4f46e5);
    border:none; border-radius:12px;
    color:#fff; font-family:inherit; font-size:0.875rem; font-weight:600;
    cursor:pointer; white-space:nowrap;
    box-shadow:0 4px 16px rgba(99,102,241,0.4);
    transition:transform 0.14s, box-shadow 0.14s;
}
.ip-nav-btn svg { flex-shrink:0; }
.ip-nav-btn:hover { transform:translateY(-1px); box-shadow:0 6px 22px rgba(99,102,241,0.55); }
.ip-nav-btn:active { transform:scale(0.97); }
.ip-coord-pill {
    flex-shrink:0; display:inline-flex; align-items:center; gap:5px;
    padding:7px 9px; background:rgba(255,255,255,0.05);
    border:1px solid rgba(255,255,255,0.1); border-radius:10px;
    color:rgba(255,255,255,0.45); font-size:0.64rem;
    font-family:'Courier New',monospace; text-decoration:none; white-space:nowrap;
    transition:background 0.18s, color 0.18s;
}
.ip-coord-pill:hover { background:rgba(34,211,238,0.1); color:#22d3ee; }

/* ── SECTIONS ────────────────────────── */
.ip-section {
    padding:14px 16px;
    border-bottom:1px solid rgba(255,255,255,0.05);
    animation: ip-fadein 0.35s ease both;
}
@keyframes ip-fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
.ip-section:last-child { border-bottom:none; }
.ip-img-section { padding:0; }

.ip-sec-hd {
    display:flex; align-items:center; gap:8px;
    font-size:0.72rem; font-weight:700; letter-spacing:0.45px;
    text-transform:uppercase; color:rgba(255,255,255,0.48); margin-bottom:10px;
}
.ip-sec-hd span { font-size:0.9rem; }

/* About text */
.ip-about-text {
    font-size:0.8rem; line-height:1.72; color:rgba(255,255,255,0.68); margin:8px 0 0;
}

/* Cuisine desc */
.ip-desc { font-size:0.78rem; color:rgba(255,255,255,0.46); font-style:italic; margin:0 0 10px; line-height:1.5; }

/* ── CHIPS ────────────────────────────── */
.ip-chips { display:flex; flex-wrap:wrap; gap:6px; }
.ip-chip {
    padding:5px 11px; border-radius:20px; font-size:0.74rem; font-weight:500;
    background:rgba(99,102,241,0.12); border:1px solid rgba(99,102,241,0.25);
    color:rgba(255,255,255,0.82); transition:background 0.18s;
}
.ip-chip:hover { background:rgba(99,102,241,0.28); }
.ip-chip--food { background:rgba(251,146,60,0.1); border-color:rgba(251,146,60,0.28); color:#fdba74; }
.ip-chip--food:hover { background:rgba(251,146,60,0.24); }

/* ── INFO TABLE ──────────────────────── */
.ip-info-table { margin-top:10px; }
.ip-kv {
    display:flex; justify-content:space-between; align-items:center; gap:8px;
    padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.04);
    font-size:0.78rem;
}
.ip-kv:last-child { border-bottom:none; }
.ip-kv span { color:rgba(255,255,255,0.4); white-space:nowrap; }
.ip-kv b { font-weight:600; color:rgba(255,255,255,0.85); text-align:right; }

/* ── NEARBY ──────────────────────────── */
.ip-nb-skel { display:flex; flex-direction:column; gap:5px; padding:7px 0; }
.ip-nb {
    display:flex; align-items:center; gap:10px;
    padding:9px 11px;
    background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06);
    border-radius:12px; margin-bottom:5px;
    animation: ip-slidein 0.3s ease both;
    transition:background 0.18s, border-color 0.18s, transform 0.14s;
    cursor:default;
}
@keyframes ip-slidein { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:none} }
.ip-nb:hover { background:rgba(99,102,241,0.1); border-color:rgba(99,102,241,0.24); transform:translateX(2px); }
.ip-nb-num {
    width:22px; height:22px; flex-shrink:0;
    background:linear-gradient(135deg,#6366f1,#22d3ee);
    border-radius:50%; font-size:0.61rem; font-weight:700; color:#fff;
    display:flex; align-items:center; justify-content:center;
}
.ip-nb-info { flex:1; min-width:0; }
.ip-nb-name {
    display:block; font-size:0.81rem; font-weight:600; color:rgba(255,255,255,0.88);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.ip-nb-dist { font-size:0.67rem; color:rgba(255,255,255,0.38); }
.ip-fly-btn {
    width:26px; height:26px; flex-shrink:0; border-radius:50%;
    background:rgba(99,102,241,0.14); border:1px solid rgba(99,102,241,0.24);
    color:#818cf8; font-size:1rem; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:background 0.18s, transform 0.14s;
}
.ip-fly-btn:hover { background:rgba(99,102,241,0.38); transform:scale(1.12); }
.ip-empty { font-size:0.75rem; color:rgba(255,255,255,0.28); }

/* ── CAROUSEL ────────────────────────── */
.ip-car {
    position:relative; width:100%; overflow:hidden;
    background:#060610; height:220px;
}
@media (max-width:520px) { .ip-car { height:185px; } }
.ip-car-track {
    display:flex; width:100%; height:100%;
    transition:transform 0.48s cubic-bezier(0.25,0.46,0.45,0.94);
    will-change:transform;
}
.ip-car-slide {
    min-width:100%; height:100%; flex-shrink:0;   /* ← critical */
    position:relative; overflow:hidden;
}
.ip-car-slide img {
    width:100%; height:100%; object-fit:cover; display:block;
    transition:transform 5s ease;
}
.ip-car-slide:hover img { transform:scale(1.05); }
.ip-car-cap {
    position:absolute; bottom:0; left:0; right:0;
    background:linear-gradient(transparent,rgba(0,0,0,0.78));
    padding:22px 12px 8px;
    font-size:0.69rem; color:rgba(255,255,255,0.85);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    pointer-events:none;
}
.ip-car-arrow {
    position:absolute; top:50%; transform:translateY(-50%);
    width:30px; height:30px; border-radius:50%;
    background:rgba(0,0,0,0.55); backdrop-filter:blur(6px);
    border:1px solid rgba(255,255,255,0.18); color:#fff;
    font-size:0.95rem; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    padding:0; z-index:6; opacity:0.75;
    transition:opacity 0.18s, background 0.18s;
}
.ip-car-arrow:hover { opacity:1; background:rgba(99,102,241,0.7); }
.ip-car-prev { left:8px; }
.ip-car-next { right:8px; }
.ip-car-bar {
    position:absolute; bottom:8px; left:0; right:0;
    display:flex; align-items:center; justify-content:center; gap:8px; z-index:5;
}
.ip-car-dots { display:flex; gap:5px; }
.ip-car-dot {
    width:6px; height:6px; border-radius:50%;
    background:rgba(255,255,255,0.28); cursor:pointer;
    transition:all 0.28s; flex-shrink:0;
}
.ip-car-dot.on { background:#fff; transform:scale(1.5); }
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
    background:rgba(99,102,241,0.55);
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
    padding:11px 16px;
    border-top:1px solid rgba(255,255,255,0.05);
}
.ip-wiki-link {
    display:inline-flex; align-items:center; gap:6px;
    color:#22d3ee; font-size:0.78rem; font-weight:500;
    text-decoration:none; transition:color 0.18s;
}
.ip-wiki-link:hover { color:rgba(34,211,238,0.65); }
.ip-wiki-title {
    font-size:0.66rem; color:rgba(255,255,255,0.25);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    max-width:120px;
}

/* ── SKELETONS ───────────────────────── */
.ip-sk {
    background:linear-gradient(90deg,
        rgba(255,255,255,0.05) 25%,
        rgba(255,255,255,0.12) 50%,
        rgba(255,255,255,0.05) 75%);
    background-size:200% 100%;
    animation:ip-shimmer 1.6s ease infinite; border-radius:5px;
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
