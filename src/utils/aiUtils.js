import { InferenceClient } from "@huggingface/inference";

const MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

function buildSystemPrompt(dashboardData) {
  const newsByCategory = dashboardData.newsByCategory || {};
  const categorySummary = Object.entries(newsByCategory)
    .map(([category, articles]) => `${category}: ${articles.length} article(s)`)
    .join("\n");

  const headlines = (dashboardData.news || [])
    .slice(0, 8)
    .map((article, index) => `${index + 1}. [${article.category}] ${article.title} (${article.source})`)
    .join("\n");

  return `You are the SpaceDash assistant.
You may answer ONLY with facts present in the dashboard data below.
If the user asks anything outside this dashboard data, reply with: "I can only answer from the current ISS tracker and news dashboard data."
Do not use outside knowledge. Do not guess. Be concise and direct.

Dashboard data:
- ISS latitude: ${dashboardData.iss.lat}
- ISS longitude: ${dashboardData.iss.lng}
- ISS speed: ${dashboardData.iss.speed} km/h
- ISS location label: ${dashboardData.iss.location}
- People currently in space: ${dashboardData.iss.peopleCount}
- People names: ${(dashboardData.iss.peopleNames || []).join(", ") || "Unavailable"}
- Loaded news categories:
${categorySummary || "No categories loaded"}
- Headlines:
${headlines || "No articles loaded"}`;
}

export async function askAI(userQuery, dashboardData) {
  const token = import.meta.env.VITE_AI_TOKEN;

  if (!token || token.includes("placeholder") || token.length < 10) {
    return "AI is not configured. Add a valid Hugging Face token in VITE_AI_TOKEN.";
  }

  if (!dashboardData?.iss || (!dashboardData?.news?.length && !dashboardData?.iss?.lat && !dashboardData?.iss?.lng)) {
    return "The dashboard data is still loading, so I do not have enough live context yet.";
  }

  try {
    const client = new InferenceClient(token);
    const result = await client.chatCompletion({
      model: MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt(dashboardData) },
        { role: "user", content: userQuery },
      ],
      max_tokens: 140,
      temperature: 0.1,
    });

    return result.choices?.[0]?.message?.content?.trim() || "I could not produce an answer from the current dashboard data.";
  } catch (error) {
    console.error("Hugging Face AI error:", error);
    return "The AI assistant could not reach Hugging Face right now. Please try again in a few seconds.";
  }
}

export function getChatHistory() {
  const history = localStorage.getItem("chat_history");
  return history ? JSON.parse(history) : [];
}

export function saveChatHistory(messages) {
  localStorage.setItem("chat_history", JSON.stringify(messages.slice(-30)));
}
