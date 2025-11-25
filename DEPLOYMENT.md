# FitSync Pro - Deployment Guide

## 🚀 Deploy to Vercel

FitSync Pro is now PWA-ready and optimized for Vercel deployment!

### Prerequisites
- GitHub account
- Vercel account (free tier works great)
- Google Cloud Console project with OAuth credentials

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: FitSync Pro PWA"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect the settings from `vercel.json`
5. Add environment variables:
   - `DATABASE_URL` - Your PostgreSQL database URL (use Neon or Vercel Postgres)
   - `SESSION_SECRET` - Random string for session encryption
   - `GOOGLE_CLIENT_ID` - From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
   - `AI_INTEGRATIONS_OPENAI_API_KEY` - Your OpenAI API key
   - `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI API base URL (optional)
   - `ISSUER_URL` - Your Replit Auth issuer URL
   - `REPL_ID` - Your Replit ID

6. Click **"Deploy"**

### Step 3: Update Google OAuth Redirect URI

After deployment, update your Google Cloud Console OAuth credentials:

**Authorized redirect URIs:**
```
https://your-app.vercel.app/api/google-fit/callback
```

**Authorized JavaScript origins:**
```
https://your-app.vercel.app
```

Changes may take 5-10 minutes to propagate.

### Step 4: Install as PWA on iPad

Once deployed:

1. Open Safari on your iPad
2. Navigate to `https://your-app.vercel.app`
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

### Database Options

For production, consider:
- **Neon** (recommended) - Serverless PostgreSQL with free tier
- **Vercel Postgres** - Integrated with Vercel
- **Supabase** - PostgreSQL + additional features

### Notes

- The app requires HTTPS (Vercel provides this automatically)
- Service worker only works on HTTPS or localhost
- Test the PWA installation on your iPad after deployment
- For Android, use Chrome's "Add to Home screen" option

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
