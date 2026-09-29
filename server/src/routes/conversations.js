const express = require('express');
const rateLimit = require('express-rate-limit');
const { verifyDeviceSecret } = require('./sync');
const { dbService } = require('../services/DatabaseService');

const router = express.Router();

const convLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

async function authDevice(req, res) {
  const { deviceId, deviceSecret } = req.body || req.query || {};
  if (!deviceId || !deviceSecret) {
    return res.status(400).json({ error: 'deviceId and deviceSecret are required' });
  }
  try {
    const auth = await verifyDeviceSecret(deviceId, deviceSecret);
    if (auth.error) return res.status(401).json({ error: auth.error });
    return { deviceId };
  } catch (err) {
    console.error('[ConversationsRouter] Device auth failed:', err);
    return res.status(500).json({ error: 'Could not verify device' });
  }
}

router.get('/', convLimiter, async (req, res) => {
  const deviceId = req.query.deviceId;
  const deviceSecret = req.query.deviceSecret;
  const auth = await authDevice({ body: { deviceId, deviceSecret } }, res);
  if (!auth || auth.statusCode) return;

  try {
    const conversations = await dbService.prisma.citizenConversation.findMany({
      where: { deviceId: auth.deviceId },
      select: {
        id: true,
        title: true,
        lastMessage: true,
        schemeSlug: true,
        schemeName: true,
        icon: true,
        accent: true,
        read: true,
        language: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ conversations });
  } catch (err) {
    console.error('[ConversationsRouter] List failed:', err);
    res.status(500).json({ error: 'Could not load conversations' });
  }
});

router.get('/:id', convLimiter, async (req, res) => {
  const { deviceId, deviceSecret } = req.query;
  const auth = await authDevice({ body: { deviceId, deviceSecret } }, res);
  if (!auth || auth.statusCode) return;

  try {
    const conversation = await dbService.prisma.citizenConversation.findFirst({
      where: { id: req.params.id, deviceId: auth.deviceId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            language: true,
            toolCalls: true,
            clientItemId: true,
            createdAt: true,
          },
        },
      },
    });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json({ conversation });
  } catch (err) {
    console.error('[ConversationsRouter] Get failed:', err);
    res.status(500).json({ error: 'Could not load conversation' });
  }
});

router.put('/:id', convLimiter, async (req, res) => {
  const auth = await authDevice(req, res);
  if (!auth || auth.statusCode) return;

  const allowed = [
    'title', 'lastMessage', 'schemeSlug', 'schemeName',
    'icon', 'accent', 'read', 'language', 'state',
  ];
  const data = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  }
  data.updatedAt = new Date();

  try {
    const existing = await dbService.prisma.citizenConversation.findFirst({
      where: { id: req.params.id, deviceId: auth.deviceId },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const updated = await dbService.prisma.citizenConversation.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true, title: true, lastMessage: true, schemeSlug: true,
        schemeName: true, icon: true, accent: true, read: true,
        language: true, updatedAt: true,
      },
    });
    res.json({ conversation: updated });
  } catch (err) {
    console.error('[ConversationsRouter] Update failed:', err);
    res.status(500).json({ error: 'Could not update conversation' });
  }
});

router.delete('/:id', convLimiter, async (req, res) => {
  const auth = await authDevice(req, res);
  if (!auth || auth.statusCode) return;

  try {
    const existing = await dbService.prisma.citizenConversation.findFirst({
      where: { id: req.params.id, deviceId: auth.deviceId },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    await dbService.prisma.citizenConversation.delete({
      where: { id: req.params.id },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('[ConversationsRouter] Delete failed:', err);
    res.status(500).json({ error: 'Could not delete conversation' });
  }
});

router.delete('/', convLimiter, async (req, res) => {
  const auth = await authDevice(req, res);
  if (!auth || auth.statusCode) return;

  try {
    await dbService.prisma.citizenConversation.deleteMany({
      where: { deviceId: auth.deviceId },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('[ConversationsRouter] Clear all failed:', err);
    res.status(500).json({ error: 'Could not clear conversations' });
  }
});

module.exports = router;
