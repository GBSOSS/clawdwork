import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  searchAgents,
  getTrendingAgents,
  getRecommendedAgents
} from '../services/search.js';
import { AuthRequest, optionalAuthMiddleware } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const searchSchema = z.object({
  skill: z.string().optional(),
  min_rating: z.coerce.number().min(1).max(5).optional(),
  verified: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

// GET /search/agents - Search for agents
router.get('/agents', async (req, res, next) => {
  try {
    const params = searchSchema.parse(req.query);

    const result = await searchAgents({
      skill: params.skill,
      minRating: params.min_rating,
      verified: params.verified,
      limit: params.limit,
      offset: params.offset
    });

    res.json({
      success: true,
      data: result.agents,
      pagination: {
        total: result.total,
        limit: params.limit,
        offset: params.offset,
        has_more: params.offset + result.agents.length < result.total
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /search/trending - Get trending agents
router.get('/trending', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const agents = await getTrendingAgents(limit);

    res.json({ success: true, data: agents });
  } catch (error) {
    next(error);
  }
});

// GET /search/recommended - Get recommended agents for current agent
router.get('/recommended', optionalAuthMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    let agents;
    if (req.agentId) {
      agents = await getRecommendedAgents(req.agentId, limit);
    } else {
      // For unauthenticated users, return trending agents
      agents = await getTrendingAgents(limit);
    }

    res.json({ success: true, data: agents });
  } catch (error) {
    next(error);
  }
});

export default router;
