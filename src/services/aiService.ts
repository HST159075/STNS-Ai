import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;

let groq: Groq | null = null;

if (apiKey && apiKey !== 'gsk_...') {
  groq = new Groq({ apiKey });
} else {
  console.warn('⚠️ GROQ_API_KEY is missing or using placeholder. AI features will be disabled.');
}

export const generateAiResponse = async (prompt: string, systemPrompt?: string, isJson = false) => {
  if (!groq) {
    throw new Error('AI Service is not configured. Please add a valid GROQ_API_KEY to your .env file.');
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt || 'You are a helpful assistant for a freelance marketplace.' },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: isJson ? { type: 'json_object' } : undefined,
    });

    const content = chatCompletion.choices[0]?.message?.content || '';
    return isJson ? JSON.parse(content) : content;
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
};

export const matchTalent = async (projectDesc: string, freelancerSkills: string[]) => {
  const prompt = `Project: ${projectDesc}. Available Freelancers have these skills: ${freelancerSkills.join(', ')}. Which skills are missing and what would be a perfect freelancer profile for this?`;
  return generateAiResponse(prompt, "You are a recruitment expert.");
};

export const analyzeBid = async (bidCoverLetter: string, projectDesc: string) => {
  const prompt = `Project: ${projectDesc}. Bid Proposal: ${bidCoverLetter}. Rate this proposal from 1 to 10 and give 3 improvement tips.`;
  return generateAiResponse(prompt, "You are a professional project manager.");
};

