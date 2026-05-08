export async function askAI(userQuery, dashboardData) {
  const token = import.meta.env.VITE_AI_TOKEN;
  
  if (!token || token.includes("placeholder") || token.length < 10) {
    return "AI is not configured. Please add your Hugging Face token to the .env file.";
  }

  const context = `
    Current ISS Data:
    - Latitude: ${dashboardData.iss.lat}
    - Longitude: ${dashboardData.iss.lng}
    - Speed: ${dashboardData.iss.speed} km/h
    - Location: ${dashboardData.iss.location}
    - People: ${dashboardData.iss.peopleCount}
    
    Latest News:
    ${(dashboardData.news || []).slice(0, 3).map((n) => `- ${n.title}`).join("\n")}
  `;

  try {
    // Using a proxy to bypass Vercel CORS blocks
    const PROXY = "https://api.allorigins.win/raw?url=";
    const API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta";
    
    const response = await fetch(PROXY + encodeURIComponent(API_URL), {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `<|system|>\n${context}</s>\n<|user|>\n${userQuery}</s>\n<|assistant|>`,
        parameters: { max_new_tokens: 100, temperature: 0.1 },
        options: { wait_for_model: true }
      }),
    });

    const result = await response.json();
    const output = result[0]?.generated_text || "";
    return output.split("<|assistant|>").pop().trim() || "I'm processing the orbital data. Ask me again in a moment!";
  } catch (error) {
    console.error("PROXY AI ERROR:", error);
    return "The AI link is currently congested. Please try one more time.";
  }
}

export function getChatHistory() {
  const history = localStorage.getItem("chat_history");
  return history ? JSON.parse(history) : [];
}

export function saveChatHistory(messages) {
  localStorage.setItem("chat_history", JSON.stringify(messages.slice(-20)));
}
