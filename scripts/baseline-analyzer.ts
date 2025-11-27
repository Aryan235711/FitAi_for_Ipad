import { execSync } from "node:child_process";
import { stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

interface BaselineChange {
  file: string;
  status: "added" | "modified" | "deleted";
  size: number;
  lastModified?: Date;
}

class BaselineAnalyzer {
  private readonly screenshotDir = "e2e/__screenshots__";

  async analyzeChanges(): Promise<BaselineChange[]> {
    let gitStatusOutput = "";
    try {
      gitStatusOutput = execSync(`git status --porcelain "${this.screenshotDir}/"`, {
        encoding: "utf-8",
      });
    } catch {
      return [];
    }

    const lines = gitStatusOutput
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const results: BaselineChange[] = [];

    for (const line of lines) {
      const statusToken = line.slice(0, 2).trim();
      const filePath = line.slice(3).trim();
      if (!filePath) continue;

      const fullPath = path.join(process.cwd(), filePath);
      let size = 0;
      let lastModified: Date | undefined;

      try {
        const fileStats = await stat(fullPath);
        size = fileStats.size;
        lastModified = fileStats.mtime;
      } catch {
        // File removed; keep defaults
      }

      results.push({
        file: filePath,
        status: this.mapGitStatus(statusToken),
        size,
        lastModified,
      });
    }

    return results;
  }

  private mapGitStatus(status: string): BaselineChange["status"] {
    if (status.includes("A")) return "added";
    if (status.includes("D")) return "deleted";
    return "modified";
  }

  async generateChangeReport(changes: BaselineChange[]): Promise<string> {
    if (changes.length === 0) {
      return "✅ No visual baseline changes detected.";
    }

    const lines = [
      "🖼️ **Visual Baseline Changes Detected**",
      "",
      ...changes.map((change) => {
        const sizeKb = change.size ? (change.size / 1024).toFixed(1) : "0.0";
        const emoji =
          change.status === "added"
            ? "🆕"
            : change.status === "deleted"
              ? "🗑️"
              : "📝";
        return `${emoji} \`${change.file}\` (${change.status}, ${sizeKb}KB)`;
      }),
      "",
      "**Actions:**",
      "- Comment `/update-baselines` to approve these changes",
      "- Comment `/reject-baselines` to investigate further",
      "",
      "_Baseline changes require manual approval for safety._",
    ];

    return lines.join("\n");
  }
}

async function main() {
  const analyzer = new BaselineAnalyzer();
  const changes = await analyzer.analyzeChanges();
  const report = await analyzer.generateChangeReport(changes);
  console.log(report);
}

const invokedFile = process.argv[1] ? pathToFileURL(process.argv[1]).href : undefined;

if (invokedFile && import.meta.url === invokedFile) {
  main().catch((error) => {
    console.error("Baseline analysis failed:", error);
    process.exit(1);
  });
}

export { BaselineAnalyzer };
export type { BaselineChange };
