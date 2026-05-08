export const ISS_BASE_API = "https://api.wheretheiss.at/v1/satellites/25544";
export const ASTROS_API = "http://api.open-notify.org/astros.json";
const ASTROS_PROXY = `https://api.allorigins.win/raw?url=${encodeURIComponent(ASTROS_API)}`;

export function calculateSpeed(pos1, pos2, timeDiffSeconds) {
  if (!pos1 || !pos2 || timeDiffSeconds <= 0) return 0;

  const R = 6371;
  const toRad = (deg) => deg * (Math.PI / 180);
  const dLat = toRad(pos2.lat - pos1.lat);
  const dLon = toRad(pos2.lng - pos1.lng);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(pos1.lat)) * Math.cos(toRad(pos2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return (distance / timeDiffSeconds) * 3600;
}

export function formatCoordinate(value, positiveLabel, negativeLabel) {
  const label = value >= 0 ? positiveLabel : negativeLabel;
  return `${Math.abs(value).toFixed(4)}° ${label}`;
}

export async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchAstronauts() {
  const data = await fetchJson(ASTROS_PROXY);

  return {
    number: Number(data.number) || 0,
    people: Array.isArray(data.people) ? data.people : [],
  };
}

export async function getNearestPlace(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=4&addressdetails=1`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Geocoder status ${response.status}`);
    }

    const data = await response.json();
    const address = data.address || {};
    const placeName = address.city || address.town || address.village || address.state || address.country;

    if (placeName) {
      return placeName;
    }

    if (address.ocean || address.sea) {
      return address.ocean || address.sea;
    }

    return data.display_name || "Over open water";
  } catch (error) {
    console.error("Geocoding error:", error);
    return "Location unavailable";
  }
}
