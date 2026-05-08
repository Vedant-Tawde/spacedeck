const API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const FALLBACK_IMAGE = "https://via.placeholder.com/600x400?text=No+Image";

export async function fetchNews(category = "space", query = "") {
  if (!API_KEY) {
    throw new Error("Missing VITE_NEWS_API_KEY in .env.");
  }

  const params = new URLSearchParams({
    apikey: API_KEY,
    language: "en",
    q: query.trim() || category,
  });

  const response = await fetch(`https://newsdata.io/api/1/latest?${params.toString()}`);
  const data = await response.json();

  if (!response.ok || data.status !== "success") {
    throw new Error(data.results?.message || data.message || `News request failed with status ${response.status}`);
  }

  return (data.results || []).slice(0, 10).map((article, index) => ({
    id: article.article_id || `${category}-${index}-${article.link}`,
    category,
    title: article.title || "Untitled article",
    source: article.source_id || article.source_name || "Unknown source",
    author: Array.isArray(article.creator) ? article.creator.join(", ") : article.creator || "Unknown author",
    date: article.pubDate || article.pubDateTZ || new Date().toISOString(),
    image: article.image_url || FALLBACK_IMAGE,
    description: article.description || article.content || "No description available.",
    link: article.link,
  }));
}

export function getCachedNews(category = "space", query = "") {
  const cacheKey = `news_data_${category}_${query}`;
  const cached = localStorage.getItem(cacheKey);
  if (!cached) return null;
  
  const { data, timestamp } = JSON.parse(cached);
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;
  
  if (now - timestamp > fifteenMinutes) {
    localStorage.removeItem(cacheKey);
    return null;
  }
  
  return data;
}

export function setCachedNews(data, category = "space", query = "") {
  const cacheKey = `news_data_${category}_${query}`;
  localStorage.setItem(cacheKey, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
}
