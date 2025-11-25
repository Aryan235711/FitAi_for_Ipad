import type { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import crypto from "crypto";

const LOGIN_TOKENS = new Map<string, { email: string; expires: number }>();

export function setupSimpleAuth(app: Express) {
  // Trust proxy
  app.set("trust proxy", 1);

  // Session middleware
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

  // ============ MAGIC LINK AUTH ============

  // 1. Request login email
  app.post("/auth/request-login", async (req: any, res) => {
    try {
      const { email } = req.body;
      
      if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Invalid email" });
      }

      // Generate login token
      const token = crypto.randomBytes(32).toString("hex");
      const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
      
      LOGIN_TOKENS.set(token, { email, expires });

      // Clean up expired tokens periodically
      if (Math.random() < 0.1) {
        for (const [key, value] of LOGIN_TOKENS.entries()) {
          if (value.expires < Date.now()) {
            LOGIN_TOKENS.delete(key);
          }
        }
      }

      const domain = process.env.REPLIT_DOMAINS || "localhost:5000";
      const loginLink = `https://${domain}/auth/verify?token=${token}`;

      console.log(`[Auth] Login link for ${email}: ${loginLink}`);

      // For demo: just return the link directly (in production, send via email)
      res.json({
        message: "Login link generated",
        loginLink: loginLink, // Send link directly for simplicity
        email: email,
      });
    } catch (error: any) {
      console.error("[Auth] Request login error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Verify token and create session
  app.get("/auth/verify", async (req: any, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Invalid token" });
      }

      const tokenData = LOGIN_TOKENS.get(token);

      if (!tokenData) {
        return res.status(400).json({ error: "Token not found or expired" });
      }

      if (tokenData.expires < Date.now()) {
        LOGIN_TOKENS.delete(token);
        return res.status(400).json({ error: "Token expired" });
      }

      const email = tokenData.email;

      // Get or create user from database
      let user = await storage.getUserByEmail(email);

      if (!user) {
        // Create new user
        const userId = crypto.randomUUID();
        const nameParts = email.split("@")[0].split(".");
        const firstName = nameParts[0] || "User";
        const lastName = nameParts[1] || "";

        await storage.upsertUser({
          id: userId,
          email,
          firstName,
          lastName,
          profileImageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}`,
        });

        user = await storage.getUser(userId);
      }

      // Create session
      req.session.user = user;
      req.session.save((err: any) => {
        if (err) {
          console.error("[Auth] Session save error:", err);
          return res.status(500).json({ error: "Session creation failed" });
        }

        // Clean up token
        LOGIN_TOKENS.delete(token);

        console.log(`[Auth] User logged in: ${email}`);
        res.redirect("/");
      });
    } catch (error: any) {
      console.error("[Auth] Verify error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Get current user
  app.get("/api/auth/user", (req: any, res) => {
    const user = req.session.user || null;
    res.json(user);
  });

  // 4. Logout
  app.get("/auth/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) console.error("[Auth] Logout error:", err);
      res.redirect("/");
    });
  });
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.user = req.session.user;
  next();
}
