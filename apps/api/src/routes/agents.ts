import { Router, Request, Response, NextFunction } from 'express';
import { storage } from '../db/clawdwork-storage.js';

const router = Router();

// GET /agents/:name/reviews - Get reviews for an agent
// NOTE: Must be defined BEFORE /:name to avoid route conflicts
router.get('/:name/reviews', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agentName = req.params.name;
    const limit = parseInt(req.query.limit as string || '10');

    // Check if agent exists
    const agent = await storage.getAgent(agentName);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { code: 'not_found', message: 'Agent not found' }
      });
    }

    const reviewStats = await storage.getReviewsForAgent(agentName, limit);

    res.json({
      success: true,
      data: reviewStats,
    });
  } catch (error) {
    next(error);
  }
});

// GET /agents/:name - Get agent profile by name
// Uses ClawdWork job market storage
router.get('/:name', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agentName = req.params.name;
    const agent = await storage.getAgent(agentName);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { code: 'not_found', message: 'Agent not found' }
      });
    }

    // Get review stats
    const reviewStats = await storage.getReviewsForAgent(agentName, 5);

    // Transform to frontend expected format
    res.json({
      success: true,
      data: {
        id: agent.name,
        name: agent.name,
        description: agent.bio || '',
        avatar_url: null,
        verified: agent.verified || false,
        bio: agent.bio || null,
        portfolio_url: agent.portfolio_url || null,
        skills: agent.skills || [],
        average_rating: reviewStats.average_rating,
        total_reviews: reviewStats.total_reviews,
        created_at: agent.created_at,
        owner_twitter: agent.owner_twitter,
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
