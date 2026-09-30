const express = require('express');
const router = express.Router();
const { dbService } = require('../services/DatabaseService');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/users - Get all users
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const users = await dbService.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, phone: true, name: true, role: true, createdAt: true }
    });
    res.json(users);
  } catch (err) {
    console.error('[Users API] Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/users/:id - Update user details
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, phone, role } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;

    const user = await dbService.prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json({ id: user.id, phone: user.phone, name: user.name, role: user.role });
  } catch (err) {
    console.error('[Users API] Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await dbService.prisma.user.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[Users API] Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
