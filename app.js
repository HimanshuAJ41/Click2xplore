/**
 * Click2Xplore - Interactive 3D Globe Application
 * Powered by Cesium.js
 */

// ============================================
// ⚠️ API TOKEN CONFIGURATION - ADD YOUR TOKEN HERE
// ============================================
// Get your FREE Cesium ion access token at: https://cesium.com/ion/tokens
// 1. Sign up for a free account at cesium.com/ion
// 2. Create a new access token
// 3. Paste it below:

const CESIUM_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjNzA0NjY4OS04N2Y4LTQ4ZmYtOWU4ZC1iYzZjYzJkNjg4MjkiLCJpZCI6Mzc4MTc4LCJpYXQiOjE3NjkwODY5MzZ9.nKCpcfaa83CL99ITJqQbsOY3vL2Uhk1UXdmzlqUjWu4';

// ============================================
// Application State
// ============================================
let viewer = null;
let isRotating = true;
let rotationSpeed = 0.0003;
let locationInfoPanel = null;
let currentMarker = null;
let userLocationEntity = null;
let userLocationPulse = null;
let userLat = null;
let userLon = null;
let regionBoundarySource = null; // Cesium DataSource for boundary polygons

/** Imagery layer refs (set in setupScene / lazy for Esri topo) */
let satelliteBaseImageryLayer = null;
let labelOverlayImageryLayer = null;
/** OpenTopoMap — Street / topo detail (former “Terrain”) */
let streetMapImageryLayer = null;
/** Esri World Topo — Google-style shaded terrain map */
let googleTerrainMapImageryLayer = null;

// ============================================
// Initialize Application
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initCesium();
    setupEventListeners();
});

/**
 * Initialize Cesium Viewer
 */
async function initCesium() {
    // Set the Cesium ion access token
    Cesium.Ion.defaultAccessToken = CESIUM_ACCESS_TOKEN;

    try {
        // Create the Cesium viewer with basic configuration
        viewer = new Cesium.Viewer('cesiumContainer', {
            // Visual settings
            animation: false,
            baseLayerPicker: false,
            fullscreenButton: false,
            vrButton: false,
            geocoder: false,
            homeButton: false,
            infoBox: false,
            sceneModePicker: false,
            selectionIndicator: false,
            timeline: false,
            navigationHelpButton: false,
            navigationInstructionsInitiallyVisible: false,

            // Scene settings
            scene3DOnly: true,

            // Credit display
            creditContainer: document.createElement('div')
        });

        // Add world terrain asynchronously
        try {
            const terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1, {
                requestWaterMask: true,
                requestVertexNormals: true
            });
            viewer.terrainProvider = terrainProvider;
        } catch (terrainError) {
            console.warn('Terrain loading failed, using default:', terrainError);
        }

        // Disable entity tracking — prevents camera locking to entities
        viewer.trackedEntity = undefined;
        viewer.selectedEntityChanged.addEventListener(() => {
            viewer.trackedEntity = undefined;
        });

        // Disable double-click zoom/track behavior
        viewer.screenSpaceEventHandler.removeInputAction(
            Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
        );

        // Enable trackpad/two-finger zoom & tilt gestures
        viewer.scene.screenSpaceCameraController.zoomEventTypes = [
            Cesium.CameraEventType.WHEEL,
            Cesium.CameraEventType.PINCH
        ];
        viewer.scene.screenSpaceCameraController.tiltEventTypes = [
            Cesium.CameraEventType.MIDDLE_DRAG,
            Cesium.CameraEventType.PINCH,
            {
                eventType: Cesium.CameraEventType.LEFT_DRAG,
                modifier: Cesium.KeyboardEventModifier.CTRL
            }
        ];

        // Configure scene
        setupScene();

        // Start auto-rotation
        startAutoRotation();

        // Track mouse position
        setupMouseTracking();

        // Get user's location and mark with blue dot
        getUserLocation();

        // Setup dynamic location name updates in footer
        setupCameraLocationUpdates();

        // ★ FIX: Wait for globe to actually render before hiding loading screen
        const hideLoading = () => {
            document.getElementById('loading-screen').classList.add('hidden');
            // Start wonder toast cycle after globe is visible
            setTimeout(startWonderToastCycle, 2500);
        };
        // Wait for tiles to fully load (remaining === 0), with 5s max fallback
        let tileReady = false;
        viewer.scene.globe.tileLoadProgressEvent.addEventListener((remaining) => {
            if (!tileReady && remaining === 0) {
                tileReady = true;
                setTimeout(hideLoading, 200);
            }
        });
        setTimeout(() => { if (!tileReady) { tileReady = true; hideLoading(); } }, 5000);

        // Initialize location info panel
        locationInfoPanel = new LocationInfoPanel('detail-panel');

        // Setup detail panel close button
        document.getElementById('close-detail').addEventListener('click', () => {
            locationInfoPanel.hide();
        });

        // Initialize navigation system
        window.navSystem = new NavigationSystem(viewer);

        if (typeof ProgressiveAdminBoundaries !== 'undefined') {
            ProgressiveAdminBoundaries.init(viewer);
        }

    } catch (error) {
        console.error('Error initializing Cesium:', error);
        showError('Failed to initialize globe. Please check your API token.');
    }
}

/**
 * Configure scene settings
 */
function setupScene() {
    const scene = viewer.scene;

    // Enable depth testing
    scene.globe.depthTestAgainstTerrain = true;

    // ★ FIX: Disable atmosphere glow/ring that causes shiny circular line
    scene.skyAtmosphere.show = true;
    scene.skyAtmosphere.hueShift = 0;
    scene.skyAtmosphere.saturationShift = 0;
    scene.skyAtmosphere.brightnessShift = 0;

    // ★ Default to Satellite View — bright, no day/night shadows
    scene.globe.enableLighting = false;
    scene.globe.showGroundAtmosphere = false;

    // ★ FIX: Reduce atmosphere intensity to eliminate shiny edge
    scene.skyAtmosphere.atmosphereLightIntensity = 5.0;
    scene.skyAtmosphere.atmosphereRayleighScatteringScale = 0;

    // Fog settings — lighter for satellite clarity
    scene.fog.enabled = true;
    scene.fog.density = 0.00012;
    scene.fog.minimumBrightness = 0.03;

    // Sun/Moon still visible for context
    scene.sun.show = true;
    scene.moon.show = true;

        // ★ QUALITY: Maximum tile resolution — no blurry start
        scene.globe.maximumScreenSpaceError = 1;
        scene.globe.preloadAncestors = true;
        scene.globe.preloadSiblings = true;
        scene.globe.tileCacheSize = 200;
        scene.globe.loadingDescendantLimit = 20;
        scene.globe.enableLighting = false;
        scene.globe.showGroundAtmosphere = false;

    scene.globe.baseColor = Cesium.Color.fromCssColorString('#1a3a5c');

    // ★ PERFORMANCE: Set rendering resolution to device pixel ratio capped at 1.5
    // This prevents over-rendering on high-DPI screens without looking blurry
    viewer.resolutionScale = Math.min(window.devicePixelRatio, 1.5);

    // ★ QUALITY: Request high-res Bing Aerial with fewer blurry tiles
    // Override base with Bing Aerial HD (already default) — force immediate tile fetch
    viewer.scene.globe.tileLoadProgressEvent.addEventListener(() => {
        viewer.scene.requestRender();
    });

    // ★ Place name labels overlay (CartoDB labels)
    const labelOverlay = new Cesium.UrlTemplateImageryProvider({
        url: 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
        subdomains: ['a', 'b', 'c', 'd'],
        minimumLevel: 0,
        maximumLevel: 18,
        credit: 'Labels © CartoDB'
    });
    viewer.imageryLayers.addImageryProvider(labelOverlay);
    satelliteBaseImageryLayer = viewer.imageryLayers.get(0);
    labelOverlayImageryLayer = viewer.imageryLayers.get(viewer.imageryLayers.length - 1);

    document.querySelector('.app-container')?.setAttribute('data-map-view', 'satellite');

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const satBtn = document.querySelector('.nav-btn[data-view="satellite"]');
    if (satBtn) satBtn.classList.add('active');

    // Initial camera position - Earth overview
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(78, 20, 25000000),
        duration: 0,
        orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-90),
            roll: 0
        }
    });
}

/**
 * Get user's current location via browser Geolocation API
 * and mark it with an animated blue dot (like Google Maps)
 * ★ Improved: better mobile handling, retry, orientation hint
 */
function getUserLocation() {
    if (!navigator.geolocation) {
        console.warn('Geolocation not supported.');
        showLocationHint('📍 Location not supported in this browser');
        return;
    }

    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLat = position.coords.latitude;
            userLon = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            console.log(`User: ${userLat}, ${userLon} (±${accuracy}m)`);

            // ─── Pulsing blue accuracy circle ───
            userLocationPulse = viewer.entities.add({
                name: 'User Location Accuracy',
                position: Cesium.Cartesian3.fromDegrees(userLon, userLat),
                ellipse: {
                    semiMajorAxis: Math.max(accuracy, 80),
                    semiMinorAxis: Math.max(accuracy, 80),
                    material: Cesium.Color.fromCssColorString('#4285F4').withAlpha(0.15),
                    outline: true,
                    outlineColor: Cesium.Color.fromCssColorString('#4285F4').withAlpha(0.4),
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                }
            });

            // ─── Solid blue dot ───
            userLocationEntity = viewer.entities.add({
                name: 'Your Location',
                position: Cesium.Cartesian3.fromDegrees(userLon, userLat),
                point: {
                    pixelSize: 14,
                    color: Cesium.Color.fromCssColorString('#4285F4'),
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 3,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });

            // Visibility on back side
            viewer.scene.preRender.addEventListener(() => {
                if (!userLocationEntity) return;
                const pos = userLocationEntity.position.getValue(viewer.clock.currentTime);
                if (!pos) return;
                const occluder = new Cesium.EllipsoidalOccluder(
                    viewer.scene.globe.ellipsoid,
                    viewer.camera.position
                );
                const visible = occluder.isPointVisible(pos);
                userLocationEntity.show = visible;
                if (userLocationPulse) userLocationPulse.show = visible;
            });

            // Keep watching
            navigator.geolocation.watchPosition(
                (pos) => {
                    userLat = pos.coords.latitude;
                    userLon = pos.coords.longitude;
                    const newPos = Cesium.Cartesian3.fromDegrees(userLon, userLat);
                    if (userLocationEntity) userLocationEntity.position = newPos;
                    if (userLocationPulse) userLocationPulse.position = newPos;
                },
                null,
                { enableHighAccuracy: true, maximumAge: 5000 }
            );
        },
        (error) => {
            console.warn('Geolocation error:', error.message);
            if (error.code === 1) {
                showLocationHint('📍 Location access denied. Enable it in browser settings.');
            } else if (error.code === 2) {
                showLocationHint(isMobile ? '📍 Could not detect location. Try rotating your device.' : '📍 Location unavailable.');
            } else {
                showLocationHint('📍 Location timed out. Retrying...');
                // Retry with lower accuracy
                setTimeout(() => {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            userLat = pos.coords.latitude;
                            userLon = pos.coords.longitude;
                        },
                        () => {},
                        { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 }
                    );
                }, 2000);
            }
        },
        { enableHighAccuracy: true, timeout: isMobile ? 15000 : 10000, maximumAge: 60000 }
    );
}

function showLocationHint(msg) {
    const existing = document.querySelector('.location-hint');
    if (existing) existing.remove();
    const hint = document.createElement('div');
    hint.className = 'click-hint location-hint';
    hint.textContent = msg;
    document.querySelector('.app-container').appendChild(hint);
    setTimeout(() => hint.remove(), 6000);
}

/**
 * Fly camera to user's current location
 * Uses -90° pitch (straight down) so pin is dead center on screen
 */
function flyToMyLocation() {
    if (userLat == null || userLon == null) {
        getUserLocation();
        return;
    }
    isRotating = false;

    // Use lookAt to guarantee the target is at screen center
    const target = Cesium.Cartesian3.fromDegrees(userLon, userLat, 0);
    const offset = new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0),
        Cesium.Math.toRadians(-90),  // straight down — no curvature offset
        1500                          // distance in meters
    );
    viewer.camera.flyToBoundingSphere(
        new Cesium.BoundingSphere(target, 0),
        {
            offset: offset,
            duration: 2.5
        }
    );
}

/**
 * Start auto-rotation of the globe
 */
function startAutoRotation() {
    viewer.clock.onTick.addEventListener(() => {
        if (isRotating && viewer.scene.mode === Cesium.SceneMode.SCENE3D) {
            viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, rotationSpeed);
        }
    });
}

/**
 * Track mouse position for coordinates display
 * Uses scene.globe.pick with a ray for terrain-accurate coordinates
 */
function setupMouseTracking() {
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction((movement) => {
        // Use ray-cast against the actual rendered globe surface (not a smooth sphere)
        const ray = viewer.camera.getPickRay(movement.endPosition);
        const cartesian = viewer.scene.globe.pick(ray, viewer.scene);

        if (cartesian) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(4);
            const lon = Cesium.Math.toDegrees(cartographic.longitude).toFixed(4);

            document.getElementById('live-coords').textContent = `${lat}°, ${lon}°`;
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Stop rotation when user interacts
    handler.setInputAction(() => {
        isRotating = false;
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // Click to show location info and add marker
    // Uses scene.pickPosition for terrain-accurate click location
    handler.setInputAction((click) => {
        // ★ Skip normal click if navigation is picking a location on map
        if (window.navSystem && window.navSystem.isPickingOnMap) return;

        // First try: terrain-accurate pick (requires depthTestAgainstTerrain = true)
        let cartesian = viewer.scene.pickPosition(click.position);

        // Fallback: ray-cast against globe surface
        if (!cartesian || !Cesium.defined(cartesian)) {
            const ray = viewer.camera.getPickRay(click.position);
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        }

        if (cartesian && Cesium.defined(cartesian)) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);
            const lon = Cesium.Math.toDegrees(cartographic.longitude);

            // Add marker pin at the exact clicked location
            addMarker(lat, lon, 'Selected Location');



            // Show detailed info panel
            if (locationInfoPanel) {
                locationInfoPanel.show(lat, lon, null);
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

/**
 * Add a marker pin at the specified location — RED DOT ONLY, no label/tag
 */
function addMarker(lat, lon, name) {
    // Remove existing marker
    if (currentMarker) {
        viewer.entities.remove(currentMarker);
    }

    // Create new marker — just a red dot, no label
    currentMarker = viewer.entities.add({
        name: name,
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
        point: {
            pixelSize: 15,
            color: Cesium.Color.RED,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 3,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
    });

    // Update footer location name dynamically via reverse geocoding
    updateLocationName(lat, lon);
}

/**
 * Create a pin marker canvas
 */
function createPinCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Draw pin shadow
    ctx.beginPath();
    ctx.ellipse(24, 60, 10, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();

    // Draw pin body
    ctx.beginPath();
    ctx.moveTo(24, 58);
    ctx.bezierCurveTo(24, 40, 8, 32, 8, 18);
    ctx.arc(24, 18, 16, Math.PI, 0, false);
    ctx.bezierCurveTo(40, 32, 24, 40, 24, 58);
    ctx.closePath();

    // Gradient fill
    const gradient = ctx.createLinearGradient(8, 0, 40, 0);
    gradient.addColorStop(0, '#ff4444');
    gradient.addColorStop(0.5, '#ff6666');
    gradient.addColorStop(1, '#cc2222');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Pin border
    ctx.strokeStyle = '#990000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(24, 18, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#990000';
    ctx.lineWidth = 1;
    ctx.stroke();

    return canvas;
}

/**
 * Fly to a specific location - uses lookAt to guarantee target is at screen center
 */
function flyToLocation(lat, lon, name, height = 5000) {
    isRotating = false;

    // Add marker at the destination
    addMarker(lat, lon, name);

    // Use flyToBoundingSphere with lookAt offset
    // This guarantees the target point is exactly at screen center
    const target = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
    const offset = new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0),
        Cesium.Math.toRadians(-90),  // straight down — pin is dead center
        height                        // distance from target
    );

    viewer.camera.flyToBoundingSphere(
        new Cesium.BoundingSphere(target, 0),
        {
            offset: offset,
            duration: 2,
            complete: () => {
                // Show detailed info panel
                if (locationInfoPanel) {
                    locationInfoPanel.show(lat, lon, name);
                }
            }
        }
    );
}


/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Location cards removed (sidebar replaced by wonder toasts)

    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const view = btn.dataset.view;
            changeView(view);
        });
    });

    // Control buttons
    document.getElementById('zoom-in').addEventListener('click', () => {
        isRotating = false;
        viewer.camera.zoomIn(viewer.camera.positionCartographic.height * 0.3);
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
        isRotating = false;
        viewer.camera.zoomOut(viewer.camera.positionCartographic.height * 0.5);
    });

    document.getElementById('rotate-left').addEventListener('click', () => {
        isRotating = false;
        viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.3);
    });

    document.getElementById('rotate-right').addEventListener('click', () => {
        isRotating = false;
        viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, -0.3);
    });

    document.getElementById('reset-view').addEventListener('click', () => {
        isRotating = true;
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(0, 20, 25000000),
            duration: 2,
            orientation: {
                heading: 0,
                pitch: Cesium.Math.toRadians(-90),
                roll: 0
            }
        });
    });

    // My Location button
    document.getElementById('my-location').addEventListener('click', () => {
        flyToMyLocation();
    });



    // ══════════════════════════════════════════
    // Search with real-time autocomplete
    // ══════════════════════════════════════════
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const suggestionsBox = document.getElementById('search-suggestions');
    let suggestDebounce = null;
    let selectedSuggIdx = -1;

    // Fetch suggestions as user types (debounced 200ms)
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        clearTimeout(suggestDebounce);

        if (query.length === 0) {
            showSearchHistory();
            return;
        }

        if (query.length < 2) {
            hideSuggestions();
            return;
        }

        suggestDebounce = setTimeout(() => fetchSuggestions(query), 200);
    });

    // Show history when clicking into empty search box
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length === 0) {
            showSearchHistory();
        }
    });

    // Keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        const items = suggestionsBox.querySelectorAll('.suggestion-item');
        if (!items.length) {
            if (e.key === 'Enter') { performSearch(); hideSuggestions(); }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedSuggIdx = Math.min(selectedSuggIdx + 1, items.length - 1);
            highlightSuggestion(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedSuggIdx = Math.max(selectedSuggIdx - 1, -1);
            highlightSuggestion(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedSuggIdx >= 0 && items[selectedSuggIdx]) {
                items[selectedSuggIdx].click();
            } else {
                performSearch();
            }
            hideSuggestions();
        } else if (e.key === 'Escape') {
            hideSuggestions();
        }
    });

    // Click search button
    searchBtn.addEventListener('click', () => {
        performSearch();
        hideSuggestions();
    });

    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) hideSuggestions();
    });

    function highlightSuggestion(items) {
        items.forEach((item, i) => {
            item.classList.toggle('selected', i === selectedSuggIdx);
            if (i === selectedSuggIdx) item.scrollIntoView({ block: 'nearest' });
        });
    }

    function hideSuggestions() {
        suggestionsBox.classList.remove('active');
        suggestionsBox.innerHTML = '';
        selectedSuggIdx = -1;
    }

    // ─── Search History (LocalStorage) ───────────────────────────
    function getSearchHistory() {
        try {
            return JSON.parse(localStorage.getItem('click2xplore_history')) || [];
        } catch (e) {
            return [];
        }
    }

    function saveSearchHistory(item) {
        if (item.source === 'category') return; // Don't save category searches
        let history = getSearchHistory();
        // Remove existing identical entry
        history = history.filter(h => h.name !== item.name);
        // Add to front
        history.unshift({
            name: item.name, detail: item.detail, lat: item.lat, lon: item.lon,
            type: item.type, icon: '🕒', source: 'history', boundingbox: item.boundingbox
        });
        if (history.length > 5) history = history.slice(0, 5);
        localStorage.setItem('click2xplore_history', JSON.stringify(history));
    }

    function showSearchHistory() {
        const history = getSearchHistory();
        if (history.length > 0) {
            renderSuggestions(history, true);
        } else {
            hideSuggestions();
        }
    }

    async function fetchSuggestions(query) {
        const q = query.toLowerCase();

        // ★ Check for CATEGORY search first (e.g. "hidden waterfall", "waterparks")
        const categoryResult = searchByCategory(q);
        if (categoryResult && categoryResult.places.length > 0) {
            const places = categoryResult.places;

            // Show category header + individual results
            const items = [];

            // Special "Show all on map" item
            items.push({
                name: `${categoryResult.label} (${places.length} found)`,
                detail: 'Click to show all on map',
                lat: 0, lon: 0,
                type: 'Category',
                icon: '🗺️',
                source: 'category',
                categoryPlaces: places
            });

            // Then show individual places (max 6)
            places.slice(0, 6).forEach(p => {
                items.push({
                    name: p.name,
                    detail: p.detail,
                    lat: p.lat, lon: p.lon,
                    type: p.type,
                    icon: p.icon,
                    source: 'local'
                });
            });

            renderSuggestions(items);
            return; // Skip API call for category searches
        }

        // ★ INSTANT: search local famous places database (<1ms)
        const localMatches = FAMOUS_PLACES.filter(p => {
            const nameMatch = p.name.toLowerCase().includes(q);
            const detailMatch = p.detail.toLowerCase().includes(q);
            const tagMatch = p.tags ? p.tags.some(t => t.includes(q)) : false;
            return nameMatch || detailMatch || tagMatch;
        }).slice(0, 6);

        // Show local results IMMEDIATELY
        if (localMatches.length > 0) {
            renderSuggestions(localMatches.map(p => ({
                name: p.name,
                detail: p.detail,
                lat: p.lat,
                lon: p.lon,
                type: p.type,
                icon: p.icon,
                source: 'local'
            })));
        }

        // Then fetch API results in background (for lesser-known places)
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `format=json&q=${encodeURIComponent(query)}` +
                `&limit=5&addressdetails=1&accept-language=en`
            );
            const apiResults = await response.json();

            // Only update if user hasn't changed the input
            if (searchInput.value.trim().toLowerCase() !== q) return;

            const apiItems = apiResults.map(r => {
                const parts = r.display_name.split(',');
                return {
                    name: parts[0].trim(),
                    detail: parts.slice(1, 4).join(',').trim(),
                    lat: parseFloat(r.lat),
                    lon: parseFloat(r.lon),
                    type: formatLocationType(r.type, r.class),
                    icon: getLocationIcon(r.type, r.class),
                    boundingbox: r.boundingbox,
                    source: 'api'
                };
            });

            // Merge: local first, then API (deduplicated)
            const localNames = new Set(localMatches.map(p => p.name.toLowerCase()));
            const uniqueApi = apiItems.filter(a => !localNames.has(a.name.toLowerCase()));
            const merged = [
                ...localMatches.map(p => ({
                    name: p.name, detail: p.detail, lat: p.lat, lon: p.lon,
                    type: p.type, icon: p.icon, source: 'local'
                })),
                ...uniqueApi
            ].slice(0, 7);

            if (merged.length > 0) {
                renderSuggestions(merged);
            }
        } catch (err) {
            // Local results already shown, API failure is fine
        }
    }

    function renderSuggestions(items, isHistory = false) {
        suggestionsBox.innerHTML = '';
        selectedSuggIdx = -1;

        if (isHistory && items.length > 0) {
            const header = document.createElement('div');
            header.className = 'suggestion-item category-header-item';
            header.style.cursor = 'default';
            header.innerHTML = `<div style="font-size:0.75rem; color:var(--text-muted); padding-left:4px;">Recent Searches</div>`;
            suggestionsBox.appendChild(header);
        }

        items.forEach((result) => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';

            if (result.source === 'category') {
                // ★ Special category header item
                item.classList.add('category-header-item');
                item.innerHTML = `
                    <div class="suggestion-icon">${result.icon}</div>
                    <div class="suggestion-text">
                        <div class="suggestion-name category-name">${result.name}</div>
                        <div class="suggestion-detail">${result.detail}</div>
                    </div>
                    <span class="suggestion-type category-badge">MAP ALL</span>
                `;

                item.addEventListener('click', () => {
                    hideSuggestions();
                    showAllOnMap(result.categoryPlaces, result.name);
                });
            } else {
                const sourceTag = result.source === 'local' ? '⚡' : '';
                item.innerHTML = `
                    <div class="suggestion-icon">${result.icon}</div>
                    <div class="suggestion-text">
                        <div class="suggestion-name">${sourceTag} ${result.name}</div>
                        <div class="suggestion-detail">${result.detail}</div>
                    </div>
                    ${result.source !== 'history' ? `<span class="suggestion-type">${result.type}</span>` : ''}
                `;

                item.addEventListener('click', () => {
                    saveSearchHistory(result);
                    searchInput.value = `${result.name}, ${result.detail?.split(',')[0] || ''}`;
                    hideSuggestions();
                    clearRegionBoundary();
                    fetchAndShowBoundary(result.name, result.lat, result.lon, result.boundingbox);
                });
            }

            suggestionsBox.appendChild(item);
        });

        suggestionsBox.classList.add('active');
    }

    function getLocationIcon(type, cls) {
        if (cls === 'boundary' || type === 'administrative') return '🏛️';
        if (type === 'city' || type === 'town') return '🏙️';
        if (type === 'village' || type === 'hamlet') return '🏘️';
        if (type === 'suburb' || type === 'neighbourhood') return '📍';
        if (cls === 'tourism' || type === 'attraction') return '🎯';
        if (cls === 'natural') return '🌿';
        if (cls === 'waterway' || type === 'river') return '🌊';
        if (cls === 'highway' || type === 'road') return '🛣️';
        if (cls === 'aeroway') return '✈️';
        if (cls === 'railway') return '🚂';
        return '📌';
    }

    function formatLocationType(type, cls) {
        if (cls === 'boundary') return 'Region';
        if (type === 'city') return 'City';
        if (type === 'town') return 'Town';
        if (type === 'village') return 'Village';
        if (type === 'state') return 'State';
        if (type === 'country') return 'Country';
        if (type === 'suburb') return 'Area';
        if (type === 'neighbourhood') return 'Area';
        if (cls === 'tourism') return 'Place';
        if (cls === 'natural') return 'Nature';
        return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Place';
    }
}

/**
 * Show all places of a category on the map with red markers
 */
let categoryMarkerEntities = [];

function showAllOnMap(places, categoryLabel) {
    // Clear previous category markers
    categoryMarkerEntities.forEach(e => viewer.entities.remove(e));
    categoryMarkerEntities = [];
    clearRegionBoundary();

    isRotating = false;

    let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;

    places.forEach(p => {
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lon < minLon) minLon = p.lon;
        if (p.lon > maxLon) maxLon = p.lon;

        const entity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat),
            point: {
                pixelSize: 10,
                color: Cesium.Color.RED,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            },
            label: {
                text: p.name,
                font: '12px sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -14),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                scaleByDistance: new Cesium.NearFarScalar(1000, 1.0, 200000, 0.5)
            }
        });
        categoryMarkerEntities.push(entity);
    });

    const latPad = (maxLat - minLat) * 0.15 || 0.5;
    const lonPad = (maxLon - minLon) * 0.15 || 0.5;

    viewer.camera.flyTo({
        destination: Cesium.Rectangle.fromDegrees(
            minLon - lonPad, minLat - latPad,
            maxLon + lonPad, maxLat + latPad
        ),
        duration: 2.5
    });
}

/**
 * Fetch boundary from Nominatim and fly to a location
 * Works for both local DB results and API results
 */
async function fetchAndShowBoundary(name, lat, lon, existingBbox) {
    isRotating = false;

    // Immediately fly to location while boundary loads
    if (existingBbox) {
        const south = parseFloat(existingBbox[0]);
        const north = parseFloat(existingBbox[1]);
        const west  = parseFloat(existingBbox[2]);
        const east  = parseFloat(existingBbox[3]);
        viewer.camera.flyTo({
            destination: Cesium.Rectangle.fromDegrees(west, south, east, north),
            duration: 2.5,
            complete: () => {
                addMarker(lat, lon, name);
                if (locationInfoPanel) locationInfoPanel.show(lat, lon, name);
            }
        });
    } else {
        flyToLocation(lat, lon, name, 50000);
    }

    // Fetch boundary polygon in parallel
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `format=json&q=${encodeURIComponent(name)}` +
            `&polygon_geojson=1&limit=1&accept-language=en`
        );
        const data = await response.json();

        if (data.length > 0 && data[0].geojson) {
            clearRegionBoundary();
            drawRegionBoundary(data[0].geojson, name);

            // If we didn't have a bounding box before, use from API
            if (!existingBbox && data[0].boundingbox) {
                const south = parseFloat(data[0].boundingbox[0]);
                const north = parseFloat(data[0].boundingbox[1]);
                const west  = parseFloat(data[0].boundingbox[2]);
                const east  = parseFloat(data[0].boundingbox[3]);
                viewer.camera.flyTo({
                    destination: Cesium.Rectangle.fromDegrees(west, south, east, north),
                    duration: 1.5
                });
            }
        }
    } catch (err) {
        console.warn('Boundary fetch failed:', err);
    }
}

/**
 * Change the view mode: globe | satellite | street (OpenTopo) | terrain (Esri topo).
 */
function changeView(view) {
    const scene = viewer.scene;
    const globe = scene.globe;

    document.querySelector('.app-container')?.setAttribute('data-map-view', view);

    switch (view) {
        case 'globe':
            globe.enableLighting = true;
            globe.showGroundAtmosphere = true;
            globe.terrainExaggeration = 1.0;
            scene.fog.density = 0.00012;
            scene.fog.minimumBrightness = 0.03;
            hideCleanMapLayer();
            break;
        case 'satellite':
            globe.enableLighting = false;
            globe.showGroundAtmosphere = false;
            globe.terrainExaggeration = 1.0;
            scene.fog.density = 0.00012;
            scene.fog.minimumBrightness = 0.03;
            hideCleanMapLayer();
            break;
        case 'street':
            globe.enableLighting = true;
            globe.showGroundAtmosphere = false;
            globe.terrainExaggeration = 1.12;
            scene.fog.density = 0.00007;
            scene.fog.minimumBrightness = 0.06;
            showStreetMapLayer();
            break;
        case 'terrain':
            globe.enableLighting = true;
            globe.showGroundAtmosphere = false;
            globe.terrainExaggeration = 1.08;
            scene.fog.density = 0.00006;
            scene.fog.minimumBrightness = 0.07;
            void showGoogleTerrainMapLayer();
            break;
        default:
            hideCleanMapLayer();
            break;
    }

    viewer.scene.requestRender();
}

/**
 * Street / mountain style: OpenTopoMap (roads, contours, relief). Used by navigation too.
 */
function showStreetMapLayer() {
    if (googleTerrainMapImageryLayer) googleTerrainMapImageryLayer.show = false;

    if (!streetMapImageryLayer) {
        streetMapImageryLayer = viewer.imageryLayers.addImageryProvider(
            new Cesium.UrlTemplateImageryProvider({
                url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                subdomains: ['a', 'b', 'c'],
                maximumLevel: 17,
                credit: '© OpenTopoMap (CC-BY-SA), © OpenStreetMap contributors'
            })
        );
        streetMapImageryLayer.brightness = 1.04;
        streetMapImageryLayer.contrast = 1.06;
        streetMapImageryLayer.saturation = 0.92;
    }

    streetMapImageryLayer.show = true;
    if (satelliteBaseImageryLayer) satelliteBaseImageryLayer.show = false;
    if (labelOverlayImageryLayer) labelOverlayImageryLayer.show = false;

    syncBasemapAttrib();
}

/**
 * Google Maps–style terrain: Esri World Topo (hypsometric tint + shaded relief in raster).
 */
async function showGoogleTerrainMapLayer() {
    if (streetMapImageryLayer) streetMapImageryLayer.show = false;

    if (!googleTerrainMapImageryLayer) {
        try {
            const topoUrl = 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer';
            let provider;
            if (typeof Cesium.ArcGisMapServerImageryProvider.fromUrl === 'function') {
                provider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(topoUrl);
            } else {
                provider = new Cesium.ArcGisMapServerImageryProvider({ url: topoUrl });
                await provider.readyPromise;
            }
            googleTerrainMapImageryLayer = viewer.imageryLayers.addImageryProvider(provider);
            googleTerrainMapImageryLayer.brightness = 1.02;
            googleTerrainMapImageryLayer.contrast = 1.05;
        } catch (e) {
            console.warn('Esri World Topo Map failed, falling back to Street map:', e);
            showStreetMapLayer();
            return;
        }
    }

    googleTerrainMapImageryLayer.show = true;
    if (satelliteBaseImageryLayer) satelliteBaseImageryLayer.show = false;
    if (labelOverlayImageryLayer) labelOverlayImageryLayer.show = false;

    syncBasemapAttrib();
    viewer.scene.requestRender();
}

/** @deprecated name — use showStreetMapLayer; kept for navigation.js */
function showCleanMapLayer() {
    showStreetMapLayer();
}

function hideCleanMapLayer() {
    if (streetMapImageryLayer) streetMapImageryLayer.show = false;
    if (googleTerrainMapImageryLayer) googleTerrainMapImageryLayer.show = false;
    if (satelliteBaseImageryLayer) satelliteBaseImageryLayer.show = true;
    if (labelOverlayImageryLayer) labelOverlayImageryLayer.show = true;

    syncBasemapAttrib();
}

function syncBasemapAttrib() {
    const el = document.getElementById('basemap-attrib');
    if (!el) return;
    const streetOn = streetMapImageryLayer && streetMapImageryLayer.show;
    const topoOn = googleTerrainMapImageryLayer && googleTerrainMapImageryLayer.show;
    if (streetOn) {
        el.textContent = ' · Street © OpenTopoMap / OpenStreetMap';
    } else if (topoOn) {
        el.textContent = ' · Terrain © Esri, HERE, Garmin, FAO, NOAA, USGS, EPA, NPS, NRCan';
    } else {
        el.textContent = '';
    }
}

/**
 * Perform geocoding search with region boundary highlighting
 * Uses Nominatim API with polygon_geojson=1 to get real geographic boundaries
 */
async function performSearch() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    // Visual feedback — disable button during search
    const searchBtn = document.getElementById('search-btn');
    searchBtn.disabled = true;
    searchBtn.style.opacity = '0.5';

    try {
        // Fetch from Nominatim with boundary polygon — English names
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `format=json&q=${encodeURIComponent(query)}` +
            `&polygon_geojson=1&limit=1&addressdetails=1&accept-language=en`
        );
        const data = await response.json();

        if (data.length === 0) {
            console.log('No results found for:', query);
            searchBtn.disabled = false;
            searchBtn.style.opacity = '1';
            return;
        }

        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        const displayName = result.display_name.split(',')[0];

        // Clear previous boundary
        clearRegionBoundary();

        // Draw boundary if polygon data exists
        if (result.geojson) {
            drawRegionBoundary(result.geojson, displayName);
        }

        // Fly to the region — use bounding box if available for better framing
        if (result.boundingbox) {
            const south = parseFloat(result.boundingbox[0]);
            const north = parseFloat(result.boundingbox[1]);
            const west  = parseFloat(result.boundingbox[2]);
            const east  = parseFloat(result.boundingbox[3]);

            isRotating = false;
            viewer.camera.flyTo({
                destination: Cesium.Rectangle.fromDegrees(west, south, east, north),
                duration: 2.5,
                complete: () => {
                    // Add marker at center
                    addMarker(lat, lon, displayName);
                    if (locationInfoPanel) {
                        locationInfoPanel.show(lat, lon, displayName);
                    }
                }
            });
        } else {
            // Fallback — fly to coordinates
            flyToLocation(lat, lon, displayName, 50000);
        }

    } catch (error) {
        console.error('Search error:', error);
    } finally {
        searchBtn.disabled = false;
        searchBtn.style.opacity = '1';
    }
}

/**
 * Draw a region boundary with THICK red border lines and subtle fill
 * Cesium ignores polygon outlineWidth, so we draw polylines separately
 */
function drawRegionBoundary(geojson, name) {
    const cleanedGeojson = cleanGeoJsonCoords(geojson);
    if (!cleanedGeojson) return;

    const featureCollection = {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            properties: { name: name },
            geometry: cleanedGeojson
        }]
    };

    Cesium.GeoJsonDataSource.load(featureCollection, {
        stroke: Cesium.Color.TRANSPARENT,
        fill: Cesium.Color.RED.withAlpha(0.08),
        clampToGround: true
    }).then((dataSource) => {
        regionBoundarySource = dataSource;
        viewer.dataSources.add(dataSource);

        const entities = dataSource.entities.values;
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity.label) entity.label.show = false;
            if (entity.billboard) entity.billboard.show = false;

            if (entity.polygon) {
                entity.polygon.material = Cesium.Color.RED.withAlpha(0.08);
                entity.polygon.outline = false; // We draw our own thick lines
                entity.polygon.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
            }
            if (entity.polyline) {
                entity.polyline.material = Cesium.Color.RED;
                entity.polyline.width = 4;
                entity.polyline.clampToGround = true;
            }
        }

        // ★ Draw thick red polylines from polygon coordinates
        drawThickBorderLines(cleanedGeojson);

    }).catch((err) => {
        console.warn('Could not draw boundary:', err);
    });
}

/**
 * Extract rings from geojson and draw thick red ground-clamped polylines
 */
function drawThickBorderLines(geojson) {
    const rings = [];

    if (geojson.type === 'Polygon') {
        geojson.coordinates.forEach(ring => rings.push(ring));
    } else if (geojson.type === 'MultiPolygon') {
        geojson.coordinates.forEach(polygon => {
            polygon.forEach(ring => rings.push(ring));
        });
    }

    rings.forEach(ring => {
        if (!ring || ring.length < 3) return;
        const positions = ring.map(coord => Cesium.Cartesian3.fromDegrees(coord[0], coord[1]));

        const entity = viewer.entities.add({
            polyline: {
                positions: positions,
                width: 4,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.15,
                    color: Cesium.Color.RED
                }),
                clampToGround: true
            }
        });
        boundaryPolylineEntities.push(entity);
    });
}

/**
 * Remove consecutive duplicate points from GeoJSON coordinates
 * Prevents Cesium "EllipsoidRhumbLine must have distinct start and end" crash
 */
function cleanGeoJsonCoords(geojson) {
    if (!geojson || !geojson.type) return null;

    try {
        // Deep clone to avoid mutating original
        const cleaned = JSON.parse(JSON.stringify(geojson));

        const dedupRing = (ring) => {
            if (!Array.isArray(ring) || ring.length < 2) return ring;
            const result = [ring[0]];
            for (let i = 1; i < ring.length; i++) {
                const prev = result[result.length - 1];
                const curr = ring[i];
                // Skip if same as previous point
                if (prev[0] !== curr[0] || prev[1] !== curr[1]) {
                    result.push(curr);
                }
            }
            // A valid polygon ring needs at least 4 points
            return result.length >= 4 ? result : (result.length >= 3 ? [...result, result[0]] : null);
        };

        const cleanCoords = (coords, type) => {
            if (type === 'Polygon') {
                return coords.map(ring => dedupRing(ring)).filter(r => r !== null);
            } else if (type === 'MultiPolygon') {
                return coords.map(polygon =>
                    polygon.map(ring => dedupRing(ring)).filter(r => r !== null)
                ).filter(p => p.length > 0);
            } else if (type === 'LineString') {
                return dedupRing(coords) || coords;
            } else if (type === 'MultiLineString') {
                return coords.map(line => dedupRing(line) || line);
            }
            return coords;
        };

        if (cleaned.coordinates) {
            cleaned.coordinates = cleanCoords(cleaned.coordinates, cleaned.type);
        }

        return cleaned;
    } catch (e) {
        console.warn('GeoJSON cleanup failed:', e);
        return geojson; // return original if cleanup fails
    }
}

/**
 * Clear any previously drawn region boundary + thick border lines
 */
let boundaryPolylineEntities = [];

function clearRegionBoundary() {
    if (regionBoundarySource) {
        viewer.dataSources.remove(regionBoundarySource, true);
        regionBoundarySource = null;
    }
    // Remove thick border polylines
    boundaryPolylineEntities.forEach(e => viewer.entities.remove(e));
    boundaryPolylineEntities = [];
}
/**
 * Dynamic location name — reverse geocodes with ENGLISH names
 * Handles Indian (Maharashtra), Japanese, and all global address structures
 *
 * Zoom detail tiers:
 *   > 10,000 km → Country
 *   > 3,000 km  → State / Region
 *   > 500 km    → Division / District (state_district in India)
 *   > 100 km    → District / County
 *   > 30 km     → City / Town / Taluka
 *   > 10 km     → City + District
 *   > 3 km      → Suburb / City District / Ward
 *   > 500 m     → Neighbourhood / Area
 *   < 500 m     → Road / Street level
 */
let _locationNameTimeout = null;
let _lastLocationNameCoords = '';

function updateLocationName(lat, lon) {
    const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    if (key === _lastLocationNameCoords) return;
    _lastLocationNameCoords = key;

    clearTimeout(_locationNameTimeout);
    _locationNameTimeout = setTimeout(async () => {
        try {
            const alt = viewer.camera.positionCartographic.height;

            // More granular zoom level mapping
            let zoom;
            if (alt > 10000000)      zoom = 3;
            else if (alt > 3000000)  zoom = 5;
            else if (alt > 500000)   zoom = 7;
            else if (alt > 100000)   zoom = 10;
            else if (alt > 30000)    zoom = 12;
            else if (alt > 10000)    zoom = 14;
            else if (alt > 3000)     zoom = 16;
            else if (alt > 500)      zoom = 17;
            else                     zoom = 18;

            // ★ accept-language=en forces English names (fixes Tokyo, Hindi areas)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?` +
                `format=json&lat=${lat}&lon=${lon}` +
                `&zoom=${zoom}&addressdetails=1&accept-language=en`
            );
            const data = await response.json();

            if (data && data.address) {
                const a = data.address;
                let name = '';

                // Helper: pick first defined value
                const pick = (...fields) => fields.find(f => f) || '';

                if (alt > 10000000) {
                    // Country level
                    name = a.country || 'Earth';

                } else if (alt > 3000000) {
                    // State / Region
                    name = pick(a.state, a.region, a.country);
                    if (a.country && name !== a.country) name += ', ' + a.country;

                } else if (alt > 500000) {
                    // Division / State District (e.g., Konkan Division, Maharashtra)
                    name = pick(a.state_district, a.state, a.region);
                    if (a.state && name !== a.state) name += ', ' + a.state;

                } else if (alt > 100000) {
                    // District / County (e.g., Pune District, Maharashtra)
                    name = pick(a.county, a.state_district, a.city, a.town);
                    if (a.state) name += ', ' + a.state;

                } else if (alt > 30000) {
                    // City / Town / Taluka
                    name = pick(a.city, a.town, a.village, a.county, a.municipality);
                    const region = pick(a.state_district, a.county, a.state);
                    if (region && name !== region) name += ', ' + region;

                } else if (alt > 10000) {
                    // City + district detail
                    name = pick(a.city, a.town, a.village, a.municipality);
                    const district = pick(a.county, a.state_district);
                    if (district && name !== district) name += ', ' + district;
                    else if (a.state) name += ', ' + a.state;

                } else if (alt > 3000) {
                    // Suburb / Ward / City District
                    name = pick(a.suburb, a.city_district, a.neighbourhood);
                    const city = pick(a.city, a.town, a.village);
                    if (city && name !== city) name += ', ' + city;
                    else if (!name) name = city || '';

                } else if (alt > 500) {
                    // Neighbourhood / Area
                    name = pick(a.neighbourhood, a.suburb, a.city_district, a.hamlet);
                    const city = pick(a.city, a.town, a.village);
                    if (city && name) name += ', ' + city;
                    else if (city) name = city;

                } else {
                    // Street level
                    name = pick(a.road, a.pedestrian, a.footway, a.neighbourhood, a.suburb);
                    const area = pick(a.suburb, a.neighbourhood);
                    const city = pick(a.city, a.town, a.village);
                    if (area && name !== area) name += ', ' + area;
                    if (city) name += ', ' + city;
                }

                // Final fallback — use display_name if we got nothing
                if (!name && data.display_name) {
                    name = data.display_name.split(',').slice(0, 2).join(',');
                }

                const el = document.getElementById('live-location-name');
                if (el && name && el.textContent !== name) {
                    // Fade out, change text, fade in
                    el.classList.add('fading');
                    setTimeout(() => {
                        el.textContent = name;
                        el.classList.remove('fading');
                    }, 400);
                }
            }
        } catch (e) {
            // Silently fail
        }
    }, 400);
}

/**
 * Update footer location name when camera stops moving
 */
function setupCameraLocationUpdates() {
    let moveTimeout = null;
    viewer.camera.moveEnd.addEventListener(() => {
        clearTimeout(moveTimeout);
        moveTimeout = setTimeout(() => {
            const cart = viewer.camera.positionCartographic;
            const lat = Cesium.Math.toDegrees(cart.latitude);
            const lon = Cesium.Math.toDegrees(cart.longitude);
            updateLocationName(lat, lon);
        }, 500);
    });
}

/**
 * Show error message
 */
function showError(message) {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.querySelector('.loading-text').textContent = 'Error';
    loadingScreen.querySelector('.loading-sub').textContent = message;
    loadingScreen.querySelector('.planet-loader').style.display = 'none';
}


// ═══════════════════════════════════════════════════════
// Wonder Toast Notification System
// Cycles world wonders one-by-one as beautiful toasts
// ═══════════════════════════════════════════════════════

const WONDER_PLACES = [
    { icon: '🗼', name: 'Eiffel Tower',       detail: 'Paris, France',               lat: 48.8584,  lon: 2.2945,    label: '🌍 World Wonder' },
    { icon: '🕌', name: 'Taj Mahal',           detail: 'Agra, India',                 lat: 27.1751,  lon: 78.0421,   label: '🌍 World Wonder' },
    { icon: '🏯', name: 'Great Wall of China', detail: 'Beijing, China',              lat: 40.4319,  lon: 116.5704,  label: '🌍 World Wonder' },
    { icon: '✝️', name: 'Christ the Redeemer', detail: 'Rio de Janeiro, Brazil',      lat: -22.9519, lon: -43.2105,  label: '🌍 World Wonder' },
    { icon: '🏟️', name: 'Colosseum',           detail: 'Rome, Italy',                 lat: 41.8902,  lon: 12.4922,   label: '🏛️ Ancient Marvel' },
    { icon: '🏛️', name: 'Machu Picchu',        detail: 'Cusco, Peru',                 lat: -13.1631, lon: -72.5450,  label: '🏛️ Ancient Marvel' },
    { icon: '🔺', name: 'Pyramids of Giza',    detail: 'Cairo, Egypt',                lat: 29.9792,  lon: 31.1342,   label: '🏛️ Ancient Marvel' },
    { icon: '🪨', name: 'Stonehenge',          detail: 'Wiltshire, UK',               lat: 51.1789,  lon: -1.8262,   label: '🔮 Mystical Place' },
    { icon: '🏛️', name: 'Angkor Wat',          detail: 'Cambodia',                    lat: 13.4125,  lon: 103.8670,  label: '🌿 Hidden Gem' },
    { icon: '🗻', name: 'Mount Fuji',          detail: 'Japan',                       lat: 35.3606,  lon: 138.7274,  label: '🏔️ Natural Wonder' },
    { icon: '🌊', name: 'Niagara Falls',       detail: 'Ontario, Canada',             lat: 43.0896,  lon: -79.0849,  label: '🏔️ Natural Wonder' },
    { icon: '🏜️', name: 'Grand Canyon',        detail: 'Arizona, USA',                lat: 36.1069,  lon: -112.1129, label: '🏔️ Natural Wonder' },
    { icon: '🏔️', name: 'Mount Everest',       detail: 'Nepal / China',               lat: 27.9881,  lon: 86.9250,   label: '🏔️ Natural Wonder' },
    { icon: '🪸', name: 'Great Barrier Reef',  detail: 'Australia',                   lat: -18.2871, lon: 147.6992,  label: '🌊 Ocean Wonder' },
    { icon: '🏝️', name: 'Santorini',           detail: 'Greece',                      lat: 36.3932,  lon: 25.4615,   label: '🌅 Dream Destination' },
    { icon: '🏗️', name: 'Burj Khalifa',        detail: 'Dubai, UAE',                  lat: 25.1972,  lon: 55.2744,   label: '🏙️ Modern Marvel' },
    { icon: '🎭', name: 'Sydney Opera House',  detail: 'Sydney, Australia',           lat: -33.8568, lon: 151.2153,  label: '🎨 Iconic Structure' },
    { icon: '🕰️', name: 'Big Ben',             detail: 'London, UK',                  lat: 51.5007,  lon: -0.1246,   label: '🏙️ City Icon' },
    { icon: '🏛️', name: 'Chichen Itza',        detail: 'Mexico',                      lat: 20.6843,  lon: -88.5678,  label: '🏛️ Ancient Marvel' },
    { icon: '🏰', name: 'Forbidden City',      detail: 'Beijing, China',              lat: 39.9163,  lon: 116.3972,  label: '🏛️ Heritage Site' },
];

let _wonderIdx    = 0;
let _wonderTimer  = null;
let _wonderPaused = false;
let _wonderResumeTimer = null;
const WONDER_DISPLAY_MS = 5500;   // how long each toast stays visible
const WONDER_GAP_MS     = 3800;   // gap between toasts

function startWonderToastCycle() {
    const container = document.getElementById('wonder-toast-container');
    if (!container) return;

    // Pause on globe interaction, resume after 15s idle
    const globe = document.getElementById('cesiumContainer');
    const pauseAndResume = () => {
        _wonderPaused = true;
        clearTimeout(_wonderTimer);
        clearTimeout(_wonderResumeTimer);
        // Manual map interaction: resume after 15s idle
        _wonderResumeTimer = setTimeout(() => {
            _wonderPaused = false;
            scheduleNext(WONDER_GAP_MS);
        }, 15000);
    };
    globe.addEventListener('mousedown', pauseAndResume);
    globe.addEventListener('touchstart', pauseAndResume, { passive: true });

    showWonderToast();
}

function showWonderToast() {
    if (_wonderPaused) return;
    const container = document.getElementById('wonder-toast-container');
    if (!container) return;

    // ★ FIX: Prevent stacking — remove any existing toast before creating a new one
    const existing = container.querySelector('.wonder-toast');
    if (existing) {
        existing.remove();
    }
    clearTimeout(_wonderTimer);

    const w = WONDER_PLACES[_wonderIdx];
    _wonderIdx = (_wonderIdx + 1) % WONDER_PLACES.length;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'wonder-toast';
    toast.innerHTML = `
        <div class="wonder-toast-icon">${w.icon}</div>
        <div class="wonder-toast-body">
            <div class="wonder-toast-label">${w.label}</div>
            <div class="wonder-toast-name">${w.name}</div>
            <div class="wonder-toast-detail">${w.detail}</div>
        </div>
        <div class="wonder-toast-action">Explore →</div>
        <div class="wonder-toast-progress"></div>
        <button class="wonder-toast-dismiss" title="Dismiss">✕</button>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('visible'));
    });

    // Progress bar animation
    const bar = toast.querySelector('.wonder-toast-progress');
    bar.style.transition = `transform ${WONDER_DISPLAY_MS}ms linear`;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => { bar.style.transform = 'scaleX(0)'; });
    });

    // Fly to on click — resume next wonder quickly after exploring
    toast.addEventListener('click', (e) => {
        if (e.target.closest('.wonder-toast-dismiss')) return;
        dismissToast(toast);
        flyToLocation(w.lat, w.lon, w.name);
        _wonderPaused = true;
        clearTimeout(_wonderTimer);
        clearTimeout(_wonderResumeTimer);
        // Resume after 8s — just long enough to enjoy the flyTo animation
        _wonderResumeTimer = setTimeout(() => {
            _wonderPaused = false;
            scheduleNext(WONDER_GAP_MS);
        }, 8000);
    });

    // Dismiss button
    toast.querySelector('.wonder-toast-dismiss').addEventListener('click', (e) => {
        e.stopPropagation();
        dismissToast(toast);
        scheduleNext(WONDER_GAP_MS);
    });

    // Auto-dismiss after display time
    _wonderTimer = setTimeout(() => {
        dismissToast(toast);
        scheduleNext(WONDER_GAP_MS);
    }, WONDER_DISPLAY_MS);
}

function dismissToast(toast) {
    clearTimeout(_wonderTimer);
    toast.classList.add('dismissing');
    setTimeout(() => toast.remove(), 350);
}

function scheduleNext(delay) {
    clearTimeout(_wonderTimer);
    if (!_wonderPaused) {
        _wonderTimer = setTimeout(showWonderToast, delay);
    }
}

