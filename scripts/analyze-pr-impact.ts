import { spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { AIRegressionDetector } from "./ai-regression-detector.ts";
import type { GitDiff } from "./ai-regression-detector.ts";

const runGit = (args: string[], { trim = true } = {}): string => {
  const result = spawnSync("git", args, { encoding: "utf-8" });
  if (result.status !== 0) {
    const stderr = result.stderr?.toString().trim();
    throw new Error(stderr || `git ${args.join(" ")} failed`);
  }
  return trim ? result.stdout.trim() : result.stdout;
};

const collectDiffFiles = (): GitDiff["files"] => {
  let listOutput = "";
  try {
    listOutput = runGit(["diff", "--name-only", "HEAD~1", "HEAD"]);
  } catch (error) {
    console.warn("Unable to compute diff against HEAD~1; falling back to current changes.");
    listOutput = runGit(["diff", "--name-only"], { trim: true });
  }

  const files = listOutput
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean);

  return files.map((file) => {
    let additions = 0;
    let deletions = 0;

    try {
      const stats = runGit(["diff", "--numstat", "HEAD~1", "HEAD", "--", file]);
      const [adds = "0", dels = "0"] = stats.split(/\s+/);
      additions = Number(adds) || 0;
      deletions = Number(dels) || 0;
    } catch {
      try {
        const stats = runGit(["diff", "--numstat", "--", file]);
        const [adds = "0", dels = "0"] = stats.split(/\s+/);
        additions = Number(adds) || 0;
        deletions = Number(dels) || 0;
      } catch {
        // ignore
      }
    }

    let patch = "";
    try {
      patch = runGit(["diff", "HEAD~1", "HEAD", "--", file], { trim: false });
    } catch {
      try {
        patch = runGit(["diff", "--", file], { trim: false });
      } catch {
        patch = "";
      }
    }

    return {
      path: file,
      additions,
      deletions,
      patch,
    };
  });
};

async function main() {
  const detector = new AIRegressionDetector();
  const files = collectDiffFiles();

  const diff: GitDiff = {
    files,
    commit: process.env.GITHUB_SHA || "local",
    author: process.env.GITHUB_ACTOR || process.env.USER || "developer",
  };

  console.log("🤖 Running AI impact analysis...");
  if (process.env.OPENAI_API_KEY) {
    console.log("🧠 LLM enhancement enabled");
  } else {
    console.log("📋 Rule-based analysis only (set OPENAI_API_KEY to enable LLM)");
  }

  const result = await detector.analyzeCommitImpact(diff);

  console.log("🤖 AI Impact Analysis\n=======================");
  console.log(`Risk Level: ${result.riskLevel.toUpperCase()}`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
  console.log(`Affected Components: ${result.affectedComponents.join(", ") || "(none)"}`);
  console.log(`Suggested Tests: ${result.testSuggestions.join(", ") || "(none)"}`);
  console.log(`Reasoning: ${result.reasoning.join("; ") || "(none)"}`);

  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    appendFileSync(githubOutput, `risk-level=${result.riskLevel}\n`);
    appendFileSync(githubOutput, `confidence=${result.confidence}\n`);
  }

  if (result.riskLevel === "high") {
    console.log("\n⚠️  HIGH RISK: Manual review recommended.");
  }
}

main().catch((error) => {
  console.error("AI impact analysis failed:", error);
  process.exit(1);
});
