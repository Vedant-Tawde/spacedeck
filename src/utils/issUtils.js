export function calculateSpeed(pos1, pos2, timeDiffSeconds) {
  if (!pos1 || !pos2 || timeDiffSeconds <= 0) return 0;
  
  const R = 6371; // Earth's radius in km 
  const toRad = (deg) => deg * (Math.PI / 180);
  const dLat = toRad(pos2.lat - pos1.lat);
  const dLon = toRad(pos2.lng - pos1.lng); 
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(pos1.lat)) * Math.cos(toRad(pos2.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // distance in km 
  const speedKmh = (distance / timeDiffSeconds) * 3600;
  return speedKmh;
}

const PROXY = "https://api.allorigins.win/raw?url=";

export const ISS_BASE_API = `${PROXY}${encodeURIComponent("https://api.wheretheiss.at/v1/satellites/25544")}`;
export const ASTROS_API = `${PROXY}${encodeURIComponent("https://api.open-notify.org/astros.json")}`;

export async function getNearestPlace(lat, lng) {
  try {
    const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
    const response = await fetch(`${PROXY}${encodeURIComponent(apiUrl)}`);
    const data = await response.json();
    return data.display_name || "Unknown Location (Ocean)";
  } catch (error) {
    console.error("Geocoding error:", error);
    return "Unknown Location";
  }
}
