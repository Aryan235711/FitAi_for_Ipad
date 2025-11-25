# FitSync Pro - Deployment Guide

## ⚠️ Important: Backend Considerations

FitSync Pro uses an **Express.js backend** with PostgreSQL, Google OAuth, and session management. This architecture is designed for platforms that support long-running Node.js servers.

### Recommended Deployment Platforms

**Best Options (Backend + Frontend):**
- **Railway.app** ⭐ (Recommended) - Supports Node.js, PostgreSQL, automatic HTTPS
- **Render.com** - Free tier available, good for fullstack apps
- **Fly.io** - Global deployment with database support
- **Replit Deployments** - Native platform, easiest setup

**Vercel Note:** Vercel is optimized for serverless/static sites. To deploy this app to Vercel, you would need to refactor the Express backend into Vercel serverless functions, which is a significant architectural change.

## 🚀 Deploy to Railway (Recommended)

FitSync Pro is now PWA-ready and works great on Railway!

### Prerequisites
- GitHub account
- Railway account (free tier works great)
- Google Cloud Console project with OAuth credentials
- OpenAI API key (for AI insights)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: FitSync Pro PWA"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your FitSync Pro repository
4. Railway will auto-detect it as a Node.js app
5. Add a PostgreSQL database:
   - Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
   - Railway will automatically set `DATABASE_URL`
6. Add environment variables in the **Variables** tab:

   | Variable | Required | Description |
   | --- | --- | --- |
   | `PUBLIC_URL` | ✅ | Base HTTPS URL for this deployment. Example: `https://your-app.up.railway.app`. Used for Google OAuth callbacks. |
   | `DATABASE_URL` | ✅ | Set automatically when you add the Railway PostgreSQL database. |
   | `SESSION_SECRET` | ✅ | Random string for Express session encryption. |
   | `GOOGLE_CLIENT_ID` | ✅ | OAuth 2.0 Client ID from Google Cloud Console. |
   | `GOOGLE_CLIENT_SECRET` | ✅ | OAuth 2.0 Client Secret from Google Cloud Console. |
   | `AI_INTEGRATIONS_OPENAI_API_KEY` | ✅ | OpenAI key for AI insights. |
   | `AI_INTEGRATIONS_OPENAI_BASE_URL` | Optional | Override if routing OpenAI requests through a proxy. |
   | `SESSION_COOKIE_SECURE` / `SESSION_COOKIE_SAMESITE` | Optional | Override cookie behavior if your TLS terminates before Node. |

7. Click **"Deploy"**
8. Railway will provide a URL like `https://your-app.up.railway.app` — copy this back into `PUBLIC_URL` anytime it changes (custom domains included).

### Step 3: Update Google OAuth Redirect URI

After deployment, update your Google Cloud Console OAuth credentials:

**Authorized redirect URIs:**
```
https://your-app.up.railway.app/auth/google/callback
https://your-app.up.railway.app/api/google-fit/callback
```

**Authorized JavaScript origins:**
```
https://your-app.up.railway.app
```

Changes may take 5-10 minutes to propagate.

### Step 4: Install as PWA on iPad

Once deployed:

1. Open Safari on your iPad
2. Navigate to your Railway deployment URL (e.g., `https://your-app.up.railway.app`)
3. Tap the **Share** button (square with arrow)
4. Scroll and tap **"Add to Home Screen"**
5. Name it "FitSync Pro"
6. Tap **"Add"**

🎉 **Done!** You now have FitSync Pro as a native-feeling app on your iPad!

### PWA Features

✅ **Offline-capable** - Works without internet  
✅ **Fullscreen mode** - No browser UI  
✅ **App icon** - Appears on home screen  
✅ **Fast loading** - Service worker caching  
✅ **iOS optimized** - Black translucent status bar  

### Alternative Deployment: Vercel (Frontend Only)

To deploy on Vercel, you would need to:
1. Refactor the Express backend into Vercel serverless functions
2. Use Vercel Postgres or external database
3. Modify OAuth flow for serverless architecture
4. This requires significant code changes and is not recommended unless you need Vercel specifically

### Database Options

For production:
- **Railway PostgreSQL** (recommended) - Included, automatic setup
- **Neon** - Serverless PostgreSQL with generous free tier
- **Supabase** - PostgreSQL + additional features

### Notes

- The app requires HTTPS (Vercel provides this automatically)
- Service worker only works on HTTPS or localhost
- Test the PWA installation on your iPad after deployment
- For Android, use Chrome's "Add to Home screen" option
- When running locally (`npm run dev`), cookies fall back to HTTP so you can test without HTTPS. In production the server automatically sets `secure` cookies; override with `SESSION_COOKIE_SECURE=false` only if TLS terminates before Node.js.

### Troubleshooting

**Service Worker not registering:**
- Ensure you're on HTTPS
- Check browser console for errors
- Clear cache and reload

**OAuth not working:**
- Verify redirect URIs in Google Cloud Console
- Wait 5-10 minutes after updating OAuth settings
- Check environment variables are set correctly

**App not caching:**
- Force refresh (Cmd+Shift+R on desktop)
- Unregister old service workers in DevTools
- Reinstall the PWA

---

Built with ❤️ using React, Vite, Google Fit API, and OpenAI
