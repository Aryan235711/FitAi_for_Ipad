import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { AIRegressionDetector } from "./ai-regression-detector.ts";
import type { GitDiff } from "./ai-regression-detector.ts";

interface TestPlan {
  visual: boolean;
  e2e: boolean;
  unit: boolean;
  bundle: boolean;
  components: string[];
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const runCommand = (args: string[]) => {
  const result = spawnSync(npmCommand, args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${npmCommand} ${args.join(" ")}`);
  }
};

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
  } catch {
    listOutput = runGit(["diff", "--name-only"], { trim: true });
  }

  const files = listOutput
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean);

  if (files.length === 0) {
    return [];
  }

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

class SmartTestRunner {
  constructor(private detector = new AIRegressionDetector()) {}

  async run(): Promise<void> {
    const files = collectDiffFiles();
    const diff: GitDiff = {
      files,
      commit: process.env.GITHUB_SHA || "local",
      author: process.env.GITHUB_ACTOR || process.env.USER || "developer",
    };

    const plan = await this.generateTestPlan(diff);
    this.logPlan(plan);
    await this.executeTestPlan(plan);
  }

  private async generateTestPlan(diff: GitDiff): Promise<TestPlan> {
    if (diff.files.length === 0) {
      return {
        visual: true,
        e2e: false,
        unit: false,
        bundle: true,
        components: [],
      };
    }

    const analysis = await this.detector.analyzeCommitImpact(diff);

    return {
      visual: true,
      e2e: analysis.riskLevel === "high",
      unit: analysis.affectedComponents.length > 0,
      bundle: analysis.reasoning.some((reason) => reason.toLowerCase().includes("bundle")),
      components: analysis.affectedComponents,
    };
  }

  private logPlan(plan: TestPlan) {
    console.log("🧪 Smart Test Plan");
    console.log(`  Visual regression: ${plan.visual ? "yes" : "no"}`);
    console.log(`  Bundle check: ${plan.bundle ? "yes" : "no"}`);
    console.log(`  Unit tests: ${plan.unit ? "yes" : "no"}`);
    console.log(`  E2E tests: ${plan.e2e ? "yes" : "no"}`);
    if (plan.components.length > 0) {
      console.log(`  Targeted components: ${plan.components.join(", ")}`);
    }
  }

  private async executeTestPlan(plan: TestPlan) {
    if (plan.visual) {
      console.log("📸 Running visual regression tests...");
      runCommand(["run", "test:visual"]);
    }

    if (plan.bundle) {
      console.log("📦 Checking bundle sizes...");
      runCommand(["run", "bundle:check"]);
    }

    if (plan.unit) {
      if (plan.components.length > 0) {
        console.log(`🔬 Running unit/integration tests for components: ${plan.components.join(", ")}`);
      } else {
        console.log("🔬 Running unit tests (no specific components detected)...");
      }
      runCommand(["run", "test"]);
    }

    if (plan.e2e) {
      console.log("🎭 Running full E2E suite...");
      runCommand(["run", "test:e2e"]);
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const runner = new SmartTestRunner();
  runner.run().catch((error) => {
    console.error("Smart test runner failed:", error);
    process.exit(1);
  });
}
