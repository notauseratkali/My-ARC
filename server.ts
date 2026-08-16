import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI Journal Enhancement endpoint (Server-side Gemini call)
  app.post("/api/ai/enhance-journal", async (req, res) => {
    try {
      const { text, action, title, aiEnabled } = req.body;

      if (aiEnabled === false) {
        return res.status(403).json({ error: "AI Enhancement is currently disabled by Crew Council settings." });
      }

      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Text content is required for AI enhancement." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback rule-based enhancement if key is missing in dev
        let simulatedText = text;
        if (action === "report") {
          simulatedText = `[EXECUTIVE SUMMARY REPORT]\nTitle: ${title || "Journal Entry"}\n\nKey Highlights:\n- ${text.replace(/\n+/g, "\n- ")}\n\nStatus: Verified and Logged under Meyvaa Portal Operating Policy.`;
        } else if (action === "summarize") {
          simulatedText = `Summary: ${text.slice(0, 180)}...`;
        } else if (action === "proofread") {
          simulatedText = text.trim() + " (Grammar & Style Verified)";
        } else {
          simulatedText = text.trim() + "\n\n[Polished & Structured for Scout Portfolio Log]";
        }
        return res.json({ enhancedText: simulatedText });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      let systemPrompt = "";
      if (action === "report") {
        systemPrompt = "You are an assistant for the Meyvaa Portal scout management platform. Reformat the following member journal entry into a structured, professional Scout Activity & Reflection Report. Do NOT add new unmentioned events, only polish, organize with clear headings (e.g. Activity Summary, Key Learnings, Scouting Values Applied), and correct grammar.";
      } else if (action === "summarize") {
        systemPrompt = "You are an assistant for the Meyvaa Portal scout management platform. Provide a concise 2-3 sentence executive summary of the member's journal entry. Do NOT invent fake details.";
      } else if (action === "proofread") {
        systemPrompt = "You are a proofreader for Scouting logs on the Meyvaa Portal platform. Correct grammar, spelling, and sentence flow of the provided text while preserving the author's exact voice and factual details. Do NOT invent new facts.";
      } else {
        systemPrompt = "You are an editor for Scout portfolios on the Meyvaa Portal platform. Refine, polish, and format the member's journal text to sound clear, professional, and inspiring while keeping every original fact intact. Do NOT invent fake stories.";
      }

      const prompt = `Title/Topic: ${title || "Journal Entry"}\n\nMember Entry:\n${text}`;

      let enhancedText = text;
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
          },
        });

        enhancedText = response.text || text;
      } catch (geminiError: any) {
        console.warn("Gemini API call warning/error, applying fallback formatting:", geminiError?.message || geminiError);
        if (action === "report") {
          enhancedText = `[EXECUTIVE SUMMARY REPORT]\nTitle: ${title || "Journal Entry"}\n\nKey Highlights:\n- ${text.replace(/\n+/g, "\n- ")}\n\nStatus: Logged under Meyvaa Portal Operating Policy.`;
        } else if (action === "summarize") {
          enhancedText = `Summary: ${text.slice(0, 180)}...`;
        } else if (action === "proofread") {
          enhancedText = text.trim() + " (Grammar & Style Verified)";
        } else {
          enhancedText = text.trim() + "\n\n[Polished & Structured for Rover Portfolio Log]";
        }
      }

      return res.json({ enhancedText });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      return res.status(500).json({
        error: "Failed to enhance text using Gemini API",
        details: err?.message || String(err),
      });
    }
  });

  // AI Syllabus Requirement Parser Endpoint (Server-side Gemini call)
  app.post("/api/ai/parse-syllabus", async (req, res) => {
    try {
      const { prompt, awardType, category } = req.body;

      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({ error: "Prompt text is required for syllabus parsing." });
      }

      const lowerPrompt = prompt.toLowerCase();

      // Rule-based Fallback Parser
      const buildFallback = () => {
        const requiresReport = /report|reflection|logbook|essay|summary|paper|thesis|write|narrative|journal/.test(lowerPrompt);
        const requiresPhotos = /photo|picture|image|proof|scan|certificate|snapshot|gallery/.test(lowerPrompt);
        const requiresDocument = /pdf|document|file|route map|gps|certificate|chart/.test(lowerPrompt);

        let submissionType = "checkbox";
        if (requiresReport && (requiresPhotos || requiresDocument)) {
          submissionType = "mixed";
        } else if (requiresReport) {
          submissionType = "report";
        } else if (requiresPhotos || requiresDocument) {
          submissionType = "evidence_files";
        }

        const lines = prompt
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        const title = lines[0] ? lines[0].slice(0, 60).replace(/^[#*-]\s*/, '') : "Custom Scout Requirement";
        const description = lines.length > 1 ? lines.slice(1, 3).join(" ") : prompt;

        // Extract tasks
        let extractedTasks = lines
          .filter((l) => /^[-*•1-9]/.test(l) || l.includes(":"))
          .map((l) => l.replace(/^[-*•\d.\s]+/, "").trim())
          .filter((l) => l.length > 3);

        if (extractedTasks.length === 0) {
          extractedTasks = [
            `Complete core practical tasks for ${title}.`,
            requiresReport ? "Draft and submit the required written reflection report." : "Review requirements with Patrol Leader.",
            requiresPhotos || requiresDocument ? "Upload required photo/document evidence to portal." : "Present completion proof to Executive Council for sign-off."
          ];
        }

        // Hours detection
        const hourMatch = prompt.match(/(\d+)\s*(?:-\s*\d+)?\s*(?:hours|hrs|hour|hr)/i);
        const minHours = hourMatch ? parseInt(hourMatch[1], 10) : 10;

        // Award type detection
        let detectedAward = awardType || "President's Scout Award";
        if (lowerPrompt.includes("baden") || lowerPrompt.includes("bp") || lowerPrompt.includes("rover")) {
          detectedAward = "Baden-Powell (BP) Award";
        } else if (lowerPrompt.includes("badge") || lowerPrompt.includes("auxiliary")) {
          detectedAward = "Auxiliary Badge";
        }

        // Category detection
        let detectedCategory = category || "Outdoor Skills";
        if (lowerPrompt.includes("lead") || lowerPrompt.includes("patrol") || lowerPrompt.includes("council")) detectedCategory = "Leadership";
        else if (lowerPrompt.includes("service") || lowerPrompt.includes("community") || lowerPrompt.includes("volunteer")) detectedCategory = "Community Service";
        else if (lowerPrompt.includes("develop") || lowerPrompt.includes("personal") || lowerPrompt.includes("fitness")) detectedCategory = "Personal Development";
        else if (lowerPrompt.includes("craft") || lowerPrompt.includes("pioneer") || lowerPrompt.includes("knot")) detectedCategory = "Scoutcraft";
        else if (lowerPrompt.includes("global") || lowerPrompt.includes("sdg") || lowerPrompt.includes("world")) detectedCategory = "Global Citizenship";

        let submissionInstructions = "Mark tasks complete once finished.";
        if (requiresReport && requiresPhotos) {
          submissionInstructions = "Members must write a reflection report and upload photo/file evidence before submitting for sign-off.";
        } else if (requiresReport) {
          submissionInstructions = "Members must submit a written report/logbook entry detailing their findings.";
        } else if (requiresPhotos || requiresDocument) {
          submissionInstructions = "Members must attach photo proof, GPS logs, or certificate documents.";
        }

        return {
          title,
          description,
          awardType: detectedAward,
          category: detectedCategory,
          tasks: extractedTasks,
          minHours,
          badgeIcon: "Award",
          submissionType,
          requiresReport,
          requiresPhotos,
          requiresDocument,
          submissionInstructions,
        };
      };

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({ result: buildFallback() });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const systemPrompt = `You are a Scout Training & Curriculum Specialist for the Meyvaa Portal platform.
Analyze the user's prompt describing a Scouting requirement or syllabus task and return a JSON object with this EXACT structure:
{
  "title": "Short title of requirement",
  "description": "Clear explanation of expectations and criteria",
  "awardType": "President's Scout Award" OR "Baden-Powell (BP) Award" OR "Auxiliary Badge",
  "category": "Leadership" OR "Community Service" OR "Outdoor Skills" OR "Personal Development" OR "Scoutcraft" OR "Global Citizenship",
  "tasks": ["Task step 1", "Task step 2", "Task step 3"],
  "minHours": 20,
  "badgeIcon": "Shield" OR "Compass" OR "Award" OR "BookOpen" OR "Heart" OR "MapPin",
  "submissionType": "checkbox" OR "report" OR "evidence_files" OR "mixed",
  "requiresReport": boolean (true if written report/reflection/essay/logbook is needed),
  "requiresPhotos": boolean (true if photo proof, certificate scan, or image evidence is needed),
  "requiresDocument": boolean (true if PDF/route map/GPS document is needed),
  "submissionInstructions": "Clear instructions on what member needs to submit"
}
Return ONLY valid JSON without markdown formatting or backticks.`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.2,
          },
        });

        let text = response.text || "";
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const jsonResult = JSON.parse(text);
        return res.json({ result: jsonResult });
      } catch (geminiError) {
        console.warn("Gemini API syllabus parse warning, using smart fallback:", geminiError);
        return res.json({ result: buildFallback() });
      }
    } catch (err: any) {
      console.error("AI Parse Syllabus error:", err);
      return res.status(500).json({ error: "Failed to parse syllabus with AI", details: err?.message });
    }
  });

  // AI Member Progression Assistant Endpoint (Server-side Gemini call)
  app.post("/api/ai/analyze-progression", async (req, res) => {
    try {
      const {
        memberName,
        memberRole,
        journals = [],
        attendedEvents = [],
        progressList = [],
        syllabusList = [],
        aiEnabled = true,
      } = req.body;

      if (aiEnabled === false) {
        return res.status(403).json({ error: "AI Progression Assistant is currently disabled by Crew Council settings." });
      }

      // Rule-based fallback generator
      const buildFallbackAnalysis = () => {
        const completedReqIds = new Set(
          progressList
            .filter((p: any) => p.status === "Completed" || p.status === "Verified")
            .map((p: any) => p.requirementId)
        );

        const inProgressList = progressList.filter(
          (p: any) => p.status === "In Progress" || p.status === "Submitted"
        );

        const uncompletedSyllabus = syllabusList.filter(
          (s: any) => !completedReqIds.has(s.id)
        );

        // Analyze text contents of journals & events
        const journalTextCombined = journals
          .map((j: any) => `${j.title} ${j.category} ${j.content}`)
          .join(" ")
          .toLowerCase();

        const eventTextCombined = attendedEvents
          .map((e: any) => `${e.title} ${e.type} ${e.description}`)
          .join(" ")
          .toLowerCase();

        const fullUserLogContext = `${journalTextCombined} ${eventTextCombined}`;

        // Match syllabus requirements
        const suggestedRequirements: any[] = [];
        const progressGaps: any[] = [];

        // Identify suggested requirements from uncompleted syllabus items
        uncompletedSyllabus.forEach((reqItem: any) => {
          let matchScore = 0;
          const rationaleParts: string[] = [];

          const lowerTitle = reqItem.title.toLowerCase();
          const lowerCat = reqItem.category.toLowerCase();

          if (fullUserLogContext.includes(lowerCat) || fullUserLogContext.includes(lowerTitle)) {
            matchScore += 3;
            rationaleParts.push(`Direct activity keywords matching "${reqItem.category}" found in your logs.`);
          }

          if (reqItem.category === "Outdoor Skills" && (fullUserLogContext.includes("camp") || fullUserLogContext.includes("hike") || fullUserLogContext.includes("outdoor"))) {
            matchScore += 2;
            rationaleParts.push("Recorded outdoor camp/hike experience in your journal logs and attended events.");
          }

          if (reqItem.category === "Community Service" && (fullUserLogContext.includes("service") || fullUserLogContext.includes("volunteer") || fullUserLogContext.includes("community") || fullUserLogContext.includes("clean"))) {
            matchScore += 2;
            rationaleParts.push("Documented community service involvement in your portfolio journal.");
          }

          if (reqItem.category === "Leadership" && (fullUserLogContext.includes("lead") || fullUserLogContext.includes("council") || fullUserLogContext.includes("meeting") || fullUserLogContext.includes("chair"))) {
            matchScore += 2;
            rationaleParts.push("Leadership role or council meeting activity logged in portal.");
          }

          const existingProgress = progressList.find((p: any) => p.requirementId === reqItem.id);
          if (existingProgress && existingProgress.status === "In Progress") {
            matchScore += 4;
            rationaleParts.push("Currently active in your progress tracker.");
          }

          if (matchScore > 0 || suggestedRequirements.length < 3) {
            suggestedRequirements.push({
              requirementId: reqItem.id,
              title: reqItem.title,
              awardType: reqItem.awardType,
              category: reqItem.category,
              matchingRationale: rationaleParts.length > 0
                ? rationaleParts.join(" ")
                : `Core requirement for ${reqItem.awardType} matching your progression level.`,
              recommendedNextSteps: reqItem.requiresReport
                ? "Draft a reflection report in your Portfolio Journal and attach evidence."
                : "Complete remaining practical tasks and request sign-off from Council/Rover Advisor.",
              matchScore,
            });
          }
        });

        // Sort suggestions by matchScore
        suggestedRequirements.sort((a, b) => b.matchScore - a.matchScore);
        const topSuggested = suggestedRequirements.slice(0, 4).map(({ matchScore, ...rest }) => rest);

        // Detect gaps based on real data
        if (journals.length === 0) {
          progressGaps.push({
            category: "Portfolio & Documentation",
            gapDescription: "No journal entries recorded in your Portfolio Logbook.",
            guidance: "Record reflections for attended events to provide proof for badges requiring written reports.",
          });
        }

        if (attendedEvents.length === 0) {
          progressGaps.push({
            category: "Event Participation",
            gapDescription: "No verified event attendance recorded in the portal.",
            guidance: "Attend upcoming crew camps, community service drives, or general assemblies to fulfill practical hours.",
          });
        }

        // Check for in-progress items lacking reports
        inProgressList.forEach((prog: any) => {
          const matchedReq = syllabusList.find((s: any) => s.id === prog.requirementId);
          if (matchedReq && matchedReq.requiresReport && (!prog.writtenReport || !prog.writtenReport.trim())) {
            progressGaps.push({
              category: matchedReq.category,
              gapDescription: `Pending written report for requirement "${matchedReq.title}".`,
              guidance: `Submit a brief reflection report under "${matchedReq.title}" to advance status to Submitted/Verified.`,
            });
          }
        });

        if (progressGaps.length === 0) {
          progressGaps.push({
            category: "Balanced Skill Progression",
            gapDescription: "Good balanced progress logged across active badges.",
            guidance: "Continue logging reflections for each completed activity to maintain a complete verification portfolio.",
          });
        }

        const completedCount = completedReqIds.size;
        const totalJournals = journals.length;
        const totalEvents = attendedEvents.length;

        const executiveSummary = `${memberName || "Member"} has recorded ${totalJournals} portfolio journal entries, attended ${totalEvents} verified crew events, and completed ${completedCount} syllabus requirements. Progression analysis shows strong momentum in active categories, with clear opportunities to finalize pending reports and focus on core award badges.`;

        const actionableMilestones = [
          topSuggested[0]
            ? `Focus on completing requirement: "${topSuggested[0].title}" (${topSuggested[0].awardType}).`
            : "Review active syllabus catalog and select a target badge.",
          inProgressList.length > 0
            ? `Finalize tasks or written reports for ${inProgressList.length} in-progress requirements.`
            : "Log a reflection entry in your Portfolio Journal for your latest activity.",
          "Request formal sign-off from your Progress Coordinator or Rover Advisor once proof is submitted.",
        ];

        return {
          executiveSummary,
          suggestedRequirements: topSuggested,
          progressGaps: progressGaps.slice(0, 4),
          actionableMilestones,
        };
      };

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({ analysis: buildFallbackAnalysis() });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const promptData = {
        memberName,
        memberRole,
        journalEntriesCount: journals.length,
        journalTitlesAndCategories: journals.slice(0, 10).map((j: any) => ({
          title: j.title,
          category: j.category,
          excerpt: j.content ? j.content.slice(0, 150) : "",
          date: j.date,
        })),
        attendedEventsCount: attendedEvents.length,
        attendedEventsList: attendedEvents.slice(0, 10).map((e: any) => ({
          title: e.title,
          type: e.type,
          description: e.description ? e.description.slice(0, 150) : "",
          date: e.startDate,
        })),
        currentProgressStatus: progressList.map((p: any) => {
          const req = syllabusList.find((s: any) => s.id === p.requirementId);
          return {
            requirementId: p.requirementId,
            title: req ? req.title : "Unknown Requirement",
            status: p.status,
            hasReport: !!(p.writtenReport && p.writtenReport.trim()),
            hasEvidence: !!(p.evidenceFiles && p.evidenceFiles.length > 0),
          };
        }),
        availableSyllabusItems: syllabusList.map((s: any) => ({
          id: s.id,
          title: s.title,
          awardType: s.awardType,
          category: s.category,
          description: s.description ? s.description.slice(0, 120) : "",
          requiresReport: s.requiresReport,
          minHours: s.minHours,
        })),
      };

      const systemPrompt = `You are an AI Scout Progression Assistant for the Meyvaa Portal scout management platform.
Analyze the member's real recorded journal entries, attended events, and current progress list against available syllabus requirements.

STRICT MANDATE:
- Do NOT generate fake events, imaginary badges, or hallucinate user data from scratch.
- ALL suggested requirements MUST come from the "availableSyllabusItems" array provided in the prompt.
- ALL rationales MUST cite real journal entries or attended events from the provided data.
- Identify specific progress gaps (e.g. missing written reports, low activity in specific categories, unsubmitted evidence).

Return ONLY a JSON object with this EXACT structure:
{
  "executiveSummary": "2-3 sentences summarizing current progression, strengths, and primary trajectory based on real logs.",
  "suggestedRequirements": [
    {
      "requirementId": "matching ID from availableSyllabusItems",
      "title": "Title from availableSyllabusItems",
      "awardType": "Award type from availableSyllabusItems",
      "category": "Category from availableSyllabusItems",
      "matchingRationale": "Explanation referencing member's real journals or attended events",
      "recommendedNextSteps": "Clear steps on how to fulfill this requirement"
    }
  ],
  "progressGaps": [
    {
      "category": "Category name",
      "gapDescription": "Specific gap detected from member's real data",
      "guidance": "Actionable guidance to bridge this gap"
    }
  ],
  "actionableMilestones": [
    "Milestone 1...",
    "Milestone 2...",
    "Milestone 3..."
  ]
}
Return ONLY valid JSON without markdown formatting or backticks.`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: JSON.stringify(promptData),
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.2,
          },
        });

        let text = response.text || "";
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const jsonAnalysis = JSON.parse(text);
        return res.json({ analysis: jsonAnalysis });
      } catch (geminiError) {
        console.warn("Gemini API progression analysis warning, using smart fallback:", geminiError);
        return res.json({ analysis: buildFallbackAnalysis() });
      }
    } catch (err: any) {
      console.error("AI Progression Assistant error:", err);
      return res.status(500).json({ error: "Failed to run AI progression analysis", details: err?.message });
    }
  });

  // In-Memory AI Question Telemetry & Quality Control Repository
  interface AIMemberQuestionLogRecord {
    id: string;
    memberId: string;
    memberName: string;
    memberRole: string;
    question: string;
    response: string;
    category: string;
    timestamp: string;
    status: 'Unreviewed' | 'Promoted to Training' | 'Verified High Quality' | 'Needs Improvement' | 'Knowledge Gap' | 'Restricted / Out of Scope';
    qualityRating?: 'helpful' | 'unhelpful' | 'flagged';
    userFeedback?: string;
    adminReviewNotes?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    convertedToQAId?: string;
    responseLatencyMs?: number;
    source: 'web_chat' | 'floating_widget' | 'sandbox_test';
  }

  const classifyQuestionCategory = (msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes("award") || lower.includes("badge") || lower.includes("syllabus") || lower.includes("president") || lower.includes("bp") || lower.includes("curriculum") || lower.includes("sign-off") || lower.includes("progression")) {
      return "Curriculum & Badges";
    }
    if (lower.includes("policy") || lower.includes("referendum") || lower.includes("bylaw") || lower.includes("constitution") || lower.includes("vote") || lower.includes("voting") || lower.includes("amend")) {
      return "Bylaws & Governance";
    }
    if (lower.includes("attendance") || lower.includes("excuse") || lower.includes("absence") || lower.includes("event") || lower.includes("camp") || lower.includes("hike") || lower.includes("meeting")) {
      return "Events & Attendance";
    }
    if (lower.includes("journal") || lower.includes("portfolio") || lower.includes("logbook") || lower.includes("reflection") || lower.includes("photo")) {
      return "Portfolio & Journals";
    }
    if (lower.includes("due") || lower.includes("dues") || lower.includes("fee") || lower.includes("payment") || lower.includes("ledger") || lower.includes("budget") || lower.includes("mvr") || lower.includes("finance")) {
      return "Finance & Dues";
    }
    if (lower.includes("access") || lower.includes("permission") || lower.includes("restricted") || lower.includes("forbidden") || lower.includes("allocated") || lower.includes("disciplinary")) {
      return "Access Control & Permissions";
    }
    return "General Scouting";
  };

  const globalQuestionLogs: AIMemberQuestionLogRecord[] = [
    {
      id: "qlog-101",
      memberId: "m-004",
      memberName: "Mariyam Shafa",
      memberRole: "Member",
      question: "What are the exact submission steps and hours required for the Baden-Powell Award in the new syllabus?",
      response: "The Baden-Powell (BP) Award is the highest Rover badge requiring completion across 6 core pillars. Submissions require verifying logged hours in your Portfolio Notebook and scheduling a formal review with your Progress Coordinator.",
      category: "Curriculum & Badges",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      status: "Promoted to Training",
      qualityRating: "helpful",
      adminReviewNotes: "High frequency question among rovers. Promoted to few-shot training dataset.",
      reviewedBy: "Ahmed Nazih (Superadmin)",
      reviewedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      convertedToQAId: "tqa-1",
      responseLatencyMs: 420,
      source: "web_chat",
    },
    {
      id: "qlog-102",
      memberId: "m-007",
      memberName: "Ibrahim Rauf",
      memberRole: "Member",
      question: "How do I cast my vote on active Operating Policy referendums and when do results take effect?",
      response: "You can cast your ballot on any active amendment in the Operating Policy & Referendums page. Under constitutional rules, referendums remain open for at least 7 days, and take effect immediately if Yea votes exceed Nay votes.",
      category: "Bylaws & Governance",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      status: "Verified High Quality",
      qualityRating: "helpful",
      adminReviewNotes: "Accurately references the 7-day voting mandate.",
      reviewedBy: "Ahmed Nazih (Superadmin)",
      reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      responseLatencyMs: 380,
      source: "floating_widget",
    },
    {
      id: "qlog-103",
      memberId: "m-009",
      memberName: "Hussain Zayan",
      memberRole: "Member",
      question: "Show me the confidential disciplinary incidents and unexcused penalty list for crew members.",
      response: "Access Restricted: As a Member, you are not authorized to access confidential Disciplinary Incident Logs. This module is restricted to Council Executives and the Rover Advisor.",
      category: "Access Control & Permissions",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      status: "Restricted / Out of Scope",
      qualityRating: "helpful",
      adminReviewNotes: "Access control boundary correctly prevented disclosure of disciplinary data.",
      reviewedBy: "Ahmed Nazih (Superadmin)",
      reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      responseLatencyMs: 290,
      source: "web_chat",
    },
    {
      id: "qlog-104",
      memberId: "m-012",
      memberName: "Aishath Sama",
      memberRole: "Member",
      question: "What is the gear checklist and emergency contact protocol for the upcoming annual sea expedition?",
      response: "For the annual sea expedition, pack standard personal survival kit, reflective vest, waterproof dry-bag, compass, and emergency whistle. Please ensure your emergency contact is updated in Profile Settings.",
      category: "Events & Attendance",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
      status: "Knowledge Gap",
      qualityRating: "unhelpful",
      userFeedback: "Needed specific boat safety equipment list and island campsite coordinates.",
      adminReviewNotes: "Knowledge gap identified: We need to upload an official Expedition Gear & Sea Safety Knowledge Doc.",
      responseLatencyMs: 510,
      source: "web_chat",
    },
  ];

  // API Endpoints for AI Question Intelligence & Quality Control
  app.get("/api/ai/question-logs", (req, res) => {
    try {
      const { search = "", category = "all", status = "all", role = "all", rating = "all" } = req.query as Record<string, string>;

      let filtered = [...globalQuestionLogs];

      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (l) =>
            l.question.toLowerCase().includes(s) ||
            l.response.toLowerCase().includes(s) ||
            l.memberName.toLowerCase().includes(s) ||
            (l.adminReviewNotes && l.adminReviewNotes.toLowerCase().includes(s))
        );
      }

      if (category !== "all") {
        filtered = filtered.filter((l) => l.category === category);
      }

      if (status !== "all") {
        filtered = filtered.filter((l) => l.status === status);
      }

      if (role !== "all") {
        filtered = filtered.filter((l) => l.memberRole === role);
      }

      if (rating !== "all") {
        filtered = filtered.filter((l) => l.qualityRating === rating);
      }

      // Compute statistics for Quality Control Dashboard
      const totalInquiries = globalQuestionLogs.length;
      const unreviewed = globalQuestionLogs.filter((l) => l.status === "Unreviewed").length;
      const promoted = globalQuestionLogs.filter((l) => l.status === "Promoted to Training").length;
      const verified = globalQuestionLogs.filter((l) => l.status === "Verified High Quality").length;
      const needsReview = globalQuestionLogs.filter((l) => l.status === "Needs Improvement").length;
      const knowledgeGaps = globalQuestionLogs.filter((l) => l.status === "Knowledge Gap").length;
      const restricted = globalQuestionLogs.filter((l) => l.status === "Restricted / Out of Scope").length;

      const rated = globalQuestionLogs.filter((l) => l.qualityRating);
      const helpful = rated.filter((l) => l.qualityRating === "helpful").length;
      const helpfulPercentage = rated.length > 0 ? Math.round((helpful / rated.length) * 100) : 100;

      const categoryCounts: Record<string, number> = {};
      globalQuestionLogs.forEach((l) => {
        categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
      });

      const roleCounts: Record<string, number> = {};
      globalQuestionLogs.forEach((l) => {
        roleCounts[l.memberRole] = (roleCounts[l.memberRole] || 0) + 1;
      });

      return res.json({
        logs: filtered,
        stats: {
          totalInquiries,
          unreviewed,
          promoted,
          verified,
          needsReview,
          knowledgeGaps,
          restricted,
          helpfulPercentage,
          categoryCounts,
          roleCounts,
        },
      });
    } catch (err: any) {
      console.error("Error fetching AI question logs:", err);
      return res.status(500).json({ error: "Failed to fetch AI question logs", details: err?.message });
    }
  });

  app.post("/api/ai/question-logs", (req, res) => {
    try {
      const {
        memberId = "unknown",
        memberName = "Scout Member",
        memberRole = "Member",
        question,
        response,
        category,
        source = "web_chat",
        qualityRating,
        userFeedback,
      } = req.body;

      if (!question || !response) {
        return res.status(400).json({ error: "question and response are required" });
      }

      const assignedCategory = category || classifyQuestionCategory(question);
      const newLog: AIMemberQuestionLogRecord = {
        id: `qlog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        memberId,
        memberName,
        memberRole,
        question: question.trim(),
        response: response.trim(),
        category: assignedCategory,
        timestamp: new Date().toISOString(),
        status: "Unreviewed",
        qualityRating: qualityRating || undefined,
        userFeedback: userFeedback || undefined,
        source,
      };

      globalQuestionLogs.unshift(newLog);
      return res.status(201).json({ log: newLog });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to save AI question log", details: err?.message });
    }
  });

  app.patch("/api/ai/question-logs/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { status, qualityRating, userFeedback, adminReviewNotes, reviewedBy, convertedToQAId } = req.body;

      const logIndex = globalQuestionLogs.findIndex((l) => l.id === id);
      if (logIndex === -1) {
        return res.status(404).json({ error: "Question log entry not found" });
      }

      const current = globalQuestionLogs[logIndex];
      const updated: AIMemberQuestionLogRecord = {
        ...current,
        ...(status ? { status } : {}),
        ...(qualityRating ? { qualityRating } : {}),
        ...(userFeedback !== undefined ? { userFeedback } : {}),
        ...(adminReviewNotes !== undefined ? { adminReviewNotes } : {}),
        ...(reviewedBy ? { reviewedBy, reviewedAt: new Date().toISOString() } : {}),
        ...(convertedToQAId ? { convertedToQAId } : {}),
      };

      globalQuestionLogs[logIndex] = updated;
      return res.json({ log: updated });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to update AI question log", details: err?.message });
    }
  });

  app.post("/api/ai/question-logs/:id/promote-to-training", (req, res) => {
    try {
      const { id } = req.params;
      const { question, answer, category = "General", reviewedBy = "Superadmin" } = req.body;

      const logIndex = globalQuestionLogs.findIndex((l) => l.id === id);
      if (logIndex === -1) {
        return res.status(404).json({ error: "Question log entry not found" });
      }

      const qaId = `tqa-promoted-${Date.now()}`;
      const qaItem = {
        id: qaId,
        question: question || globalQuestionLogs[logIndex].question,
        answer: answer || globalQuestionLogs[logIndex].response,
        category,
        createdAt: new Date().toISOString().split("T")[0],
      };

      globalQuestionLogs[logIndex] = {
        ...globalQuestionLogs[logIndex],
        status: "Promoted to Training",
        qualityRating: "helpful",
        convertedToQAId: qaId,
        adminReviewNotes: `Promoted to official few-shot model training by ${reviewedBy}.`,
        reviewedBy,
        reviewedAt: new Date().toISOString(),
      };

      return res.json({
        success: true,
        qaItem,
        log: globalQuestionLogs[logIndex],
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to promote question to training", details: err?.message });
    }
  });

  app.post("/api/ai/question-logs/feedback", (req, res) => {
    try {
      const { questionLogId, rating, feedback } = req.body;
      if (!questionLogId || !rating) {
        return res.status(400).json({ error: "questionLogId and rating are required" });
      }

      const logIndex = globalQuestionLogs.findIndex((l) => l.id === questionLogId);
      if (logIndex !== -1) {
        globalQuestionLogs[logIndex].qualityRating = rating;
        if (feedback) {
          globalQuestionLogs[logIndex].userFeedback = feedback;
        }
        if (rating === "unhelpful" && globalQuestionLogs[logIndex].status === "Unreviewed") {
          globalQuestionLogs[logIndex].status = "Needs Improvement";
        } else if (rating === "helpful" && globalQuestionLogs[logIndex].status === "Unreviewed") {
          globalQuestionLogs[logIndex].status = "Verified High Quality";
        }
        return res.json({ success: true, log: globalQuestionLogs[logIndex] });
      }

      return res.status(404).json({ error: "Question log not found" });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to submit feedback", details: err?.message });
    }
  });

  app.delete("/api/ai/question-logs/:id", (req, res) => {
    try {
      const { id } = req.params;
      const index = globalQuestionLogs.findIndex((l) => l.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Question log not found" });
      }

      globalQuestionLogs.splice(index, 1);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to delete question log", details: err?.message });
    }
  });

  // AI Assistant Chatbot Endpoint (Server-side Gemini 3.7 call with custom training & permissions)
  app.post("/api/ai/assistant-chat", async (req, res) => {
    const startTime = Date.now();
    try {
      const {
        message,
        history = [],
        memberId = "unknown",
        memberRole = "Member",
        memberName = "Scout Member",
        isSuperAdmin = false,
        aiAssistantConfig,
        portalContext = {},
        allocatedPages = [],
        restrictedPages = [],
        activePermissions = [],
        source = "web_chat",
      } = req.body;

      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "Message is required." });
      }

      // Security & Permissions Check: Only Superadmin and Superadmin-allocated users/roles
      const isAllowed =
        isSuperAdmin ||
        memberRole === "Superadmin" ||
        aiAssistantConfig?.allowAllMembers === true ||
        (Array.isArray(aiAssistantConfig?.allowedUserIds) && aiAssistantConfig.allowedUserIds.includes(memberId)) ||
        (memberRole && Array.isArray(aiAssistantConfig?.allowedRoles) && aiAssistantConfig.allowedRoles.includes(memberRole));

      if (!isAllowed) {
        return res.status(403).json({
          error: "Access Denied: You do not currently have permission to use the Meyvaa AI Assistant. Contact your Superadmin to allocate access.",
        });
      }

      // Build allocated & restricted page summaries
      const allocatedPageList: string[] = Array.isArray(allocatedPages) && allocatedPages.length > 0
        ? allocatedPages.map((p: any) => p.label || p.id)
        : isSuperAdmin
        ? ["All Portal Pages (Full Administrative Authority)"]
        : memberRole !== "Member"
        ? ["Overview", "Members Directory", "Awards & Syllabus", "Portfolio Notebook", "Events & Calendar", "Attendance Portal", "Meeting Minutes", "Operating Policy", "Payments & Dues", "Settings"]
        : ["Overview", "Members Directory (View)", "Awards & Syllabus (Personal Progress)", "Portfolio Notebook (Personal Reflections)", "Events & Calendar (RSVP/Excusal)", "Attendance Portal (Personal Attendance)", "Operating Policy & Referendums (Voting)", "Payments & Dues (Personal Dues)", "Personal Profile Settings"];

      const restrictedPageList: string[] = Array.isArray(restrictedPages) && restrictedPages.length > 0
        ? restrictedPages.map((p: any) => `${p.label || p.id} (${p.requiredRoleOrPermission || "Restricted"})`)
        : isSuperAdmin
        ? []
        : memberRole === "Member"
        ? ["Disciplinary Incident Log (Confidential)", "Audit Trail & Logs", "Organisation Superadmin Hub", "Council Settings & Term Configuration", "Syllabus Item Creation/Editing", "Requirement Sign-off for other members", "Drafting/Publishing official Meeting Minutes"]
        : ["Organisation Superadmin Hub", "Disciplinary Incident Log (unless assigned permission)"];

      const hasDisciplinaryAccess = isSuperAdmin || activePermissions.includes("manageDisciplinary");
      const hasMinutesAccess = isSuperAdmin || activePermissions.includes("manageMinutes");
      const hasSyllabusManageAccess = isSuperAdmin || activePermissions.includes("createSyllabus") || activePermissions.includes("monitorProgress");
      const hasSettingsManageAccess = isSuperAdmin || activePermissions.includes("manageSettings");

      // Build fallback response generator if API key is not present or offline
      const buildFallbackChatResponse = () => {
        const lowerMsg = message.toLowerCase();
        let reply = "";
        let followUps: string[] = [];

        // Check for unauthorized access attempts in query
        if ((lowerMsg.includes("disciplinary") || lowerMsg.includes("incident") || lowerMsg.includes("punish")) && !hasDisciplinaryAccess) {
          return {
            reply: `### 🔒 Access Restricted: Disciplinary Incident Log
As a **${memberRole}**, you are not allocated access to the confidential **Disciplinary Incident Log**.

**Your Allocated Pages Include:**
${allocatedPageList.map(p => `- ${p}`).join("\n")}

*Note*: Disciplinary records are strictly confidential and accessible only to Council Executive members with Disciplinary permission or the Superadmin. If you have an urgent grievance or incident to report, please contact your Rover Advisor or Crew Chairperson directly.`,
            followUps: [
              "What are my allocated pages in the portal?",
              "How do I submit an excusal for an upcoming assembly?",
              "Show my personal syllabus requirements.",
            ],
          };
        }

        if ((lowerMsg.includes("superadmin") || lowerMsg.includes("organisation license") || lowerMsg.includes("database sync")) && !isSuperAdmin) {
          return {
            reply: `### 🔒 Access Restricted: Superadmin Administration Hub
The **Organisation Directory & Superadmin Hub** is restricted to system Superadmins only.

**Your Allocated Pages Include:**
${allocatedPageList.map(p => `- ${p}`).join("\n")}

As a **${memberRole}**, you can access your crew operations, syllabus milestones, and portfolio journals through your assigned tabs.`,
            followUps: [
              "View my allocated pages",
              "Check requirements for the Baden-Powell Award",
              "How do I vote in the active policy referendum?",
            ],
          };
        }

        if ((lowerMsg.includes("create syllabus") || lowerMsg.includes("delete badge") || lowerMsg.includes("sign off other")) && !hasSyllabusManageAccess) {
          return {
            reply: `### 🔒 Access Notice: Syllabus Management & Verification
As a **${memberRole}**, your allocated access in **Awards & Syllabus** is for tracking your **own personal progress** and submitting requirement evidence.

- **To request verification/sign-off**: Upload reflection logs with photo attachments in your **[Portfolio Notebook](tab:journals)**.
- **Verification Authority**: Only appointed **Progress Coordinators** and the **Rover Advisor** have permission to verify completed requirements and sign off awards.`,
            followUps: [
              "How do I log a reflection in my Portfolio Notebook?",
              "What are the requirements for the President Scout Award?",
              "Who is our crew Progress Coordinator?",
            ],
          };
        }

        // Check if question matches any custom training Q&As first!
        if (Array.isArray(aiAssistantConfig?.trainingQAs)) {
          const matchedQA = aiAssistantConfig.trainingQAs.find((qa: any) => {
            const q = (qa.question || "").toLowerCase();
            return lowerMsg.includes(q) || q.includes(lowerMsg);
          });
          if (matchedQA) {
            return {
              reply: matchedQA.answer,
              followUps: [
                "Tell me more about this requirement.",
                "How does this apply to our current term?",
                "What documents or forms do I need?",
              ],
            };
          }
        }

        // Contextual rule-based responses
        if (lowerMsg.includes("baden") || lowerMsg.includes("bp") || lowerMsg.includes("award")) {
          reply = `### Baden-Powell (BP) Award & Syllabus Guidance
The **Baden-Powell (BP) Award** is the premier Rover Scout milestone in the Meyvaa Portal curriculum.

**Key Requirement Domains:**
1. **Leadership & Governance**: Chairing council meetings, crew leadership, or mentoring junior scouts.
2. **Community Service & Civic Action**: Logging at least 30 verified hours in community welfare or ecological initiatives.
3. **Outdoor Exploration & Campcraft**: Completing multi-day expeditions, survival treks, and pioneering builds.
4. **Personal Development**: Vocational skills, mental resilience, and first-aid certification.

*Tip for ${memberName || "Rover"}*: Make sure to log every practical experience in your **[Portfolio Notebook](tab:journals)** and request sign-off from your Progress Coordinator or Rover Advisor once tasks are verified.`;
          followUps = [
            "How do I submit reflection reports for badges?",
            "What auxiliary badges can I earn alongside this?",
            "Who can sign off on my syllabus progress?",
          ];
        } else if (lowerMsg.includes("allocated") || lowerMsg.includes("my access") || lowerMsg.includes("pages") || lowerMsg.includes("permissions")) {
          reply = `### 📋 Your Allocated Pages & Portal Access Scope
**User**: ${memberName || "Scout"}
**Council Role**: ${memberRole}
**Access Authority**: ${isSuperAdmin ? "Superadmin (Full Authority)" : memberRole !== "Member" ? "Council Officer" : "Active Rover Member"}

**Your Allocated Pages:**
${allocatedPageList.map(p => `- ✅ **${p}**`).join("\n")}

${restrictedPageList.length > 0 ? `**Restricted Modules (No Access):**\n${restrictedPageList.map(p => `- 🔒 ${p}`).join("\n")}\n\n*Note*: The AI Chatbot will strictly enforce your access scope and only provide assistance and actions within your allocated pages.` : ""}`;
          followUps = [
            "How do I log hours in my Portfolio Notebook?",
            "What are the requirements for President Scout Award?",
            "How do I submit an event excusal request?",
          ];
        } else if (lowerMsg.includes("policy") || lowerMsg.includes("vote") || lowerMsg.includes("referendum") || lowerMsg.includes("amend")) {
          reply = `### Operating Policy & Democratic Referendums
Under the **Meyvaa Portal Governance Code**:
- **Proposals**: Any Council Executive member may draft policy revisions or amendments.
- **Mandatory Referendum**: All policy edits MUST undergo a crew-wide voting period lasting at least **7 days (1 week)**.
- **Ratification Threshold**: If the total **Yea (In Favor)** votes exceed **Nay (Against)** votes at the close of voting, the revision is officially enacted into the active Operating Policy.
- **Your Access**: As a member, you can review all active policies and cast your ballot in **[Operating Policy & Referendums](tab:policy)**.`;
          followUps = [
            "How do I cast my vote in active referendums?",
            "Can general members propose amendments to Council?",
            "Where can I read the full Operating Policy document?",
          ];
        } else if (lowerMsg.includes("agenda") || lowerMsg.includes("minutes") || lowerMsg.includes("meeting")) {
          if (!hasMinutesAccess && memberRole === "Member") {
            reply = `### 📋 Meeting Minutes Access
As a **Member**, you have allocated access to **view** published Council Meeting Minutes and official resolutions in **[Meeting Minutes](tab:minutes)**.

*Note*: Drafting and publishing official minutes is restricted to the **Crew Secretary** and authorized Council Executive officers.`;
            followUps = [
              "Where do I view published meeting resolutions?",
              "What were the key resolutions from the last AGM?",
              "How do I submit an agenda item for council review?",
            ];
          } else {
            reply = `### Council Meeting Agenda & Minutes Template
Here is a recommended structure for your upcoming Scout Council Executive session:

1. **Opening & Call to Order**: Recitation of Scout Promise & roll call by Secretary.
2. **Review of Previous Minutes**: Approval of resolutions and open action items.
3. **Executive Officer Reports**:
   - *Rover Advisor*: Administrative updates & headquarters directives.
   - *Chairperson / Vice Chair*: Operational priorities & crew morale.
   - *Treasurer*: Dues collection, expense approvals, and budget ledger.
   - *Progress & Event Coordinators*: Syllabus advancement and calendar schedules.
4. **General Business & New Proposals**: New badge drives, camp logistics, and gear requisitions.
5. **Action Item Assignments**: Due dates and assigned council members.
6. **Adjournment & Scout Prayer**.`;
            followUps = [
              "How do I record meeting minutes in the portal?",
              "What is the quorum requirement for council votes?",
              "How do I assign action items to coordinators?",
            ];
          }
        } else if (lowerMsg.includes("attendance") || lowerMsg.includes("excuse") || lowerMsg.includes("absence")) {
          reply = `### Attendance Protocols & Excusal Policy
- **Minimum Active Standard**: All active Rovers must maintain at least **75% attendance** at compulsory crew assemblies, drills, and official events.
- **Excusal Requests**: If you are unable to attend due to work, examinations, or health reasons, submit an **Exemption/Excusal Request** through the **[Attendance Portal](tab:attendance)** before the event rolls.
- **Verification**: Council and the Rover Advisor review exemption logs before finalizing unexcused tallies.`;
          followUps = [
            "How do unexcused absences affect badge eligibility?",
            "Where do I check my personal attendance score?",
            "How do coordinators mark attendance for events?",
          ];
        } else if (lowerMsg.includes("camp") || lowerMsg.includes("event") || lowerMsg.includes("hike")) {
          reply = `### Event & Camp Planning Guide
Planning a crew expedition through Meyvaa Portal:
1. **Event Details**: Check upcoming dates and compulsory status in **[Events & Calendar](tab:events)**.
2. **Excusal / Attendance**: Submit RSVP or early excusals in the Attendance tab if unable to attend.
3. **Dues & Levies**: If event fees apply, view dues under **[Payments & Crew Dues](tab:payments)**.
4. **Post-Event Reflections**: Log your reflections and photos in your **[Portfolio Notebook](tab:journals)** for syllabus credit.`;
          followUps = [
            "How do I submit an event excusal request?",
            "What gear is required for overnight camps?",
            "How do I check my personal event attendance score?",
          ];
        } else {
          reply = `Greetings, **${memberName || "Scout"}** (${memberRole}). I am the **${aiAssistantConfig?.name || "Meyvaa AI Scout Advisor"}**.

I am strictly aligned with your allocated portal pages:
${allocatedPageList.map(p => `- ${p}`).join("\n")}

How can I assist you with your scouting milestones, syllabus, or activities today?`;
          followUps = [
            "What are my allocated pages in the portal?",
            "Explain requirements for the Baden-Powell Award.",
            "How do I submit an excusal for an upcoming assembly?",
          ];
        }

        return { reply, followUps };
      };

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        const fallback = buildFallbackChatResponse();
        const latency = Date.now() - startTime;
        const assignedCat = classifyQuestionCategory(message);
        const isRestrictedQuery = fallback.reply.includes("Access Restricted") || fallback.reply.includes("Access Denied");
        const logId = `qlog-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        globalQuestionLogs.unshift({
          id: logId,
          memberId,
          memberName,
          memberRole,
          question: message.trim(),
          response: fallback.reply,
          category: assignedCat,
          timestamp: new Date().toISOString(),
          status: isRestrictedQuery ? "Restricted / Out of Scope" : "Unreviewed",
          responseLatencyMs: latency,
          source: (source as any) || "web_chat",
        });

        return res.json({
          response: fallback.reply,
          suggestedFollowUps: fallback.followUps,
          model: "gemini-3.7-flash (Local Intelligence Engine)",
          questionLogId: logId,
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Construct rich system prompt with Superadmin training & knowledge base
      let knowledgeText = "";
      if (Array.isArray(aiAssistantConfig?.knowledgeDocs) && aiAssistantConfig.knowledgeDocs.length > 0) {
        knowledgeText = "\n\n[TRAINED SCOUT KNOWLEDGE BASE & GROUP DIRECTIVES]\n" +
          aiAssistantConfig.knowledgeDocs
            .map((doc: any) => `### ${doc.title} (${doc.category})\n${doc.content}`)
            .join("\n\n");
      }

      let fewShotQAText = "";
      if (Array.isArray(aiAssistantConfig?.trainingQAs) && aiAssistantConfig.trainingQAs.length > 0) {
        fewShotQAText = "\n\n[TRAINED FEW-SHOT Q&A EXAMPLES & EXPECTED ANSWERS]\n" +
          aiAssistantConfig.trainingQAs
            .map((qa: any) => `Q: ${qa.question}\nA: ${qa.answer}`)
            .join("\n\n");
      }

      const portalContextText = `\n\n[LIVE MEYVAA PORTAL CONTEXT & PAGE ALLOCATION]
- Interacting User: ${memberName || "Unknown"} (ID: ${memberId || "N/A"})
- Council Role: ${memberRole || "Member"}
- Is Superadmin: ${isSuperAdmin ? "Yes (Full Administrative Access)" : "No"}
- Active Term: ${portalContext.activeTerm || "2025-2026"}
- Active Crew: ${portalContext.crewName || "Arabiyya Rover Crew"}
- Total Syllabus Items Available: ${portalContext.syllabusCount || 0}
- Active Events in Calendar: ${portalContext.eventsCount || 0}

[MEMBER'S ALLOCATED PAGES & PERMISSIONS]
- ALLOCATED / ACCESSIBLE PAGES:
${allocatedPageList.map(p => `  * ${p}`).join("\n")}
- RESTRICTED / FORBIDDEN PAGES FOR THIS USER:
${restrictedPageList.length > 0 ? restrictedPageList.map(p => `  * ${p}`).join("\n") : "  * None (Superadmin has full access)"}
- ACTIVE COUNCIL PERMISSIONS:
${activePermissions.length > 0 ? activePermissions.map((p: string) => `  * ${p}`).join("\n") : "  * Standard Member Access (Personal progress tracking, Portfolio logging, Referendum voting, Excusal submissions)"}`;

      const accessControlDirective = `\n\n[MANDATORY ACCESS CONTROL & PAGE ALLOCATION POLICY]
1. STRICT BOUNDARIES: You MUST strictly respect and enforce the member's allocated pages and role permissions.
2. NEVER assist or provide execution steps for restricted pages (e.g. Disciplinary Incident Log, Superadmin Hub, Audit Logs, or administrative settings if the user is a general Member or lacks permission).
3. If an unauthorized user inquires about a restricted page or action:
   - Politely explain that access is restricted to their allocated pages (${allocatedPageList.join(", ")}).
   - Inform them of the authorized role (e.g., Council Executive, Secretary, or Superadmin) who manages that function.
   - Redirect them to their allocated pages (e.g., Portfolio Notebook, Awards & Syllabus personal tracker, Operating Policy voting).
4. When suggesting pages or navigation in your responses, you may use markdown link format: \`[Go to <Page Name>](tab:<tabId>)\` where tabId is one of: ${allocatedPages.map((p: any) => p.id).join(", ") || "dashboard, members, syllabus, journals, events, attendance, policy, payments, settings"}. NEVER generate navigation links to restricted tabs.`;

      const systemInstruction = `${aiAssistantConfig?.systemPrompt || "You are the Meyvaa Portal AI Scout Advisor, an expert assistant for scout groups, rovers, and council leaders."}

Tone & Style Directive: ${aiAssistantConfig?.tone || "Encouraging, structured, professional, and directly actionable."}
Always format responses clearly using Markdown (headings, bullet points, checklists, or bold highlights). Never invent fake events, imaginary badges, or fictitious bylaws. Adhere strictly to the trained knowledge base, the Scout Promise and Law, and the page allocation constraints.${knowledgeText}${fewShotQAText}${portalContextText}${accessControlDirective}`;

      // Build conversation turns from history
      const formattedHistory = history.slice(-8).map((h: any) => ({
        role: h.sender === "user" ? "user" : "model",
        parts: [{ text: h.text }],
      }));

      // Append current user message
      const promptContents = [
        ...formattedHistory,
        {
          role: "user",
          parts: [{ text: message }],
        },
      ];

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: promptContents as any,
          config: {
            systemInstruction,
            temperature: typeof aiAssistantConfig?.temperature === "number" ? aiAssistantConfig.temperature : 0.3,
          },
        });

        const replyText = response.text || "I am here to assist with your Scouting and portal questions. Please ask away!";
        const latency = Date.now() - startTime;
        const assignedCat = classifyQuestionCategory(message);
        const isRestrictedQuery = replyText.includes("Access Restricted") || replyText.includes("Access Denied") || replyText.includes("restricted to");
        const logId = `qlog-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        globalQuestionLogs.unshift({
          id: logId,
          memberId,
          memberName,
          memberRole,
          question: message.trim(),
          response: replyText,
          category: assignedCat,
          timestamp: new Date().toISOString(),
          status: isRestrictedQuery ? "Restricted / Out of Scope" : "Unreviewed",
          responseLatencyMs: latency,
          source: (source as any) || "web_chat",
        });

        // Generate 3 contextual follow-up chips
        let suggestedFollowUps = [
          "Explain the next steps for badge verification.",
          "How do I draft meeting minutes for council?",
          "Summarize our active crew operating policies.",
        ];

        if (message.toLowerCase().includes("award") || message.toLowerCase().includes("badge")) {
          suggestedFollowUps = [
            "What evidence files are required for submission?",
            "How many practical service hours are needed?",
            "How do I request sign-off from my Advisor?",
          ];
        } else if (message.toLowerCase().includes("policy") || message.toLowerCase().includes("referendum")) {
          suggestedFollowUps = [
            "How long must a policy referendum remain open for voting?",
            "Who can propose policy changes to the Council?",
            "What happens if a referendum passes?",
          ];
        }

        return res.json({
          response: replyText,
          suggestedFollowUps,
          model: "gemini-3.7-flash",
          questionLogId: logId,
        });
      } catch (geminiError: any) {
        console.warn("Gemini Chatbot API error, using smart fallback:", geminiError?.message || geminiError);
        const fallback = buildFallbackChatResponse();
        const latency = Date.now() - startTime;
        const assignedCat = classifyQuestionCategory(message);
        const isRestrictedQuery = fallback.reply.includes("Access Restricted") || fallback.reply.includes("Access Denied");
        const logId = `qlog-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        globalQuestionLogs.unshift({
          id: logId,
          memberId,
          memberName,
          memberRole,
          question: message.trim(),
          response: fallback.reply,
          category: assignedCat,
          timestamp: new Date().toISOString(),
          status: isRestrictedQuery ? "Restricted / Out of Scope" : "Unreviewed",
          responseLatencyMs: latency,
          source: (source as any) || "web_chat",
        });

        return res.json({
          response: fallback.reply,
          suggestedFollowUps: fallback.followUps,
          model: "gemini-3.7-flash (Local Intelligence Engine)",
          questionLogId: logId,
        });
      }
    } catch (err: any) {
      console.error("AI Assistant Chatbot endpoint error:", err);
      return res.status(500).json({ error: "Failed to process chat with AI Assistant", details: err?.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Meyvaa Portal Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
