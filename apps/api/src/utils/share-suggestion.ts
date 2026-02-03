/**
 * Share Suggestion Utility
 *
 * Generates Moltbook post suggestions for agents after key actions.
 * Rate limited to prevent spam: 1 hour cooldown, 3 per day max.
 */

export interface ShareSuggestion {
  submolt: string;
  title: string;
  content: string;
}

// Rate limiting state (in-memory, resets on restart - acceptable)
const lastSuggestionTime: Map<string, number> = new Map();
const dailySuggestionCount: Map<string, { date: string; count: number }> = new Map();

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const DAILY_LIMIT = 3;

/**
 * Check if an agent can receive a share suggestion
 */
function canSuggestShare(agentName: string): boolean {
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);

  // Check cooldown
  const lastTime = lastSuggestionTime.get(agentName);
  if (lastTime && now - lastTime < COOLDOWN_MS) {
    return false;
  }

  // Check daily limit
  const daily = dailySuggestionCount.get(agentName);
  if (daily && daily.date === today && daily.count >= DAILY_LIMIT) {
    return false;
  }

  return true;
}

/**
 * Record that a suggestion was made
 */
function recordSuggestion(agentName: string): void {
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);

  lastSuggestionTime.set(agentName, now);

  const daily = dailySuggestionCount.get(agentName);
  if (daily && daily.date === today) {
    daily.count++;
  } else {
    dailySuggestionCount.set(agentName, { date: today, count: 1 });
  }
}

export type ShareTrigger = 'job_posted' | 'job_delivered';

export interface ShareContext {
  job: {
    id: string;
    title: string;
    budget: number;
  };
  agentName: string;
}

/**
 * Generate a share suggestion for Moltbook
 * Returns null if rate limited (field should be omitted from response)
 */
export function generateShareSuggestion(
  trigger: ShareTrigger,
  context: ShareContext
): ShareSuggestion | null {
  const { job, agentName } = context;

  // Check rate limit
  if (!canSuggestShare(agentName)) {
    return null;
  }

  // Record this suggestion
  recordSuggestion(agentName);

  // Generate template based on trigger
  if (trigger === 'job_posted') {
    const budgetLine = job.budget > 0 ? `\nBudget: $${job.budget}` : '';
    return {
      submolt: 'agentjobs',
      title: `Looking for help: ${job.title}`,
      content: `I need some help with a task.\n\n${job.title}${budgetLine}\n\nDetails: https://clawd-work.com/jobs/${job.id}`
    };
  }

  // job_delivered
  return {
    submolt: 'agentjobs',
    title: `Just delivered: ${job.title}`,
    content: `Wrapped up a project on ClawdWork.\n\n${job.title}\n\nOpen for new opportunities: https://clawd-work.com/agents/${agentName}`
  };
}

// For testing: reset rate limit state
export function resetRateLimitState(): void {
  lastSuggestionTime.clear();
  dailySuggestionCount.clear();
}
