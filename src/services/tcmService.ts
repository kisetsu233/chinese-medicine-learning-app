import { GoogleGenAI } from "@google/genai";
import { Herb } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function fetchFromClaude(herbName: string): Promise<Partial<Herb>> {
  const prompt = promptTemplate(herbName);
  
  const response = await fetch("/api/ai/claude", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) throw new Error(`Claude proxy error: ${response.statusText}`);
  
  const data = await response.json();
  const content = data.content?.[0]?.text;
  
  if (!content) throw new Error("Empty response from Claude");
  
  const jsonStr = content.replace(/```json|```/g, "").trim();
  return JSON.parse(jsonStr);
}

async function fetchFromLocalModel(herbName: string, endpoint: string, modelName: string): Promise<Partial<Herb>> {
  const prompt = promptTemplate(herbName);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: 'user', content: prompt }],
      stream: false
    })
  });

  if (!response.ok) throw new Error(`Local model error: ${response.statusText}`);
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || data.response;
  
  if (!content) throw new Error("Empty response from local model");
  
  const jsonStr = content.replace(/```json|```/g, "").trim();
  return JSON.parse(jsonStr);
}

export async function fetchHerbDetails(herbName: string): Promise<Partial<Herb>> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const localEndpoint = process.env.LOCAL_MODEL_ENDPOINT;
  const localModelName = process.env.LOCAL_MODEL_NAME || "llama3";

  try {
    // 优先级 1: Anthropic Claude
    if (anthropicKey && anthropicKey !== "") {
      console.log(`Using Claude for ${herbName}...`);
      return await fetchFromClaude(herbName);
    }

    // 优先级 2: Local Model
    if (localEndpoint) {
      console.log(`Using local model at ${localEndpoint} for ${herbName}...`);
      return await fetchFromLocalModel(herbName, localEndpoint, localModelName);
    }

    // 优先级 3: Gemini
    const geminiKey = process.env.GEMINI_API_KEY || "";
    if (!geminiKey || geminiKey === "MY_GEMINI_API_KEY") {
      throw new Error("请配置有效的 API Key 或本地模型");
    }

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: promptTemplate(herbName),
    });
    
    const text = response.text;
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("Error fetching herb details:", error);
    return {
      name: herbName,
      category: "获取失败",
      natureTaste: "AI 获取失败，请检查 API 配置或网络",
    };
  }
}

function promptTemplate(herbName: string) {
  return `
    你是一个专业的中药学专家。请提供中药材 "${herbName}" 的详细信息。
    请按以下 JSON 格式返回：
    {
      "pinyin": "拼音",
      "scientificName": "学名",
      "category": "分类",
      "description": "简短的一句描述",
      "natureTaste": "性味归经",
      "functions": "功效",
      "applications": ["应用1", "应用2"],
      "herbPairs": [
        { "name": "配伍药名", "effect": "作用" }
      ]
    }
    
    只需返回 JSON 对象，不要包含 Markdown 格式。
  `;
}
