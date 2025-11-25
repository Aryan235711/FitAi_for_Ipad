import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { getAuthUrl, exchangeCodeForTokens, fetchGoogleFitData, transformGoogleFitData } from "./googleFit";
import { generateDailyInsight } from "./aiInsights";
import { insertFitnessMetricSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);

  // ============== AUTH ROUTES ==============
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ============== GOOGLE FIT ROUTES ==============
  
  // Initiate Google Fit OAuth flow
  app.get('/api/google-fit/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const redirectUri = `https://${req.hostname}/api/google-fit/callback`;
      const authUrl = getAuthUrl(userId, redirectUri);
      res.json({ authUrl });
    } catch (error: any) {
      console.error("Error initiating Google Fit connection:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Google Fit OAuth callback
  app.get('/api/google-fit/callback', async (req, res) => {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.status(400).send('Missing code or state parameter');
    }

    try {
      const redirectUri = `https://${req.hostname}/api/google-fit/callback`;
      await exchangeCodeForTokens(code as string, userId as string, redirectUri);
      
      // Redirect back to app
      res.redirect('/?connected=true');
    } catch (error: any) {
      console.error("Error in Google Fit callback:", error);
      res.redirect('/?error=connection_failed');
    }
  });

  // Check Google Fit connection status
  app.get('/api/google-fit/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const token = await storage.getGoogleFitToken(userId);
      res.json({ connected: !!token, expiresAt: token?.expiresAt });
    } catch (error: any) {
      console.error("Error checking Google Fit status:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Disconnect Google Fit
  app.delete('/api/google-fit/disconnect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.body;

      // Default to last 30 days if not specified
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const data = await fetchGoogleFitData(userId, start, end);
      const transformedMetrics = transformGoogleFitData(data, userId);

      // Save metrics to database
      await storage.saveFitnessMetrics(transformedMetrics);

      res.json({ 
        success: true, 
        synced: transformedMetrics.length,
        message: `Synced ${transformedMetrics.length} days of data`
      });
    } catch (error: any) {
      console.error("Error syncing Google Fit data:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============== FITNESS METRICS ROUTES ==============
  
  // Get user's fitness metrics
  app.get('/api/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const metricData = insertFitnessMetricSchema.parse({
        ...req.body,
        userId,
      });
      
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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

  const httpServer = createServer(app);
  return httpServer;
}
