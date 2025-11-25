# FitSync Pro - Advanced Health Metrics Dashboard

## Overview

FitSync Pro is a comprehensive fitness and health tracking application that integrates with Google Fit to provide deep insights into biometric data. The application visualizes complex health metrics through advanced charts and provides AI-powered insights to help users understand correlations between sleep, recovery, nutrition, and workout performance.

**Core Purpose:** Transform raw fitness data into actionable insights by revealing patterns and correlations across multiple health dimensions (sleep quality, heart rate variability, nutrition, recovery, and workout intensity).

**Key Features:**
- Email-based magic link authentication (works with any email including Gmail)
- Google Fit integration for automated data synchronization
- Advanced data visualizations (Recovery Radar, Nerve Check, MindShield, Fuel Analyzer, Sync Index)
- AI-powered daily insights using OpenAI
- Real-time biometric tracking and analysis
- Readiness and recovery score calculations

## User Preferences

Preferred communication style: Simple, everyday language.
UI Structure: DO NOT MODIFY - User values current structure. Only add functionality.
Authentication: Switched from Google OAuth to magic link email authentication (Session 3, Nov 25, 2025)

## Latest Updates (Session 3, Nov 25, 2025)

**Major Changes:**
- Replaced complex Google OAuth with simple magic link email authentication
- Works with any email (Gmail, Yahoo, Outlook, etc.)
- Auto-creates users on first login
- No OAuth configuration needed - completely portable to local/self-hosted environments
- Session-based auth with PostgreSQL backing
- Production-ready and tested

## 📊 FEATURE READABILITY & iPad UX AUDIT

### Chart Breakdown & Readability Scores

#### 1. **Recovery Radar** - 3D Scatter Plot
**What It Shows:** 
- X-axis: Workout Intensity (how hard you exercised)
- Y-axis: Sleep Quality % (how well you slept)
- Z-axis (bubble size): Heart Rate at Rest (RHR - lower is better)
- Color: Pink = high RHR (needs rest), Neon Lime = low RHR (ready to go)

**Data Display on iPad:**
- ✅ Hover tooltips appear on tap/long-press
- ✅ Bubble size proportional to RHR value
- ✅ Clear axis labels in readable 12px font
- ⚠️ Small touch target - need 44px minimum (currently borderline)

**Interaction Pattern:** Tap a bubble → tooltip shows exact values
**iPad Readability Score:** 7.5/10
**Issues:** Scatter plot axis labels could be slightly larger for older eyes

---

#### 2. **Nerve Check** - Dual Line Chart
**What It Shows:**
- Blue solid line: Heart Rate Variability (HRV) - higher = better nervous system recovery
- Neon Lime dashed line: Sleep Consistency - measures if sleep schedule is regular
- X-axis: Date (showing last 7-30 days)
- Two separate Y-axes for different scales

**Data Display on iPad:**
- ✅ Values appear on hover/tap at each data point
- ✅ Date shown as day number (01, 02, etc.) - readable
- ✅ Both lines clearly distinguished (solid vs dashed)
- ✅ Large active dots (6px) when hovering - great for iPad

**Interaction Pattern:** Tap any point → detailed tooltip shows HRV + Sleep Consistency values
**iPad Readability Score:** 8.5/10
**Why High:** Clear line styles, large touch targets, easy to follow trends

---

#### 3. **MindShield** - Heatmap Grid (28 boxes)
**What It Shows:** 
- 4 rows × 7 columns = 28 day visualization (4 weeks)
- Color intensity = psychological resilience/stress level
- Dark red = stressed/low resilience
- Bright Neon Lime = highly resilient/low stress
- Numbers inside boxes = 0-100 resilience score

**Data Display on iPad:**
- ✅ Number appears ON the box (not hover-required)
- ✅ Each box scales 110% on hover - visual feedback
- ✅ Text opacity changes: 60% default → 100% on hover (very readable)
- ✅ Minimum 44px squares - good iPad touch target

**Interaction Pattern:** 
- Default: See color + number
- Tap/Hover: Box scales up, number becomes brighter
- NO HOVER REQUIRED - numbers always visible!

**iPad Readability Score:** 9/10
**Why High:** Numbers are always visible, not hidden in tooltips. Excellent for iPad!

---

#### 4. **Nerve Check** - Dual Axis Line Chart (continued)
**iPad-Specific Issues:**
- Hover tooltips work on iPad with long-press (400ms)
- No native hover on iPad - uses long-press instead
- Tooltip appears in dark glass style card
- Contains: Date, HRV value, Sleep Consistency value

**Reading Pattern on iPad:**
1. Scroll to see full week
2. Long-press any point on line
3. Tooltip pops up showing exact numbers
4. Easy to compare day-to-day changes

---

#### 5. **Sync Index** - Three Circular Progress Gauges
**What It Shows:**
- Recovery (top left): % recovery from last workout
- HRV (top center): Heart Rate Variability score
- Sleep (top right): Sleep quality percentage
- Each has animated circular ring 0-100%

**Data Display on iPad:**
- ✅ Number displayed INSIDE circle (not hidden)
- ✅ Label below each circle (REC, HRV, SLP)
- ✅ Color-coded: Primary color, Secondary color, Accent color
- ✅ Responsive to screen size - scales perfectly

**Interaction Pattern:** Read-only visualization (no interaction needed)
**iPad Readability Score:** 9.5/10
**Why High:** All data visible at once, no hover required, clear labels

---

#### 6. **Wellness Triangle** - 3D Radar Chart
**What It Shows:** Three metrics in a triangle:
- Sleep Quality (top)
- Recovery Readiness (bottom left)
- HRV Health (bottom right)

**Data Display on iPad:**
- ⚠️ Hover tooltips only
- Requires precise tapping
- Values only show on tap

**iPad Readability Score:** 6.5/10
**Issues:** Hidden data (only in tooltips), hard to tap on iPad

---

#### 7. **Load Balancer** - Parallel Bars
**What It Shows:** Workout intensity vs recovery capacity
- Green bar = how hard you worked
- Orange bar = how much recovery capacity remains

**Data Display on iPad:**
- ✅ Bars always show percentages
- ✅ Easy to compare side-by-side
- ✅ Large touch targets

**iPad Readability Score:** 8/10

---

#### 8. **Fuel Analyzer** - Nutrition Breakdown
**What It Shows:** 
- Calories vs macros (protein, carbs, fats)
- Bar chart showing intake by day

**Data Display on iPad:**
- ✅ Values on bars or hover
- ✅ Color-coded nutrients

**iPad Readability Score:** 8/10

---

#### 9. **Vitality Orb** - Glowing Circle (Animated)
**What It Shows:** Overall wellness score (0-100)
- Size and glow intensity represent current vitality
- Animated pulse effect

**Data Display on iPad:**
- ✅ Large, easy to read number in center
- ✅ Color indicates status (red=low, green=high)
- ✅ No interaction needed - visual only

**iPad Readability Score:** 9/10

---

### OVERALL READABILITY ASSESSMENT

| Feature | Data Visibility | iPad Touch | Number Display | Score |
|---------|-----------------|-----------|-----------------|-------|
| Recovery Radar | Tooltip | Borderline | Tap required | 7.5/10 |
| Nerve Check | Tooltip | Excellent | Tap required | 8.5/10 |
| MindShield Heatmap | **Always visible** | Excellent | **Always visible** | **9/10** |
| Sync Index Gauges | **Always visible** | N/A | **Always visible** | **9.5/10** |
| Wellness Triangle | Tooltip | Hard | Tap required | 6.5/10 |
| Load Balancer | **Always visible** | Excellent | **Always visible** | 8/10 |
| Fuel Analyzer | Mixed | Good | Mostly visible | 8/10 |
| Vitality Orb | **Always visible** | N/A | **Always visible** | 9/10 |

### 🎯 iPad UX Recommendations

**✅ Already Great for iPad:**
- MindShield (numbers always visible)
- Sync Index (circular gauges, no hover needed)
- Vitality Orb (large display)
- Load Balancer (simple bars)

**⚠️ Could Improve for iPad:**
- Recovery Radar: Make axis labels larger (14px instead of 12px)
- Wellness Triangle: Add data labels directly on chart (don't hide in tooltips)
- Nerve Check: Already good with long-press, but could add visible legend

**🎨 Current iPad Gesture Support:**
- ✅ Pull-to-refresh on dashboard
- ✅ Long-press (400ms) for tooltips
- ✅ Pinch-zoom available
- ✅ All buttons 44px+ touch target

### 📱 Authentication Experience

**Login Flow on iPad:**
1. User enters email
2. Gets magic link (displayed on screen in dev mode)
3. Clicks link → authenticated instantly
4. No OAuth popups, no redirect issues
5. Session stored in database

**Advantages:**
- ✅ Works offline on local machine
- ✅ No CORS issues
- ✅ Works on any domain
- ✅ Simple and bulletproof

---

## System Architecture

### Frontend Architecture

**Framework:** React 18 with TypeScript using Vite as the build tool

**UI Component System:**
- **shadcn/ui** with Radix UI primitives for accessible, customizable components
- **Tailwind CSS v4** (using `@import "tailwindcss"` directive) with custom design tokens
- **CSS Variables** for theming with dark mode by default
- **Framer Motion** for animations and transitions

**State Management:**
- **TanStack Query (React Query)** for server state management, data fetching, and caching
- Local React state for UI-specific state
- Custom hooks pattern for shared logic (`useAuth`, `useFitnessData`, `useGoogleFit`)

**Routing:** Wouter for lightweight client-side routing

**Design System:**
- Custom color palette: Neon Lime primary (#ccff00), Electric Blue secondary, Hot Pink accent
- Dark theme with glass morphism effects
- Custom fonts: Inter (body), Outfit (display), Space Grotesk (mono)
- Responsive design with mobile-first approach

**Chart Library:** Recharts for data visualization with custom-styled components

**Code Organization:**
- `/client/src/components` - Reusable UI components
- `/client/src/pages` - Page-level components
- `/client/src/hooks` - Custom React hooks
- `/client/src/lib` - Utility functions and API client
- `/shared` - Shared types and schemas between client and server

### Backend Architecture

**Framework:** Express.js with TypeScript running on Node.js

**API Design:** RESTful API with JSON responses

**Authentication:** 
- Email-based magic link system
- Passport.js-compatible session middleware
- Session-based authentication with connect-pg-simple for session storage
- Protected routes using `isAuthenticated` middleware

**Database ORM:** Drizzle ORM with PostgreSQL dialect

**Server Structure:**
- Development server (`index-dev.ts`) with Vite middleware for HMR
- Production server (`index-prod.ts`) serving static files
- Modular route registration in `routes.ts`
- Separated business logic in dedicated modules (`storage.ts`, `googleFit.ts`, `aiInsights.ts`)

**Key Endpoints:**
- `/auth/request-login` - Request magic link (POST)
- `/auth/verify` - Verify token and create session (GET)
- `/api/auth/user` - Get authenticated user
- `/auth/logout` - Logout user
- `/api/google-fit/sync` - Sync fitness data
- `/api/fitness-metrics` - Retrieve fitness metrics
- `/api/insights/latest` - Get latest AI insight

### Data Layer

**Database:** PostgreSQL (via Neon serverless or local PostgreSQL)

**Schema Design:**
```
sessions - Session storage for authentication
users - User profiles (id, email, firstName, lastName, profileImageUrl)
google_fit_tokens - OAuth tokens for Google Fit API (with refresh token support)
fitness_metrics - Daily health metrics (RHR, HRV, sleep scores, nutrition, activity)
insights - AI-generated insights (content, type, read status)
```

**Data Storage Pattern:**
- Interface-based storage layer (`IStorage`) for abstraction
- `DatabaseStorage` class implements all database operations
- Drizzle ORM for type-safe queries
- Upsert pattern for idempotent metric updates

**Metric Calculation:**
- Readiness Score: Weighted combination of sleep (40%), recovery (30%), HRV (30%)
- Strain Score: Based on workout intensity and step count
- Sync Index: Multi-dimensional score across recovery, HRV, and sleep

### External Dependencies

**Third-Party Services:**

1. **Google Fit API**
   - OAuth 2.0 authentication flow
   - Scopes: fitness.activity, heart_rate, sleep, nutrition, body
   - Data fetching for multiple health dimensions
   - Token refresh mechanism for long-term access

2. **OpenAI API**
   - Model: GPT-4o-mini
   - Purpose: Generate personalized daily insights
   - Input: Last 7 days of fitness metrics
   - Output: 2-3 sentence actionable insights focused on correlations

3. **Neon Database** (Replit) or Local PostgreSQL (Self-hosted)
   - Serverless PostgreSQL provider
   - Connection via `@neondatabase/serverless` driver or standard `pg`
   - Environment variable: `DATABASE_URL`

**APIs and Integrations:**
- Google OAuth 2.0 for Fit API access
- OpenAI Chat Completions API for insights

**Key Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_BASE_URL` - OpenAI API base URL (optional)

**Build and Deployment:**
- Vite for frontend bundling with React plugin
- esbuild for backend bundling (ESM format)
- Production build outputs to `/dist` directory
- Works on Replit, local machine, Docker, any Node.js host
