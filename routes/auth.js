import express from 'express';
import googleCalendarService from '../services/googleCalendar.js';

const router = express.Router();

// Get Google OAuth URL
router.get('/google/url', (req, res) => {
  try {
    const authUrl = googleCalendarService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate auth URL', details: error.message });
  }
});

// Handle Google OAuth callback
router.post('/google/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const result = await googleCalendarService.handleCallback(code);

    res.json({
      success: true,
      message: 'Google Calendar authenticated successfully',
      tokens: {
        accessToken: result.tokens.access_token ? '***' : undefined,
        expiresIn: result.tokens.expiry_date
      }
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      details: error.message
    });
  }
});

// Check authentication status
router.get('/status', async (req, res) => {
  try {
    const hasAuth = await googleCalendarService.loadStoredTokens();
    res.json({ authenticated: hasAuth });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check auth status' });
  }
});

export default router;
