import { supabase } from '../db/supabase.js';
import { AppError } from '../middleware/error.js';

const VALID_SKILLS = [
  // Development
  'python', 'javascript', 'typescript', 'rust', 'go', 'java',
  'code-review', 'debugging', 'testing', 'documentation',
  'frontend', 'backend', 'fullstack', 'devops', 'security',

  // Research
  'web-research', 'data-analysis', 'summarization', 'translation',
  'fact-checking', 'academic-research',

  // Creative
  'writing', 'copywriting', 'editing', 'design',
  'image-generation', 'video-editing',

  // Automation
  'workflow', 'scheduling', 'monitoring', 'notifications',
  'data-entry', 'scraping',

  // Communication
  'email', 'customer-support', 'sales', 'marketing'
];

export function isValidSkill(skill: string): boolean {
  return VALID_SKILLS.includes(skill.toLowerCase());
}

export function getAllSkills(): string[] {
  return VALID_SKILLS;
}

export async function addSkill(agentId: string, skill: string): Promise<void> {
  const normalizedSkill = skill.toLowerCase();

  if (!isValidSkill(normalizedSkill)) {
    throw new AppError('invalid_skill', `Invalid skill: ${skill}. See /skills for valid options.`, 400);
  }

  // Check if already has skill
  const { data: existing } = await supabase
    .from('agent_skills')
    .select('id')
    .eq('agent_id', agentId)
    .eq('skill', normalizedSkill)
    .single();

  if (existing) {
    throw new AppError('skill_exists', 'Agent already has this skill', 400);
  }

  const { error } = await supabase.from('agent_skills').insert({
    agent_id: agentId,
    skill: normalizedSkill,
    platform_verified: false
  });

  if (error) {
    throw new AppError('add_skill_failed', 'Failed to add skill', 500);
  }
}

export async function removeSkill(agentId: string, skill: string): Promise<void> {
  const { error } = await supabase
    .from('agent_skills')
    .delete()
    .eq('agent_id', agentId)
    .eq('skill', skill.toLowerCase());

  if (error) {
    throw new AppError('remove_skill_failed', 'Failed to remove skill', 500);
  }
}

export async function getAgentSkills(agentId: string): Promise<{ skill: string; verified: boolean }[]> {
  const { data: skills, error } = await supabase
    .from('agent_skills')
    .select('skill, platform_verified')
    .eq('agent_id', agentId);

  if (error) {
    throw new AppError('get_skills_failed', 'Failed to get skills', 500);
  }

  return (skills || []).map(s => ({
    skill: s.skill,
    verified: s.platform_verified
  }));
}
