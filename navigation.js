/**
 * Click2Xplore — Navigation System v4
 * Algorithm: OpenRouteService (primary) with OSRM fallback
 * Features: waypoints, pick-on-map, real-time tracking, elevation (ORS),
 *           avoid options (driving). Modes: car, bike, walk only (real routing).
 * UX: Google Maps-style — non-blocking, smooth, mobile-first bottom-sheet
 *
 * ORS API Key: https://openrouteservice.org/dev/#/signup (free: 2000 req/day)
 */

class NavigationSystem {
    constructor(viewer) {
        this.viewer = viewer;
        this.routeEntities = [];
        this.poiEntities = [];
        this.navPanel = null;
        this.currentRoutes = [];
        this.selectedRouteIdx = 0;
        this.isNavigating = false;
        this.isPickingOnMap = false;
        this.pickTarget = null;
        this.watchId = null;
        this.userLat = null;
        this.userLon = null;
        this.destLat = null;
        this.destLon = null;
        this.destName = '';
        this.startLat = null;
        this.startLon = null;
        this.startName = 'My Location';
        this.selectedMode = 'driving';
        this.navTracker = null;
        this.waypoints = [];
        this.pickOverlay = null;
        this._panelExpanded = false;
        // ── ORS Configuration ─────────────────────────────────────────────
        // Replace 'YOUR_FREE_ORS_KEY' with your key from:
        // https://openrouteservice.org/dev/#/signup  (free: 2000 req/day, 40 req/min)
        this.ORS_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjJmYjIxZTIzYTQ4OTRkY2Y5ZDVmYjQ5MmU3YmRjZjM0IiwiaCI6Im11cm11cjY0In0=';
        this.ORS_BASE = 'https://api.openrouteservice.org/v2/directions';
        // ─────────────────────────────────────────────────────────────────

        this.profiles = {
            driving: { label: '🚗 Car', ors: 'driving-car', speed: 40, color: '#4285F4', alternatives: true },
            cycling: { label: '🚲 Bike', ors: 'cycling-regular', speed: 15, color: '#34A853', alternatives: false },
            walking: { label: '🚶 Walk', ors: 'foot-walking', speed: 5, color: '#FF6B35', alternatives: false },
        };
        this.init();
    }

    init() {
        this.createNavPanel();
        this.createPickOverlay();
        this.getUserLocation();
        this.setupMapPick();
    }

    getUserLocation() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    this.userLat = pos.coords.latitude;
                    this.userLon = pos.coords.longitude;
                    this.startLat = this.userLat;
                    this.startLon = this.userLon;
                },
                () => {
                    this.userLat = 19.076; this.userLon = 72.8777;
                    this.startLat = this.userLat; this.startLon = this.userLon;
                },
                { enableHighAccuracy: true }
            );
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Pick-on-map overlay (minimal — just a banner at top)
    // ═══════════════════════════════════════════════════════════
    createPickOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'pick-overlay';
        overlay.className = 'pick-overlay';
        overlay.innerHTML = `
            <div class="pick-banner">
                <span>📍 Tap map to set location</span>
                <button id="cancel-pick" class="cancel-pick-btn">✕ Cancel</button>
            </div>
        `;
        overlay.style.display = 'none';
        document.querySelector('.app-container').appendChild(overlay);
        this.pickOverlay = overlay;
        overlay.querySelector('#cancel-pick').addEventListener('click', () => this.cancelPick());
    }

    // ═══════════════════════════════════════════════════════════
    // Nav Panel — Google Maps style
    // ═══════════════════════════════════════════════════════════
    createNavPanel() {
        const panel = document.createElement('div');
        panel.id = 'nav-panel';
        panel.className = 'nav-panel glass-effect';
        panel.innerHTML = `
            <!-- COLLAPSED STATE: Just shows route summary + drag handle -->
            <div class="nav-drag-handle" id="nav-drag-handle">
                <div class="drag-pill"></div>
            </div>

            <!-- HEADER: always visible -->
            <div class="nav-header">
                <div class="nav-header-left">
                    <span class="nav-icon-pin">🧭</span>
                    <span class="nav-title-text">Navigation</span>
                </div>
                <div class="nav-header-right">
                    <button class="nav-collapse-btn" id="nav-toggle" title="Expand/Collapse">
                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                            <path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                    <button class="close-btn nav-close" id="close-nav" title="Close">✕</button>
                </div>
            </div>

            <!-- COLLAPSED: Route quick-view (only when route is calculated) -->
            <div class="nav-collapsed-summary" id="nav-collapsed-summary" style="display:none">
                <div class="collapsed-meta" id="collapsed-meta"></div>
                <button class="start-nav-btn-mini" id="start-nav-mini-btn" style="display:none">▶ Go</button>
            </div>

            <!-- EXPANDED BODY -->
            <div class="nav-body" id="nav-body">
                <!-- Endpoints -->
                <div class="nav-endpoints" id="nav-endpoints">
                    <div class="nav-point-row">
                        <div class="nav-point-indicator">
                            <div class="point-dot start-dot"></div>
                            <div class="point-line"></div>
                        </div>
                        <div class="nav-point-inputs">
                            <div class="nav-input-group">
                                <input type="text" id="nav-from" class="nav-input" placeholder="Your location" value="My Location" readonly>
                                <button class="pick-map-btn" data-pick="start" title="Pick on map">📌</button>
                            </div>
                            <div id="waypoints-container"></div>
                            <div class="nav-input-group">
                                <input type="text" id="nav-to" class="nav-input" placeholder="Choose destination" readonly>
                                <button class="pick-map-btn" data-pick="end" title="Pick on map">📌</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Add stop -->
                <div class="nav-add-row">
                    <button id="add-waypoint-btn" class="add-waypoint-btn">
                        <span>+</span> Add Stop
                    </button>
                </div>

                <!-- Transport modes -->
                <div class="nav-modes" id="nav-modes">
                    <button class="mode-btn active" data-mode="driving">🚗<span>Car</span></button>
                    <button class="mode-btn" data-mode="cycling">🚲<span>Bike</span></button>
                    <button class="mode-btn" data-mode="walking">🚶<span>Walk</span></button>
                </div>

                <!-- Avoid options (shown for driving/cycling) -->
                <div class="nav-avoid-row" id="nav-avoid-row" style="display:none">
                    <span class="avoid-label">Avoid:</span>
                    <label class="avoid-chip"><input type="checkbox" id="avoid-tolls"> Tolls</label>
                    <label class="avoid-chip"><input type="checkbox" id="avoid-highways"> Highways</label>
                    <label class="avoid-chip"><input type="checkbox" id="avoid-ferries"> Ferries</label>
                </div>

                <!-- Route calculation status -->
                <div id="nav-route-info" class="nav-route-info"></div>

                <!-- Route alternatives -->
                <div id="nav-routes-list" class="nav-routes-list"></div>

                <!-- Turn-by-turn (collapsible) -->
                <div id="nav-steps" class="nav-steps"></div>

                <!-- Along-route POIs -->
                <div id="nav-pois" class="nav-pois"></div>

                <!-- Action buttons -->
                <div class="nav-actions">
                    <button id="start-nav-btn" class="start-nav-btn" style="display:none">▶ Start Navigation</button>
                    <button id="stop-nav-btn" class="stop-nav-btn" style="display:none">⬛ Stop</button>
                </div>
            </div>
        `;

        document.querySelector('.app-container').appendChild(panel);
        this.navPanel = panel;

        this._bindPanelEvents();
    }

    _bindPanelEvents() {
        const panel = this.navPanel;

        // Close
        panel.querySelector('#close-nav').addEventListener('click', () => this.hide());

        // Toggle expand/collapse
        panel.querySelector('#nav-toggle').addEventListener('click', () => this._toggleExpand());
        panel.querySelector('#nav-drag-handle').addEventListener('click', () => this._toggleExpand());

        // Mode buttons
        panel.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                panel.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedMode = btn.dataset.mode;
                // Show avoid options only for driving / cycling
                const avoidRow = panel.querySelector('#nav-avoid-row');
                avoidRow.style.display = ['driving', 'cycling'].includes(btn.dataset.mode) ? 'flex' : 'none';
                if (this.destLat) this.fetchRoute();
            });
        });

        // Recalculate route when avoid options change
        ['avoid-tolls', 'avoid-highways', 'avoid-ferries'].forEach(id => {
            panel.querySelector(`#${id}`)?.addEventListener('change', () => {
                if (this.destLat) this.fetchRoute();
            });
        });

        // Pick-on-map buttons
        panel.querySelectorAll('.pick-map-btn').forEach(btn => {
            btn.addEventListener('click', () => this.startPick(btn.dataset.pick));
        });

        // Add waypoint
        panel.querySelector('#add-waypoint-btn').addEventListener('click', () => this.addWaypoint());

        // Start/Stop navigation
        panel.querySelector('#start-nav-btn').addEventListener('click', () => this.startLiveNavigation());
        panel.querySelector('#stop-nav-btn').addEventListener('click', () => this.stopLiveNavigation());
        panel.querySelector('#start-nav-mini-btn').addEventListener('click', () => this.startLiveNavigation());

        // Stop propagation so panel clicks don't bubble to globe
        panel.addEventListener('mousedown', e => e.stopPropagation());
        panel.addEventListener('touchstart', e => e.stopPropagation(), { passive: false });
        panel.addEventListener('wheel', e => e.stopPropagation());
    }

    _toggleExpand() {
        this._panelExpanded = !this._panelExpanded;
        const body = this.navPanel.querySelector('#nav-body');
        const toggleBtn = this.navPanel.querySelector('#nav-toggle');
        const collapsedBar = this.navPanel.querySelector('#nav-collapsed-summary');

        if (this._panelExpanded) {
            body.classList.add('expanded');
            this.navPanel.classList.add('panel-expanded');
            toggleBtn.style.transform = 'rotate(180deg)';
            collapsedBar.style.display = 'none';
        } else {
            body.classList.remove('expanded');
            this.navPanel.classList.remove('panel-expanded');
            toggleBtn.style.transform = '';
            // Show summary bar only if route exists
            if (this.currentRoutes.length > 0) {
                collapsedBar.style.display = 'flex';
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Waypoints
    // ═══════════════════════════════════════════════════════════
    addWaypoint(name = '', lat = null, lon = null) {
        const idx = this.waypoints.length;
        this.waypoints.push({ name: name || `Stop ${idx + 1}`, lat, lon });
        this.renderWaypoints();
    }

    removeWaypoint(idx) {
        this.waypoints.splice(idx, 1);
        this.renderWaypoints();
        if (this.destLat) this.fetchRoute();
    }

    renderWaypoints() {
        const container = this.navPanel.querySelector('#waypoints-container');
        container.innerHTML = '';
        this.waypoints.forEach((wp, i) => {
            const div = document.createElement('div');
            div.className = 'nav-input-group waypoint-group';
            div.innerHTML = `
                <span class="waypoint-num">${i + 1}</span>
                <input type="text" class="nav-input" value="${wp.name}" readonly>
                <button class="pick-map-btn" data-pick="waypoint-${i}" title="Pick on map">📌</button>
                <button class="remove-wp-btn" title="Remove">✕</button>
            `;
            div.querySelector('.pick-map-btn').addEventListener('click', () => this.startPick(`waypoint-${i}`));
            div.querySelector('.remove-wp-btn').addEventListener('click', () => this.removeWaypoint(i));
            container.appendChild(div);
        });
    }

    // ═══════════════════════════════════════════════════════════
    // Pick-on-map
    // ═══════════════════════════════════════════════════════════
    setupMapPick() {
        const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        handler.setInputAction((click) => {
            if (!this.isPickingOnMap) return;
            const cartesian = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
            if (!cartesian) return;
            const carto = Cesium.Cartographic.fromCartesian(cartesian);
            this.handlePickResult(
                Cesium.Math.toDegrees(carto.latitude),
                Cesium.Math.toDegrees(carto.longitude)
            );
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    startPick(target) {
        this.isPickingOnMap = true;
        this.pickTarget = target;
        this.pickOverlay.style.display = 'flex';
        this.viewer.canvas.style.cursor = 'crosshair';
        // Collapse panel so map is visible
        if (this._panelExpanded) this._toggleExpand();
    }

    cancelPick() {
        this.isPickingOnMap = false;
        this.pickTarget = null;
        this.pickOverlay.style.display = 'none';
        this.viewer.canvas.style.cursor = '';
    }

    async handlePickResult(lat, lon) {
        this.cancelPick();
        // Re-expand panel after picking
        if (!this._panelExpanded) this._toggleExpand();

        let name = `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`);
            const data = await res.json();
            if (data.display_name) {
                name = data.display_name.split(',').slice(0, 2).join(',').trim();
            }
        } catch (e) { /* use coords */ }

        if (this.pickTarget === 'start') {
            this.startLat = lat; this.startLon = lon; this.startName = name;
            this.navPanel.querySelector('#nav-from').value = name;
        } else if (this.pickTarget === 'end') {
            this.destLat = lat; this.destLon = lon; this.destName = name;
            this.navPanel.querySelector('#nav-to').value = name;
        } else if (this.pickTarget?.startsWith('waypoint-')) {
            const idx = parseInt(this.pickTarget.split('-')[1]);
            if (this.waypoints[idx]) {
                this.waypoints[idx] = { lat, lon, name };
                this.renderWaypoints();
            }
        }

        if (this.startLat && this.destLat) this.fetchRoute();
    }

    // ═══════════════════════════════════════════════════════════
    // Show / Hide
    // ═══════════════════════════════════════════════════════════
    async show(destLat, destLon, destName) {
        this.destLat = destLat;
        this.destLon = destLon;
        this.destName = destName;

        this.navPanel.querySelector('#nav-to').value = destName;
        this.navPanel.classList.add('visible');
        this._panelExpanded = false;
        this._toggleExpand(); // open expanded

        // Get fresh user location
        if ('geolocation' in navigator) {
            try {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
                });
                this.userLat = pos.coords.latitude;
                this.userLon = pos.coords.longitude;
                this.startLat = this.userLat;
                this.startLon = this.userLon;
            } catch (e) {
                if (!this.startLat) { this.startLat = this.userLat; this.startLon = this.userLon; }
            }
        }

        this.navPanel.querySelector('#nav-from').value = this.startName;
        this.fetchRoute();
    }

    hide() {
        this.navPanel.classList.remove('visible');
        this.navPanel.classList.remove('panel-expanded');
        const body = this.navPanel.querySelector('#nav-body');
        body.classList.remove('expanded');
        this._panelExpanded = false;
        this.clearRoute();
        this.stopLiveNavigation();
        this.cancelPick();
        // Restore globe controls
        if (typeof hideCleanMapLayer === 'function') hideCleanMapLayer();
    }

    // ═══════════════════════════════════════════════════════════
    // Route Fetching — OpenRouteService primary, OSRM fallback
    // ═══════════════════════════════════════════════════════════
    async fetchRoute() {
        const info = this.navPanel.querySelector('#nav-route-info');
        const steps = this.navPanel.querySelector('#nav-steps');
        const pois = this.navPanel.querySelector('#nav-pois');
        const routesList = this.navPanel.querySelector('#nav-routes-list');

        info.innerHTML = '<div class="nav-loading"><div class="spinner"></div> Calculating routes…</div>';
        steps.innerHTML = '';
        pois.innerHTML = '';
        routesList.innerHTML = '';

        // Remove any stale elevation chart
        this.navPanel.querySelector('#elevation-chart')?.remove();

        if (!this.startLat || !this.destLat) {
            info.innerHTML = '<p class="route-note">Set both start and destination to calculate route.</p>';
            return;
        }

        const straightDist = this.haversine(this.startLat, this.startLon, this.destLat, this.destLon);
        this.updateModeAvailability(straightDist);

        const profile = this.profiles[this.selectedMode];
        if (!profile) {
            this.selectedMode = 'driving';
            return this.fetchRoute();
        }

        // If ORS key is still the placeholder, skip straight to OSRM fallback
        if (this.ORS_KEY === 'YOUR_FREE_ORS_KEY') {
            await this.fetchRouteOSRMFallback(profile);
            return;
        }

        try {
            // Build coordinates [[lon,lat], ...]
            const coordinates = [[this.startLon, this.startLat]];
            this.waypoints.forEach(wp => { if (wp.lat && wp.lon) coordinates.push([wp.lon, wp.lat]); });
            coordinates.push([this.destLon, this.destLat]);

            const body = {
                coordinates,
                elevation: true,
                instructions: true,
                instructions_format: 'text',
                language: 'en',
                units: 'km'
            };

            // Only driving asks for alternate paths — bike/walk use a single best path so
            // the line on the map always matches the selected mode (no extra “ghost” routes).
            if (profile.alternatives) {
                body.alternative_routes = { target_count: 1, weight_factor: 1.45 };
            }

            // Build avoid_features from checkboxes
            const avoidFeatures = [];
            if (this.navPanel.querySelector('#avoid-tolls')?.checked) avoidFeatures.push('tollways');
            if (this.navPanel.querySelector('#avoid-highways')?.checked) avoidFeatures.push('highways');
            if (this.navPanel.querySelector('#avoid-ferries')?.checked) avoidFeatures.push('ferries');
            if (avoidFeatures.length > 0) {
                body.options = body.options || {};
                body.options.avoid_features = avoidFeatures;
            }

            const response = await fetch(`${this.ORS_BASE}/${profile.ors}/geojson`, {
                method: 'POST',
                headers: {
                    'Authorization': this.ORS_KEY,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, application/geo+json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('ORS error:', errText);
                await this.fetchRouteOSRMFallback(profile);
                return;
            }

            const geojson = await response.json();
            let features = geojson.features || [];

            if (!features.length) {
                info.innerHTML = '<p class="route-error">❌ No route found. Try a different mode.</p>';
                return;
            }

            // Bike/walk: use one route only (ORS may still return extras in edge cases).
            if (!profile.alternatives) {
                features = features.slice(0, 1);
            }

            // Convert ORS GeoJSON features to internal route objects
            this.currentRoutes = features.map(f => ({
                distance: f.properties.summary.distance * 1000, // ORS returns km, convert to m
                duration: f.properties.summary.duration,
                geometry: f.geometry,
                legs: [{
                    steps: (f.properties.segments?.[0]?.steps || []).map(s => ({
                        name: s.name || '',
                        distance: s.distance * 1000,
                        duration: s.duration,
                        maneuver: {
                            type: this._orsInstructionType(s.type),
                            modifier: s.instruction || ''
                        }
                    }))
                }],
                // ORS-specific extras
                ascent: f.properties.ascent,
                descent: f.properties.descent,
                warnings: f.properties.warnings || []
            }));

            this.selectedRouteIdx = 0;

            this.renderRouteOptions(this.currentRoutes, profile);
            this.showRouteDetails(0, profile);
            this.drawAllRoutes(this.currentRoutes, profile);

            this.navPanel.querySelector('#start-nav-btn').style.display = 'block';
            this._updateCollapsedSummary(this.currentRoutes[0], profile);

            // Elevation profile (only when 3D coordinates are available)
            if (features[0].geometry.coordinates[0]?.length === 3) {
                this.renderElevationProfile(features[0].geometry.coordinates);
            }

            this.fetchAlongRoutePOIs(this.currentRoutes[0].geometry.coordinates);

        } catch (err) {
            console.error('ORS Route fetch error:', err);
            await this.fetchRouteOSRMFallback(profile);
        }
    }

    // ─── OSRM Fallback ────────────────────────────────────────────────────────────────────
    async fetchRouteOSRMFallback(profile) {
        const info = this.navPanel.querySelector('#nav-route-info');

        // Map ORS profile names back to OSRM equivalents
        const osrmMap = {
            'driving-car': 'driving',
            'cycling-regular': 'cycling',
            'foot-walking': 'foot'
        };
        const osrmProfile = osrmMap[profile.ors] || 'driving';
        const wantAlts = profile.alternatives === true;

        try {
            let coords = `${this.startLon},${this.startLat}`;
            this.waypoints.forEach(wp => { if (wp.lat && wp.lon) coords += `;${wp.lon},${wp.lat}`; });
            coords += `;${this.destLon},${this.destLat}`;

            const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${coords}` +
                `?overview=full&geometries=geojson&steps=true&alternatives=${wantAlts ? 'true' : 'false'}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.code !== 'Ok' || !data.routes.length) {
                info.innerHTML = '<p class="route-error">❌ No route found. Try a different mode.</p>';
                return;
            }

            info.innerHTML = `<p class="route-note" style="color:#F59E0B">⚠️ Using backup routing (ORS key not set).
                <a href="https://openrouteservice.org/dev/#/signup" target="_blank" style="color:#F59E0B">Get free ORS key →</a></p>`;

            let routes = data.routes;
            if (!wantAlts && routes.length > 1) {
                routes = routes.slice(0, 1);
            }
            this.currentRoutes = routes;
            this.selectedRouteIdx = 0;

            this.renderRouteOptions(routes, profile);
            this.showRouteDetails(0, profile);
            this.drawAllRoutes(routes, profile);

            this.navPanel.querySelector('#start-nav-btn').style.display = 'block';
            this._updateCollapsedSummary(routes[0], profile);
            this.fetchAlongRoutePOIs(routes[0].geometry.coordinates);

        } catch (err) {
            this.navPanel.querySelector('#nav-route-info').innerHTML =
                '<p class="route-error">❌ Route calculation failed. Check your internet connection.</p>';
        }
    }

    // ─── ORS instruction-type number → OSRM-style string ────────────────────────
    _orsInstructionType(orsType) {
        const map = {
            0: 'depart', 1: 'turn', 2: 'turn', 3: 'turn',
            4: 'turn', 5: 'merge', 6: 'fork', 7: 'roundabout',
            8: 'roundabout', 9: 'continue', 10: 'turn', 11: 'arrive',
            12: 'arrive', 13: 'continue'
        };
        return map[orsType] || 'continue';
    }

    _updateCollapsedSummary(route, profile) {
        const meta = this.navPanel.querySelector('#collapsed-meta');
        const miniBtn = this.navPanel.querySelector('#start-nav-mini-btn');
        const distKm = (route.distance / 1000).toFixed(1);
        const dur = this.formatDuration(route.duration / 60);
        meta.innerHTML = `<strong>${dur}</strong><span class="collapsed-sep">·</span>${distKm} km <span class="collapsed-mode">${profile.label}</span>`;
        miniBtn.style.display = 'block';
        this.navPanel.querySelector('#nav-collapsed-summary').style.display = 'flex';
    }

    buildCoordinateString() {
        let coords = `${this.startLon},${this.startLat}`;
        this.waypoints.forEach(wp => { if (wp.lat && wp.lon) coords += `;${wp.lon},${wp.lat}`; });
        coords += `;${this.destLon},${this.destLat}`;
        return coords;
    }

    // ═══════════════════════════════════════════════════════════
    // Route Options UI
    // ═══════════════════════════════════════════════════════════
    renderRouteOptions(routes, profile) {
        const container = this.navPanel.querySelector('#nav-routes-list');
        container.innerHTML = '';
        if (routes.length <= 1) return;

        const header = document.createElement('p');
        header.className = 'routes-header';
        header.textContent = 'Route Options';
        container.appendChild(header);

        routes.forEach((route, i) => {
            const distKm = (route.distance / 1000).toFixed(1);
            const dur = this.formatDuration(route.duration / 60);
            const card = document.createElement('div');
            card.className = `route-option-card ${i === 0 ? 'selected' : ''}`;
            card.innerHTML = `
                <div class="route-option-left">
                    <span class="route-option-badge">${i === 0 ? 'Fastest' : i === 1 ? 'Alternative' : 'Route ' + (i + 1)}</span>
                    <span class="route-option-time">${dur}</span>
                </div>
                <span class="route-option-dist">${distKm} km</span>
            `;
            card.addEventListener('click', () => {
                container.querySelectorAll('.route-option-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedRouteIdx = i;
                this.showRouteDetails(i, profile);
                this.drawAllRoutes(routes, profile);
                this._updateCollapsedSummary(routes[i], profile);
                this.fetchAlongRoutePOIs(routes[i].geometry.coordinates);
            });
            container.appendChild(card);
        });
    }

    // ─── Elevation Profile Chart ────────────────────────────────────────────────
    renderElevationProfile(coordinates) {
        const existingChart = this.navPanel.querySelector('#elevation-chart');
        if (existingChart) existingChart.remove();

        const has3D = coordinates[0]?.length === 3;
        if (!has3D) return;

        const elevations = coordinates.map(c => c[2]);
        const minElev = Math.min(...elevations);
        const maxElev = Math.max(...elevations);
        const range = maxElev - minElev || 1;

        const chartDiv = document.createElement('div');
        chartDiv.id = 'elevation-chart';
        chartDiv.className = 'elevation-chart';
        chartDiv.innerHTML = `
            <div class="elev-header">
                <span>📈 Elevation Profile</span>
                <span class="elev-range">${Math.round(minElev)}m – ${Math.round(maxElev)}m</span>
            </div>
            <svg viewBox="0 0 300 60" preserveAspectRatio="none" class="elev-svg">
                <defs>
                    <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stop-color="#4285F4" stop-opacity="0.8"/>
                        <stop offset="100%" stop-color="#4285F4" stop-opacity="0.1"/>
                    </linearGradient>
                </defs>
                <path d="${this._buildElevationPath(elevations, minElev, range, 300, 60)}"
                      fill="url(#elevGrad)" stroke="#4285F4" stroke-width="1.5"/>
            </svg>
        `;

        // Insert before nav-actions
        const actions = this.navPanel.querySelector('.nav-actions');
        if (actions) actions.parentNode.insertBefore(chartDiv, actions);
    }

    _buildElevationPath(elevations, minElev, range, width, height) {
        const step = width / (Math.max(elevations.length - 1, 1));
        const points = elevations.map((e, i) => {
            const x = i * step;
            const y = height - ((e - minElev) / range) * (height - 4) - 2;
            return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
        });
        points.push('L' + width + ',' + height + ' L0,' + height + ' Z');
        return points.join(' ');
    }

    showRouteDetails(idx, profile) {
        const route = this.currentRoutes[idx];
        const info = this.navPanel.querySelector('#nav-route-info');
        const steps = this.navPanel.querySelector('#nav-steps');
        const distKm = (route.distance / 1000).toFixed(1);

        info.innerHTML = `
            <div class="route-summary">
                <div class="route-stat primary-stat">
                    <span class="stat-value">${this.formatDuration(route.duration / 60)}</span>
                    <span class="stat-label">Travel Time</span>
                </div>
                <div class="route-stat">
                    <span class="stat-value">${distKm} km</span>
                    <span class="stat-label">Distance</span>
                </div>
                <div class="route-stat">
                    <span class="stat-value">${profile.label}</span>
                    <span class="stat-label">Mode</span>
                </div>
            </div>
        `;


        // Append ORS-specific extras (ascent/descent/warnings) if available
        if (route.ascent !== undefined) {
            const extraDiv = document.createElement('div');
            extraDiv.className = 'route-extras';
            extraDiv.innerHTML =
                '<span class="route-extra-item">⬆️ ' + Math.round(route.ascent) + 'm ascent</span>' +
                '<span class="route-extra-item">⬇️ ' + Math.round(route.descent) + 'm descent</span>';
            info.appendChild(extraDiv);
        }
        if (route.warnings && route.warnings.length > 0) {
            const warnDiv = document.createElement('div');
            warnDiv.className = 'route-warning';
            warnDiv.innerHTML = route.warnings.map(w => '⚠️ ' + (w.message || w)).join('<br>');
            info.appendChild(warnDiv);
        }
        let allSteps = [];
        route.legs.forEach((leg, legIdx) => {
            if (route.legs.length > 1) {
                const to = legIdx === route.legs.length - 1 ? this.destName : (this.waypoints[legIdx]?.name || `Stop ${legIdx + 1}`);
                allSteps.push({ type: 'leg-header', text: `To ${to}` });
            }
            leg.steps.forEach(s => allSteps.push(s));
        });

        const stepHTML = allSteps.slice(0, 20).map(s => {
            if (s.type === 'leg-header') {
                return `<div class="nav-step leg-header"><span class="step-icon">📍</span><span class="step-text">${s.text}</span></div>`;
            }
            const icon = this.getStepIcon(s.maneuver.type, s.maneuver.modifier);
            const dist = s.distance > 1000 ? (s.distance / 1000).toFixed(1) + ' km' : Math.round(s.distance) + ' m';
            return `<div class="nav-step"><span class="step-icon">${icon}</span><span class="step-text">${s.name || 'Continue'}</span><span class="step-dist">${dist}</span></div>`;
        }).join('');

        steps.innerHTML = stepHTML ? `<details class="steps-details"><summary>📋 Directions</summary>${stepHTML}</details>` : '';
    }

    // ═══════════════════════════════════════════════════════════
    // Route Drawing
    // ═══════════════════════════════════════════════════════════
    drawAllRoutes(routes, profile) {
        profile = profile || this.profiles[this.selectedMode] || this.profiles.driving;
        const modeColor = Cesium.Color.fromCssColorString(profile.color);
        this.clearRoute();

        // Alternate driving paths only (lighter, neutral)
        routes.forEach((route, i) => {
            if (i === this.selectedRouteIdx) return;
            const positions = route.geometry.coordinates.map(c => Cesium.Cartesian3.fromDegrees(c[0], c[1]));
            this.routeEntities.push(this.viewer.entities.add({
                polyline: { positions, width: 5, material: Cesium.Color.fromCssColorString('#93c5fd').withAlpha(0.5), clampToGround: true }
            }));
        });

        // Selected route — color matches mode (car blue / bike green / walk orange)
        const sel = routes[this.selectedRouteIdx];
        const positions = sel.geometry.coordinates.map(c => Cesium.Cartesian3.fromDegrees(c[0], c[1]));
        this.routeEntities.push(this.viewer.entities.add({
            polyline: { positions, width: 10, material: modeColor.withAlpha(0.28), clampToGround: true }
        }));
        this.routeEntities.push(this.viewer.entities.add({
            polyline: { positions, width: 6, material: new Cesium.PolylineGlowMaterialProperty({ glowPower: 0.22, color: modeColor }), clampToGround: true }
        }));

        // Markers
        this.routeEntities.push(this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(this.startLon, this.startLat),
            point: { pixelSize: 14, color: Cesium.Color.fromCssColorString('#34A853'), outlineColor: Cesium.Color.WHITE, outlineWidth: 3, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY },
            label: { text: 'Start', font: '12px sans-serif', fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.BLACK, outlineWidth: 2, style: Cesium.LabelStyle.FILL_AND_OUTLINE, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -18), disableDepthTestDistance: Number.POSITIVE_INFINITY }
        }));

        this.waypoints.forEach(wp => {
            if (!wp.lat) return;
            this.routeEntities.push(this.viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat),
                point: { pixelSize: 12, color: Cesium.Color.ORANGE, outlineColor: Cesium.Color.WHITE, outlineWidth: 2, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY },
                label: { text: wp.name, font: '11px sans-serif', fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.BLACK, outlineWidth: 2, style: Cesium.LabelStyle.FILL_AND_OUTLINE, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -16), disableDepthTestDistance: Number.POSITIVE_INFINITY }
            }));
        });

        this.routeEntities.push(this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(this.destLon, this.destLat),
            point: { pixelSize: 14, color: Cesium.Color.RED, outlineColor: Cesium.Color.WHITE, outlineWidth: 3, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY },
            label: { text: this.destName, font: '12px sans-serif', fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.BLACK, outlineWidth: 2, style: Cesium.LabelStyle.FILL_AND_OUTLINE, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -18), disableDepthTestDistance: Number.POSITIVE_INFINITY }
        }));

        this.flyToFitRoute(sel.geometry.coordinates);
    }

    flyToFitRoute(coordinates) {
        let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
        coordinates.forEach(c => {
            if (c[1] < minLat) minLat = c[1];
            if (c[1] > maxLat) maxLat = c[1];
            if (c[0] < minLon) minLon = c[0];
            if (c[0] > maxLon) maxLon = c[0];
        });
        const latPad = (maxLat - minLat) * 0.2 || 0.5;
        const lonPad = (maxLon - minLon) * 0.2 || 0.5;
        this.viewer.camera.flyTo({
            destination: Cesium.Rectangle.fromDegrees(minLon - lonPad, minLat - latPad, maxLon + lonPad, maxLat + latPad),
            orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
            duration: 2.0
        });
    }

    clearRoute() {
        this.routeEntities.forEach(e => this.viewer.entities.remove(e));
        this.routeEntities = [];
        this.poiEntities.forEach(e => this.viewer.entities.remove(e));
        this.poiEntities = [];
    }

    // ═══════════════════════════════════════════════════════════
    // Along-Route POIs
    // ═══════════════════════════════════════════════════════════
    async fetchAlongRoutePOIs(coordinates) {
        const pois = this.navPanel.querySelector('#nav-pois');
        pois.innerHTML = '<div class="nav-loading"><div class="spinner"></div> Finding stops…</div>';

        const samplePoints = [];
        const step = Math.max(1, Math.floor(coordinates.length / 5));
        for (let i = 0; i < coordinates.length; i += step) samplePoints.push(coordinates[i]);

        try {
            const aroundParts = samplePoints.map(c => `(around:3000,${c[1]},${c[0]})`);
            const mid = Math.floor(aroundParts.length / 2);
            const query = `[out:json][timeout:15];(
                node["amenity"="fuel"]${aroundParts[0]};
                node["amenity"="fuel"]${aroundParts[mid]};
                node["amenity"="restaurant"]${aroundParts[0]};
                node["amenity"="restaurant"]${aroundParts[mid]};
            );out body 10;`;

            const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
            const data = await response.json();

            const fuel = [], restaurants = [];
            (data.elements || []).forEach(el => {
                const name = el.tags?.name || (el.tags?.amenity === 'fuel' ? 'Fuel Station' : 'Restaurant');
                const dist = this.haversine(this.startLat, this.startLon, el.lat, el.lon);
                const entry = { name, lat: el.lat, lon: el.lon, dist };
                if (el.tags?.amenity === 'fuel') fuel.push(entry);
                else restaurants.push(entry);
            });

            fuel.sort((a, b) => a.dist - b.dist);
            restaurants.sort((a, b) => a.dist - b.dist);

            let html = '';
            if (fuel.length > 0) {
                html += '<h4>⛽ Fuel Stations</h4>';
                html += fuel.slice(0, 3).map(f => {
                    this.addPOIMarker(f.lat, f.lon, f.name, '⛽');
                    return `<div class="poi-item"><span class="poi-icon">⛽</span><span class="poi-name">${f.name}</span><span class="poi-dist">${f.dist.toFixed(1)} km</span></div>`;
                }).join('');
            }
            if (restaurants.length > 0) {
                html += '<h4>🍽️ Restaurants</h4>';
                html += restaurants.slice(0, 3).map(r => {
                    this.addPOIMarker(r.lat, r.lon, r.name, '🍽️');
                    return `<div class="poi-item"><span class="poi-icon">🍽️</span><span class="poi-name">${r.name}</span><span class="poi-dist">${r.dist.toFixed(1)} km</span></div>`;
                }).join('');
            }

            pois.innerHTML = html || '<p class="route-note">No stops found along this route.</p>';
        } catch (err) {
            pois.innerHTML = '<p class="route-note">Could not load stops.</p>';
        }
    }

    addPOIMarker(lat, lon, name, icon) {
        const entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat),
            point: { pixelSize: 8, color: Cesium.Color.YELLOW, outlineColor: Cesium.Color.BLACK, outlineWidth: 1, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY },
            label: { text: `${icon} ${name}`, font: '10px sans-serif', fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.BLACK, outlineWidth: 1, style: Cesium.LabelStyle.FILL_AND_OUTLINE, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -12), disableDepthTestDistance: Number.POSITIVE_INFINITY, scaleByDistance: new Cesium.NearFarScalar(500, 1.0, 50000, 0.3) }
        });
        this.poiEntities.push(entity);
    }

    // ═══════════════════════════════════════════════════════════
    // Live Navigation
    // ═══════════════════════════════════════════════════════════
    startLiveNavigation() {
        if (this.isNavigating) return;
        this.isNavigating = true;

        this.navPanel.querySelector('#start-nav-btn').style.display = 'none';
        this.navPanel.querySelector('#stop-nav-btn').style.display = 'block';
        this.navPanel.querySelector('#start-nav-mini-btn').style.display = 'none';

        this.enableNavView();

        // Collapse panel — give full screen to map during navigation
        if (this._panelExpanded) this._toggleExpand();

        if ('geolocation' in navigator) {
            this.watchId = navigator.geolocation.watchPosition(
                pos => this.updateLivePosition(pos.coords.latitude, pos.coords.longitude),
                err => console.warn('Nav tracking error:', err),
                { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
            );
        }

        this.navTracker = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(this.startLon, this.startLat),
            point: { pixelSize: 16, color: Cesium.Color.fromCssColorString('#4285F4'), outlineColor: Cesium.Color.WHITE, outlineWidth: 3, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY },
            label: { text: '📍 You', font: 'bold 13px sans-serif', fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.fromCssColorString('#4285F4'), outlineWidth: 2, style: Cesium.LabelStyle.FILL_AND_OUTLINE, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -20), disableDepthTestDistance: Number.POSITIVE_INFINITY }
        });

        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(this.startLon, this.startLat, 3000),
            orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
            duration: 1.5
        });
    }

    updateLivePosition(lat, lon) {
        this.userLat = lat; this.userLon = lon;
        if (this.navTracker) {
            this.navTracker.position = Cesium.Cartesian3.fromDegrees(lon, lat);
        }
        const remaining = this.haversine(lat, lon, this.destLat, this.destLon);
        const meta = this.navPanel.querySelector('#collapsed-meta');
        const speed = (this.profiles[this.selectedMode] || this.profiles.driving).speed;
        const eta = remaining / speed;
        meta.innerHTML = `<span class="live-dot"></span> ${remaining.toFixed(1)} km · ETA ${this.formatDuration(eta * 60)}`;

        if (remaining < 0.1) {
            this.stopLiveNavigation();
            alert('🎉 You have arrived at ' + this.destName + '!');
        }
    }

    stopLiveNavigation() {
        this.isNavigating = false;
        if (this.watchId) { navigator.geolocation.clearWatch(this.watchId); this.watchId = null; }
        if (this.navTracker) { this.viewer.entities.remove(this.navTracker); this.navTracker = null; }
        this.navPanel.querySelector('#start-nav-btn').style.display = 'block';
        this.navPanel.querySelector('#stop-nav-btn').style.display = 'none';
        const miniBtn = this.navPanel.querySelector('#start-nav-mini-btn');
        if (miniBtn) miniBtn.style.display = 'block';
        this.disableNavView();
    }

    enableNavView() {
        const scene = this.viewer.scene;
        scene.globe.enableLighting = false;
        scene.globe.showGroundAtmosphere = false;
        if (typeof showCleanMapLayer === 'function') showCleanMapLayer();
    }

    disableNavView() {
        if (typeof hideCleanMapLayer === 'function') hideCleanMapLayer();
    }

    // ═══════════════════════════════════════════════════════════
    // Dynamic transport mode filtering
    // ═══════════════════════════════════════════════════════════
    updateModeAvailability(distKm) {
        const rules = {
            driving: { min: 0, max: Infinity },
            cycling: { min: 0, max: 300 },
            walking: { min: 0, max: 50 },
        };
        this.navPanel.querySelectorAll('.mode-btn').forEach(btn => {
            const rule = rules[btn.dataset.mode];
            const unavailable = !rule || distKm < rule.min || distKm > rule.max;
            btn.classList.toggle('unavailable', unavailable);
            btn.disabled = unavailable;
        });
        const cur = this.navPanel.querySelector(`.mode-btn[data-mode="${this.selectedMode}"]`);
        if (cur?.classList.contains('unavailable')) {
            this.selectedMode = 'driving';
            this.navPanel.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            this.navPanel.querySelector('.mode-btn[data-mode="driving"]')?.classList.add('active');
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════
    formatDuration(minutes) {
        if (minutes < 60) return `${Math.round(minutes)} min`;
        const hrs = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    }

    haversine(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    getStepIcon(type, modifier) {
        if (type === 'depart') return '🟢';
        if (type === 'arrive') return '🔴';
        if (type === 'turn') {
            if (modifier?.includes('left')) return '⬅️';
            if (modifier?.includes('right')) return '➡️';
            return '↗️';
        }
        if (type === 'roundabout') return '🔄';
        if (type === 'merge') return '🔀';
        if (type === 'fork') return '🔱';
        if (type === 'continue') return '⬆️';
        return '➡️';
    }
}

window.NavigationSystem = NavigationSystem;
