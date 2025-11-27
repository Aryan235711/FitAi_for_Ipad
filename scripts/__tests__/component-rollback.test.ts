import { describe, it, expect, beforeEach, vi } from "vitest";
import { ComponentRollback } from "../component-rollback";
import { execSync } from "node:child_process";

vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  return {
    ...actual,
    execSync: vi.fn(),
  };
});

type ExecMock = ReturnType<typeof vi.fn>;
const execMock = execSync as unknown as ExecMock;

describe("ComponentRollback", () => {
  beforeEach(() => {
    execMock.mockReset();
  });

  it("rejects invalid component names", async () => {
    const rollback = new ComponentRollback();

    await expect(
      rollback.rollback({ component: "Vitality Orb", targetCommit: "abc1234" })
    ).rejects.toThrow(/Invalid component name/i);
  });

  it("rejects invalid commit hashes", async () => {
    const rollback = new ComponentRollback();

    await expect(
      rollback.rollback({ component: "VitalityOrb", targetCommit: "bad" })
    ).rejects.toThrow(/invalid commit hash/i);
  });

  it("rejects commits that are not in history", async () => {
    execMock.mockImplementation((command: string) => {
      if (command.startsWith("git cat-file")) {
        throw new Error("missing commit");
      }
      return "";
    });

    const rollback = new ComponentRollback();

    await expect(
      rollback.rollback({ component: "VitalityOrb", targetCommit: "abc1234" })
    ).rejects.toThrow(/does not exist/i);
  });

  it("blocks files outside allowlist", async () => {
    const rollback = new ComponentRollback();

    const findSpy = vi
      .spyOn(rollback as unknown as { findComponentFiles: (c: string) => Promise<string[]> }, "findComponentFiles")
      .mockResolvedValue(["server/index.ts"]);
    const commitSpy = vi.spyOn(rollback as unknown as { validateCommit: (hash: string) => void }, "validateCommit");
    commitSpy.mockImplementation(() => {});

    await expect(
      rollback.rollback({ component: "VitalityOrb", targetCommit: "abc1234" })
    ).rejects.toThrow(/outside allowed directories/i);

    findSpy.mockRestore();
    commitSpy.mockRestore();
  });

  it("performs dry run without mutating files", async () => {
    const rollback = new ComponentRollback();

    vi.spyOn(rollback as unknown as { findComponentFiles: (c: string) => Promise<string[]> }, "findComponentFiles")
      .mockResolvedValue(["client/src/components/charts/VitalityOrb.tsx"]);
    const commitSpy = vi.spyOn(rollback as unknown as { validateCommit: (hash: string) => void }, "validateCommit");
    commitSpy.mockImplementation(() => {});

    const result = await rollback.rollback({ component: "VitalityOrb", targetCommit: "abc1234" });

    expect(result.dryRun).toBe(true);
    expect(result.affectedFiles).toEqual([
      "client/src/components/charts/VitalityOrb.tsx",
    ]);
    expect(execMock).not.toHaveBeenCalledWith(expect.stringContaining("git checkout"));
    expect(execMock).not.toHaveBeenCalledWith(expect.stringContaining("git add"));

    commitSpy.mockRestore();
  });
});
