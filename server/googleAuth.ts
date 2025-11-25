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

  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: "/api/google-fit/callback",
        passReqToCallback: false,
        accessType: "offline",
        prompt: "consent",
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // Extract user info from Google profile
          const email = profile.emails?.[0]?.value;
          const firstName = profile.name?.givenName;
          const lastName = profile.name?.familyName;
          const profileImageUrl = profile.photos?.[0]?.value;
          const userId = profile.id;

          console.log("[Google OAuth] Authenticated user:", { userId, email });

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
        } catch (error) {
          console.error("[Google OAuth] Error:", error);
          return done(error);
        }
      }
    )
  );

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

  // Google OAuth routes with detailed logging
  app.get("/api/login", (req, res, next) => {
    try {
      console.log("[Google OAuth] ===== LOGIN ROUTE CALLED =====");
      console.log("[Google OAuth] Host:", req.get("host"));
      console.log("[Google OAuth] URL:", req.originalUrl);
      console.log("[Google OAuth] Client ID present:", !!process.env.GOOGLE_CLIENT_ID);
      console.log("[Google OAuth] Client Secret present:", !!process.env.GOOGLE_CLIENT_SECRET);
      
      const authenticator = passport.authenticate("google", {
        scope: ["profile", "email"],
        accessType: "offline",
        prompt: "consent",
      });
      
      console.log("[Google OAuth] Calling passport.authenticate...");
      authenticator(req, res, (err: any) => {
        if (err) {
          console.error("[Google OAuth] ERROR in authenticator:", {
            message: err.message,
            name: err.name,
            stack: err.stack,
          });
          return res.status(500).json({ 
            error: "OAuth Error", 
            message: err.message,
            details: err.stack 
          });
        }
        console.log("[Google OAuth] Authenticator completed without error");
      });
    } catch (error: any) {
      console.error("[Google OAuth] CATCH ERROR in /api/login:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      res.status(500).json({ 
        error: "Server Error", 
        message: error.message,
        details: error.stack 
      });
    }
  });

  app.get(
    "/api/google-fit/callback",
    (req, res, next) => {
      try {
        console.log("[Google OAuth] ===== CALLBACK ROUTE CALLED =====");
        console.log("[Google OAuth] Query params:", req.query);
        console.log("[Google OAuth] Full URL:", req.originalUrl);
        
        if (req.query.error) {
          console.error("[Google OAuth] Google returned error:", req.query.error);
          console.error("[Google OAuth] Error description:", req.query.error_description);
          return res.status(400).json({
            error: req.query.error,
            description: req.query.error_description,
          });
        }
        
        if (!req.query.code) {
          console.error("[Google OAuth] No authorization code received!");
          return res.status(400).json({ error: "No authorization code" });
        }
        
        console.log("[Google OAuth] Valid code received, authenticating...");
        
        const authenticator = passport.authenticate("google", {
          failureRedirect: "/login?error=google_auth_failed",
          failureMessage: true,
        });
        
        authenticator(req, res, (err: any) => {
          if (err) {
            console.error("[Google OAuth] ERROR in callback authenticator:", {
              message: err.message,
              name: err.name,
              stack: err.stack,
            });
            return res.status(500).json({ 
              error: "OAuth Error", 
              message: err.message,
              details: err.stack 
            });
          }
          console.log("[Google OAuth] Callback authenticator completed");
        });
      } catch (error: any) {
        console.error("[Google OAuth] CATCH ERROR in /api/google-fit/callback:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
        res.status(500).json({ 
          error: "Server Error", 
          message: error.message,
          details: error.stack 
        });
      }
    },
    (req, res) => {
      // Successful authentication
      try {
        console.log("[Google OAuth] ===== CALLBACK SUCCESS =====");
        console.log("[Google OAuth] User:", req.user);
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
