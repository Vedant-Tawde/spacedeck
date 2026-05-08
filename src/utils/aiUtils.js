import { HfInference } from "@huggingface/inference";

export async function askAI(userQuery, dashboardData) {
  const token = import.meta.env.VITE_AI_TOKEN;
  
  if (!token || token.includes("placeholder") || token.length < 10) {
    return "AI is not configured. Please add your Hugging Face token to the .env file.";
  }

  const hf = new HfInference(token);

  const context = `
    You are a helpful dashboard assistant. You can ONLY answer questions based on the provided dashboard data.
    If the answer is not in the data, politely say you don't know or that it's outside your scope.
    
    Current ISS Data:
    - Latitude: ${dashboardData.iss.lat}
    - Longitude: ${dashboardData.iss.lng}
    - Speed: ${dashboardData.iss.speed.toFixed(2)} km/h
    - Location: ${dashboardData.iss.location}
    - People in Space: ${dashboardData.iss.peopleCount}
    - Astronauts: ${dashboardData.iss.peopleNames.join(", ")}
    
    Latest News Headlines:
    ${dashboardData.news.map((n, i) => `${i + 1}. ${n.title} (Source: ${n.source})`).join("\n")}
    
    Rules:
    - No internet knowledge.
    - No guessing.
    - Be concise.
  `;

  try {
    const response = await hf.textGeneration({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      inputs: `<s>[INST] ${context}\n\nUser Question: ${userQuery} [/INST]`,
      parameters: {
        max_new_tokens: 250,
        temperature: 0.1,
      },
      options: {
        wait_for_model: true
      }
    });

    return response.generated_text.split("[/INST]").pop().trim();
  } catch (error) {
    console.error("AI Error:", error);
    return "Sorry, I encountered an error while processing your request.";
  }
}

export function getChatHistory() {
  const history = localStorage.getItem("chat_history");
  return history ? JSON.parse(history) : [];
}

export function saveChatHistory(messages) {
  localStorage.setItem("chat_history", JSON.stringify(messages.slice(-30)));
}
