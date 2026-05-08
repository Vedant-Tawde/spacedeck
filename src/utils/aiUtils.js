import { HfInference } from "@huggingface/inference";

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
    - People in Space: ${dashboardData.iss.peopleCount}
    - Astronauts: ${dashboardData.iss.peopleNames.join(", ")}
    
    Latest News Headlines:
    ${(dashboardData.news || []).slice(0, 5).map((n, i) => `${i + 1}. ${n.title}`).join("\n")}
    
    Rules:
    - Answer based ONLY on the data above.
    - Be extremely concise (1-2 sentences).
  `;

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: `<|system|>\n${context}</s>\n<|user|>\n${userQuery}</s>\n<|assistant|>`,
          parameters: { max_new_tokens: 150, temperature: 0.1 },
          options: { wait_for_model: true }
        }),
      }
    );

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    // Zephyr returns an array for text-generation
    const output = result[0]?.generated_text || "";
    return output.split("<|assistant|>").pop().trim();
  } catch (error) {
    console.error("DIRECT AI ERROR:", error);
    return `AI Error: ${error.message?.substring(0, 50)}`;
  }
}

export function getChatHistory() {
  const history = localStorage.getItem("chat_history");
  return history ? JSON.parse(history) : [];
}

export function saveChatHistory(messages) {
  localStorage.setItem("chat_history", JSON.stringify(messages.slice(-30)));
}
