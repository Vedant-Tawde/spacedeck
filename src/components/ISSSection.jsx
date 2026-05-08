import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { ISS_BASE_API, calculateSpeed, fetchAstronauts, fetchJson, formatCoordinate, getNearestPlace } from '../utils/issUtils';
import { Users, MapPin, Activity, Navigation, RefreshCw, AlertCircle } from 'lucide-react';

const ISS_CACHE_KEY = 'iss_last_sample';
const MIN_FETCH_GAP_MS = 15000;
const RATE_LIMIT_BACKOFF_MS = 60000;

const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const ISSSection = ({ onDataUpdate }) => {
  const [issData, setIssData] = useState(() => {
    const cached = localStorage.getItem(ISS_CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        localStorage.removeItem(ISS_CACHE_KEY);
      }
    }

    return {
      lat: 0,
      lng: 0,
      speed: 0,
      location: "Orbiting Earth",
      peopleCount: 0,
      peopleNames: [],
    };
  });
  const [history, setHistory] = useState(() => {
    const cached = localStorage.getItem(ISS_CACHE_KEY);
    if (cached) {
      try {
        const sample = JSON.parse(cached);
        return sample?.lat || sample?.lng ? [{ lat: sample.lat, lng: sample.lng, timestamp: sample.timestamp || Math.floor(Date.now() / 1000) }] : [];
      } catch {
        return [];
      }
    }

    return [];
  });
  const [loading, setLoading] = useState(() => !(issData.lat || issData.lng));
  const [error, setError] = useState(null);
  const prevSampleRef = useRef(null);
  const inFlightRef = useRef(false);
  const lastFetchAtRef = useRef(0);
  const rateLimitedUntilRef = useRef(0);

  const fetchData = useCallback(async () => {
    const now = Date.now();

    if (inFlightRef.current) {
      return;
    }

    if (now < rateLimitedUntilRef.current) {
      const retrySeconds = Math.ceil((rateLimitedUntilRef.current - now) / 1000);
      setError(`ISS API rate limit reached. Retrying automatically in ${retrySeconds}s.`);
      setLoading(false);
      return;
    }

    if (now - lastFetchAtRef.current < MIN_FETCH_GAP_MS) {
      return;
    }

    try {
      inFlightRef.current = true;
      lastFetchAtRef.current = now;
      setLoading(true);
      const issJson = await fetchJson(ISS_BASE_API);
      const newPos = {
        lat: parseFloat(issJson.latitude),
        lng: parseFloat(issJson.longitude),
      };

      if (Number.isNaN(newPos.lat) || Number.isNaN(newPos.lng)) {
        throw new Error("Received invalid ISS coordinates.");
      }

      const timestamp = Number(issJson.timestamp) || Math.floor(Date.now() / 1000);
      const previousSample = prevSampleRef.current;
      const elapsedSeconds = previousSample ? timestamp - previousSample.timestamp : 0;
      const derivedSpeed = previousSample ? calculateSpeed(previousSample, newPos, elapsedSeconds) : 0;
      const currentSpeed = Number(issJson.velocity) || derivedSpeed;

      let locationName = "Location unavailable";
      try {
        locationName = await getNearestPlace(newPos.lat, newPos.lng);
      } catch (geocodeError) {
        console.warn("Geocoding lookup failed", geocodeError);
      }

      let astrosData = { number: 0, people: [] };
      try {
        astrosData = await fetchAstronauts();
      } catch (astronautError) {
        console.warn("Astronaut lookup failed", astronautError);
      }

      const updatedData = {
        lat: newPos.lat,
        lng: newPos.lng,
        speed: currentSpeed,
        location: locationName,
        peopleCount: astrosData.number || 0,
        peopleNames: (astrosData.people || []).map((person) => person.name),
        timestamp,
      };

      setIssData(updatedData);
      setHistory((prev) => [...prev.slice(-14), { ...newPos, timestamp }]);
      onDataUpdate(updatedData);
      prevSampleRef.current = { ...newPos, timestamp };
      localStorage.setItem(ISS_CACHE_KEY, JSON.stringify(updatedData));
      rateLimitedUntilRef.current = 0;
      setError(null);
    } catch (err) {
      console.error("ISS Fetch Error:", err);

      if (err.message?.includes('429')) {
        rateLimitedUntilRef.current = Date.now() + RATE_LIMIT_BACKOFF_MS;
        setError('ISS API rate limit reached. Showing the latest saved sample while we wait to retry.');
      } else {
        setError(err.message || "Unable to fetch live ISS data right now.");
      }
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [onDataUpdate]);

  useEffect(() => {
    if (issData.lat || issData.lng) {
      prevSampleRef.current = {
        lat: issData.lat,
        lng: issData.lng,
        timestamp: issData.timestamp || Math.floor(Date.now() / 1000),
      };
      onDataUpdate(issData);
    }
  }, [issData, onDataUpdate]);

  useEffect(() => {
    const initialFetch = setTimeout(() => {
      fetchData();
    }, 0);

    const interval = setInterval(() => {
      fetchData();
    }, 15000);
    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, [fetchData]);

  return (
    <div className="space-y-8 animate-fade-in">
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-4 text-indigo-500">
            <MapPin size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Live Coordinates</span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black text-slate-800 dark:text-white">{formatCoordinate(issData.lat, 'N', 'S')}</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{formatCoordinate(issData.lng, 'E', 'W')}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-4 text-emerald-500">
            <Activity size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Orbital Velocity</span>
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white">{Math.round(issData.speed).toLocaleString()} <span className="text-lg font-medium text-slate-400">km/h</span></p>
          <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-4 text-amber-500">
            <Navigation size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Ground Point</span>
          </div>
          <p className="text-lg font-bold text-slate-800 dark:text-white line-clamp-1">{issData.location}</p>
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{history.length} tracked</span>
            <button onClick={() => fetchData()} className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:scale-110 transition-all">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Map & Astronauts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-2xl h-[500px]">
          <MapContainer 
            center={[issData.lat || 0, issData.lng || 0]} 
            zoom={3} 
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <RecenterMap center={[issData.lat, issData.lng]} />
            <Polyline positions={history.map(h => [h.lat, h.lng])} color="#6366f1" weight={4} opacity={0.6} dashArray="10, 15" />
            <Marker position={[issData.lat, issData.lng]}>
              <Tooltip permanent direction="top" offset={[0, -10]}>ISS Station</Tooltip>
            </Marker>
          </MapContainer>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Users size={20} />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Crew Members</h3>
          </div>
          <div className="text-6xl font-black text-indigo-600 mb-8">
            {issData.peopleCount}
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
            {issData.peopleNames.length > 0 ? issData.peopleNames.map((name, i) => (
              <div key={i} className="text-sm font-bold p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                {name}
              </div>
            )) : (
              <p className="text-xs text-slate-400 font-bold uppercase italic">Syncing crew data...</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ISSSection;
