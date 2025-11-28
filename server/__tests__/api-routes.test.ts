import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import type { Server } from 'http';
import { app } from '../app';
import { registerRoutes } from '../routes';

const storageMocks = vi.hoisted(() => ({
  healthCheck: vi.fn().mockResolvedValue(undefined),
  getUser: vi.fn(),
  getUserByEmail: vi.fn(),
  upsertUser: vi.fn(),
  getGoogleFitToken: vi.fn().mockResolvedValue({
    userId: 'user-123',
    accessToken: 'access-token',
    refreshToken: 'test-refresh-token',
    expiresAt: new Date(Date.now() + 60_000),
  }),
  saveGoogleFitToken: vi.fn(),
  updateGoogleFitToken: vi.fn(),
  deleteGoogleFitToken: vi.fn(),
  getFitnessMetrics: vi.fn().mockResolvedValue([]),
  getFitnessMetricByDate: vi.fn(),
  saveFitnessMetrics: vi.fn().mockResolvedValue(undefined),
  upsertFitnessMetric: vi.fn(),
  getLatestInsight: vi.fn(),
  saveInsight: vi.fn(),
  markInsightAsRead: vi.fn(),
}));

vi.mock('../storage', () => ({
  storage: storageMocks,
}));

const fetchGoogleFitDataMock = vi.hoisted(() => vi.fn());
const transformGoogleFitDataMock = vi.hoisted(() => vi.fn());

vi.mock('../googleFit', () => ({
  fetchGoogleFitData: (...args: unknown[]) => fetchGoogleFitDataMock(...args),
  transformGoogleFitData: (...args: unknown[]) => transformGoogleFitDataMock(...args),
}));

const generateDailyInsightMock = vi.hoisted(() => vi.fn());

vi.mock('../aiInsights', () => ({
  generateDailyInsight: (...args: unknown[]) => generateDailyInsightMock(...args),
}));

vi.mock('../googleAuth', () => ({
  setupAuth: vi.fn(),
  isAuthenticated: (req: any, res: any, next: any) => {
    const userId = req.headers['x-test-user'];
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = { id: userId };
    req.isAuthenticated = () => true;
    next();
  },
}));

describe('API Routes', () => {
  let server: Server;

  beforeAll(async () => {
    process.env.SESSION_SECRET = 'test-secret';
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated access to protected fitness metrics', async () => {
    const response = await request(app).get('/api/metrics');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
    expect(storageMocks.getFitnessMetrics).not.toHaveBeenCalled();
  });

  it('returns metrics for authenticated users and forwards query params', async () => {
    const metricsPayload = [
      { id: 1, userId: 'user-abc', date: '2024-01-01', recoveryScore: 80 },
    ];
    storageMocks.getFitnessMetrics.mockResolvedValueOnce(metricsPayload);

    const response = await request(app)
      .get('/api/metrics?days=7')
      .set('x-test-user', 'user-abc');

    expect(response.status).toBe(200);
    expect(response.body).toMatchInlineSnapshot(`
      [
        {
          "date": "2024-01-01",
          "id": 1,
          "recoveryScore": 80,
          "userId": "user-abc",
        },
      ]
    `);
    expect(storageMocks.getFitnessMetrics).toHaveBeenCalledWith('user-abc', 7);
  });

  it('maps Google Fit sync errors to friendly messages', async () => {
    const syncError = Object.assign(new Error('refresh token missing'), { status: 400 });
    fetchGoogleFitDataMock.mockRejectedValueOnce(syncError);

    const response = await request(app)
      .post('/api/google-fit/sync')
      .set('x-test-user', 'user-xyz')
      .send({ startDate: '2024-01-01', endDate: '2024-01-05' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      errorType: 'StaleRefreshToken',
    });
  });

  it('returns 400 with friendly message when refresh token is missing from storage', async () => {
    storageMocks.getGoogleFitToken.mockResolvedValueOnce({
      userId: 'user-no-refresh',
      accessToken: 'access-token',
      expiresAt: new Date(Date.now() + 60_000),
      // No refreshToken
    });

    const response = await request(app)
      .post('/api/google-fit/sync')
      .set('x-test-user', 'user-no-refresh')
      .send({ startDate: '2024-01-01', endDate: '2024-01-05' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Google Fit: refresh token missing',
      errorType: 'MissingRefreshToken',
    });
    expect(fetchGoogleFitDataMock).not.toHaveBeenCalled();
  });

  it('saves transformed Google Fit metrics on successful sync', async () => {
    fetchGoogleFitDataMock.mockResolvedValueOnce({ bucket: [] });
    transformGoogleFitDataMock.mockReturnValueOnce([
      { userId: 'user-xyz', date: '2024-01-01', recoveryScore: 90 },
    ]);

    const response = await request(app)
      .post('/api/google-fit/sync')
      .set('x-test-user', 'user-xyz')
      .send({ startDate: '2024-01-01', endDate: '2024-01-05' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchInlineSnapshot(`
      {
        "details": {
          "endDate": "2024-01-05",
          "metricsCount": 1,
          "startDate": "2024-01-01",
        },
        "message": "Successfully synced 1 days of fitness data",
        "success": true,
        "synced": 1,
      }
    `);
    expect(storageMocks.saveFitnessMetrics).toHaveBeenCalledWith([
      { userId: 'user-xyz', date: '2024-01-01', recoveryScore: 90 },
    ]);
    expect(generateDailyInsightMock).toHaveBeenCalledWith('user-xyz');
  });

  describe('Insights routes', () => {
    it('returns the latest stored insight for the user', async () => {
      storageMocks.getLatestInsight.mockResolvedValueOnce({
        id: 42,
        userId: 'user-abc',
        content: 'Prioritize lower-intensity work today.',
        type: 'recovery',
        generatedAt: '2024-01-01T00:00:00.000Z',
        isRead: false,
      });

      const response = await request(app)
        .get('/api/insights/latest')
        .set('x-test-user', 'user-abc');

      expect(response.status).toBe(200);
      expect(response.body).toMatchInlineSnapshot(`
        {
          "content": "Prioritize lower-intensity work today.",
          "generatedAt": "2024-01-01T00:00:00.000Z",
          "id": 42,
          "isRead": false,
          "type": "recovery",
          "userId": "user-abc",
        }
      `);
      expect(storageMocks.getLatestInsight).toHaveBeenCalledWith('user-abc');
    });

    it('falls back to CTA message when no insights exist', async () => {
      storageMocks.getLatestInsight.mockResolvedValueOnce(undefined);

      const response = await request(app)
        .get('/api/insights/latest')
        .set('x-test-user', 'user-missing');

      expect(response.status).toBe(200);
      expect(response.body).toMatchInlineSnapshot(`
        {
          "content": "No insights yet. Sync your Google Fit data to get started!",
        }
      `);
    });

    it('generates a fresh insight via AI and returns the copy', async () => {
      generateDailyInsightMock.mockResolvedValueOnce('Hydrate and stretch today.');

      const response = await request(app)
        .post('/api/insights/generate')
        .set('x-test-user', 'user-ai');

      expect(response.status).toBe(200);
      expect(response.body).toMatchInlineSnapshot(`
        {
          "content": "Hydrate and stretch today.",
        }
      `);
      expect(generateDailyInsightMock).toHaveBeenCalledWith('user-ai');
    });

    it('propagates AI generation failures with helpful messaging', async () => {
      generateDailyInsightMock.mockRejectedValueOnce(new Error('OpenAI timeout'));

      const response = await request(app)
        .post('/api/insights/generate')
        .set('x-test-user', 'user-ai');

      expect(response.status).toBe(500);
      expect(response.body).toMatchInlineSnapshot(`
        {
          "message": "OpenAI timeout",
        }
      `);
    });

    it('marks an insight as read', async () => {
      const response = await request(app)
        .patch('/api/insights/12/read')
        .set('x-test-user', 'user-ai');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
      expect(storageMocks.markInsightAsRead).toHaveBeenCalledWith(12);
    });
  });
});
