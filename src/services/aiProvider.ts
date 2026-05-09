import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

export const aiProvider = {
  /**
   * Generates a structured response using Groq AI (Llama 3)
   */
  generateContent: async (prompt: string, isJson: boolean = false) => {
    try {
      if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is missing. Please set it in .env");
      }

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        response_format: isJson ? { type: "json_object" } : undefined,
        temperature: 0.7,
      });

      const text = completion.choices[0]?.message?.content || "";
      return isJson ? JSON.parse(text) : text;
    } catch (error: any) {
      console.error("Groq Provider Error:", error.message);
      return null;
    }
  },

  /**
   * Specialized method for the Chatbot using Groq
   */
  getChatResponse: async (history: any[], message: string) => {
    try {
      if (!process.env.GROQ_API_KEY) return null;

      const messages = [
        ...history.map(h => ({
          role: h.role === 'ai' ? 'assistant' : 'user',
          content: h.content
        })),
        { role: "user", content: message }
      ];

      const completion = await groq.chat.completions.create({
        messages: messages as any,
        model: "llama-3.3-70b-versatile",
        temperature: 0.6,
      });

      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Groq Chat Error:", error);
      return null;
    }
  }
};
