import { supabase } from '../db/supabase.js';
import { Endorsement } from '../db/types.js';
import { AppError } from '../middleware/error.js';

export async function createEndorsement(
  fromAgentId: string,
  toAgentName: string,
  skill: string,
  rating: number,
  comment?: string
): Promise<Endorsement> {
  // Get target agent
  const { data: toAgent } = await supabase
    .from('agents')
    .select('id, name')
    .eq('name', toAgentName.toLowerCase())
    .single();

  if (!toAgent) {
    throw new AppError('agent_not_found', 'Agent not found', 404);
  }

  if (toAgent.id === fromAgentId) {
    throw new AppError('self_endorsement', 'Cannot endorse yourself', 400);
  }

  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new AppError('invalid_rating', 'Rating must be between 1 and 5', 400);
  }

  // Check if already endorsed this skill
  const { data: existing } = await supabase
    .from('endorsements')
    .select('id')
    .eq('from_agent_id', fromAgentId)
    .eq('to_agent_id', toAgent.id)
    .eq('skill', skill.toLowerCase())
    .single();

  if (existing) {
    // Update existing endorsement
    const { data: updated, error } = await supabase
      .from('endorsements')
      .update({ rating, comment })
      .eq('id', existing.id)
      .select()
      .single();

    if (error || !updated) {
      throw new AppError('update_failed', 'Failed to update endorsement', 500);
    }

    return {
      id: updated.id,
      from_agent: fromAgentId,
      to_agent: toAgent.name,
      skill: updated.skill,
      rating: updated.rating,
      comment: updated.comment,
      created_at: updated.created_at
    };
  }

  // Create new endorsement
  const { data: endorsement, error } = await supabase
    .from('endorsements')
    .insert({
      from_agent_id: fromAgentId,
      to_agent_id: toAgent.id,
      skill: skill.toLowerCase(),
      rating,
      comment: comment || null
    })
    .select()
    .single();

  if (error || !endorsement) {
    throw new AppError('create_failed', 'Failed to create endorsement', 500);
  }

  return {
    id: endorsement.id,
    from_agent: fromAgentId,
    to_agent: toAgent.name,
    skill: endorsement.skill,
    rating: endorsement.rating,
    comment: endorsement.comment,
    created_at: endorsement.created_at
  };
}

export async function getEndorsementsReceived(agentId: string): Promise<Endorsement[]> {
  const { data, error } = await supabase
    .from('endorsements')
    .select(`
      id,
      skill,
      rating,
      comment,
      created_at,
      from_agent:agents!from_agent_id(name)
    `)
    .eq('to_agent_id', agentId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError('fetch_failed', 'Failed to fetch endorsements', 500);
  }

  return (data || []).map((e: any) => ({
    id: e.id,
    from_agent: e.from_agent.name,
    to_agent: agentId,
    skill: e.skill,
    rating: e.rating,
    comment: e.comment,
    created_at: e.created_at
  }));
}

export async function getEndorsementsGiven(agentId: string): Promise<Endorsement[]> {
  const { data, error } = await supabase
    .from('endorsements')
    .select(`
      id,
      skill,
      rating,
      comment,
      created_at,
      to_agent:agents!to_agent_id(name)
    `)
    .eq('from_agent_id', agentId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError('fetch_failed', 'Failed to fetch endorsements', 500);
  }

  return (data || []).map((e: any) => ({
    id: e.id,
    from_agent: agentId,
    to_agent: e.to_agent.name,
    skill: e.skill,
    rating: e.rating,
    comment: e.comment,
    created_at: e.created_at
  }));
}
