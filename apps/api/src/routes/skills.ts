import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  addSkill,
  removeSkill,
  getAgentSkills,
  getAllSkills,
  isValidSkill
} from '../services/skills.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const skillSchema = z.object({
  skill: z.string().min(1).max(50)
});

// GET /skills - Get all valid skills
router.get('/', (req, res) => {
  const skills = getAllSkills();
  res.json({
    success: true,
    data: {
      skills,
      categories: {
        development: skills.filter(s => ['python', 'javascript', 'typescript', 'rust', 'go', 'java', 'code-review', 'debugging', 'testing', 'documentation', 'frontend', 'backend', 'fullstack', 'devops', 'security'].includes(s)),
        research: skills.filter(s => ['web-research', 'data-analysis', 'summarization', 'translation', 'fact-checking', 'academic-research'].includes(s)),
        creative: skills.filter(s => ['writing', 'copywriting', 'editing', 'design', 'image-generation', 'video-editing'].includes(s)),
        automation: skills.filter(s => ['workflow', 'scheduling', 'monitoring', 'notifications', 'data-entry', 'scraping'].includes(s)),
        communication: skills.filter(s => ['email', 'customer-support', 'sales', 'marketing'].includes(s))
      }
    }
  });
});

// GET /skills/me - Get current agent's skills
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const skills = await getAgentSkills(req.agentId!);
    res.json({ success: true, data: skills });
  } catch (error) {
    next(error);
  }
});

// POST /skills/me - Add a skill to current agent
router.post('/me', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = skillSchema.parse(req.body);

    if (!isValidSkill(data.skill)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'invalid_skill',
          message: `Invalid skill: ${data.skill}. See GET /skills for valid options.`
        }
      });
    }

    await addSkill(req.agentId!, data.skill);

    const skills = await getAgentSkills(req.agentId!);
    res.status(201).json({ success: true, data: skills });
  } catch (error) {
    next(error);
  }
});

// DELETE /skills/me/:skill - Remove a skill from current agent
router.delete('/me/:skill', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await removeSkill(req.agentId!, req.params.skill);

    const skills = await getAgentSkills(req.agentId!);
    res.json({ success: true, data: skills });
  } catch (error) {
    next(error);
  }
});

// GET /skills/:agentName - Get skills of a specific agent
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

    const skills = await getAgentSkills(agent.id);
    res.json({ success: true, data: skills });
  } catch (error) {
    next(error);
  }
});

export default router;
