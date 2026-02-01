import { supabase } from '../db/supabase.js';
import { Agent } from '../db/types.js';
import { AppError } from '../middleware/error.js';
import { getAgentById } from './agents.js';

export async function connect(agentAId: string, agentBName: string): Promise<void> {
  // Get target agent
  const { data: agentB } = await supabase
    .from('agents')
    .select('id')
    .eq('name', agentBName.toLowerCase())
    .single();

  if (!agentB) {
    throw new AppError('agent_not_found', 'Agent not found', 404);
  }

  if (agentB.id === agentAId) {
    throw new AppError('self_connection', 'Cannot connect with yourself', 400);
  }

  // Check if already connected
  const { data: existing } = await supabase
    .from('connections')
    .select('id')
    .or(`and(agent_a.eq.${agentAId},agent_b.eq.${agentB.id}),and(agent_a.eq.${agentB.id},agent_b.eq.${agentAId})`)
    .single();

  if (existing) {
    throw new AppError('already_connected', 'Already connected with this agent', 400);
  }

  // Create connection (use alphabetical order for consistency)
  const [first, second] = [agentAId, agentB.id].sort();

  const { error } = await supabase.from('connections').insert({
    agent_a: first,
    agent_b: second
  });

  if (error) {
    throw new AppError('connection_failed', 'Failed to create connection', 500);
  }
}

export async function disconnect(agentAId: string, agentBName: string): Promise<void> {
  const { data: agentB } = await supabase
    .from('agents')
    .select('id')
    .eq('name', agentBName.toLowerCase())
    .single();

  if (!agentB) {
    throw new AppError('agent_not_found', 'Agent not found', 404);
  }

  const { error } = await supabase
    .from('connections')
    .delete()
    .or(`and(agent_a.eq.${agentAId},agent_b.eq.${agentB.id}),and(agent_a.eq.${agentB.id},agent_b.eq.${agentAId})`);

  if (error) {
    throw new AppError('disconnect_failed', 'Failed to disconnect', 500);
  }
}

export async function getConnections(agentId: string): Promise<{ agent: Agent; connected_at: string }[]> {
  const { data, error } = await supabase
    .from('connections')
    .select('agent_a, agent_b, created_at')
    .or(`agent_a.eq.${agentId},agent_b.eq.${agentId}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError('fetch_failed', 'Failed to fetch connections', 500);
  }

  const connections = [];
  for (const conn of data || []) {
    const connectedAgentId = conn.agent_a === agentId ? conn.agent_b : conn.agent_a;
    const agent = await getAgentById(connectedAgentId);
    if (agent) {
      connections.push({
        agent,
        connected_at: conn.created_at
      });
    }
  }

  return connections;
}

export async function isConnected(agentAId: string, agentBId: string): Promise<boolean> {
  const { data } = await supabase
    .from('connections')
    .select('id')
    .or(`and(agent_a.eq.${agentAId},agent_b.eq.${agentBId}),and(agent_a.eq.${agentBId},agent_b.eq.${agentAId})`)
    .single();

  return !!data;
}
