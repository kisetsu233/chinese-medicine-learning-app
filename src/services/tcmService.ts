import { GoogleGenAI } from "@google/genai";
import { Herb } from "../types";

// The platform injects GEMINI_API_KEY into the environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function fetchHerbDetails(herbName: string): Promise<Partial<Herb>> {
  const prompt = `
    你是一个专业的中药学专家。请提供中药材 "${herbName}" 的详细信息。
    请按以下 JSON 格式返回：
    {
      "pinyin": "拼音",
      "scientificName": "学名",
      "category": "分类 (如: 辛温解表药)",
      "description": "简短的一句描述 (如: 为麻黄科植物草麻黄、中麻黄或木贼麻黄的干燥草质茎)",
      "natureTaste": "性味归经 (如: 辛、微苦、温、升浮，归肺经、膀胱经)",
      "functions": "功效 (如: 发汗解表、宣肺平喘、利水消肿)",
      "applications": ["应用1 (如: 风寒感冒)", "应用2", ...],
      "herbPairs": [
        { "name": "药对 (如: 麻黄 + 桂枝)", "effect": "作用 (如: 解表力量加强)" },
        ...
      ]
    }
    
    只需返回 JSON 对象，不要包含 Markdown 格式。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error fetching herb details:", error);
    return {
      name: herbName,
      category: "获取失败",
      natureTaste: "无法通过 AI 获取信息",
    };
  }
}
