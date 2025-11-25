import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, Request } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Simplified Google Auth Setup
export function setupAuth(app: Express) {
  // 1. Trust proxy (critical for HTTPS)
  app.set("trust proxy", 1);

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
        secure: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  // 3. Passport initialization
  app.use(passport.initialize());
  app.use(passport.session());

  // 4. Google OAuth Strategy with absolute callback URL
  const callbackUrl = `https://${process.env.REPLIT_DOMAINS}/auth/google/callback`;
  console.log("[Google Auth] Callback URL:", callbackUrl);

  const googleStrategy = new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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

        const user = {
          id: userId,
          email,
          firstName,
          lastName,
          profileImageUrl,
          accessToken,
          refreshToken,
        };

        return done(null, user);
      } catch (error: any) {
        console.error("[Google Auth] Error:", error.message);
        return done(error);
      }
    }
  );

  passport.use(googleStrategy);

  // 5. Serialization
  passport.serializeUser((user: any, done) => done(null, user));
  passport.deserializeUser((user: any, done) => done(null, user));

  // 6. Authentication routes
  app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
      console.log("[Google Auth] Callback success, redirecting to /");
      res.redirect("/");
    }
  );

  app.get("/auth/logout", (req: any, res) => {
    req.logout((err: any) => {
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
