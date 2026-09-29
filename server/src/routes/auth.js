const express = require('express');
const { dbService } = require('../services/DatabaseService');
const { signToken, setAuthCookie, clearAuthCookie, authenticate } = require('../middleware/auth');

const router = express.Router();

// Simple in-memory store for OTPs (Demo only)
const otpStore = new Map();

// POST /api/auth/request-otp
// Body: { phone }
router.post('/request-otp', async (req, res) => {
  try {
    const { phone } = req.body || {};
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Generate a demo OTP (Hardcoded to 123456 for demo purposes, but stored to simulate real flow)
    const demoOtp = '123456';
    otpStore.set(phone, {
      otp: demoOtp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    console.log(`[Auth] OTP for ${phone} is ${demoOtp}`);

    res.json({ success: true, message: 'OTP sent successfully (Demo: use 123456)' });
  } catch (err) {
    console.error('[Auth] request-otp error:', err);
    res.status(500).json({ error: 'Failed to request OTP' });
  }
});

// POST /api/auth/verify-otp
// Body: { phone, otp }
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body || {};
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    const record = otpStore.get(phone);
    if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // OTP is valid. Clear it.
    otpStore.delete(phone);

    // Find or create the user
    let user = await dbService.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      // First user is admin, others are user
      const userCount = await dbService.prisma.user.count();
      const assignedRole = userCount === 0 ? 'admin' : 'user';
      
      user = await dbService.prisma.user.create({
        data: {
          phone,
          role: assignedRole,
        },
      });
    }

    const token = signToken(user);
    setAuthCookie(res, token);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('[Auth] verify-otp error:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

// GET /api/auth/me — returns current user + list of accessible agent IDs
router.get('/me', authenticate, async (req, res) => {
  try {
    // For demo purposes, we'll let authenticated users access all agents
    const agents = await dbService.prisma.agent.findMany({ select: { id: true, name: true } });
    res.json({ user: publicUser(req.user), agents });
  } catch (err) {
    console.error('[Auth] me error:', err);
    res.status(500).json({ error: 'Failed to load user' });
  }
});

function publicUser(u) {
  return { id: u.id, phone: u.phone, name: u.name, role: u.role };
}

module.exports = router;
