import { Router } from 'express';
import { upsertUserFromSupabaseToken } from '../utils/supabaseAuth';

const router = Router();

router.post('/supabase/session', async (req, res) => {
  try {
    const { accessToken, providerToken, providerRefreshToken, providerExpiresAt } = req.body;
    if (!accessToken) return res.status(400).json({ error: 'accessToken required' });

    const user = await upsertUserFromSupabaseToken(accessToken, {
      providerToken,
      providerRefreshToken,
      providerExpiresAt,
    });

    return res.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      googleConnected: Boolean(providerToken),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/google', (_req, res) => {
  res.status(410).json({
    error: 'Google OAuth is handled by Supabase Auth from the frontend.',
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/meetings.space.readonly',
    ],
  });
});

router.get('/google/callback', (_req, res) => {
  res.redirect(process.env.FRONTEND_URL || 'http://localhost:5500');
});

router.get('/notion', (_req, res) => {
  res.status(501).json({
    error: 'Notion OAuth is scaffolded but not connected yet.',
    next: 'For the hackathon path, set NOTION_CLIENT_SECRET and NOTION_DATABASE_ID in .env.',
  });
});

export default router;
