import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
export default function MapView({
  center,
  places = [],
  selected,
  onSelect,
  route,
  endpoints = [],
  searchRadius,
  onCenterPick,
}) {
  const node = useRef(null),
    map = useRef(null),
    layer = useRef(null);
  const pickRef = useRef(onCenterPick);
  pickRef.current = onCenterPick;
  const safeLabel = (value) => {
    const node = document.createElement("span");
    node.textContent = value;
    return node;
  };
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    map.current = L.map(node.current).setView([center.lat, center.lon], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    })
      .on("tileerror", () => setTileError(true))
      .addTo(map.current);
    map.current.on("click", (e) =>
      pickRef.current?.({ lat: e.latlng.lat, lon: e.latlng.lng }),
    );
    layer.current = L.layerGroup().addTo(map.current);
    const observer = new ResizeObserver(() => map.current?.invalidateSize());
    observer.observe(node.current);
    return () => {
      observer.disconnect();
      map.current.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const m = map.current,
      g = layer.current;
    if (!m) return;
    g.clearLayers();
    let radiusCircle;
    if (searchRadius)
      radiusCircle = L.circle([center.lat, center.lon], {
        radius: searchRadius,
        color: "#407b72",
        weight: 1,
        fillOpacity: 0.025,
        dashArray: "5 5",
        interactive: false,
      }).addTo(g);
    if (Number.isFinite(center.accuracy) && center.accuracy > 0)
      L.circle([center.lat, center.lon], {
        radius: center.accuracy,
        color: "#aa6a35",
        weight: 1,
        fillOpacity: 0.08,
        interactive: false,
      }).addTo(g);
    L.circleMarker([center.lat, center.lon], {
      radius: 8,
      color: "#fff",
      weight: 3,
      fillColor: "#1f7774",
      fillOpacity: 1,
    })
      .addTo(g)
      .bindTooltip(safeLabel(center.label || "Search center"));
    places.forEach((p, i) => {
      const marker = L.marker([p.lat, p.lon], {
        title: p.name,
        alt: p.name,
        icon: L.divIcon({
          className: "place-pin",
          html: `<span${selected === p.id ? ' class="selected"' : ""}>${i + 1}</span>`,
          iconSize: [30, 36],
          iconAnchor: [15, 36],
        }),
      }).addTo(g);
      const text = document.createElement("strong");
      text.textContent = p.name;
      marker.bindPopup(text);
      marker.getElement()?.setAttribute("aria-label", p.name);
      marker.on("click", () => onSelect?.(p.id));
      marker.on("keypress", (e) => {
        if (e.originalEvent?.key === "Enter" || e.originalEvent?.keyCode === 13)
          onSelect?.(p.id);
      });
      if (p.id === selected) marker.openPopup();
    });
    endpoints.forEach((p, i) =>
      L.circleMarker([p.lat, p.lon], {
        radius: 9,
        color: i ? "#b64e29" : "#1f7774",
      })
        .addTo(g)
        .bindTooltip(
          safeLabel(
            `${endpoints.length === 1 ? "Selected location" : i === 0 ? "Origin" : i === endpoints.length - 1 ? "Destination" : `Stop ${i}`}: ${p.label || p.name}`,
          ),
          {
            permanent: true,
          },
        ),
    );
    if (route?.points) {
      L.polyline(route.points, { color: "#c65930", weight: 5 }).addTo(g);
      m.fitBounds(route.points, { padding: [35, 35] });
    } else if (selected && places.find((p) => p.id === selected)) {
      const p = places.find((p) => p.id === selected);
      m.setView([p.lat, p.lon], 15);
    } else if (endpoints.length > 1)
      m.fitBounds(
        endpoints.map((p) => [p.lat, p.lon]),
        { padding: [50, 50] },
      );
    else if (radiusCircle)
      m.fitBounds(radiusCircle.getBounds(), { padding: [18, 18], maxZoom: 16 });
    else m.setView([center.lat, center.lon], 13);
  }, [center, places, selected, route, endpoints, searchRadius]);
  return (
    <div className="map-wrap">
      <div
        className="leaflet-map"
        ref={node}
        aria-label="Interactive OpenStreetMap map"
      />
      {tileError && (
        <div className="map-warning" role="status">
          Some map tiles could not load. Place lists and search remain
          available.
        </div>
      )}
      <span className="map-caption">OPENSTREETMAP · COMMUNITY-MAPPED</span>
    </div>
  );
}
