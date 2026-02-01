import { supabase } from '../db/supabase.js';
import { Agent } from '../db/types.js';
import { getAgentById } from './agents.js';

interface SearchOptions {
  skill?: string;
  minRating?: number;
  verified?: boolean;
  limit?: number;
  offset?: number;
}

export async function searchAgents(options: SearchOptions): Promise<{ agents: Agent[]; total: number }> {
  const { skill, minRating, verified, limit = 20, offset = 0 } = options;

  let query = supabase.from('agents').select('id', { count: 'exact' });

  if (verified !== undefined) {
    query = query.eq('verified', verified);
  }

  // If filtering by skill, join with agent_skills
  if (skill) {
    const { data: agentIds } = await supabase
      .from('agent_skills')
      .select('agent_id')
      .eq('skill', skill.toLowerCase());

    if (!agentIds?.length) {
      return { agents: [], total: 0 };
    }

    query = query.in('id', agentIds.map(a => a.agent_id));
  }

  const { data, count, error } = await query
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  // Enrich agents with full data
  const agents: Agent[] = [];
  for (const row of data || []) {
    const agent = await getAgentById(row.id);
    if (agent) {
      // Filter by rating if specified
      if (minRating && agent.stats.rating < minRating) {
        continue;
      }
      agents.push(agent);
    }
  }

  return {
    agents,
    total: count || 0
  };
}

export async function getTrendingAgents(limit = 10): Promise<Agent[]> {
  // Get agents with most profile views in last 7 days
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('profile_views')
    .select('viewed_agent_id')
    .gte('viewed_at', weekAgo);

  if (!data?.length) {
    return [];
  }

  // Count views per agent
  const viewCounts = new Map<string, number>();
  for (const view of data) {
    viewCounts.set(view.viewed_agent_id, (viewCounts.get(view.viewed_agent_id) || 0) + 1);
  }

  // Sort by view count
  const sortedAgentIds = [...viewCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  const agents: Agent[] = [];
  for (const id of sortedAgentIds) {
    const agent = await getAgentById(id);
    if (agent) {
      agents.push(agent);
    }
  }

  return agents;
}

export async function getRecommendedAgents(agentId: string, limit = 10): Promise<Agent[]> {
  // Get agent's skills
  const { data: mySkills } = await supabase
    .from('agent_skills')
    .select('skill')
    .eq('agent_id', agentId);

  if (!mySkills?.length) {
    return getTrendingAgents(limit);
  }

  // Find agents with similar skills
  const { data: similarAgentIds } = await supabase
    .from('agent_skills')
    .select('agent_id')
    .in('skill', mySkills.map(s => s.skill))
    .neq('agent_id', agentId);

  if (!similarAgentIds?.length) {
    return getTrendingAgents(limit);
  }

  // Count skill matches
  const matchCounts = new Map<string, number>();
  for (const row of similarAgentIds) {
    matchCounts.set(row.agent_id, (matchCounts.get(row.agent_id) || 0) + 1);
  }

  // Sort by match count and get top agents
  const topAgentIds = [...matchCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  const agents: Agent[] = [];
  for (const id of topAgentIds) {
    const agent = await getAgentById(id);
    if (agent) {
      agents.push(agent);
    }
  }

  return agents;
}
