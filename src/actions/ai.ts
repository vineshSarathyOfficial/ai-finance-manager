"use server";

import { getRequiredUserId } from "@/lib/auth/session";
import { getGeminiModel } from "@/lib/ai/gemini";
import { buildFinancialContext } from "@/lib/ai/context";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface AiHealthInsight {
  headline: string;
  win: string;
  anomaly: string;
  recommendation: string;
}

const COPILOT_SYSTEM_INSTRUCTION = `You are FinPulse AI, an intelligent, empathetic, and highly analytical personal finance copilot.
Your job is to help the user understand their spending, find actionable savings opportunities, analyze their subscriptions, and give realistic financial advice.

Guidelines:
1. All monetary values are in Indian Rupees (₹) by default.
2. Be direct, encouraging, and structured. Use Markdown formatting (bolding, bullet points, headers).
3. Always base your answers on the user's provided real financial context data.
4. If asked about something not in the data, clarify what data is available.
5. Provide specific numbers and practical savings steps when asked how to save money or cut costs.
`;

/**
 * Conversational Financial Copilot Server Action
 */
export async function askFinancialCopilotAction(
  message: string,
  history: ChatMessage[],
  customApiKey?: string
): Promise<{ success: boolean; response: string; error?: string }> {
  try {
    const userId = await getRequiredUserId();
    const model = getGeminiModel(customApiKey);

    if (!model) {
      return {
        success: false,
        response: "",
        error: "GEMINI_KEY_MISSING",
      };
    }

    const financialContext = await buildFinancialContext(userId);

    // Format chat history for Gemini
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `${COPILOT_SYSTEM_INSTRUCTION}\n\nHere is my current live financial snapshot:\n\`\`\`json\n${financialContext}\n\`\`\`` }],
        },
        {
          role: "model",
          parts: [{ text: "Hello! I have loaded your live FinPulse financial data. How can I help you manage your wealth, spending, or savings goals today?" }],
        },
        ...history.slice(-8).map((h) => ({
          role: h.role,
          parts: [{ text: h.content }],
        })),
      ],
    });

    const result = await chat.sendMessage(message);
    const text = result.response.text();

    return {
      success: true,
      response: text,
    };
  } catch (error: any) {
    console.error("[askFinancialCopilotAction] Error:", error);
    return {
      success: false,
      response: "",
      error: error?.message || "Failed to communicate with AI.",
    };
  }
}

/**
 * Generates an automated 3-point AI Financial Health summary for the Dashboard
 */
export async function getDashboardAiHealthAction(
  customApiKey?: string
): Promise<{ success: boolean; data?: AiHealthInsight; error?: string }> {
  try {
    const userId = await getRequiredUserId();
    const model = getGeminiModel(customApiKey);

    if (!model) {
      return { success: false, error: "GEMINI_KEY_MISSING" };
    }

    const financialContext = await buildFinancialContext(userId);

    const prompt = `Analyze this user's financial snapshot and provide a concise 3-point health review in JSON format.
Snapshot:
\`\`\`json
${financialContext}
\`\`\`

Respond ONLY with valid JSON matching this exact structure, with no extra markdown code blocks if possible:
{
  "headline": "Short 4-6 word summary of their financial state",
  "win": "One positive achievement or good spending habit observed",
  "anomaly": "One spending area, spike, or subscription requiring attention",
  "recommendation": "One high-impact, actionable next step to save or optimize"
}`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    // Clean JSON markdown codeblock wrappers if present
    const cleanJson = rawText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed: AiHealthInsight = JSON.parse(cleanJson);

    return {
      success: true,
      data: parsed,
    };
  } catch (error: any) {
    console.error("[getDashboardAiHealthAction] Error:", error);
    return {
      success: false,
      error: error?.message || "Could not generate AI insight.",
    };
  }
}
