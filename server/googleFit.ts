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
    redirectUri || `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/google-fit/callback`
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
        { dataTypeName: 'com.google.heart_rate.summary' },
        { dataTypeName: 'com.google.sleep.segment' },
        { dataTypeName: 'com.google.activity.segment' },
        { dataTypeName: 'com.google.nutrition' },
      ],
      bucketByTime: { durationMillis: '86400000' }, // 1 day buckets (must be string)
      startTimeMillis: startTimeMillis.toString(),
      endTimeMillis: endTimeMillis.toString(),
    };
    
    const response = await fitness.users.dataset.aggregate({
      userId: 'me',
      requestBody: aggregateRequest as any,
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
      protein: 0,
      carbs: 0,
      fats: 0,
      deepSleepMinutes: null,
      spo2: null,
      recoveryScore: null,
      totalSleepMinutes: 0,
      activityMinutes: 0,
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
            // Average heart rate (simplified - use minimum as RHR approximation)
            const currentHr = Math.round(point.value[0]?.fpVal || 0);
            if (currentHr > 0) {
              metric.rhr = metric.rhr ? Math.min(metric.rhr, currentHr) : currentHr;
            }
            break;
          case 'com.google.heart_rate.summary':
            // Extract HRV if available (RMSSD or SDNN)
            if (point.value[1]?.fpVal) {
              metric.hrv = Math.round(point.value[1].fpVal);
            }
            break;
          case 'com.google.sleep.segment':
            const sleepDuration = (point.endTimeNanos - point.startTimeNanos) / 1e9 / 60;
            const sleepType = point.value[0]?.intVal;
            
            metric.totalSleepMinutes += Math.round(sleepDuration);
            
            if (sleepType === 4) { // Deep sleep
              metric.deepSleepMinutes = (metric.deepSleepMinutes || 0) + Math.round(sleepDuration);
            }
            break;
          case 'com.google.activity.segment':
            const activityDuration = (point.endTimeNanos - point.startTimeNanos) / 1e9 / 60;
            const activityType = point.value[0]?.intVal;
            
            // Activity types: 1=biking, 7=walking, 8=running, etc.
            if ([1, 7, 8, 9, 10].includes(activityType)) {
              metric.activityMinutes += Math.round(activityDuration);
            }
            break;
          case 'com.google.nutrition':
            // Extract macros if available
            if (point.value[0]) metric.protein += Math.round(point.value[0].fpVal || 0);
            if (point.value[1]) metric.carbs += Math.round(point.value[1].fpVal || 0);
            if (point.value[2]) metric.fats += Math.round(point.value[2].fpVal || 0);
            break;
        }
      });
    });
    
    // Calculate derived metrics
    // Sleep score based on total sleep (7-9 hours optimal)
    if (metric.totalSleepMinutes > 0) {
      const sleepHours = metric.totalSleepMinutes / 60;
      const deepSleepRatio = metric.deepSleepMinutes ? (metric.deepSleepMinutes / metric.totalSleepMinutes) : 0.15;
      
      let sleepQuality = 100;
      if (sleepHours < 7) sleepQuality = (sleepHours / 7) * 100;
      else if (sleepHours > 9) sleepQuality = 100 - ((sleepHours - 9) * 10);
      
      metric.sleepScore = Math.min(100, Math.round(sleepQuality * 0.7 + deepSleepRatio * 100 * 0.3));
    }
    
    // Recovery score based on RHR (lower is better)
    if (metric.rhr) {
      if (metric.rhr < 60) {
        metric.recoveryScore = Math.min(100, 85 + (60 - metric.rhr));
      } else {
        metric.recoveryScore = Math.max(0, 85 - (metric.rhr - 60) * 1.5);
      }
      metric.recoveryScore = Math.round(metric.recoveryScore);
    }
    
    // Workout intensity from activity minutes and calories
    if (metric.activityMinutes > 0) {
      const intensityFromTime = Math.min(100, (metric.activityMinutes / 60) * 100);
      const intensityFromCalories = Math.min(100, (metric.calories / 2500) * 100);
      metric.workoutIntensity = Math.round((intensityFromTime + intensityFromCalories) / 2);
    } else if (metric.steps > 8000) {
      // Light workout intensity from steps only
      metric.workoutIntensity = Math.min(50, Math.round((metric.steps / 10000) * 50));
    }
    
    // Default HRV if not available (will be calculated from historical RHR variation in storage layer)
    if (!metric.hrv && metric.rhr) {
      metric.hrv = Math.max(20, Math.min(80, 60 - (metric.rhr - 60)));
    }
    
    return metric;
  });
  
  return metrics.filter((m: any) => m.steps > 0 || m.calories > 0); // Filter out empty days
}
