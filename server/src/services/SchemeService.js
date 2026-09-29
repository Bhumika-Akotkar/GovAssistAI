const { dbService } = require('./DatabaseService');
// force restart

class SchemeService {
  async searchSchemes({ age, income, category, gender, state, query }) {
    try {
      const andClauses = [];

      if (age !== undefined && age !== null) {
        andClauses.push({ OR: [{ minAge: null }, { minAge: { lte: age } }] });
        andClauses.push({ OR: [{ maxAge: null }, { maxAge: { gte: age } }] });
      }
      if (income !== undefined && income !== null) {
        andClauses.push({ OR: [{ maxIncome: null }, { maxIncome: { gte: income } }] });
      }
      if (gender) {
        andClauses.push({ OR: [{ gender: null }, { gender: { in: [gender, 'any'] } }] });
      }
      if (category) {
        andClauses.push({ OR: [{ category: null }, { category: { in: [category, 'any'] } }] });
      }
      if (state) {
        andClauses.push({ OR: [{ state: null }, { state: { in: [state, 'All India'] } }] });
      }
      andClauses.push({ isActive: true });

      const whereClause = andClauses.length > 0 ? { AND: andClauses } : { isActive: true };

      const filteredSchemes = await dbService.prisma.scheme.findMany({ where: whereClause });

      if (query && query.trim().length > 0) {
        const queryWords = query.toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 2 && !['yojana', 'scheme', 'the', 'for', 'and'].includes(w));

        if (queryWords.length === 0) return filteredSchemes.slice(0, 5);

        const scored = filteredSchemes.map(scheme => {
          const schemeText = [
            scheme.name,
            scheme.description,
            scheme.sector,
            scheme.benefits,
            Array.isArray(scheme.tags) ? scheme.tags.join(' ') : '',
          ].filter(Boolean).join(' ').toLowerCase();

          const score = queryWords.reduce((acc, word) => acc + (schemeText.includes(word) ? 1 : 0), 0);
          return { scheme, score };
        });

        return scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 5).map(s => s.scheme);
      }

      return filteredSchemes.slice(0, 5);
    } catch (err) {
      console.error('[SchemeService] Search failed:', err);
      return [];
    }
  }

  async getSchemeById(id) {
    try {
      return await dbService.prisma.scheme.findUnique({ where: { id } });
    } catch (err) {
      console.error('[SchemeService] Get by ID failed:', err);
      return null;
    }
  }

  /**
   * Returns just the applicationSteps JSON for a scheme (for direct frontend rendering).
   * The LLM never sees this data — it's fetched by the citizen frontend directly.
   */
  async getSteps(schemeId) {
    try {
      const scheme = await dbService.prisma.scheme.findUnique({
        where: { id: schemeId },
        select: { id: true, name: true, siteUrl: true, applicationSteps: true }
      });
      if (!scheme) return null;
      return {
        schemeId: scheme.id,
        schemeName: scheme.name,
        siteUrl: scheme.siteUrl,
        steps: scheme.applicationSteps || []
      };
    } catch (err) {
      console.error('[SchemeService] getSteps failed:', err);
      return null;
    }
  }

  /**
   * Bulk import/upsert schemes from a JSON array.
   * Matches by name (case-insensitive). Creates if not found, updates if found.
   */
  async importSchemes(schemesArray) {
    const results = { created: 0, updated: 0, failed: 0, errors: [] };

    for (const raw of schemesArray) {
      try {
        if (!raw.name || !raw.description) {
          results.failed++;
          results.errors.push(`Skipped: missing name or description — ${JSON.stringify(raw).slice(0, 60)}`);
          continue;
        }

        // Normalize requiredDocuments: accept String or String[]
        const rawDocs = raw.requiredDocuments;
        const requiredDocumentsStr = Array.isArray(rawDocs)
          ? rawDocs.join('\n')
          : (typeof rawDocs === 'string' ? rawDocs : null);

        // Normalize images: ensure every item is a quoted string
        const rawImages = raw.images;
        const images = Array.isArray(rawImages)
          ? rawImages.filter(i => typeof i === 'string' && i.trim().length > 0)
          : null;

        const data = {
          name: raw.name,
          description: raw.description,
          state: raw.state || null,
          minAge: raw.minAge ? parseInt(raw.minAge) : null,
          maxAge: raw.maxAge ? parseInt(raw.maxAge) : null,
          maxIncome: raw.maxIncome ? parseFloat(raw.maxIncome) : null,
          gender: raw.gender || null,
          category: raw.category || null,
          sector: raw.sector || null,
          benefits: raw.benefits || null,
          applicationProcess: raw.applicationProcess || null,
          requiredDocuments: requiredDocumentsStr,
          isActive: raw.isActive !== undefined ? raw.isActive : true,
          siteUrl: raw.siteUrl || null,
          images: images || null,
          tags: Array.isArray(raw.tags) ? raw.tags : null,
          dynamicDetails: raw.dynamicDetails || null,
          qualifyingQuestions: Array.isArray(raw.qualifyingQuestions) ? raw.qualifyingQuestions : null,
          applicationSteps: Array.isArray(raw.applicationSteps) ? raw.applicationSteps : null,
          exclusionCriteria: Array.isArray(raw.exclusionCriteria) ? raw.exclusionCriteria : null,
          sources: Array.isArray(raw.sources) ? raw.sources : null,
        };

        // Try to find by name
        const existing = await dbService.prisma.scheme.findFirst({
          where: { name: { equals: raw.name, mode: 'insensitive' } }
        });

        if (existing) {
          await dbService.prisma.scheme.update({ where: { id: existing.id }, data });
          results.updated++;
        } else {
          await dbService.prisma.scheme.create({ data });
          results.created++;
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`Failed on "${raw.name}": ${err.message}`);
      }
    }

    return results;
  }
}

const schemeService = new SchemeService();
module.exports = { schemeService };

