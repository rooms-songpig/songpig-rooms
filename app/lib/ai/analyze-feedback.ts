type FeedbackStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';
type FeedbackPriority = 'low' | 'normal' | 'high' | 'critical';
type FeedbackType = 'bug' | 'feature' | 'question' | 'other';

export interface FeedbackAnalysisInput {
  id?: string;
  title: string;
  description: string;
  type: FeedbackType;
  currentStatus?: FeedbackStatus;
  currentPriority?: FeedbackPriority;
}

export interface FeedbackAnalysisResult {
  suggestedStatus: FeedbackStatus;
  suggestedPriority: FeedbackPriority;
  summary: string;
  reasoning?: string;
  provider: string;
  costHint: string;
}

interface ProviderConfig {
  name: 'openai' | 'anthropic';
  enabled: boolean;
  model: string;
  costHint: string;
}

const providerOrder = (
  process.env.AI_PROVIDER_ORDER ||
  'openai,anthropic'
)
  .split(',')
  .map((p) => p.trim().toLowerCase())
  .filter(Boolean) as Array<'openai' | 'anthropic'>;

const providerConfigs: ProviderConfig[] = [
  {
    name: 'openai',
    enabled: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_SEVERITY_MODEL || 'gpt-4o-mini',
    costHint: 'low',
  },
  {
    name: 'anthropic',
    enabled: Boolean(process.env.ANTHROPIC_API_KEY),
    model: process.env.ANTHROPIC_SEVERITY_MODEL || 'claude-3-haiku-20240307',
    costHint: 'low',
  },
];

const statusFallback: FeedbackStatus = 'open';
const priorityFallback: FeedbackPriority = 'normal';

function analyzeRuleBased(input: FeedbackAnalysisInput): FeedbackAnalysisResult {
  const text = `${input.title} ${input.description}`.toLowerCase();
  const criticalKeywords = ['crash', 'data loss', 'cannot login', "can't login", 'not logging', 'blocked', 'no access'];
  const highKeywords = ['not working', 'broken', 'error', 'fails', 'failure', 'urgent'];

  let priority: FeedbackPriority = priorityFallback;
  if (criticalKeywords.some((k) => text.includes(k))) {
    priority = 'critical';
  } else if (highKeywords.some((k) => text.includes(k))) {
    priority = 'high';
  } else if (input.type === 'feature') {
    priority = 'normal';
  } else if (input.type === 'question' || input.type === 'other') {
    priority = 'low';
  }

  return {
    suggestedStatus: statusFallback,
    suggestedPriority: priority,
    summary: `${input.type.toUpperCase()}: ${input.title}`.trim(),
    reasoning: 'Rule-based fallback suggestion',
    provider: 'rule_based',
    costHint: 'free',
  };
}

function buildPrompt(input: FeedbackAnalysisInput) {
  return `
You are a product triage assistant. Analyze the following feedback and respond ONLY with JSON having fields:
{
  "suggestedStatus": "open|in_progress|resolved|closed|wont_fix",
  "suggestedPriority": "critical|high|normal|low",
  "summary": "short summary of issue or request",
  "reasoning": "one sentence explanation"
}

Current status: ${input.currentStatus || 'unknown'}
Current priority: ${input.currentPriority || 'unknown'}
Type: ${input.type}
Title: ${input.title}
Description: ${input.description}
`;
}

async function callOpenAI(input: FeedbackAnalysisInput): Promise<FeedbackAnalysisResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const prompt = buildPrompt(input);
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: providerConfigs.find((p) => p.name === 'openai')?.model,
      temperature: 0.2,
      max_tokens: 300,
      messages: [
        { role: 'system', content: 'You are a concise product triage assistant.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message?.content;
  if (!message) {
    throw new Error('OpenAI returned no content');
  }

  const parsed = JSON.parse(message);
  return {
    suggestedStatus: parsed.suggestedStatus || statusFallback,
    suggestedPriority: parsed.suggestedPriority || priorityFallback,
    summary: parsed.summary || input.title,
    reasoning: parsed.reasoning,
    provider: 'openai',
    costHint: 'low',
  };
}

async function callAnthropic(input: FeedbackAnalysisInput): Promise<FeedbackAnalysisResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const prompt = buildPrompt(input);
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: providerConfigs.find((p) => p.name === 'anthropic')?.model,
      max_tokens: 300,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;
  if (!content) {
    throw new Error('Anthropic returned no content');
  }

  const parsed = JSON.parse(content);
  return {
    suggestedStatus: parsed.suggestedStatus || statusFallback,
    suggestedPriority: parsed.suggestedPriority || priorityFallback,
    summary: parsed.summary || input.title,
    reasoning: parsed.reasoning,
    provider: 'anthropic',
    costHint: 'low',
  };
}

const providerHandlers: Record<'openai' | 'anthropic', (input: FeedbackAnalysisInput) => Promise<FeedbackAnalysisResult>> = {
  openai: callOpenAI,
  anthropic: callAnthropic,
};

export async function analyzeFeedbackSeverity(input: FeedbackAnalysisInput): Promise<FeedbackAnalysisResult> {
  const orderedProviders = providerOrder
    .map((name) => providerConfigs.find((cfg) => cfg.name === name))
    .filter((cfg): cfg is ProviderConfig => Boolean(cfg && cfg.enabled));

  if (orderedProviders.length === 0) {
    console.warn('AI: No providers enabled, falling back to rule-based analysis');
    return analyzeRuleBased(input);
  }

  const errors: string[] = [];

  for (const provider of orderedProviders) {
    try {
      const result = await providerHandlers[provider.name](input);
      return { ...result, costHint: provider.costHint, provider: provider.name };
    } catch (error) {
      console.error(`[AI] ${provider.name} failed`, error);
      errors.push(`${provider.name}: ${(error as Error).message}`);
    }
  }

  console.error('AI: All providers failed, falling back to rule-based analysis', errors);
  return analyzeRuleBased(input);
}

