import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { resolveBaseUrl } from "./utils/baseUrl";

// Unified Google Auth (login + Fit access in one OAuth flow)
export function setupAuth(app: Express) {
  // 1. Trust proxy (critical for HTTPS)
  app.set("trust proxy", 1);

  const isProduction = process.env.NODE_ENV === "production";
  const cookieSecure = process.env.SESSION_COOKIE_SECURE
    ? process.env.SESSION_COOKIE_SECURE === "true"
    : isProduction;
  const cookieSameSite = (process.env.SESSION_COOKIE_SAMESITE as
    | "lax"
    | "strict"
    | "none"
    | undefined) || (cookieSecure ? "lax" : "lax");
  const baseUrl = resolveBaseUrl();

  // 2. Session middleware
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: 7 * 24 * 60 * 60 * 1000,
    tableName: "sessions",
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET!,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  // 3. Passport initialization
  app.use(passport.initialize());
  app.use(passport.session());

  // 4. Determine callback URL for current environment
  const callbackUrl = `${baseUrl}/auth/google/callback`;
  console.log("[Google Auth] Callback URL:", callbackUrl);

  // 5. Google OAuth Strategy - request both profile + Fit scopes in ONE flow
  const SCOPES = [
    "profile",
    "email",
    "https://www.googleapis.com/auth/fitness.activity.read",
    "https://www.googleapis.com/auth/fitness.heart_rate.read",
    "https://www.googleapis.com/auth/fitness.sleep.read",
    "https://www.googleapis.com/auth/fitness.nutrition.read",
    "https://www.googleapis.com/auth/fitness.body.read",
  ];

  const googleStrategy = new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: callbackUrl,
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const userId = profile.id;
        const email = profile.emails?.[0]?.value || "";
        const firstName = profile.name?.givenName || "";
        const lastName = profile.name?.familyName || "";
        const profileImageUrl = profile.photos?.[0]?.value || "";

        console.log("[Google Auth] User verified:", { userId, email });

        // Save user to database
        await storage.upsertUser({
          id: userId,
          email,
          firstName,
          lastName,
          profileImageUrl,
        });

        // Save the Google Fit tokens from login for Fit API access
        if (refreshToken || accessToken) {
          await storage.saveGoogleFitToken({
            userId,
            accessToken,
            refreshToken: refreshToken || undefined,
            expiresAt: new Date(Date.now() + 3600 * 1000),
            scope: SCOPES.join(" "),
          });
        }

        const user = {
          id: userId,
          email,
          firstName,
          lastName,
          profileImageUrl,
        };

        return done(null, user);
      } catch (error: any) {
        console.error("[Google Auth] Error:", error.message);
        return done(error);
      }
    }
  );

  passport.use(googleStrategy);

  // 6. Serialization
  passport.serializeUser((user: any, done) => done(null, user));
  passport.deserializeUser((user: any, done) => done(null, user));

  // 7. Authentication routes
  app.get(
    "/auth/google",
    (req: any, res: any, next: any) => {
      passport.authenticate("google", { 
        scope: SCOPES,
        accessType: "offline",
        prompt: "consent"
      } as any)(req, res, next);
    }
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req: any, res) => {
      console.log("[Google Auth] Callback success, redirecting to /");
      res.redirect("/");
    }
  );

  app.get("/auth/logout", (req: any, res) => {
    req.logout((err: any) => {
      if (err) console.error("[Google Auth] Logout error:", err);
      console.log("[Google Auth] Logout");
      res.redirect("/");
    });
  });
}

// Middleware
export function isAuthenticated(req: any, res: any, next: any) {
  if (!req.isAuthenticated?.()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}
