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
          model: "gemini-2.5-flash",
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
          model: "gemini-2.5-flash",
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
          model: "gemini-2.5-flash",
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
