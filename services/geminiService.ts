
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function askSpindleExpert(question: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一位世界级的超精密机床设计专家，专注于气体静压主轴（Aerostatic Spindle）领域。
请用专业且通俗易懂的方式回答用户关于气静压主轴的问题。
当前用户的疑问是：${question}`,
      config: {
        systemInstruction: "回答应包含物理原理分析、工程应用实例，并以Markdown格式呈现。",
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "抱歉，专家目前正在实验室忙碌，请稍后再试。";
  }
}
