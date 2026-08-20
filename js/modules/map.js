/**
 * map.js
 * Leaflet map setup, radius circle (with the elastic CSS transition
 * applied to its underlying SVG path), and marker <-> card sync.
 */

let mapInstance = null;
let radiusCircle = null;
let markerLayer = null;
const markerRefs = new Map(); // place.id -> Leaflet marker

export function initMap(elementId, center = { lat: 28.6139, lon: 77.209 }) {
  mapInstance = L.map(elementId, { zoomControl: false }).setView([center.lat, center.lon], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(mapInstance);

  L.control.zoom({ position: "bottomright" }).addTo(mapInstance);

  radiusCircle = L.circle([center.lat, center.lon], {
    radius: 1000,
    color: "#D9642C",
    weight: 2,
    fillColor: "#D9642C",
    fillOpacity: 0.08,
  }).addTo(mapInstance);

  // Apply the elastic transition to the circle's underlying SVG path
  // once it's rendered, so radius changes animate smoothly.
  const path = radiusCircle.getElement?.() || radiusCircle._path;
  if (path) {
    path.style.transition = "r 300ms cubic-bezier(0.34, 1.56, 0.64, 1)";
  }

  markerLayer = L.layerGroup().addTo(mapInstance);

  return mapInstance;
}

export function setCenter(lat, lon) {
  mapInstance?.setView([lat, lon], mapInstance.getZoom());
  radiusCircle?.setLatLng([lat, lon]);
}

export function setRadius(meters) {
  radiusCircle?.setRadius(meters);
}

/** Zooms/pans the map so the full radius circle is visible — called after the
 *  radius slider settles (debounced), not on every drag tick, to avoid jank. */
export function fitToRadius(paddingPx = 40) {
  if (!mapInstance || !radiusCircle) return;
  mapInstance.fitBounds(radiusCircle.getBounds(), { padding: [paddingPx, paddingPx], animate: true });
}

/** Renders markers for a list of places, replacing any previous set */
export function renderMarkers(places, { onMarkerClick, icons } = {}) {
  markerLayer.clearLayers();
  markerRefs.clear();

  places.forEach((place) => {
    const icon = L.divIcon({
      className: "place-marker",
      html: `<div class="place-marker__pin">${icons?.[place.category] || "📍"}</div>`,
      iconSize: [32, 32],
    });

    const marker = L.marker([place.lat, place.lon], { icon }).addTo(markerLayer);
    if (onMarkerClick) {
      marker.on("click", () => onMarkerClick(place));
    }
    markerRefs.set(place.id, marker);
  });
}

/** Pops a marker's icon (marker-pop animation) and pans to it — called when its card is hovered/clicked */
export function highlightMarker(placeId) {
  const marker = markerRefs.get(placeId);
  if (!marker) return;

  const el = marker.getElement();
  if (el) {
    el.classList.remove("marker-pop");
    void el.offsetWidth; // restart animation
    el.classList.add("marker-pop");
  }
  mapInstance?.panTo(marker.getLatLng(), { animate: true });
}

export function getMap() {
  return mapInstance;
}
