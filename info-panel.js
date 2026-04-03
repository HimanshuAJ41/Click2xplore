/**
 * LocationInfoPanel — v3 Optimised
 *
 * Strategy:
 *  Phase 1 (~0ms)   — Render instantly from local PLACES_DB + coordinates
 *  Phase 2 (~50–200ms) — Patch in Nominatim + RestCountries data (parallel)
 *  Phase 3 (async)  — Lazy-load images after panel is visible
 *
 * Cache: LRU memory cache (50 entries, 10-min TTL) — repeat clicks are instant
 */

// ─── Cache ───────────────────────────────────────────────────────────────────
const _cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function cacheGet(key) {
    const entry = _cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) { _cache.delete(key); return null; }
    return entry.val;
}
function cacheSet(key, val) {
    if (_cache.size >= 50) _cache.delete(_cache.keys().next().value); // evict oldest
    _cache.set(key, { val, ts: Date.now() });
}

// ─── Country meta (static — zero network) ────────────────────────────────────
const COUNTRY_META = {
    IN: { flag: '🇮🇳', capital: 'New Delhi', currency: 'Indian Rupee', languages: ['Hindi', 'English'], cuisine: { food: ['Biryani', 'Butter Chicken', 'Dosa', 'Samosa'], specialty: 'Spicy curries & aromatic spices' } },
    FR: { flag: '🇫🇷', capital: 'Paris',     currency: 'Euro',         languages: ['French'],            cuisine: { food: ['Croissant', 'Baguette', 'Coq au Vin', 'Crêpes'], specialty: 'Fine dining & pastries' } },
    IT: { flag: '🇮🇹', capital: 'Rome',      currency: 'Euro',         languages: ['Italian'],           cuisine: { food: ['Pizza', 'Pasta', 'Gelato', 'Risotto'], specialty: 'Mediterranean flavours' } },
    JP: { flag: '🇯🇵', capital: 'Tokyo',     currency: 'Yen',          languages: ['Japanese'],          cuisine: { food: ['Sushi', 'Ramen', 'Tempura', 'Mochi'], specialty: 'Fresh seafood & umami' } },
    CN: { flag: '🇨🇳', capital: 'Beijing',   currency: 'Renminbi',     languages: ['Mandarin'],          cuisine: { food: ['Dim Sum', 'Peking Duck', 'Dumplings', 'Hot Pot'], specialty: 'Diverse regional cuisines' } },
    US: { flag: '🇺🇸', capital: 'Washington D.C.', currency: 'US Dollar', languages: ['English'],        cuisine: { food: ['Burger', 'BBQ', 'Apple Pie', 'Hot Dogs'], specialty: 'Diverse fusion cuisine' } },
    GB: { flag: '🇬🇧', capital: 'London',    currency: 'Pound Sterling', languages: ['English'],         cuisine: { food: ['Fish & Chips', 'Sunday Roast', 'Shepherd\'s Pie', 'Scones'], specialty: 'Hearty comfort food' } },
    DE: { flag: '🇩🇪', capital: 'Berlin',    currency: 'Euro',         languages: ['German'],            cuisine: { food: ['Bratwurst', 'Schnitzel', 'Pretzel', 'Black Forest Cake'], specialty: 'Hearty meat dishes & beer' } },
    BR: { flag: '🇧🇷', capital: 'Brasília',  currency: 'Brazilian Real', languages: ['Portuguese'],      cuisine: { food: ['Feijoada', 'Churrasco', 'Açaí', 'Pão de Queijo'], specialty: 'Grilled meats & tropical fruits' } },
    MX: { flag: '🇲🇽', capital: 'Mexico City', currency: 'Mexican Peso', languages: ['Spanish'],         cuisine: { food: ['Tacos', 'Enchiladas', 'Guacamole', 'Churros'], specialty: 'Bold flavours & fresh ingredients' } },
    ES: { flag: '🇪🇸', capital: 'Madrid',    currency: 'Euro',         languages: ['Spanish'],           cuisine: { food: ['Paella', 'Tapas', 'Gazpacho', 'Churros'], specialty: 'Mediterranean seafood' } },
    RU: { flag: '🇷🇺', capital: 'Moscow',    currency: 'Ruble',        languages: ['Russian'],           cuisine: { food: ['Borscht', 'Beef Stroganoff', 'Pelmeni', 'Blini'], specialty: 'Hearty Eastern European fare' } },
    AU: { flag: '🇦🇺', capital: 'Canberra',  currency: 'Australian Dollar', languages: ['English'],      cuisine: { food: ['Vegemite Toast', 'Meat Pie', 'Lamington', 'Barramundi'], specialty: 'Fresh seafood & BBQ' } },
    EG: { flag: '🇪🇬', capital: 'Cairo',     currency: 'Egyptian Pound', languages: ['Arabic'],          cuisine: { food: ['Koshari', 'Falafel', 'Ful Medames', 'Baklava'], specialty: 'Middle Eastern flavours' } },
    GR: { flag: '🇬🇷', capital: 'Athens',    currency: 'Euro',         languages: ['Greek'],             cuisine: { food: ['Gyros', 'Moussaka', 'Souvlaki', 'Baklava'], specialty: 'Fresh olive oil & herbs' } },
    TH: { flag: '🇹🇭', capital: 'Bangkok',   currency: 'Baht',         languages: ['Thai'],              cuisine: { food: ['Pad Thai', 'Tom Yum', 'Green Curry', 'Mango Rice'], specialty: 'Sweet, sour, salty, spicy balance' } },
    TR: { flag: '🇹🇷', capital: 'Ankara',    currency: 'Turkish Lira', languages: ['Turkish'],           cuisine: { food: ['Kebab', 'Baklava', 'Meze', 'Börek'], specialty: 'Rich spices & grilled meats' } },
    PE: { flag: '🇵🇪', capital: 'Lima',      currency: 'Peruvian Sol', languages: ['Spanish'],           cuisine: { food: ['Ceviche', 'Lomo Saltado', 'Anticuchos', 'Causa'], specialty: 'Fusion of indigenous & Spanish' } },
    JO: { flag: '🇯🇴', capital: 'Amman',     currency: 'Jordanian Dinar', languages: ['Arabic'],         cuisine: { food: ['Mansaf', 'Falafel', 'Hummus', 'Knafeh'], specialty: 'Levantine & Bedouin cooking' } },
    PT: { flag: '🇵🇹', capital: 'Lisbon',    currency: 'Euro',         languages: ['Portuguese'],        cuisine: { food: ['Pastéis de Nata', 'Bacalhau', 'Bifanas', 'Caldo Verde'], specialty: 'Atlantic seafood & pastries' } },
    NL: { flag: '🇳🇱', capital: 'Amsterdam', currency: 'Euro',         languages: ['Dutch'],             cuisine: { food: ['Stroopwafel', 'Haring', 'Bitterballen', 'Poffertjes'], specialty: 'Dairy & dairy-based delights' } },
    CH: { flag: '🇨🇭', capital: 'Bern',      currency: 'Swiss Franc',  languages: ['German', 'French', 'Italian'], cuisine: { food: ['Fondue', 'Raclette', 'Rösti', 'Swiss Chocolate'], specialty: 'Alpine comfort food' } },
    CA: { flag: '🇨🇦', capital: 'Ottawa',    currency: 'Canadian Dollar', languages: ['English', 'French'], cuisine: { food: ['Poutine', 'Butter Tarts', 'BeaverTails', 'Maple Syrup'], specialty: 'Multicultural fusion' } },
    AE: { flag: '🇦🇪', capital: 'Abu Dhabi', currency: 'UAE Dirham',   languages: ['Arabic'],            cuisine: { food: ['Shawarma', 'Harees', 'Al Harees', 'Luqaimat'], specialty: 'Arabic hospitality & spices' } },
    ZA: { flag: '🇿🇦', capital: 'Pretoria',  currency: 'Rand',         languages: ['Zulu', 'Xhosa', 'Afrikaans'], cuisine: { food: ['Braai', 'Bobotie', 'Biltong', 'Bunny Chow'], specialty: 'Braai culture & Cape Malay spices' } },
};

function getCountryMeta(code) {
    return COUNTRY_META[code?.toUpperCase()] || { flag: '🌍', capital: '', currency: '', languages: [], cuisine: { food: ['Local dishes'], specialty: 'Regional specialties' } };
}

// ─── Nominatim with cache ────────────────────────────────────────────────────
async function fetchNominatim(lat, lng) {
    const key = `nom_${lat.toFixed(3)}_${lng.toFixed(3)}`;
    const cached = cacheGet(key);
    if (cached) return cached;

    const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en`,
        { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    cacheSet(key, data);
    return data;
}

// ─── Wikipedia images with cache ─────────────────────────────────────────────
async function fetchWikiImages(lat, lng, explicitName = null) {
    const safeName = explicitName ? explicitName.replace(/[^a-zA-Z0-9]/g, '_') : '';
    const key = `wimg_${safeName}_${lat.toFixed(2)}_${lng.toFixed(2)}`;
    const cached = cacheGet(key);
    if (cached) return cached;

    let articles = [];

    // 1. If explicit name is given, try searching Wikipedia for it exactly
    if (explicitName && explicitName !== 'Unknown Location' && explicitName !== 'Selected Location') {
        try {
            const searchRes = await fetch(
                `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(explicitName)}&utf8=&format=json&origin=*`,
                { signal: AbortSignal.timeout(5000) }
            );
            const searchData = await searchRes.json();
            if (searchData.query?.search?.length > 0) {
                // Grab up to 4 top articles associated with this search
                searchData.query.search.slice(0, 4).forEach(s => {
                    articles.push({ pageid: s.pageid, title: s.title });
                });
            }
        } catch(e) { console.warn('Wiki name search error:', e); }
    }

    // 2. Fallback to geosearch if name search missed or no name provided
    if (articles.length === 0) {
        try {
            const geoRes = await fetch(
                `https://en.wikipedia.org/w/api.php?action=query&list=geosearch` +
                `&gscoord=${lat}|${lng}&gsradius=8000&gslimit=6&format=json&origin=*`,
                { signal: AbortSignal.timeout(6000) }
            );
            const geoData = await geoRes.json();
            articles = geoData.query?.geosearch || [];
        } catch(e) { console.warn('Wiki geo search error:', e); }
    }

    if (!articles.length) { cacheSet(key, []); return []; }

    // 3. Get images for these articles
    try {
        const pageIds = articles.map(a => a.pageid).join('|');
        const imgRes = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageIds}` +
            `&prop=pageimages&piprop=thumbnail&pithumbsize=700&format=json&origin=*`,
            { signal: AbortSignal.timeout(6000) }
        );
        const imgData = await imgRes.json();
        const pages = imgData.query?.pages || {};
        const images = Object.values(pages)
            .filter(p => p.thumbnail?.source)
            .map(p => ({ url: p.thumbnail.source, title: p.title }));

        cacheSet(key, images);
        return images;
    } catch(e) {
        return [];
    }
}

// ─── Wikipedia nearby places (fast — single call) ────────────────────────────
async function fetchWikiNearby(lat, lng) {
    const key = `wnear_${lat.toFixed(2)}_${lng.toFixed(2)}`;
    const cached = cacheGet(key);
    if (cached) return cached;

    const res = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=geosearch` +
        `&gscoord=${lat}|${lng}&gsradius=8000&gslimit=5&format=json&origin=*`,
        { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    const places = (data.query?.geosearch || []).map(p => ({
        name: p.title,
        distance: (p.dist / 1000).toFixed(1) + ' km'
    }));
    cacheSet(key, places);
    return places;
}

// ─── Main Class ───────────────────────────────────────────────────────────────
class LocationInfoPanel {
    constructor(panelId) {
        this.panel = document.getElementById(panelId);
        this.carouselInterval = null;
        this._abortCtrl = null;
        this._currentKey = null;
    }

    /**
     * Show panel — 3-phase progressive render
     */
    async show(lat, lng, explicitName = null) {
        // Abort any in-flight request for a previous location
        if (this._abortCtrl) this._abortCtrl.abort();
        this._abortCtrl = new AbortController();
        const thisKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
        this._currentKey = thisKey;

        this.stopCarousel();
        this.panel.classList.add('visible');

        // ── Phase 1: Instant render (~0ms) ───────────────────────────────────
        // Use known data immediately — show skeleton for async fields
        const roundedCode = this._guessCountryCode(lat, lng); // rough bbox guess
        const meta = getCountryMeta(roundedCode);
        this._renderPhase1(lat, lng, meta);

        // ── Phase 2: Parallel fast fetches (~50–200ms) ────────────────────────
        // Nominatim reverse geocode + Wikipedia nearby (parallel)
        try {
            const [nominatim, nearby] = await Promise.all([
                fetchNominatim(lat, lng),
                fetchWikiNearby(lat, lng)
            ]);

            if (this._currentKey !== thisKey) return; // user clicked elsewhere

            const countryCode = nominatim.address?.country_code?.toUpperCase() || roundedCode;
            const updatedMeta = getCountryMeta(countryCode);

            const placeInfo = {
                name: (explicitName && explicitName !== 'Selected Location' ? explicitName : null) || 
                      nominatim.name || nominatim.address?.city || nominatim.address?.town ||
                      nominatim.address?.village || nominatim.address?.suburb ||
                      nominatim.address?.state || 'Unknown Location',
                country: nominatim.address?.country || '',
                state: nominatim.address?.state || '',
                countryCode
            };

            this._renderPhase2(lat, lng, placeInfo, updatedMeta, nearby);

            // ── Phase 3: Lazy-load images (non-blocking) ──────────────────────
            fetchWikiImages(lat, lng, placeInfo.name).then(images => {
                if (this._currentKey !== thisKey) return;
                if (images.length > 0) this._patchImages(images);
            }).catch(() => {});

        } catch (e) {
            if (e.name === 'AbortError') return;
            // Phase 2 failed — phase 1 content still visible, that's fine
            console.warn('Info panel phase 2 error:', e.message);
        }
    }

    hide() {
        this.panel.classList.remove('visible');
        this.stopCarousel();
        this._currentKey = null;
    }

    // ─── Phase 1: Instant skeleton + local known data ─────────────────────────
    _renderPhase1(lat, lng, meta) {
        const content = this.panel.querySelector('.detail-content');
        content.innerHTML = `
            <div class="location-carousel no-images" id="loc-carousel-wrapper">
                <div class="skeleton-img skeleton-anim"></div>
            </div>

            <div class="info-section location-header">
                <div class="location-flag">${meta.flag}</div>
                <div class="location-title-area">
                    <h2 class="skeleton-text skeleton-anim" style="width:60%;height:22px;border-radius:6px;"></h2>
                    <p class="skeleton-text skeleton-anim" style="width:40%;height:14px;border-radius:4px;margin-top:6px;"></p>
                </div>
            </div>

            <div class="info-section navigate-section">
                <button class="navigate-btn" id="navigate-to-btn" data-lat="${lat}" data-lng="${lng}" data-name="This Location">
                    🧭 Navigate Here
                </button>
            </div>



            <div class="info-section">
                <h3><span class="section-icon">🍜</span> Local Cuisine</h3>
                <p class="specialty-text">${meta.cuisine.specialty}</p>
                <div class="info-tags food-tags">
                    ${meta.cuisine.food.map(f => `<span class="tag food-tag">${f}</span>`).join('')}
                </div>
            </div>

            <div id="phase2-placeholder"></div>

            <div class="info-section explore-more" id="wiki-link-section" style="display:none"></div>
        `;

        // Wire navigate button immediately
        this._wireNavButton(content, lat, lng, 'This Location');
    }

    // ─── Phase 2: Patch real data into existing DOM (no full re-render) ───────
    _renderPhase2(lat, lng, placeInfo, meta, nearby) {
        const content = this.panel.querySelector('.detail-content');
        if (!content) return;

        // Update flag
        const flagEl = content.querySelector('.location-flag');
        if (flagEl) flagEl.textContent = meta.flag;

        // Replace skeleton title
        const titleArea = content.querySelector('.location-title-area');
        if (titleArea) {
            titleArea.innerHTML = `
                <h2>${placeInfo.name}</h2>
                <p class="location-subtitle">${placeInfo.state ? placeInfo.state + ', ' : ''}${placeInfo.country}</p>
            `;
        }

        // Update navigate button name
        const navBtn = content.querySelector('#navigate-to-btn');
        if (navBtn) {
            navBtn.dataset.name = placeInfo.name;
            this._wireNavButton(content, lat, lng, placeInfo.name);
        }

        // Patch phase-2 extra content
        const placeholder = content.querySelector('#phase2-placeholder');
        if (placeholder) {
            let extra = '';

            // Language & culture
            if (meta.capital || meta.languages.length) {
                extra += `
                    <div class="info-section">
                        <h3><span class="section-icon">🗣️</span> Language & Culture</h3>
                        <div class="info-tags">
                            ${meta.languages.map(l => `<span class="tag">${l}</span>`).join('')}
                        </div>
                        ${meta.capital ? `<p class="info-detail">Capital: <strong>${meta.capital}</strong></p>` : ''}
                        ${meta.currency ? `<p class="info-detail">Currency: ${meta.currency}</p>` : ''}
                    </div>`;
            }

            // Nearby places
            if (nearby.length > 0) {
                extra += `
                    <div class="info-section">
                        <h3><span class="section-icon">🏛️</span> Famous Places Nearby</h3>
                        <ul class="places-list">
                            ${nearby.slice(0, 4).map(p => `
                                <li class="place-item">
                                    <span class="place-name">${p.name}</span>
                                    <span class="place-distance">${p.distance}</span>
                                </li>`).join('')}
                        </ul>
                    </div>`;
            }

            placeholder.outerHTML = extra;
        }

        // Wiki link
        const wikiSec = content.querySelector('#wiki-link-section');
        if (wikiSec) {
            wikiSec.style.display = '';
            wikiSec.innerHTML = `
                <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(placeInfo.name)}"
                   target="_blank" class="explore-link">📚 Learn more on Wikipedia</a>`;
        }
    }

    // ─── Phase 3: Patch images into existing carousel wrapper ─────────────────
    _patchImages(images) {
        const wrapper = this.panel.querySelector('#loc-carousel-wrapper');
        if (!wrapper) return;

        wrapper.className = 'location-carousel';
        wrapper.id = 'loc-carousel';
        wrapper.innerHTML = `
            <div class="carousel-track">
                ${images.map((img, i) => `
                    <div class="carousel-slide">
                        <img src="${img.url}" alt="${img.title}"
                             loading="${i === 0 ? 'eager' : 'lazy'}" />
                        <div class="carousel-caption">${img.title}</div>
                    </div>`).join('')}
            </div>
            ${images.length > 1 ? `
                <div class="carousel-controls">
                    <div class="carousel-dots">
                        ${images.map((_, i) => `<span class="carousel-dot ${i === 0 ? 'active' : ''}" data-idx="${i}"></span>`).join('')}
                    </div>
                    <span class="carousel-counter">1 / ${images.length}</span>
                </div>` : ''}
        `;

        // Dot navigation
        wrapper.querySelectorAll('.carousel-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const idx = parseInt(dot.dataset.idx);
                const track = wrapper.querySelector('.carousel-track');
                track.style.transform = `translateX(-${idx * 100}%)`;
                wrapper.querySelectorAll('.carousel-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
                const counter = wrapper.querySelector('.carousel-counter');
                if (counter) counter.textContent = `${idx + 1} / ${images.length}`;
            });
        });

        if (images.length > 1) this.startCarousel(wrapper, images.length);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    _wireNavButton(content, lat, lng, name) {
        const btn = content.querySelector('#navigate-to-btn');
        if (!btn) return;
        // Remove old listener by cloning
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
            if (window.navSystem) window.navSystem.show(lat, lng, name);
        });
    }

    /** Very rough country code from lat/lng bounding boxes — zero network cost */
    _guessCountryCode(lat, lng) {
        if (lat >= 8 && lat <= 37 && lng >= 68 && lng <= 97) return 'IN';
        if (lat >= 42 && lat <= 51 && lng >= -5 && lng <= 10) return 'FR';
        if (lat >= 36 && lat <= 47 && lng >= 6 && lng <= 19) return 'IT';
        if (lat >= 30 && lat <= 46 && lng >= 128 && lng <= 146) return 'JP';
        if (lat >= 18 && lat <= 53 && lng >= 73 && lng <= 135) return 'CN';
        if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66) return 'US';
        if (lat >= 49 && lat <= 61 && lng >= -8 && lng <= 2) return 'GB';
        if (lat >= 47 && lat <= 55 && lng >= 6 && lng <= 15) return 'DE';
        if (lat >= -34 && lat <= 6 && lng >= -74 && lng <= -34) return 'BR';
        if (lat >= 14 && lat <= 33 && lng >= -118 && lng <= -86) return 'MX';
        if (lat >= 36 && lat <= 44 && lng >= -9 && lng <= 4) return 'ES';
        if (lat >= 41 && lat <= 82 && lng >= 27 && lng <= 180) return 'RU';
        if (lat >= -44 && lat <= -10 && lng >= 113 && lng <= 154) return 'AU';
        if (lat >= 22 && lat <= 32 && lng >= 25 && lng <= 37) return 'EG';
        if (lat >= 35 && lat <= 42 && lng >= 20 && lng <= 30) return 'GR';
        if (lat >= 5 && lat <= 21 && lng >= 97 && lng <= 106) return 'TH';
        if (lat >= 36 && lat <= 42 && lng >= 26 && lng <= 45) return 'TR';
        if (lat >= 30 && lat <= 33 && lng >= 35 && lng <= 39) return 'JO';
        if (lat >= 56 && lat <= 71 && lng >= 10 && lng <= 32) return 'NO';
        if (lat >= 45 && lat <= 48 && lng >= 5 && lng <= 11) return 'CH';
        if (lat >= 42 && lat <= 72 && lng >= -141 && lng <= -52) return 'CA';
        if (lat >= 23 && lat <= 26 && lng >= 51 && lng <= 56) return 'AE';
        if (lat >= -35 && lat <= -22 && lng >= 16 && lng <= 33) return 'ZA';
        return '';
    }

    startCarousel(container, totalImages) {
        if (totalImages <= 1) return;
        this.stopCarousel();
        let currentIdx = 0;
        const track = container.querySelector('.carousel-track');
        const dots = container.querySelectorAll('.carousel-dot');
        const counter = container.querySelector('.carousel-counter');

        this.carouselInterval = setInterval(() => {
            currentIdx = (currentIdx + 1) % totalImages;
            if (track) track.style.transform = `translateX(-${currentIdx * 100}%)`;
            dots.forEach((d, i) => d.classList.toggle('active', i === currentIdx));
            if (counter) counter.textContent = `${currentIdx + 1} / ${totalImages}`;
        }, 3500);

        container.addEventListener('mouseenter', () => this.stopCarousel());
        container.addEventListener('mouseleave', () => this.startCarousel(container, totalImages));
    }

    stopCarousel() {
        if (this.carouselInterval) {
            clearInterval(this.carouselInterval);
            this.carouselInterval = null;
        }
    }
}

// ─── Skeleton CSS (injected once) ────────────────────────────────────────────
(function injectSkeletonCSS() {
    if (document.getElementById('skeleton-css')) return;
    const s = document.createElement('style');
    s.id = 'skeleton-css';
    s.textContent = `
        .skeleton-img {
            width: 100%; height: 200px;
            background: var(--bg-glass);
        }
        .skeleton-text {
            display: block;
            background: rgba(255,255,255,0.07);
        }
        .skeleton-anim {
            background: linear-gradient(90deg,
                rgba(255,255,255,0.05) 25%,
                rgba(255,255,255,0.12) 50%,
                rgba(255,255,255,0.05) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.4s ease infinite;
        }
        @keyframes shimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
    `;
    document.head.appendChild(s);
})();

window.LocationInfoPanel = LocationInfoPanel;
