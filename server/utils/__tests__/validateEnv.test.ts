import { describe, it, expect, beforeEach, vi, afterAll } from "vitest";
import { validateEnvironment } from "../validateEnv";

const REQUIRED_KEYS = [
  "DATABASE_URL",
  "SESSION_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
];

const OPTIONAL_KEYS = [
  "PUBLIC_URL",
  "AI_INTEGRATIONS_OPENAI_API_KEY",
];

describe("validateEnvironment", () => {
  const originalEnv = { ...process.env };
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    process.env = { ...originalEnv };
    REQUIRED_KEYS.forEach((key) => {
      process.env[key] = `${key}-value`;
    });
    OPTIONAL_KEYS.forEach((key) => {
      delete process.env[key];
    });
  });

  it("throws if required values are missing", () => {
    delete process.env.DATABASE_URL;

    expect(() => validateEnvironment()).toThrow(/DATABASE_URL/);
  });

  it("logs warnings for optional but missing values", () => {
    validateEnvironment();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("passes silently when everything is set", () => {
    OPTIONAL_KEYS.forEach((key) => {
      process.env[key] = `${key}-value`;
    });

    expect(() => validateEnvironment()).not.toThrow();
  });

  afterAll(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });
});
