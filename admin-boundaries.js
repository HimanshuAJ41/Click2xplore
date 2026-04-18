/**
 * Progressive administrative boundaries & labels (Natural Earth, global).
 * Visibility follows camera height: countries → states/provinces → cities.
 */

/** Natural Earth vector (GitHub master) — stable raw URLs, CORS-friendly */
const NE_GEOJSON_BASE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson';

function _neProp(entity, key) {
    const bag = entity.properties;
    if (!bag || !Cesium.defined(bag[key])) return undefined;
    const v = bag[key];
    return typeof v.getValue === 'function' ? v.getValue(Cesium.JulianDate.now()) : v;
}

const ProgressiveAdminBoundaries = {
    viewer: null,
    /** @type {Cesium.GeoJsonDataSource[]} */
    _countries: null,
    _countryLabels: null,
    _admin1: null,
    _admin1Labels: null,
    _places: null,
    _placeEntities: [],
    _loading: false,
    _loadedMask: 0,
    _moveEndBound: null,
    _lastVisibilityTier: '',
    _countryLineColor: null,
    _adminLineColor: null,

    init(viewer) {
        this.viewer = viewer;
        this._moveEndBound = () => this.updateVisibility();
        viewer.camera.moveEnd.addEventListener(this._moveEndBound);
        setTimeout(() => this._bootstrap(), 800);
    },

    async _bootstrap() {
        if (!this.viewer || this._loading) return;
        this._loading = true;
        try {
            await this._loadCountries();
            this.updateVisibility();
            await this._loadAdmin1();
            this.updateVisibility();
            await this._loadPlaces();
            this.updateVisibility();
        } catch (e) {
            console.warn('ProgressiveAdminBoundaries:', e);
        } finally {
            this._loading = false;
        }
    },

    async _fetchGeoJson(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${url}: ${res.status}`);
        return res.json();
    },

    async _loadCountries() {
        if (this._countries) return;
        const stroke = Cesium.Color.fromCssColorString('#e8f4ff').withAlpha(0.72);
        this._countryLineColor = Cesium.Color.fromCssColorString('#e8f4ff');
        this._countries = await Cesium.GeoJsonDataSource.load(
            `${NE_GEOJSON_BASE}/ne_110m_admin_0_boundary_lines_land.geojson`,
            {
                stroke,
                strokeWidth: 1.8,
                clampToGround: true
            }
        );
        this._widenPolylines(this._countries, 2);
        await this.viewer.dataSources.add(this._countries);

        const cj = await this._fetchGeoJson(`${NE_GEOJSON_BASE}/ne_10m_admin_0_label_points.geojson`);
        cj.features = (cj.features || []).filter((f) => {
            const lr = f.properties?.labelrank ?? f.properties?.LABELRANK;
            const n = typeof lr === 'number' ? lr : parseInt(lr, 10);
            return !Number.isFinite(n) || n <= 5;
        });
        this._countryLabels = await Cesium.GeoJsonDataSource.load(cj, { clampToGround: true });
        this._convertPointsToLabels(this._countryLabels, {
            font: '600 13px Outfit,sans-serif',
            minScale: 0.45,
            maxScale: 1.15,
            near: 4e5,
            far: 2.2e7
        }, (e) => _neProp(e, 'NAME') || _neProp(e, 'ADMIN') || '');
        await this.viewer.dataSources.add(this._countryLabels);
        this._loadedMask |= 1;
    },

    async _loadAdmin1() {
        if (this._admin1) return;
        const stroke = Cesium.Color.fromCssColorString('#a8d4ff').withAlpha(0.55);
        this._adminLineColor = Cesium.Color.fromCssColorString('#a8d4ff');
        this._admin1 = await Cesium.GeoJsonDataSource.load(
            `${NE_GEOJSON_BASE}/ne_50m_admin_1_states_provinces_lines.geojson`,
            {
                stroke,
                strokeWidth: 1,
                clampToGround: true
            }
        );
        this._widenPolylines(this._admin1, 1.5);
        await this.viewer.dataSources.add(this._admin1);

        const aj = await this._fetchGeoJson(`${NE_GEOJSON_BASE}/ne_10m_admin_1_label_points.geojson`);
        aj.features = (aj.features || []).filter((f) => {
            const sr = f.properties?.scalerank ?? f.properties?.SCALERANK;
            const n = typeof sr === 'number' ? sr : parseInt(sr, 10);
            return !Number.isFinite(n) || n <= 4; // lower label density for smoother zooming
        });
        this._admin1Labels = await Cesium.GeoJsonDataSource.load(aj, { clampToGround: true });
        this._convertPointsToLabels(this._admin1Labels, {
            font: '500 11px Outfit,sans-serif',
            minScale: 0.35,
            maxScale: 0.95,
            near: 8e4,
            far: 4e6
        }, (e) => _neProp(e, 'name') || _neProp(e, 'NAME') || _neProp(e, 'abbrev') || '');
        await this.viewer.dataSources.add(this._admin1Labels);
        this._loadedMask |= 2;
    },

    async _loadPlaces() {
        if (this._places) return;
        const stroke = Cesium.Color.fromCssColorString('#ffd699').withAlpha(0.5);
        this._places = await Cesium.GeoJsonDataSource.load(
            `${NE_GEOJSON_BASE}/ne_50m_populated_places.geojson`,
            {
                stroke,
                fill: Cesium.Color.TRANSPARENT,
                clampToGround: true
            }
        );
        this._placeEntities = this._places.entities.values.slice();
        for (let i = 0; i < this._placeEntities.length; i++) {
            const entity = this._placeEntities[i];
            const name = _neProp(entity, 'NAME');
            const rank = _neProp(entity, 'SCALERANK');
            const scalerank = typeof rank === 'number' ? rank : parseInt(rank, 10) || 10;
            entity.__scalerank = scalerank;
            if (scalerank > 8) entity.show = false; // hide dense low-priority places by default
            if (entity.billboard) entity.billboard = undefined;
            if (entity.point) {
                entity.point = new Cesium.PointGraphics({
                    pixelSize: 4,
                    color: Cesium.Color.fromCssColorString('#ffcc66').withAlpha(0.85),
                    outlineColor: Cesium.Color.BLACK.withAlpha(0.6),
                    outlineWidth: 1,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    scaleByDistance: new Cesium.NearFarScalar(5e3, 1, 5e5, 0.35)
                });
            }
            if (name) {
                entity.label = new Cesium.LabelGraphics({
                    text: name,
                    font: '500 10px Outfit,sans-serif',
                    fillColor: Cesium.Color.WHITE.withAlpha(0.88),
                    outlineColor: Cesium.Color.BLACK.withAlpha(0.55),
                    outlineWidth: 3,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -8),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    scaleByDistance: new Cesium.NearFarScalar(8e3, 1.0, 2.5e5, 0.35),
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 3.2e5)
                });
            }
        }
        await this.viewer.dataSources.add(this._places);
        this._loadedMask |= 4;
    },

    _stylePolygonOutlines(ds, color, width) {
        const entities = ds.entities.values;
        for (let i = 0; i < entities.length; i++) {
            const e = entities[i];
            if (e.polygon) {
                e.polygon.material = Cesium.Color.TRANSPARENT;
                e.polygon.outline = true;
                e.polygon.outlineColor = color;
                e.polygon.outlineWidth = width;
            }
        }
    },

    _widenPolylines(ds, width) {
        const entities = ds.entities.values;
        for (let i = 0; i < entities.length; i++) {
            const e = entities[i];
            if (e.polyline) {
                e.polyline.width = width;
                e.polyline.clampToGround = true;
            }
        }
    },

    _setLineOpacity(ds, baseColor, alpha) {
        if (!ds || !baseColor) return;
        const entities = ds.entities.values;
        for (let i = 0; i < entities.length; i++) {
            const e = entities[i];
            if (e.polyline) {
                e.polyline.material = baseColor.withAlpha(alpha);
            }
        }
    },

    _convertPointsToLabels(ds, style, getName) {
        const entities = ds.entities.values;
        for (let i = 0; i < entities.length; i++) {
            const e = entities[i];
            if (e.billboard) e.billboard = undefined;

            const text = (getName(e) || '').trim();
            if (!text) {
                e.show = false;
                continue;
            }

            e.point = new Cesium.PointGraphics({
                pixelSize: 0,
                color: Cesium.Color.TRANSPARENT,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            });
            e.label = new Cesium.LabelGraphics({
                text,
                font: style.font,
                fillColor: Cesium.Color.WHITE.withAlpha(0.86),
                outlineColor: Cesium.Color.BLACK.withAlpha(0.55),
                outlineWidth: 3,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                scaleByDistance: new Cesium.NearFarScalar(style.near, style.maxScale, style.far, style.minScale)
            });
        }
    },

    updateVisibility() {
        if (!this.viewer) return;
        const h = this.viewer.camera.positionCartographic.height;
        const tier =
            h > 2.4e7 ? 'global' :
            h > 1.1e7 ? 'continent' :
            h > 4.2e6 ? 'country' :
            h > 1.8e6 ? 'state' :
            h > 7e5 ? 'region' :
            h > 3.2e5 ? 'city-major' :
            h > 1.5e5 ? 'city-mid' :
            h > 7e4 ? 'city-local' : 'street';
        if (tier === this._lastVisibilityTier) return;
        this._lastVisibilityTier = tier;

        // Country outlines: visible globally but softened at very high altitude
        const showCountries = h > 8e4 && h < 4.5e7;
        if (this._countries) this._countries.show = showCountries;
        const countryAlpha =
            h > 2.4e7 ? 0.10 :
            h > 1.1e7 ? 0.20 :
            h > 4.2e6 ? 0.32 :
            h > 1.8e6 ? 0.42 : 0.55;
        this._setLineOpacity(this._countries, this._countryLineColor, countryAlpha);

        // Country names: hide at first-look globe, show on closer regional view
        const showCountryLabels = h > 1.8e6 && h < 8e6;
        if (this._countryLabels) this._countryLabels.show = showCountryLabels;

        // States / provinces: only once user starts zooming in
        const showAdmin1Lines = h > 1.4e5 && h < 2.2e6;
        if (this._admin1) this._admin1.show = showAdmin1Lines;
        const adminAlpha =
            h > 1.8e6 ? 0.12 :
            h > 7e5 ? 0.20 :
            h > 3.2e5 ? 0.28 : 0.38;
        this._setLineOpacity(this._admin1, this._adminLineColor, adminAlpha);

        const showAdmin1Labels = h > 2.2e5 && h < 1.1e6;
        if (this._admin1Labels) this._admin1Labels.show = showAdmin1Labels;

        // Cities / towns: keep startup globe clean, reveal details progressively
        if (this._places && this._placeEntities.length) {
            const showPlaces = h < 5e5;
            this._places.show = showPlaces;
            let maxRank = 10;
            if (h > 3.2e5) maxRank = 1;
            else if (h > 1.5e5) maxRank = 2;
            else if (h > 7e4) maxRank = 3;
            else if (h > 4e4) maxRank = 4;
            else maxRank = 6;

            for (let i = 0; i < this._placeEntities.length; i++) {
                const e = this._placeEntities[i];
                const r = typeof e.__scalerank === 'number' ? e.__scalerank : 10;
                e.show = showPlaces && r <= maxRank;
            }
        }

        this.viewer.scene.requestRender();
    },

    destroy() {
        if (this.viewer && this._moveEndBound) {
            this.viewer.camera.moveEnd.removeEventListener(this._moveEndBound);
        }
        this.viewer = null;
    }
};

window.ProgressiveAdminBoundaries = ProgressiveAdminBoundaries;
