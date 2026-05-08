import { useState } from 'react';
import { useTheme } from './context/ThemeContext';
import ISSSection from './components/ISSSection';
import NewsSection from './components/NewsSection';
import ChartsSection from './components/ChartsSection';
import Chatbot from './components/Chatbot';
import { Sun, Moon, Rocket, Newspaper, BarChart3 } from 'lucide-react';

const App = () => {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('iss');
  const [issData, setIssData] = useState({ lat: 0, lng: 0, speed: 0, location: "Orbit", peopleCount: 0, peopleNames: [] });
  const [issHistory, setIssHistory] = useState([]);
  const [newsByCategory, setNewsByCategory] = useState({});
  const newsData = Object.values(newsByCategory).flat();

  const handleISSUpdate = (data) => {
    if (!data) return;
    setIssData(data);
    setIssHistory((prev) => [...prev.slice(-29), {
      ...data,
      timestamp: new Date((data.timestamp || Date.now() / 1000) * 1000).toLocaleTimeString(),
    }]);
  };

  const handleNewsUpdate = (data) => {
    if (!data?.category) return;
    setNewsByCategory((prev) => ({
      ...prev,
      [data.category]: data.articles || [],
    }));
  };

  const tabs = [
    { id: 'iss', label: 'ISS Tracker', icon: Rocket },
    { id: 'news', label: 'Space News', icon: Newspaper },
    { id: 'charts', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 border-b ${isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-white/80'} backdrop-blur-md`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Rocket size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">SpaceDash</h1>
          </div>

          <nav className="hidden md:flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <button 
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-indigo-600 transition-all"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTab === 'iss' && <ISSSection onDataUpdate={handleISSUpdate} />}
          {activeTab === 'news' && <NewsSection onDataUpdate={handleNewsUpdate} />}
          {activeTab === 'charts' && <ChartsSection issHistory={issHistory} newsByCategory={newsByCategory} />}
        </div>
      </main>

      {/* Chatbot */}
      <Chatbot dashboardData={{ iss: issData, news: newsData, newsByCategory }} />

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-200 dark:border-slate-800 text-center text-slate-400 text-sm">
        <p>&copy; 2026 Space Dashboard • Modern Space Analytics</p>
      </footer>
    </div>
  );
};

export default App;
