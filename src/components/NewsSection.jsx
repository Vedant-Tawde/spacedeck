import { useState, useEffect, useCallback } from 'react';
import { fetchNews, getCachedNews, setCachedNews } from '../utils/newsUtils';
import { Search, RefreshCw, ExternalLink, Calendar, AlertCircle } from 'lucide-react';

const NewsSection = ({ onDataUpdate }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date"); 
  const [category, setCategory] = useState("space");
  const [error, setError] = useState(null);

  const loadNews = useCallback(async (force = false, query = "") => {
    setLoading(true);
    setError(null);

    if (!force) {
      const cached = getCachedNews(category, query);
      if (cached) {
        setArticles(cached);
        onDataUpdate({ category, articles: cached });
        setLoading(false);
        return;
      }
    }

    try {
      const data = await fetchNews(category, query);
      setArticles(data);
      setCachedNews(data, category, query);
      onDataUpdate({ category, articles: data });
    } catch (fetchError) {
      console.error("News fetch error:", fetchError);
      setArticles([]);
      setError(fetchError.message || "Unable to fetch live news right now.");
      onDataUpdate({ category, articles: [] });
    } finally {
      setLoading(false);
    }
  }, [category, onDataUpdate]);

  useEffect(() => {
    const initialLoad = setTimeout(() => {
      loadNews();
    }, 0);

    return () => clearTimeout(initialLoad);
  }, [category, loadNews]);

  const filteredArticles = articles
    .filter(a => a.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.date) - new Date(a.date);
      return a.source.localeCompare(b.source);
    });

  return (
    <section className="space-y-8 animate-fade-in">
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search space news..."
            className="w-full pl-12 pr-6 py-3 text-sm rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar">
          {['space', 'science', 'technology', 'astronomy'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                category === cat 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <select 
            className="flex-1 lg:flex-none px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:outline-none cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Latest</option>
            <option value="source">Source</option>
          </select>
          
          <button 
            onClick={() => loadNews(true, search)}
            className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-all"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-[2rem] h-96 border border-slate-100 dark:border-slate-800 p-6 flex flex-col gap-4 shadow-sm animate-pulse">
              <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
              <div className="w-3/4 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-lg opacity-50" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article) => (
            <div key={article.id} className="group bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col transition-all hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2">
              <div className="relative h-56 overflow-hidden">
                <img 
                  src={article.image} 
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => e.target.src = "https://via.placeholder.com/600x400?text=News+Image"}
                />
                <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600">
                  {article.source}
                </div>
              </div>
              
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-lg font-bold mb-3 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-3 leading-relaxed">
                  {article.description}
                </p>
                
                <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    {new Date(article.date).toLocaleDateString()}
                  </div>
                  <a 
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    READ MORE <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && filteredArticles.length === 0 && (
        <div className="text-center py-32">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search size={24} className="text-slate-300" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-300">No matching articles found.</p>
        </div>
      )}
    </section>
  );
};

export default NewsSection;
