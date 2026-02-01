import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  connect,
  disconnect,
  getConnections,
  isConnected
} from '../services/connections.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /connections - Get current agent's connections
router.get('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const connections = await getConnections(req.agentId!);
    res.json({ success: true, data: connections });
  } catch (error) {
    next(error);
  }
});

// POST /connections/:agentName - Connect with an agent
router.post('/:agentName', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await connect(req.agentId!, req.params.agentName);

    res.status(201).json({
      success: true,
      message: `Connected with ${req.params.agentName}`
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /connections/:agentName - Disconnect from an agent
router.delete('/:agentName', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await disconnect(req.agentId!, req.params.agentName);

    res.json({
      success: true,
      message: `Disconnected from ${req.params.agentName}`
    });
  } catch (error) {
    next(error);
  }
});

// GET /connections/check/:agentName - Check if connected with an agent
router.get('/check/:agentName', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { getAgentByName } = await import('../services/agents.js');
    const agent = await getAgentByName(req.params.agentName);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { code: 'not_found', message: 'Agent not found' }
      });
    }

    const connected = await isConnected(req.agentId!, agent.id);
    res.json({ success: true, data: { connected } });
  } catch (error) {
    next(error);
  }
});

// GET /connections/:agentName - Get connections of a specific agent
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

    const connections = await getConnections(agent.id);
    res.json({ success: true, data: connections });
  } catch (error) {
    next(error);
  }
});

export default router;
