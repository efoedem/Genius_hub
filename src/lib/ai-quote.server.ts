import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AiEvaluationSchema = z.object({
  detectedDomain: z.string(),
  technicalComplexity: z.enum(["standard", "advanced", "expert"]),
  tediumScore: z.number().min(1).max(10),
  reasoning: z.string(),
  estimatedHours: z.number(),
  suggestedMultiplier: z.number(),
});

type AiEvaluation = z.infer<typeof AiEvaluationSchema>;

export const analyzeProjectComplexity = createServerFn()
  .validator(
    z.object({
      serviceKey: z.string(),
      projectBrief: z.string(),
      fileName: z.string().optional(),
      fileTextExtract: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<AiEvaluation> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    const fallbackResponse: AiEvaluation = {
      detectedDomain: data.serviceKey,
      technicalComplexity: "standard",
      tediumScore: 3,
      reasoning: "Standard project evaluation applied (default rate).",
      estimatedHours: 2,
      suggestedMultiplier: 1.0,
    };

    if (!apiKey) {
      console.warn("ANTHROPIC_API_KEY missing in .env. Using fallback quote.");
      return fallbackResponse;
    }

    try {
      const prompt = `
        You are an expert technical estimator for an engineering and academic services agency.
        Analyze the following project brief and attached file text to assess its technical tedium and complexity.

        Service Category: ${data.serviceKey}
        Project Brief: "${data.projectBrief}"
        Attached File Name: "${data.fileName || "None"}"
        Extracted Content Excerpt: "${data.fileTextExtract || "None"}"

        Complexity tiers:
        - "standard" (Multiplier: 1.0)
        - "advanced" (Multiplier: 1.4)
        - "expert" (Multiplier: 1.9)

        Return strictly a raw valid JSON object (no markdown, no backticks) matching this structure:
        {
          "detectedDomain": "string",
          "technicalComplexity": "standard" | "advanced" | "expert",
          "tediumScore": 3,
          "reasoning": "brief explanation",
          "estimatedHours": 2,
          "suggestedMultiplier": 1.0
        }
      `;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Anthropic API HTTP Error:", res.status, errorText);
        return fallbackResponse;
      }

      const json = await res.json();
      const rawText = json.content?.[0]?.text;

      if (!rawText) return fallbackResponse;

      // Clean out potential markdown backticks if Claude adds them
      const cleanedText = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleanedText);

      return AiEvaluationSchema.parse(parsed);
    } catch (error: any) {
      console.warn("Claude AI evaluation failed, using fallback profile:", error?.message || error);
      return fallbackResponse;
    }
  });
