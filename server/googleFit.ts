import { google } from 'googleapis';
import { storage } from './storage';

const GOOGLE_FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
  'https://www.googleapis.com/auth/fitness.nutrition.read',
  'https://www.googleapis.com/auth/fitness.body.read',
];

export function getOAuth2Client(redirectUri?: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/google-fit/callback`
  );
}

export function getAuthUrl(userId: string, redirectUri?: string): string {
  const oauth2Client = getOAuth2Client(redirectUri);
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_FIT_SCOPES,
    state: userId, // Pass userId as state to retrieve it in callback
    prompt: 'consent', // Force consent to get refresh token
  });
}

export async function exchangeCodeForTokens(code: string, userId: string, redirectUri?: string) {
  const oauth2Client = getOAuth2Client(redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  
  // Save tokens to database
  await storage.saveGoogleFitToken({
    userId,
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token || undefined,
    expiresAt: new Date(tokens.expiry_date!),
    scope: tokens.scope!,
  });
  
  return tokens;
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const tokenData = await storage.getGoogleFitToken(userId);
  
  if (!tokenData) {
    throw new Error('No Google Fit token found. Please connect your Google Fit account.');
  }
  
  const now = new Date();
  
  // If token is still valid, return it
  if (tokenData.expiresAt > now) {
    return tokenData.accessToken;
  }
  
  // Token expired, refresh it
  if (!tokenData.refreshToken) {
    throw new Error('Refresh token not available. Please reconnect your Google Fit account.');
  }
  
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: tokenData.refreshToken,
  });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  // Update tokens in database
  await storage.updateGoogleFitToken(userId, {
    accessToken: credentials.access_token!,
    expiresAt: new Date(credentials.expiry_date!),
  });
  
  return credentials.access_token!;
}

export async function fetchGoogleFitData(userId: string, startDate: string, endDate: string) {
  const accessToken = await getValidAccessToken(userId);
  
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const fitness = google.fitness({ version: 'v1', auth: oauth2Client });
  
  const startTimeMillis = new Date(startDate).getTime();
  const endTimeMillis = new Date(endDate).getTime();
  
  try {
    // Fetch aggregated data for various metrics
    const aggregateRequest = {
      aggregateBy: [
        { dataTypeName: 'com.google.step_count.delta' },
        { dataTypeName: 'com.google.calories.expended' },
        { dataTypeName: 'com.google.heart_rate.bpm' },
        { dataTypeName: 'com.google.sleep.segment' },
      ],
      bucketByTime: { durationMillis: 86400000 }, // 1 day buckets
      startTimeMillis,
      endTimeMillis,
    };
    
    const response = await fitness.users.dataset.aggregate({
      userId: 'me',
      requestBody: aggregateRequest,
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching Google Fit data:', error.message);
    throw new Error(`Failed to fetch Google Fit data: ${error.message}`);
  }
}

// Transform Google Fit API response to our fitness metrics format
export function transformGoogleFitData(apiData: any, userId: string) {
  if (!apiData.bucket) return [];
  
  const metrics = apiData.bucket.map((bucket: any) => {
    const startDate = new Date(parseInt(bucket.startTimeMillis));
    const date = startDate.toISOString().split('T')[0];
    
    const metric: any = {
      userId,
      date,
      steps: 0,
      calories: 0,
      rhr: null,
      hrv: null,
      sleepScore: null,
      sleepConsistency: null,
      workoutIntensity: null,
      protein: null,
      carbs: null,
      fats: null,
      deepSleepMinutes: null,
      spo2: null,
      recoveryScore: null,
    };
    
    // Extract data from buckets
    bucket.dataset?.forEach((dataset: any) => {
      dataset.point?.forEach((point: any) => {
        const dataTypeName = dataset.dataSourceId.split(':')[0];
        
        switch (dataTypeName) {
          case 'com.google.step_count.delta':
            metric.steps += point.value[0]?.intVal || 0;
            break;
          case 'com.google.calories.expended':
            metric.calories += Math.round(point.value[0]?.fpVal || 0);
            break;
          case 'com.google.heart_rate.bpm':
            // Average heart rate (simplified)
            metric.rhr = Math.round(point.value[0]?.fpVal || 0);
            break;
          case 'com.google.sleep.segment':
            // Calculate deep sleep minutes (simplified)
            const duration = (point.endTimeNanos - point.startTimeNanos) / 1e9 / 60; // in minutes
            if (point.value[0]?.intVal === 4) { // Deep sleep
              metric.deepSleepMinutes = (metric.deepSleepMinutes || 0) + Math.round(duration);
            }
            break;
        }
      });
    });
    
    // Calculate derived metrics (simplified)
    metric.sleepScore = metric.deepSleepMinutes ? Math.min(100, Math.round((metric.deepSleepMinutes / 90) * 100)) : null;
    metric.recoveryScore = metric.rhr && metric.rhr < 65 ? Math.round(100 - (metric.rhr - 45)) : null;
    
    return metric;
  });
  
  return metrics.filter((m: any) => m.steps > 0 || m.calories > 0); // Filter out empty days
}
