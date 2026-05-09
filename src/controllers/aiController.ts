import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { aiProvider } from '../services/aiProvider';

/**
 * FEATURE 1: AI Data Analyzer (Smart Insights)
 * Analyzes user profile & platform data to return structured insights
 */
export const getSmartInsights = async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { skills: { include: { skill: true } }, postedProjects: true, freelanceContracts: true }
    });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Construct optimized prompt for Groq/Llama 3
    const prompt = `Act as an elite business analyst for NexusMarket. Analyze this ${user.role} profile:
      Name: ${user.name}
      Skills: ${user.skills.map(s => s.skill.name).join(', ')}
      Projects: ${user.postedProjects.length}
      Contracts: ${user.freelanceContracts.length}
      
      Return a JSON object with:
      {
        "title": "A catchy role-aware title",
        "message": "A personalized insight or tip (max 20 words)",
        "recommendations": [{"id": "1", "title": "Example Action"}],
        "confidenceScore": "A percentage based on profile completeness"
      }`;

    const insights = await aiProvider.generateContent(prompt, true) || {
      title: "Strategic Dashboard Active",
      message: "Keep your profile updated to unlock AI-powered recommendations.",
      recommendations: [],
      confidenceScore: "85%"
    };

    res.status(200).json({ success: true, insights });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * FEATURE 2: AI Chat Assistant (Context-Aware)
 */
export const chatWithAI = async (req: Request, res: Response) => {
  const { message, history = [] } = req.body;
  const userId = (req as any).auth?.userId;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    const contextPrompt = `You are Nexus AI, an elite assistant for NexusMarket. 
      The user is ${user?.name} with role ${user?.role}. 
      Be professional, concise, and helpful. User says: ${message}`;

    const advice = await aiProvider.getChatResponse(history, contextPrompt) || 
      "I'm currently processing multiple data streams. Please try again in a moment.";

    res.status(200).json({ success: true, advice });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * FEATURE 3: AI Content Generator (Project Architect)
 * Generates project descriptions for clients
 */
export const generateProjectBrief = async (req: Request, res: Response) => {
  const { title, category } = req.body;

  try {
    const prompt = `Act as a professional project architect. Create a detailed, high-quality project description for:
      Title: ${title}
      Category: ${category}
      
      Focus on deliverables, technical requirements, and target outcome. (Max 150 words).`;

    const brief = await aiProvider.generateContent(prompt) || "Failed to generate brief. Please try manual entry.";
    res.status(200).json({ success: true, brief });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * FEATURE 5: AI Cover Letter Generator
 * Generates tailored cover letters for freelancers bidding on projects
 */
export const generateCoverLetter = async (req: Request, res: Response) => {
  const { projectTitle, projectDescription, freelancerBio, skills } = req.body;

  try {
    const prompt = `Act as an elite freelance strategist. Write a highly persuasive, professional cover letter for this project:
      Project Title: ${projectTitle}
      Project Description: ${projectDescription}
      
      Freelancer Background:
      Bio: ${freelancerBio}
      Skills: ${skills.join(', ')}
      
      Requirements:
      1. Keep it concise (max 3 short paragraphs).
      2. Start with a strong hook based on the project.
      3. Highlight relevant skills and experience.
      4. End with a confident call to action.
      Return ONLY the cover letter text, no conversational filler.`;

    const coverLetter = await aiProvider.generateContent(prompt) || "I am highly interested in your project and have the required skills. Let's discuss further.";
    res.status(200).json({ success: true, coverLetter });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * FEATURE 4: AI Auto-Tagging & Classification
 * Suggests skills/tags based on project description
 */
export const suggestProjectTags = async (req: Request, res: Response) => {
  const { description } = req.body;

  try {
    const prompt = `Extract exactly 5 relevant professional skills/tags from this project description: "${description}". 
      Return as a comma-separated list of tags only.`;

    const tags = await aiProvider.generateContent(prompt) || "Web Development, Design";
    res.status(200).json({ success: true, tags: tags.split(',').map((t: string) => t.trim()) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * FEATURE 4: AI Profile Optimizer
 * Analyzes a freelancer's profile and returns structured improvement suggestions
 */
export const optimizeProfile = async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        skills: { include: { skill: true } },
        freelanceContracts: { select: { status: true } },
        bids: { select: { id: true } },
        _count: { select: { bids: true, freelanceContracts: true } }
      }
    }) as any;

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const prompt = `Act as an elite freelance career coach. Analyze this freelancer profile and provide specific, actionable improvements:

      Name: ${user.name}
      Bio: ${user.bio || "Not provided"}
      Skills: ${user.skills.map((s: any) => s.skill.name).join(', ') || "None listed"}
      Total Bids: ${user._count.bids}
      Completed Contracts: ${user.freelanceContracts.filter((c: any) => c.status === 'COMPLETED').length}

      Return a JSON object:
      {
        "overallScore": 0-100,
        "grade": "A/B/C/D",
        "headline": "A powerful one-line summary of their positioning",
        "improvements": [
          {
            "area": "Bio / Skills / Portfolio / Rates",
            "priority": "High / Medium / Low",
            "suggestion": "Specific actionable advice (max 20 words)",
            "impact": "How this will help them win more projects"
          }
        ],
        "strengths": ["List of current strengths"],
        "suggestedBio": "A rewritten, more compelling version of their bio"
      }`;

    const optimization = await aiProvider.generateContent(prompt, true) || {
      overallScore: 70,
      grade: "B",
      headline: "Skilled professional ready for growth",
      improvements: [{ area: "Bio", priority: "High", suggestion: "Add specific measurable achievements", impact: "Increases client trust" }],
      strengths: ["Technical skills"],
      suggestedBio: "Update your bio to highlight your expertise."
    };

    res.status(200).json({ success: true, optimization });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * FEATURE 3: AI Bid Auditor (Batch Analysis for Clients)
 * Fetches all bids for a project and ranks them using AI
 */
export const auditProjectBids = async (req: Request, res: Response) => {
  const { projectId } = req.params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId as string },
      include: {
        bids: {
          include: { freelancer: { select: { name: true, bio: true, skills: { include: { skill: true } } } } }
        }
      }
    }) as any;

    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    // SECURITY CHECK: Only the project owner can audit bids
    if (project.clientId !== (req as any).auth?.userId) {
      return res.status(403).json({ success: false, message: "Forbidden: Only the project owner can audit bids." });
    }

    if (!project.bids || project.bids.length === 0) {
      return res.status(200).json({ success: true, analysis: [], message: "No bids to analyze yet." });
    }

    const bidsContext = project.bids.map((b: any) => ({
      freelancer: b.freelancer?.name || 'Unknown',
      amount: b.amount,
      proposal: b.coverLetter,
      skills: b.freelancer?.skills?.map((s: any) => s.skill.name).join(', ') || ''
    }));

    const prompt = `Act as an elite talent sourcer. Analyze and rank these ${bidsContext.length} bids for the project:
      Project: ${project.title}
      Requirements: ${project.description}
      
      Bids to Analyze:
      ${JSON.stringify(bidsContext, null, 2)}
      
      Return a JSON object with:
      {
        "rankings": [
          {
            "freelancer": "Name",
            "score": 0-100,
            "justification": "Why this rank?",
            "matchType": "Perfect Match / Good / Risky"
          }
        ],
        "topPick": "Name of the best freelancer",
        "strategicAdvice": "Advice for the client on choosing the right one"
      }`;

    const analysis = await aiProvider.generateContent(prompt, true) || {
      rankings: [],
      topPick: "N/A",
      strategicAdvice: "Consult with each freelancer before deciding."
    };

    res.status(200).json({ success: true, analysis });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
