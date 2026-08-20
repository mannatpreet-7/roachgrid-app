/**
 * radiusSelector.js
 * Wires the radius <input type="range"> to the map circle and
 * triggers a debounced re-fetch of nearby places.
 */
import { debounce } from "../utils/dom.js";
import { setRadius } from "./map.js";

export function initRadiusSelector({ sliderEl, valueEl, onChange }) {
  const debouncedChange = debounce((meters) => onChange(meters), 400);

  function update(meters) {
    valueEl.textContent = meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
    setRadius(meters);
    debouncedChange(meters);
  }

  sliderEl.addEventListener("input", (e) => update(Number(e.target.value)));

  // Initialize on load
  update(Number(sliderEl.value));

  return { setValue: (meters) => { sliderEl.value = meters; update(meters); } };
}
