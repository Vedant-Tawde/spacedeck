import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { ISS_BASE_API, ASTROS_API, calculateSpeed, getNearestPlace } from '../utils/issUtils';
import { Users, MapPin, Activity, Navigation, RefreshCw, Info } from 'lucide-react';

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
  const [issData, setIssData] = useState({
    lat: 0,
    lng: 0,
    speed: 0,
    location: "Orbiting Earth",
    peopleCount: 0,
    peopleNames: []
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const prevPosRef = useRef(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const issRes = await fetch(ISS_BASE_API);
      if (!issRes.ok) throw new Error("API Rate Limit");
      
      const issJson = await issRes.json();
      
      const newPos = {
        lat: parseFloat(issJson.latitude),
        lng: parseFloat(issJson.longitude)
      };

      if (isNaN(newPos.lat) || isNaN(newPos.lng)) throw new Error("Invalid Data");

      const currentSpeed = issJson.velocity || 27600;
      
      // Get location (handle CORS/errors silently)
      let locationName = "International Waters / Orbit";
      try {
        locationName = await getNearestPlace(newPos.lat, newPos.lng);
      } catch (e) { console.warn("Geocoding suppressed"); }

      // Get Astronauts
      let astrosData = { number: 0, people: [] };
      try {
        const astrosRes = await fetch(ASTROS_API);
        if (astrosRes.ok) astrosData = await astrosRes.json();
      } catch (e) { console.warn("Astros suppressed"); }

      const updatedData = {
        lat: newPos.lat,
        lng: newPos.lng,
        speed: currentSpeed,
        location: locationName,
        peopleCount: astrosData.number || 0,
        peopleNames: (astrosData.people || []).map(p => p.name)
      };

      setIssData(updatedData);
      setHistory(prev => {
        const newHistory = [...prev.slice(-29), newPos];
        return newHistory;
      });
      onDataUpdate(updatedData);
      prevPosRef.current = newPos;
      setError(null);
    } catch (err) {
      console.error("ISS Fetch Error:", err);
      // Ensure we show SOME data for the exam demo
      if (issData.lat === 0) {
        const dummy = { lat: 45.4215, lng: -75.6972, speed: 27600, location: "North Atlantic (Simulated)", peopleCount: 7, peopleNames: ["C. Hadfield", "S. Williams", "O. Kononenko"] };
        setIssData(dummy);
        onDataUpdate(dummy);
        setError("Note: API Connection Refused. Showing simulated orbital data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-4 text-indigo-500">
            <MapPin size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Live Coordinates</span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black text-slate-800 dark:text-white">{issData.lat.toFixed(4)}° N</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{issData.lng.toFixed(4)}° E</p>
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
            <button onClick={fetchData} className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:scale-110 transition-all">
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

      {error && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest rounded-2xl flex items-center gap-3 animate-pulse">
          <Info size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ISSSection;
