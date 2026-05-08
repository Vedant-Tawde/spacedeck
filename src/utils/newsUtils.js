const API_KEY = import.meta.env.VITE_NEWS_API_KEY;

export async function fetchNews(category = "space", query = "") {
  const cacheKey = `news_data_${category}_${query}`;
  const baseUrl = `https://newsdata.io/api/1/news?apikey=${API_KEY}&q=${query || category}&language=en`;
  
  try {
    const response = await fetch(baseUrl);
    const data = await response.json();
    
    if (data.status === "success") {
      const articles = data.results.map(article => ({
        id: article.article_id,
        title: article.title,
        source: article.source_id,
        author: article.creator ? article.creator.join(", ") : "Unknown",
        date: article.pubDate,
        image: article.image_url || "https://via.placeholder.com/400x200?text=No+Image",
        description: article.description || article.content || "No description available.",
        link: article.link
      })).slice(0, 10);
      return articles;
    }
    throw new Error(data.message || "Failed to fetch news");
  } catch (error) {
    console.error("News fetch error:", error);
    return [];
  }
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
