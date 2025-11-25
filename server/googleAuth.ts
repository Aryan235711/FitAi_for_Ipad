import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Middleware to attach the current host to each request for OAuth callback construction
  app.use((req, res, next) => {
    req.baseUrl = req.get("host") || "localhost:5000";
    next();
  });

  // Middleware to dynamically set the passport strategy's callback URL per request
  app.use((req, res, next) => {
    // Extract the full callback URL from request
    const protocol = req.get("x-forwarded-proto") || req.protocol || "https";
    const host = req.get("x-forwarded-host") || req.get("host") || "localhost:5000";
    const fullCallbackUrl = `${protocol}://${host}/api/google-fit/callback`;
    
    // Store on request for access in routes
    req.fullCallbackUrl = fullCallbackUrl;
    
    next();
  });

  // Google OAuth Strategy - use dynamic callback URL
  const googleStrategy = new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/google-fit/callback",
      passReqToCallback: true,
      accessType: "offline",
      prompt: "consent",
    },
      (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
        (async () => {
          try {
            // Extract user info from Google profile
            const email = profile.emails?.[0]?.value;
            const firstName = profile.name?.givenName;
            const lastName = profile.name?.familyName;
            const profileImageUrl = profile.photos?.[0]?.value;
            const userId = profile.id;

            console.log("[Google OAuth] ===== VERIFY CALLBACK =====", { userId, email, accessTokenLength: accessToken?.length });

            // Upsert user into database
            await storage.upsertUser({
              id: userId,
              email: email || "",
              firstName: firstName || "",
              lastName: lastName || "",
              profileImageUrl: profileImageUrl || "",
            });

            // Create user object for session
            const user = {
              id: userId,
              email,
              firstName,
              lastName,
              profileImageUrl,
              accessToken,
              refreshToken,
            };

            console.log("[Google OAuth] User session created for:", userId);
            return done(null, user);
          } catch (error: any) {
            console.error("[Google OAuth] Verify callback error:", {
              message: error.message,
              stack: error.stack?.split('\n')[0],
              profile: profile?.id
            });
            return done(error);
          }
        })();
      }
  );

  passport.use(googleStrategy);

  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  // Error handling middleware for OAuth
  app.use((err: any, req: any, res: any, next: any) => {
    if (err && req.path.includes("/api/login")) {
      console.error("[Google OAuth ERROR] Login error:", {
        message: err.message,
        name: err.name,
        status: err.status,
        statusCode: err.statusCode,
        stack: err.stack,
        path: req.path,
        method: req.method,
      });
    }
    if (err && req.path.includes("/api/google-fit/callback")) {
      console.error("[Google OAuth ERROR] Callback error:", {
        message: err.message,
        name: err.name,
        status: err.status,
        statusCode: err.statusCode,
        stack: err.stack,
        query: req.query,
      });
    }
    next(err);
  });

  // Google Login route
  app.get("/api/login", (req, res, next) => {
    try {
      console.log("[Google OAuth] ===== LOGIN CALLED =====");
      console.log("[Google OAuth] Full Callback URL:", req.fullCallbackUrl);
      console.log("[Google OAuth] Host:", req.get("host"));
      console.log("[Google OAuth] Protocol:", req.get("x-forwarded-proto") || req.protocol);
      
      passport.authenticate("google", {
        scope: ["profile", "email"],
      })(req, res, next);
    } catch (error: any) {
      console.error("[Google OAuth] Login error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Callback with direct Passport handling
  app.get(
    "/api/google-fit/callback",
    passport.authenticate("google", {
      failureRedirect: "/login?error=auth_failed",
    }),
    (req, res) => {
      try {
        console.log("[Google OAuth] ===== CALLBACK SUCCESS =====");
        console.log("[Google OAuth] User authenticated:", req.user?.id);
        console.log("[Google OAuth] Session ID:", req.sessionID);
        console.log("[Google OAuth] Redirecting to /");
        res.redirect("/");
      } catch (error: any) {
        console.error("[Google OAuth] ERROR during redirect:", error.message);
        res.status(500).json({ error: "Redirect failed", message: error.message });
      }
    }
  );

  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
