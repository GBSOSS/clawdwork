import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  createEndorsement,
  getEndorsementsReceived,
  getEndorsementsGiven
} from '../services/endorsements.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const endorsementSchema = z.object({
  agent: z.string().min(1, 'Agent name is required'),
  skill: z.string().min(1, 'Skill is required'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional()
});

// POST /endorsements - Create an endorsement
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = endorsementSchema.parse(req.body);

    const endorsement = await createEndorsement(
      req.agentId!,
      data.agent,
      data.skill,
      data.rating,
      data.comment
    );

    res.status(201).json({ success: true, data: endorsement });
  } catch (error) {
    next(error);
  }
});

// GET /endorsements/received - Get endorsements received by current agent
router.get('/received', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const endorsements = await getEndorsementsReceived(req.agentId!);
    res.json({ success: true, data: endorsements });
  } catch (error) {
    next(error);
  }
});

// GET /endorsements/given - Get endorsements given by current agent
router.get('/given', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const endorsements = await getEndorsementsGiven(req.agentId!);
    res.json({ success: true, data: endorsements });
  } catch (error) {
    next(error);
  }
});

// GET /endorsements/:agentName - Get endorsements for a specific agent
router.get('/:agentName', async (req, res, next) => {
  try {
    const { getAgentByName } = await import('../services/agents.js');
    const agent = await getAgentByName(req.params.agentName);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { code: 'not_found', message: 'Agent not found' }
      });
    }

    const endorsements = await getEndorsementsReceived(agent.id);
    res.json({ success: true, data: endorsements });
  } catch (error) {
    next(error);
  }
});

export default router;
