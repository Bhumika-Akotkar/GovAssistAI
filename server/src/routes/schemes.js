const express = require('express');
const router = express.Router();
const { dbService } = require('../services/DatabaseService');
const { schemeService } = require('../services/SchemeService');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/schemes - List all schemes with optional filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { state, category, sector, gender, search } = req.query;
    const where = {};

    if (state) where.state = state;
    if (category) where.category = category;
    if (sector) where.sector = sector;
    if (gender) where.gender = gender;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sector: { contains: search, mode: 'insensitive' } }
      ];
    }

    const schemes = await dbService.prisma.scheme.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json(schemes);
  } catch (err) {
    console.error('[Schemes API] Error fetching schemes:', err);
    res.status(500).json({ error: 'Failed to fetch schemes' });
  }
});

// GET /api/schemes/:id/steps - Get only applicationSteps (PUBLIC - no auth needed for citizen frontend)
router.get('/:id/steps', async (req, res) => {
  try {
    const data = await schemeService.getSteps(req.params.id);
    if (!data) return res.status(404).json({ error: 'Scheme not found or has no steps' });
    res.json(data);
  } catch (err) {
    console.error('[Schemes API] Error fetching steps:', err);
    res.status(500).json({ error: 'Failed to fetch steps' });
  }
});

// GET /api/schemes/:id - Get single scheme by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const scheme = await dbService.prisma.scheme.findUnique({ where: { id: req.params.id } });
    if (!scheme) return res.status(404).json({ error: 'Scheme not found' });
    res.json(scheme);
  } catch (err) {
    console.error('[Schemes API] Error fetching scheme:', err);
    res.status(500).json({ error: 'Failed to fetch scheme' });
  }
});

// POST /api/schemes/import - Bulk import/upsert from JSON array (admin only)
router.post('/import', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { schemes } = req.body;
    if (!Array.isArray(schemes) || schemes.length === 0) {
      return res.status(400).json({ error: 'Body must be { schemes: [...] } with at least one item.' });
    }
    const results = await schemeService.importSchemes(schemes);
    res.json({ success: true, ...results });
  } catch (err) {
    console.error('[Schemes API] Import failed:', err);
    res.status(500).json({ error: 'Import failed', detail: err.message });
  }
});

// POST /api/schemes - Create new scheme (admin only)
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const {
      name, description, state, minAge, maxAge, maxIncome,
      gender, category, sector, benefits, applicationProcess,
      requiredDocuments, isActive,
      siteUrl, images, tags, dynamicDetails, qualifyingQuestions, applicationSteps,
      exclusionCriteria, sources
    } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    const newScheme = await dbService.prisma.scheme.create({
      data: {
        name, description,
        state: state || null,
        minAge: minAge ? parseInt(minAge) : null,
        maxAge: maxAge ? parseInt(maxAge) : null,
        maxIncome: maxIncome ? parseFloat(maxIncome) : null,
        gender: gender || null,
        category: category || null,
        sector: sector || null,
        benefits: benefits || null,
        applicationProcess: applicationProcess || null,
        requiredDocuments: requiredDocuments || null,
        isActive: isActive !== undefined ? isActive : true,
        siteUrl: siteUrl || null,
        images: images || null,
        tags: tags || null,
        dynamicDetails: dynamicDetails || null,
        qualifyingQuestions: qualifyingQuestions || null,
        applicationSteps: applicationSteps || null,
        exclusionCriteria: exclusionCriteria || null,
        sources: sources || null,
      }
    });

    res.status(201).json(newScheme);
  } catch (err) {
    console.error('[Schemes API] Error creating scheme:', err);
    res.status(500).json({ error: 'Failed to create scheme' });
  }
});

// PUT /api/schemes/:id - Update existing scheme (admin only)
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const {
      name, description, state, minAge, maxAge, maxIncome,
      gender, category, sector, benefits, applicationProcess,
      requiredDocuments, isActive,
      siteUrl, images, tags, dynamicDetails, qualifyingQuestions, applicationSteps,
      exclusionCriteria, sources
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (state !== undefined) updateData.state = state;
    if (minAge !== undefined) updateData.minAge = minAge ? parseInt(minAge) : null;
    if (maxAge !== undefined) updateData.maxAge = maxAge ? parseInt(maxAge) : null;
    if (maxIncome !== undefined) updateData.maxIncome = maxIncome ? parseFloat(maxIncome) : null;
    if (gender !== undefined) updateData.gender = gender;
    if (category !== undefined) updateData.category = category;
    if (sector !== undefined) updateData.sector = sector;
    if (benefits !== undefined) updateData.benefits = benefits;
    if (applicationProcess !== undefined) updateData.applicationProcess = applicationProcess;
    if (requiredDocuments !== undefined) updateData.requiredDocuments = requiredDocuments;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (siteUrl !== undefined) updateData.siteUrl = siteUrl;
    if (images !== undefined) updateData.images = images;
    if (tags !== undefined) updateData.tags = tags;
    if (dynamicDetails !== undefined) updateData.dynamicDetails = dynamicDetails;
    if (qualifyingQuestions !== undefined) updateData.qualifyingQuestions = qualifyingQuestions;
    if (applicationSteps !== undefined) updateData.applicationSteps = applicationSteps;
    if (exclusionCriteria !== undefined) updateData.exclusionCriteria = exclusionCriteria;
    if (sources !== undefined) updateData.sources = sources;

    const updatedScheme = await dbService.prisma.scheme.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(updatedScheme);
  } catch (err) {
    console.error('[Schemes API] Error updating scheme:', err);
    res.status(500).json({ error: 'Failed to update scheme' });
  }
});

// DELETE /api/schemes/:id - Delete scheme (admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await dbService.prisma.scheme.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error('[Schemes API] Error deleting scheme:', err);
    res.status(500).json({ error: 'Failed to delete scheme' });
  }
});

module.exports = router;
