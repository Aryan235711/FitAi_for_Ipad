import { pathToFileURL } from "node:url";
import OpenAI from "openai";
interface ChangeImpact {
  riskLevel: "low" | "medium" | "high";
  affectedComponents: string[];
  testSuggestions: string[];
  confidence: number;
  reasoning: string[];
}

interface GitDiffFile {
  path: string;
  additions: number;
  deletions: number;
  patch: string;
}

interface GitDiff {
  files: GitDiffFile[];
  commit: string;
  author: string;
}

interface RiskFactors {
  cssChanges: number;
  animationChanges: number;
  chartComponents: number;
  bundleConfig: number;
  reasons: string[];
  confidence: number;
}

class AIRegressionDetector {
  private openai?: OpenAI;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  async analyzeCommitImpact(diff: GitDiff): Promise<ChangeImpact> {
    const baseline = await this.ruleBasedAnalysis(diff);

    if (!this.openai || baseline.riskLevel === "low") {
      return baseline;
    }

    return this.enhanceWithLLM(diff, baseline);
  }

  private async ruleBasedAnalysis(diff: GitDiff): Promise<ChangeImpact> {
    const riskFactors = this.calculateRiskFactors(diff);

    return {
      riskLevel: this.determineRiskLevel(riskFactors),
      affectedComponents: this.identifyAffectedComponents(diff),
      testSuggestions: this.generateTestSuggestions(diff),
      confidence: riskFactors.confidence,
      reasoning: riskFactors.reasons,
    };
  }

  private calculateRiskFactors(diff: GitDiff): RiskFactors {
    const factors: RiskFactors = {
      cssChanges: 0,
      animationChanges: 0,
      chartComponents: 0,
      bundleConfig: 0,
      reasons: [],
      confidence: 0,
    };

    diff.files.forEach((file) => {
      const totalChanges = file.additions + file.deletions;
      const lowerPatch = file.patch.toLowerCase();
      const lowerPath = file.path.toLowerCase();

      if (lowerPath.endsWith(".css") || lowerPath.includes("chart-effects")) {
        factors.cssChanges += totalChanges;
        factors.reasons.push(`CSS changes in ${file.path}`);
      }

      if (lowerPatch.includes("animation") || lowerPatch.includes("keyframes")) {
        factors.animationChanges += 1;
        factors.reasons.push(`Animation changes detected in ${file.path}`);
      }

      if (lowerPath.includes("/charts/") || lowerPath.includes("chart")) {
        factors.chartComponents += 1;
        factors.reasons.push(`Chart component modified: ${file.path}`);
      }

      if (lowerPath.includes("vite.config") || lowerPath.includes("bundle")) {
        factors.bundleConfig += 1;
        factors.reasons.push(`Bundle configuration touched: ${file.path}`);
      }
    });

    factors.confidence = Math.min(0.9, factors.reasons.length * 0.2 + 0.3);
    return factors;
  }

  private determineRiskLevel(factors: RiskFactors): "low" | "medium" | "high" {
    if (factors.animationChanges > 0 || factors.bundleConfig > 0) {
      return "high";
    }

    if (factors.cssChanges > 10 || factors.chartComponents > 1) {
      return "medium";
    }

    return "low";
  }

  private identifyAffectedComponents(diff: GitDiff): string[] {
    const components = new Set<string>();

    diff.files.forEach((file) => {
      if (file.path.includes("/charts/")) {
        const component = file.path.split("/").pop()?.replace(/\.(tsx|ts|js|jsx)$/i, "");
        if (component) {
          components.add(component);
        }
      }
    });

    return Array.from(components);
  }

  private generateTestSuggestions(diff: GitDiff): string[] {
    const suggestions = new Set<string>();

    diff.files.forEach((file) => {
      if (file.path.includes("VitalityOrb")) {
        suggestions.add("Run VitalityOrb visual + animation tests");
      }

      if (file.path.endsWith(".css") || file.path.includes("chart-effects")) {
        suggestions.add("Update visual regression snapshots");
      }

      if (file.path.includes("vite.config")) {
        suggestions.add("Verify bundle size limits");
      }

      if (file.path.includes("/e2e/") || file.path.includes("playwright")) {
        suggestions.add("Execute relevant Playwright specs");
      }
    });

    return Array.from(suggestions);
  }

  private async enhanceWithLLM(
    diff: GitDiff,
    baseline: ChangeImpact,
  ): Promise<ChangeImpact> {
    const prompt = this.buildAnalysisPrompt(diff, baseline);

    try {
      const response = await this.openai!.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.1,
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      });

      const llmResult = this.parseLLMResponse(
        response.choices[0]?.message?.content ?? "",
      );

      return {
        ...baseline,
        riskLevel: llmResult.riskLevel ?? baseline.riskLevel,
        reasoning: [...baseline.reasoning, ...(llmResult.reasoning ?? [])],
        testSuggestions: [
          ...new Set([
            ...baseline.testSuggestions,
            ...(llmResult.testSuggestions ?? []),
          ]),
        ],
        confidence: Math.min(0.95, baseline.confidence + 0.2),
      };
    } catch (error) {
      console.warn("LLM analysis failed; returning rule-based result.", error);
      return baseline;
    }
  }

  private buildAnalysisPrompt(diff: GitDiff, baseline: ChangeImpact): string {
    const fileSummaries = diff.files
      .map((file) => {
        const summary = `${file.path}: +${file.additions}/-${file.deletions}`;
        const patchSnippet = (file.patch || "").slice(0, 400);
        return `${summary}\n${patchSnippet}${
          file.patch && file.patch.length > 400 ? "..." : ""
        }`;
      })
      .join("\n\n");

    return `Analyze this React/TypeScript code change for UI regression risk.

BASELINE ANALYSIS:
Risk: ${baseline.riskLevel}
Components: ${baseline.affectedComponents.join(", ") || "(none)"}
Reasoning: ${baseline.reasoning.join("; ") || "(none)"}
Suggested Tests: ${baseline.testSuggestions.join(", ") || "(none)"}

CODE CHANGES:
${fileSummaries}

Focus on:
1. CSS animation timing/keyframes failures
2. Bundle or lazy-loading impacts on CSS/JS ordering
3. Chart rendering regressions
4. Accessibility or reduced-motion regressions

Respond strictly in JSON with the shape:
{
  "riskLevel": "low|medium|high",
  "reasoning": ["specific technical concerns"],
  "testSuggestions": ["actionable test recommendations"]
}`;
  }

  private parseLLMResponse(content: string): Partial<ChangeImpact> {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {};
      }
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.warn("Failed to parse LLM response", error);
      return {};
    }
  }
}

export { AIRegressionDetector };
export type { ChangeImpact, GitDiff };

const isDirectExecution = (() => {
  const target = process.argv[1];
  if (!target) {
    return false;
  }
  try {
    return import.meta.url === pathToFileURL(target).href;
  } catch {
    return false;
  }
})();

if (isDirectExecution) {
  (async () => {
    const detector = new AIRegressionDetector();
    const sampleDiff: GitDiff = {
      files: [
        {
          path: "client/src/components/charts/VitalityOrb.tsx",
          additions: 10,
          deletions: 2,
          patch: "animation: vitality-orb-spin",
        },
        {
          path: "client/src/components/charts/chart-effects.css",
          additions: 8,
          deletions: 0,
          patch: "@keyframes vitality-orb-spin",
        },
      ],
      commit: "local",
      author: process.env.USER || "developer",
    };

    const result = await detector.analyzeCommitImpact(sampleDiff);
    console.log(JSON.stringify(result, null, 2));
  })().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
