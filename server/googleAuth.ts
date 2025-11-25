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
    name: "fitsync.sid",
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: sessionTtl,
      domain: undefined, // Let browser handle domain
    },
  });
}

export async function setupAuth(app: Express) {
  // Important for OAuth with proxy/HTTPS
  app.set("trust proxy", 1);
  
  // Add security headers
  app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });
  
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // COMPREHENSIVE REQUEST LOGGING - log EVERY request to OAuth endpoints
  app.use((req, res, next) => {
    if (req.path.includes("/api/login") || req.path.includes("/api/google-fit/callback")) {
      console.log("\n========== OAUTH REQUEST RECEIVED ==========");
      console.log("[Request] Path:", req.path);
      console.log("[Request] Method:", req.method);
      console.log("[Request] Query:", JSON.stringify(req.query));
      console.log("[Request] Headers:", {
        host: req.get("host"),
        protocol: req.get("x-forwarded-proto") || req.protocol,
        userAgent: req.get("user-agent")?.substring(0, 50),
      });
      console.log("[Request] Session:", {
        sessionID: req.sessionID,
        hasSession: !!req.session,
        isAuth: req.isAuthenticated?.(),
      });
      console.log("==========================================\n");
    }
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
      prompt: "select_account",  // Avoid "403: org_internal" by forcing account selection
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
      console.log("[Google OAuth] Starting OAuth flow with prompt=select_account");
      
      // Add prompt: 'select_account' to avoid "403: org_internal" error
      // and 'consent' to force consent screen (gets refresh token)
      passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account",
        accessType: "offline",
      })(req, res, next);
    } catch (error: any) {
      console.error("[Google OAuth] Login error:", error.message, error.stack);
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  });

  // Callback with direct Passport handling - with comprehensive error logging
  app.get(
    "/api/google-fit/callback",
    (req, res, next) => {
      console.log("[Google OAuth Callback] ===== CALLBACK ROUTE HIT =====");
      console.log("[Google OAuth Callback] URL:", req.originalUrl);
      console.log("[Google OAuth Callback] Query:", req.query);
      console.log("[Google OAuth Callback] Session ID:", req.sessionID);
      console.log("[Google OAuth Callback] Is Authenticated:", req.isAuthenticated?.());
      
      // Check for error from Google
      if (req.query.error) {
        console.error("[Google OAuth Callback] ===== ERROR FROM GOOGLE =====");
        console.error("[Google OAuth Callback] Error:", req.query.error);
        console.error("[Google OAuth Callback] Error URI:", req.query.error_uri);
        console.error("[Google OAuth Callback] Error description:", req.query.error_description);
        return res.status(400).json({
          error: req.query.error,
          errorDescription: req.query.error_description,
          solution: "Check Google Cloud Console OAuth consent screen is set to 'External' for personal Google accounts",
        });
      }
      
      console.log("[Google OAuth Callback] No error param, proceeding with Passport authenticate...");
      
      // Call passport authenticate
      passport.authenticate("google", {
        failureRedirect: "/login?error=auth_failed",
        failureMessage: true,
      })(req, res, next);
    },
    (req, res) => {
      try {
        console.log("[Google OAuth Callback] ===== CALLBACK SUCCESS HANDLER =====");
        console.log("[Google OAuth Callback] User:", req.user?.id, req.user?.email);
        console.log("[Google OAuth Callback] Session ID:", req.sessionID);
        console.log("[Google OAuth Callback] Redirecting to /");
        res.redirect("/");
      } catch (error: any) {
        console.error("[Google OAuth Callback] ERROR in success handler:", {
          message: error.message,
          stack: error.stack?.split("\n")[0],
        });
        res.status(500).json({ error: "Redirect failed", message: error.message });
      }
    }
  );

  // Add a catch-all error handler for OAuth errors
  app.use((err: any, req: any, res: any, next: any) => {
    if (req.path.includes("/api/login") || req.path.includes("/api/google-fit/callback")) {
      console.error("[Global Error Handler] OAuth error detected:", {
        path: req.path,
        statusCode: err.statusCode || err.status || 500,
        message: err.message,
        stack: err.stack?.split("\n").slice(0, 3),
        authError: err.authError,
        details: err.details,
      });
    }
    next(err);
  });

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
