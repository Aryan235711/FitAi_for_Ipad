import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./googleAuth";
import { fetchGoogleFitData, transformGoogleFitData } from "./googleFit";
import { generateDailyInsight } from "./aiInsights";
import { insertFitnessMetricSchema, type InsertFitnessMetric, type FitnessMetric } from "@shared/schema";
import { resolveBaseUrl } from "./utils/baseUrl";

function mapGoogleFitSyncError(error: any) {
  const rawMessage = error?.message || "Failed to sync Google Fit data";
  const normalizedMessage = rawMessage.toLowerCase();

  if (normalizedMessage.includes("no google fit token")) {
    return {
      status: 400,
      message: "Please connect Google Fit before syncing.",
      errorType: "MissingOAuthConsent",
    };
  }

  if (normalizedMessage.includes("refresh token")) {
    return {
      status: 400,
      message: "Google Fit access expired. Reconnect to refresh permissions.",
      errorType: "StaleRefreshToken",
    };
  }

  const apiStatus = error?.code || error?.status || error?.response?.status;
  if (apiStatus === 403) {
    return {
      status: 403,
      message: "Google Fit denied the request. Reconnect and try again.",
      errorType: "GoogleApiForbidden",
    };
  }

  return {
    status: 500,
    message: rawMessage,
    errorType: error?.name || "GoogleFitSyncError",
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Google OAuth Auth (unified for login + Fit access)
  setupAuth(app);

  const healthHandler = async (_req: any, res: any) => {
    try {
      await storage.healthCheck();
      res.json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      });
    } catch (error: any) {
      console.error("[Health] check failed", error?.message || error);
      res.status(500).json({
        status: "error",
        message: "Database check failed",
        error: error?.message || "Unknown",
      });
    }
  };

  app.get("/health", healthHandler);
  app.get("/api/health", healthHandler);

  // ============== AUTH ROUTES ==============
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Return user if authenticated, null if not
      if (!req.isAuthenticated?.()) {
        return res.json(null);
      }
      const userId = req.user?.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ============== GOOGLE FIT ROUTES ==============
  
  // Initiate Google Fit OAuth flow
  app.get('/api/google-fit/connect', isAuthenticated, async (_req: any, res) => {
    try {
      const authUrl = `${resolveBaseUrl()}/auth/google`;
      console.log('[Google Fit Connect] Using unified auth route:', authUrl);
      res.json({ authUrl });
    } catch (error: any) {
      console.error("Error initiating Google Fit connection:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Check Google Fit connection status
  app.get('/api/google-fit/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const token = await storage.getGoogleFitToken(userId);
      let latestMetric: FitnessMetric | undefined;
      if (token) {
        const recentMetrics = await storage.getFitnessMetrics(userId, 1);
        latestMetric = recentMetrics.length > 0 ? recentMetrics[recentMetrics.length - 1] : undefined;
      }

      res.json({
        connected: !!token,
        expiresAt: token?.expiresAt,
        hasSyncedData: !!latestMetric,
        lastSyncedAt: latestMetric?.date ?? null,
      });
    } catch (error: any) {
      console.error("Error checking Google Fit status:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Disconnect Google Fit
  app.delete('/api/google-fit/disconnect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      await storage.deleteGoogleFitToken(userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error disconnecting Google Fit:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Sync Google Fit data
  app.post('/api/google-fit/sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { startDate, endDate } = req.body;

      // Early validation: check if user has a valid Google Fit token
      const tokenData = await storage.getGoogleFitToken(userId);
      if (!tokenData?.refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Google Fit: refresh token missing',
          errorType: 'MissingRefreshToken',
        });
      }

      // Default to last 30 days if not specified
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      console.log(`[Google Fit Sync] Starting sync for user ${userId} from ${start} to ${end}`);

      const data = await fetchGoogleFitData(userId, start, end);
      const transformedMetrics = transformGoogleFitData(data, userId);

      console.log(`[Google Fit Sync] Transformed ${transformedMetrics.length} days of metrics`);

      // Save metrics to database
      await storage.saveFitnessMetrics(transformedMetrics);

      console.log(`[Google Fit Sync] Successfully saved metrics to database`);

      // Generate AI insight after successful sync
      try {
        console.log(`[Google Fit Sync] Generating AI insight...`);
        await generateDailyInsight(userId);
        console.log(`[Google Fit Sync] AI insight generated successfully`);
      } catch (insightError: any) {
        console.error(`[Google Fit Sync] Failed to generate AI insight:`, insightError.message);
        // Don't fail the sync if insight generation fails
      }

      res.json({ 
        success: true, 
        synced: transformedMetrics.length,
        message: `Successfully synced ${transformedMetrics.length} days of fitness data`,
        details: {
          startDate: start,
          endDate: end,
          metricsCount: transformedMetrics.length,
        }
      });
    } catch (error: any) {
      console.error("[Google Fit Sync] Error:", error);
      const mapped = mapGoogleFitSyncError(error);
      res.status(mapped.status).json({ 
        success: false,
        message: mapped.message,
        errorType: mapped.errorType,
        details: 'Check server logs for more information'
      });
    }
  });

  // ============== FITNESS METRICS ROUTES ==============
  
  // Get user's fitness metrics
  app.get('/api/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const days = parseInt(req.query.days as string) || 30;
      const metrics = await storage.getFitnessMetrics(userId, days);
      res.json(metrics);
    } catch (error: any) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add/update a single fitness metric
  app.post('/api/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const metricData = insertFitnessMetricSchema.parse({
        ...req.body,
        userId,
      }) as InsertFitnessMetric;
      
      const metric = await storage.upsertFitnessMetric(metricData);
      res.json(metric);
    } catch (error: any) {
      console.error("Error saving metric:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // ============== AI INSIGHTS ROUTES ==============
  
  // Get latest AI insight
  app.get('/api/insights/latest', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const insight = await storage.getLatestInsight(userId);
      res.json(insight || { content: "No insights yet. Sync your Google Fit data to get started!" });
    } catch (error: any) {
      console.error("Error fetching insight:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Generate new AI insight
  app.post('/api/insights/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const insight = await generateDailyInsight(userId);
      res.json({ content: insight });
    } catch (error: any) {
      console.error("Error generating insight:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Mark insight as read
  app.patch('/api/insights/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const insightId = parseInt(req.params.id);
      await storage.markInsightAsRead(insightId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error marking insight as read:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============== CSRF TOKEN ROUTE ==============
  app.get('/api/csrf/token', (req: any, res) => {
    try {
      // Generate a simple CSRF token using session ID and timestamp
      const sessionId = req.sessionID || 'anonymous';
      const timestamp = Date.now();
      const secret = process.env.CSRF_SECRET || process.env.SESSION_SECRET || 'default-csrf-secret';
      
      // Create a simple hash-based token
      const crypto = require('crypto');
      const token = crypto
        .createHmac('sha256', secret)
        .update(`${sessionId}-${timestamp}`)
        .digest('hex');
      
      res.status(200).json({ token });
    } catch (err: any) {
      console.error('[CSRF] token generation failed:', err?.message ?? err);
      res.status(500).json({ error: 'Failed to generate CSRF token' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
