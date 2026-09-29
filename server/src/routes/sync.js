const express = require('express');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');

const { dbService } = require('../services/DatabaseService');
const { getSupportedLanguages } = require('../modules/i18n/languageRegistry');
const {
  validateEnvelope,
  partitionItems,
  ValidationError,
} = require('./syncValidation');

const router = express.Router();

const syncLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many sync requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

const catalogLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many catalog requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

// A device is registered on first sync by hashing whatever secret it presents.
// That means an attacker who guesses a deviceId can register it first, so the
// id is not a secret and the secret must be high-entropy. The client generates
// 32 random bytes; anything shorter is refused.
const MIN_SECRET_LENGTH = 32;

/**
 * Returns { isNew } on success, or { error } when the presented secret does not
 * match the one already registered for this device.
 */
async function verifyDeviceSecret(deviceId, deviceSecret) {
  if (deviceSecret.length < MIN_SECRET_LENGTH) {
    return { error: 'deviceSecret is too short' };
  }

  const existing = await dbService.prisma.citizenDevice.findUnique({
    where: { deviceId },
    select: { deviceSecretHash: true },
  });

  if (!existing) {
    const deviceSecretHash = await bcrypt.hash(deviceSecret, 10);
    await dbService.prisma.citizenDevice.create({ data: { deviceId, deviceSecretHash } });
    return { isNew: true };
  }

  const matches = await bcrypt.compare(deviceSecret, existing.deviceSecretHash);
  return matches ? { isNew: false } : { error: 'Invalid deviceSecret' };
}

router.post('/', syncLimiter, async (req, res) => {
  let envelope;
  try {
    envelope = validateEnvelope(req.body);
  } catch (err) {
    if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
    throw err;
  }

  const { deviceId, deviceSecret, items } = envelope;

  try {
    const auth = await verifyDeviceSecret(deviceId, deviceSecret);
    if (auth.error) return res.status(401).json({ error: auth.error });
  } catch (err) {
    console.error('[SyncRouter] Device auth failed:', err);
    return res.status(500).json({ error: 'Could not verify device' });
  }

  const now = new Date();
  const { valid, rejected } = partitionItems(items, now);

  const acked = [];

  for (const item of valid) {
    try {
      await dbService.prisma.citizenConversation.upsert({
        where: { id: item.conversationId },
        create: {
          id: item.conversationId,
          deviceId,
          language: item.language,
          channel: 'text',
        },
        // A replayed batch must not drag the conversation's updatedAt backwards
        // or change the language back to a stale value.
        update: { updatedAt: now },
      });

      await dbService.prisma.citizenMessage.create({
        data: {
          conversationId: item.conversationId,
          role: item.role,
          content: item.text,
          language: item.language,
          clientItemId: item.clientItemId,
          toolCalls: item.toolCalls,
          createdAt: item.createdAt,
        },
      });

      acked.push(item.clientItemId);
    } catch (err) {
      if (err.code === 'P2002') {
        // Unique-constraint hit means this clientItemId is already stored —
        // the happy path for a retry after a dropped response. Ack it so the
        // client deletes it instead of retrying forever.
        acked.push(item.clientItemId);
        continue;
      }
      console.error('[SyncRouter] Persist failed for', item.clientItemId, err);
      rejected.push({ clientItemId: item.clientItemId, reason: 'Server error during persistence' });
    }
  }

  // A partial success is normal. The client deletes only what is in `acked`
  // and keeps everything in `rejected` for a later attempt.
  res.json({ acked, rejected, serverTime: now.toISOString() });
});

router.get('/catalog', catalogLimiter, (req, res) => {
  const catalogDir =
    process.env.CATALOG_DIR || path.join(__dirname, '..', '..', '..', 'citizen', 'src', 'data', 'schemes');
  const indexPath = path.join(catalogDir, 'index.json');

  if (!fs.existsSync(indexPath)) {
    return res.status(404).json({ error: 'Catalog not found' });
  }

  let index;
  try {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (err) {
    console.error('[SyncRouter] Catalog index unreadable:', err);
    return res.status(500).json({ error: 'Catalog index is invalid' });
  }

  const schemes = [];
  for (const slug of index.schemes || []) {
    const schemePath = path.join(catalogDir, `${slug}.json`);
    if (!fs.existsSync(schemePath)) {
      console.error(`[SyncRouter] Catalog index references missing scheme: ${slug}`);
      continue;
    }
    try {
      schemes.push(JSON.parse(fs.readFileSync(schemePath, 'utf8')));
    } catch (err) {
      // One malformed file must not blank the whole catalog.
      console.error(`[SyncRouter] Skipping unreadable scheme ${slug}:`, err);
    }
  }

  const version = index.version || 'unknown';
  const etag = `W/"${version}"`;

  if (req.headers['if-none-match'] === etag) return res.status(304).end();

  res.set('ETag', etag);
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  res.json({ version, schemes });
});

router.get('/languages', catalogLimiter, (req, res) => {
  res.json({ languages: getSupportedLanguages() });
});

module.exports = router;
module.exports.verifyDeviceSecret = verifyDeviceSecret;
