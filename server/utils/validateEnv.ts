const REQUIRED_ENV: Record<string, string> = {
  DATABASE_URL: "PostgreSQL connection string",
  SESSION_SECRET: "Express session secret",
  GOOGLE_CLIENT_ID: "Google OAuth client id",
  GOOGLE_CLIENT_SECRET: "Google OAuth client secret",
};

const OPTIONAL_RECOMMENDED: Record<string, string> = {
  PUBLIC_URL: "Public HTTPS URL for OAuth callbacks (set automatically on most hosts)",
  AI_INTEGRATIONS_OPENAI_API_KEY: "OpenAI API key for AI insights",
};

function logPrefixed(message: string, level: "info" | "warn" = "info") {
  const prefix = `[env:${level}]`;
  if (level === "warn") {
    console.warn(`${prefix} ${message}`);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

export function validateEnvironment() {
  const missing = Object.keys(REQUIRED_ENV).filter((key) => !process.env[key]);

  if (missing.length > 0) {
    const details = missing.map((key) => `- ${key}: ${REQUIRED_ENV[key]}`).join("\n");
    throw new Error(
      `Missing required environment variables:\n${details}\nAdd them to your .env file or hosting provider before starting the server.`,
    );
  }

  Object.entries(OPTIONAL_RECOMMENDED).forEach(([key, description]) => {
    if (!process.env[key]) {
      logPrefixed(`${key} not set. ${description}`, "warn");
    }
  });
}
