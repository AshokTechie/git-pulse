import { config } from '../config.js';
import { prisma } from '../db/client.js';
import { createLogger } from '../lib/logger.js';
import { getStoredHealth } from './metrics/healthStore.service.js';
import { getCicdAnalytics } from './metrics/cicd.service.js';

const logger = createLogger('ai-service');

export interface AiQueryResult {
  answer: string;
  reasons: string[];
  source: 'llm' | 'rule-based';
}

interface RepoContext {
  name: string;
  health: number | null;
  commits: number;
  openPrs: number;
  openIssues: number;
  alerts: number;
  anomalies: number;
  insights: { severity: string; title: string }[];
  ciFailureRate: number | null;
}

/** Build a compact, relevant context for the LLM. Never dump the whole DB. */
export async function buildContext(repoFilter?: string): Promise<RepoContext[]> {
  const repos = await prisma.repository.findMany({
    where: repoFilter ? { name: { contains: repoFilter, mode: 'insensitive' } } : {},
    select: { id: true, name: true, fullName: true },
    take: 30,
  });

  const context: RepoContext[] = [];
  for (const repo of repos) {
    const [health, cicd, insights, anomalies, metrics, alerts, prs] = await Promise.all([
      getStoredHealth(repo.id, '30d'),
      getCicdAnalytics(repo.id, '30d'),
      prisma.aiInsight.findMany({
        where: { repositoryId: repo.id, status: 'OPEN' },
        select: { severity: true, title: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.anomaly.count({ where: { repositoryId: repo.id, status: 'OPEN' } }),
      prisma.repositoryMetric.findUnique({ where: { repositoryId_range: { repositoryId: repo.id, range: 'THIRTY_DAYS' } } }),
      prisma.securityAlert.count({ where: { repositoryId: repo.id, state: 'OPEN' } }),
      prisma.pullRequest.count({ where: { repositoryId: repo.id, state: 'OPEN' } }),
    ]);

    context.push({
      name: repo.name,
      health: health?.score ?? null,
      commits: metrics?.commits ?? 0,
      openPrs: prs,
      openIssues: metrics?.openIssues ?? 0,
      alerts,
      anomalies,
      insights: insights.map((i) => ({ severity: i.severity, title: i.title })),
      ciFailureRate: cicd.failureRate,
    });
  }
  return context;
}

function compactPrompt(question: string, context: RepoContext[]): string {
  const compact = context.map((c) => {
    const flags = [
      c.health !== null ? `health=${c.health}/100` : 'no-health',
      `commits=${c.commits}`,
      `openPrs=${c.openPrs}`,
      `openIssues=${c.openIssues}`,
      `alerts=${c.alerts}`,
      `anomalies=${c.anomalies}`,
      `ciFail=${c.ciFailureRate !== null ? c.ciFailureRate + '%' : 'n/a'}`,
    ];
    const topInsight = c.insights[0] ? ` | #${c.insights[0].severity.toLowerCase()}: ${c.insights[0].title}` : '';
    return `- ${c.name}: ${flags.join(', ')}${topInsight}`;
  }).join('\n');

  return `You are GitPulse, an engineering analytics assistant. Repositories under analysis:\n${compact}\n\nQuestion: ${question}\nAnswer concisely (2-4 sentences). If the user asks which repositories need attention, name them and give concrete reasons from the data. If the data is insufficient, say so.`;
}

/**
 * Ask the AI assistant. Prefers the configured LLM; falls back to a
 * deterministic rule-based answer when no API key is configured (keeps the
 * feature usable during local development without hardcoding fake analytics).
 */
export async function queryAi(question: string, repoFilter?: string): Promise<AiQueryResult> {
  const context = await buildContext(repoFilter);

  if (config.ai.apiKey) {
    try {
      return await callLlmWithFallback(question, context);
    } catch (error) {
      logger.warn('LLM call failed, falling back to rules', error);
    }
  }

  return ruleBasedAnswer(question, context);
}

async function callLlmWithFallback(question: string, context: RepoContext[]): Promise<AiQueryResult> {
  const endpoint = `${config.ai.apiBase}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.ai.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.ai.model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'You are a concise engineering analytics assistant. Answer using only the provided repository data.' },
        { role: 'user', content: compactPrompt(question, context) },
      ],
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI provider error ${response.status}`);
  }
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Empty AI response');
  return { answer: content, reasons: [], source: 'llm' };
}

function ruleBasedAnswer(question: string, context: RepoContext[]): AiQueryResult {
  const attention = context
    .map((c) => {
      let score = 0;
      const reasons: string[] = [];
      if (c.health !== null && c.health < 75) {
        score += 3;
        reasons.push(`Health score is ${c.health}/100`);
      }
      if (c.anomalies > 0) {
        score += 2;
        reasons.push(`${c.anomalies} active anomaly/anomalies`);
      }
      if (c.openPrs > 10) {
        score += 1;
        reasons.push(`${c.openPrs} open PRs`);
      }
      if (c.alerts > 0) {
        score += 2;
        reasons.push(`${c.alerts} open security alerts`);
      }
      if (c.ciFailureRate !== null && c.ciFailureRate > 15) {
        score += 2;
        reasons.push(`CI failure rate ${c.ciFailureRate}%`);
      }
      if (c.openIssues > 20) {
        score += 1;
        reasons.push(`${c.openIssues} open issues`);
      }
      return { repo: c.name, score, reasons };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  if (attention.length === 0) {
    return {
      answer: `All repositories look healthy based on the current data (${context.length} tracked).`,
      reasons: [],
      source: 'rule-based',
    };
  }

  const top = attention.slice(0, 3);
  const answer = `${top.map((r) => r.repo).join(', ')} need attention.`;
  const reasons = top.flatMap((r) => r.reasons.slice(0, 3));

  return { answer, reasons, source: 'rule-based' };
}