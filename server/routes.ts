import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./googleAuth";
import { getAuthUrl, exchangeCodeForTokens, fetchGoogleFitData, transformGoogleFitData } from "./googleFit";
import { generateDailyInsight } from "./aiInsights";
import { insertFitnessMetricSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Google Auth
  await setupAuth(app);

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
  
  // DEBUG: List available Google Fit data sources
  app.get('/api/google-fit/datasources', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { getValidAccessToken, getOAuth2Client } = await import('./googleFit');
      const { google } = await import('googleapis');
      
      const accessToken = await getValidAccessToken(userId);
      
      // Create OAuth2 client and set credentials
      const oauth2Client = getOAuth2Client();
      oauth2Client.setCredentials({ access_token: accessToken });
      
      const fitness = google.fitness({ version: 'v1', auth: oauth2Client });
      
      const response = await fitness.users.dataSources.list({ userId: 'me' });
      
      res.json({
        message: "Available Google Fit Data Sources",
        dataSources: response.data.dataSource?.map((ds: any) => ({
          dataStreamId: ds.dataStreamId,
          dataType: ds.dataType?.name,
          device: ds.device?.model || 'Unknown',
          application: ds.application?.name || 'Unknown',
        })) || [],
        totalSources: response.data.dataSource?.length || 0,
      });
    } catch (error: any) {
      console.error("Error listing data sources:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // DEBUG: Show OAuth configuration (PUBLIC - no auth required for debugging)
  app.get('/api/google-fit/debug', async (req: any, res) => {
    const replyDomains = process.env.REPLIT_DOMAINS || "unknown";
    const replId = process.env.REPL_ID || "unknown";
    const replOwner = process.env.REPL_OWNER || "unknown";
    
    // The ONLY redirect URI that matters for THIS deployment
    const correctRedirectUri = `https://${replyDomains}/api/google-fit/callback`;
    
    res.json({
      message: "CRITICAL: Google OAuth Redirect URI Verification",
      urgent: "IF YOU'RE GETTING 403 ERRORS, YOU MUST DO THIS NOW:",
      
      correctRedirectUri: correctRedirectUri,
      currentlyUsing: correctRedirectUri,
      
      instructions: {
        step1: "Go to https://console.cloud.google.com/apis/credentials",
        step2: "Find your OAuth 2.0 Client ID (NOT the secret)",
        step3: "Click on it to open the details",
        step4: "Look for 'Authorized redirect URIs' section",
        step5: "Make sure this URI is EXACTLY registered:",
        requiredUri: correctRedirectUri,
        step6: "If not there, click 'ADD URI' and paste:",
        step7: "Click SAVE",
        step8: "Wait 5-10 minutes for changes to propagate to Google servers",
      },
      
      debug: {
        REPLIT_DOMAINS: replyDomains,
        REPL_ID: replId,
        REPL_OWNER: replOwner,
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        redirectUriBeingSent: correctRedirectUri,
      },
      
      troubleshooting: {
        issue: "Still getting 403 error?",
        check1: "Verify redirect URI is EXACTLY as shown above (case-sensitive, no extra slashes)",
        check2: "Make sure it's registered in Google Cloud Console for your Client ID",
        check3: "Wait 10 minutes after saving - Google takes time to propagate",
        check4: "Try incognito/private browser window",
        check5: "Clear browser cookies and cache",
        check6: "Make sure OAuth consent screen is set to 'External'",
        check7: "Make sure your Gmail is added as a test user",
      }
    });
  });
  
  // Initiate Google Fit OAuth flow
  app.get('/api/google-fit/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      // Use req.get('host') instead of req.hostname to include port if needed
      const redirectUri = `https://${req.get('host')}/api/google-fit/callback`;
      const authUrl = getAuthUrl(userId, redirectUri);
      
      console.log('[Google Fit Connect] Redirect URI:', redirectUri);
      console.log('[Google Fit Connect] Auth URL:', authUrl);
      
      res.json({ authUrl, redirectUri });
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
      res.json({ connected: !!token, expiresAt: token?.expiresAt });
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
      res.status(500).json({ 
        success: false,
        message: error.message,
        errorType: error.name || 'UnknownError',
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

  const httpServer = createServer(app);
  return httpServer;
}
