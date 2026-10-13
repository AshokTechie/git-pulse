import { prisma } from '../db/client.js';
import { SETTINGS } from '../config.js';
import { decryptSecret } from '../lib/crypto.js';
import { createLogger, redact } from '../lib/logger.js';
import { GitHubClient, GitHubRateLimitError, type GhCommit } from '../lib/githubClient.js';
import {
  fetchBranches,
  fetchCodeScanningAlerts,
  fetchCommits,
  fetchCommitDetail,
  fetchDeployments,
  fetchDependabotAlerts,
  fetchIssues,
  fetchIssueComments,
  fetchLanguages,
  fetchPullRequestReviews,
  fetchPullRequests,
  fetchRepositoryDetail,
  fetchSecretScanningAlerts,
  fetchWorkflowRunJobs,
  fetchWorkflowRuns,
} from './github.service.js';

const logger = createLogger('sync-service');

// ---------------------------------------------------------------------------
// Developer resolution helpers
// ---------------------------------------------------------------------------

export async function resolveDeveloperId(ghUser: { login?: string | null; id?: number | null } | null): Promise<string | null> {
  if (!ghUser?.id || ghUser.id <= 0) return null;
  const login = ghUser.login ?? `gh-user-${ghUser.id}`;
  return prisma.developer.upsert({
    where: { githubId: ghUser.id },
    update: { login },
    create: { githubId: ghUser.id, login },
  }).then((d) => d.id).catch(() => null);
}

export async function upsertDeveloper(opts: {
  githubId: number;
  login: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}): Promise<string> {
  return prisma.developer.upsert({
    where: { githubId: opts.githubId },
    update: { login: opts.login, name: opts.name ?? undefined, email: opts.email ?? undefined, avatarUrl: opts.avatarUrl ?? undefined },
    create: {
      githubId: opts.githubId,
      login: opts.login,
      name: opts.name,
      email: opts.email,
      avatarUrl: opts.avatarUrl,
    },
  }).then((d) => d.id);
}

// ---------------------------------------------------------------------------
// Repository metadata
// ---------------------------------------------------------------------------

export async function syncRepositoryRecord(client: GitHubClient, fullName: string): Promise<string> {
  const [owner, name] = fullName.split('/');
  const detail = await fetchRepositoryDetail(client, owner, name);
  const languages = await fetchLanguages(client, owner, name).catch(() => ({}));

  let organizationId: string | null = null;
  if (detail.organization?.login) {
    organizationId = await prisma.organization.upsert({
      where: { githubId: detail.organization.id },
      update: { login: detail.organization.login },
      create: {
        githubId: detail.organization.id,
        login: detail.organization.login,
      },
    }).then((o) => o.id).catch(() => null);
  }

  const data = {
    organizationId,
    ownerLogin: detail.owner.login,
    name: detail.name,
    fullName: detail.full_name,
    description: detail.description,
    homepageUrl: detail.homepage,
    primaryLanguage: detail.language,
    languages,
    isPrivate: detail.private,
    isFork: detail.fork,
    isArchived: detail.archived,
    isTemplate: detail.template,
    defaultBranch: detail.default_branch,
    license: detail.license?.spdx_id ?? null,
    topics: detail.topics ?? [],
    stargazersCount: detail.stargazers_count,
    forksCount: detail.forks_count,
    watchersCount: detail.watchers_count,
    openIssuesCount: detail.open_issues_count,
    pushedAt: detail.pushed_at ? new Date(detail.pushed_at) : null,
    gitHubCreatedAt: detail.created_at ? new Date(detail.created_at) : null,
    gitHubUpdatedAt: detail.updated_at ? new Date(detail.updated_at) : null,
    sizeBytes: detail.size,
  };

  const record = await prisma.repository.upsert({
    where: { githubId: detail.id },
    update: data,
    create: { githubId: detail.id, ...data },
  });
  return record.id;
}

// ---------------------------------------------------------------------------
// Commits
// ---------------------------------------------------------------------------

export async function syncCommits(
  client: GitHubClient,
  repoId: string,
  fullName: string,
  opts: { since?: Date } = {},
): Promise<number> {
  const [owner, name] = fullName.split('/');
  const sync = await startSync(repoId, 'COMMITS');
  try {
    const commits = await fetchCommits(client, owner, name, { since: opts.since, maxPages: 30 });
    let count = 0;
    for (const commit of commits) {
      count++;
      await upsertCommitRow(client, repoId, owner, name, commit, count <= SETTINGS.commitDetailSample);
    }
    await finishSync(sync.id, 'COMMITS', count);
    if (count > 0) await prisma.repository.update({ where: { id: repoId }, data: { lastCommitSyncedAt: new Date() } });
    return count;
  } catch (error) {
    await failSync(sync.id, 'COMMITS', error);
    throw error;
  }
}

async function upsertCommitRow(
  client: GitHubClient,
  repoId: string,
  owner: string,
  name: string,
  commit: GhCommit,
  withDetail: boolean,
): Promise<void> {
  const au = commit.commit.author;
  const authoredAt = au?.date ? new Date(au.date) : new Date();
  const authorId = commit.author?.login ? await resolveDeveloperId({ login: commit.author.login, id: commit.author.id }) : null;
  const committerId = commit.committer?.login ? await resolveDeveloperId({ login: commit.committer.login, id: commit.committer.id }) : null;

  const existing = await prisma.commit.findUnique({
    where: { repositoryId_sha: { repositoryId: repoId, sha: commit.sha } },
    select: { id: true, changedFiles: true },
  });

  if (existing && existing.changedFiles > 0) return;

  let additions = 0;
  let deletions = 0;
  let changedFiles = 0;
  let parentCount = 0;
  let files: { filename: string; status: string; additions: number; deletions: number }[] = [];

  if (withDetail) {
    const detail = await fetchCommitDetail(client, owner, name, commit.sha).catch(() => null);
    additions = detail?.stats?.additions ?? 0;
    deletions = detail?.stats?.deletions ?? 0;
    changedFiles = detail?.files?.length ?? 0;
    parentCount = detail?.parents?.length ?? 0;
    files = detail?.files ?? [];
  }

  const record = await prisma.commit.upsert({
    where: { repositoryId_sha: { repositoryId: repoId, sha: commit.sha } },
    update: {
      authorId,
      committerId,
      message: commit.commit.message ?? '',
      authorName: au?.name ?? null,
      authorEmail: au?.email ?? null,
      authoredAt,
      committedAt: commit.commit.committer?.date ? new Date(commit.commit.committer.date) : null,
      additions,
      deletions,
      changedFiles,
      parentCount,
      isMerge: commit.parents.length >= 2,
    },
    create: {
      repositoryId: repoId,
      sha: commit.sha,
      authorId,
      committerId,
      message: commit.commit.message ?? '',
      authorName: au?.name ?? null,
      authorEmail: au?.email ?? null,
      authoredAt,
      committedAt: commit.commit.committer?.date ? new Date(commit.commit.committer.date) : null,
      additions,
      deletions,
      changedFiles,
      parentCount,
      isMerge: commit.parents.length >= 2,
    },
  });

  if (files.length > 0) {
    for (const f of files) {
      await prisma.commitFile.upsert({
        where: { commitId_path: { commitId: record.id, path: f.filename } },
        update: { status: f.status, additions: f.additions, deletions: f.deletions },
        create: {
          commitId: record.id,
          repositoryId: repoId,
          path: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
        },
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Pull requests
// ---------------------------------------------------------------------------

export async function syncPullRequests(
  client: GitHubClient,
  repoId: string,
  fullName: string,
  opts: { since?: Date } = {},
): Promise<number> {
  const [owner, name] = fullName.split('/');
  const sync = await startSync(repoId, 'PULL_REQUESTS');
  try {
    const prs = await fetchPullRequests(client, owner, name, { state: 'all', since: opts.since, maxPages: 30 });
    let count = 0;
    for (const pr of prs) {
      count++;
      await upsertPullRequest(client, repoId, owner, name, pr);
    }
    await finishSync(sync.id, 'PULL_REQUESTS', count);
    return count;
  } catch (error) {
    await failSync(sync.id, 'PULL_REQUESTS', error);
    throw error;
  }
}

async function upsertPullRequest(
  client: GitHubClient,
  repoId: string,
  owner: string,
  name: string,
  pr: import('../lib/githubClient.js').GhPullRequest,
): Promise<void> {
  const authorId = await resolveDeveloperId(pr.user);
  const mergedById = pr.merged_by ? await resolveDeveloperId({ login: pr.merged_by.login, id: pr.merged_by.id }) : null;
  const state: 'OPEN' | 'CLOSED' | 'MERGED' = pr.merged_at ? 'MERGED' : pr.state === 'open' ? 'OPEN' : 'CLOSED';

  await prisma.pullRequest.upsert({
    where: { repositoryId_githubId: { repositoryId: repoId, githubId: pr.id } },
    update: {
      number: pr.number,
      title: pr.title,
      body: pr.body,
      authorId,
      state,
      draft: pr.draft,
      baseRef: pr.base.ref,
      baseSha: pr.base.sha,
      headRef: pr.head.ref,
      headSha: pr.head.sha,
      mergeCommitSha: pr.merge_commit_sha,
      mergedById,
      labels: (pr.labels ?? []).map((l) => l.name),
      assignees: (pr.assignees ?? []).map((a) => a.login),
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changed_files,
      reviewCommentsCount: pr.review_comments,
      commentsCount: pr.comments,
      totalCommentsCount: pr.review_comments + pr.comments,
      updatedAt: new Date(pr.updated_at),
      closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
      mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
    },
    create: {
      repositoryId: repoId,
      githubId: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body,
      bodyUrl: pr.html_url,
      authorId,
      state,
      draft: pr.draft,
      baseRef: pr.base.ref,
      baseSha: pr.base.sha,
      headRef: pr.head.ref,
      headSha: pr.head.sha,
      mergeCommitSha: pr.merge_commit_sha,
      mergedById,
      labels: (pr.labels ?? []).map((l) => l.name),
      assignees: (pr.assignees ?? []).map((a) => a.login),
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changed_files,
      reviewCommentsCount: pr.review_comments,
      commentsCount: pr.comments,
      totalCommentsCount: pr.review_comments + pr.comments,
      createdAt: new Date(pr.created_at),
      updatedAt: new Date(pr.updated_at),
      closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
      mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
    },
  });

  await syncPullRequestReviews(client, repoId, owner, name, pr.number);
}

async function syncPullRequestReviews(
  client: GitHubClient,
  repoId: string,
  owner: string,
  name: string,
  prNumber: number,
): Promise<void> {
  const reviews = await fetchPullRequestReviews(client, owner, name, prNumber);
  for (const review of reviews) {
    const reviewerId = await resolveDeveloperId({ login: review.user?.login ?? null, id: review.user?.id ?? null });
    const prRecord = await prisma.pullRequest.findFirst({
      where: { repositoryId: repoId, number: prNumber },
      select: { id: true },
    });
    if (!prRecord) continue;
    await prisma.pullRequestReview.upsert({
      where: { githubId: review.id },
      update: {
        pullRequestId: prRecord.id,
        reviewerId,
        state: mapReviewState(review.state),
        body: review.body,
        commitId: review.commit_id,
        submittedAt: review.submitted_at ? new Date(review.submitted_at) : null,
        authorAssociation: review.author_association,
      },
      create: {
        pullRequestId: prRecord.id,
        githubId: review.id,
        reviewerId,
        state: mapReviewState(review.state),
        body: review.body,
        commitId: review.commit_id,
        submittedAt: review.submitted_at ? new Date(review.submitted_at) : null,
        authorAssociation: review.author_association,
      },
    });
  }
}

function mapReviewState(state: string): 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING' {
  switch (state) {
    case 'APPROVED': return 'APPROVED';
    case 'CHANGES_REQUESTED': return 'CHANGES_REQUESTED';
    case 'COMMENTED': return 'COMMENTED';
    case 'DISMISSED': return 'DISMISSED';
    default: return 'PENDING';
  }
}

// ---------------------------------------------------------------------------
// Issues
// ---------------------------------------------------------------------------

export async function syncIssues(
  client: GitHubClient,
  repoId: string,
  fullName: string,
  opts: { since?: Date } = {},
): Promise<number> {
  const [owner, name] = fullName.split('/');
  const sync = await startSync(repoId, 'ISSUES');
  try {
    const issues = await fetchIssues(client, owner, name, { state: 'all', since: opts.since, maxPages: 30 });
    let count = 0;
    for (const issue of issues) {
      if (issue.pull_request) continue; // PRs are handled by the pulls API
      count++;
      const authorId = await resolveDeveloperId({ login: issue.user?.login ?? null, id: issue.user?.id ?? null });
      await prisma.issue.upsert({
        where: { repositoryId_number: { repositoryId: repoId, number: issue.number } },
        update: {
          title: issue.title,
          body: issue.body,
          bodyUrl: issue.html_url,
          authorId,
          state: issue.state === 'open' ? 'OPEN' : 'CLOSED',
          isPullRequest: false,
          labels: (issue.labels ?? []).map((l) => l.name),
          assignees: (issue.assignees ?? []).map((a) => a.login),
          commentsCount: issue.comments,
          updatedAt: new Date(issue.updated_at),
          closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
        },
        create: {
          repositoryId: repoId,
          githubId: issue.id,
          number: issue.number,
          title: issue.title,
          body: issue.body,
          bodyUrl: issue.html_url,
          authorId,
          state: issue.state === 'open' ? 'OPEN' : 'CLOSED',
          isPullRequest: false,
          labels: (issue.labels ?? []).map((l) => l.name),
          assignees: (issue.assignees ?? []).map((a) => a.login),
          commentsCount: issue.comments,
          createdAt: new Date(issue.created_at),
          updatedAt: new Date(issue.updated_at),
          closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
        },
      });

      const record = await prisma.issue.findUnique({
        where: { repositoryId_number: { repositoryId: repoId, number: issue.number } },
        select: { id: true },
      });
      if (record) await syncIssueComments(client, record.id, owner, name, issue.number);
    }
    await finishSync(sync.id, 'ISSUES', count);
    return count;
  } catch (error) {
    await failSync(sync.id, 'ISSUES', error);
    throw error;
  }
}

async function syncIssueComments(
  client: GitHubClient,
  issueId: string,
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<void> {
  const comments = await fetchIssueComments(client, owner, repo, issueNumber);
  for (const comment of comments) {
    const authorId = await resolveDeveloperId({ login: comment.user?.login ?? null, id: comment.user?.id ?? null });
    await prisma.issueComment.upsert({
      where: { githubId: comment.id },
      update: { body: comment.body, authorId, updatedAt: new Date(comment.updated_at) },
      create: {
        issueId,
        githubId: comment.id,
        authorId,
        body: comment.body,
        bodyUrl: comment.html_url,
        createdAt: new Date(comment.created_at),
        updatedAt: new Date(comment.updated_at),
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Branches / deployments / workflows
// ---------------------------------------------------------------------------

export async function syncBranches(client: GitHubClient, repoId: string, fullName: string, defaultBranch: string): Promise<number> {
  const [owner, name] = fullName.split('/');
  const sync = await startSync(repoId, 'REPOSITORY');
  try {
    const branches = await fetchBranches(client, owner, name);
    let count = 0;
    for (const branch of branches) {
      count++;
      await prisma.branch.upsert({
        where: { repositoryId_name: { repositoryId: repoId, name: branch.name } },
        update: { headSha: branch.commit.sha, protected: branch.protected ?? false, isDefault: branch.name === defaultBranch },
        create: {
          repositoryId: repoId,
          name: branch.name,
          headSha: branch.commit.sha,
          protected: branch.protected ?? false,
          isDefault: branch.name === defaultBranch,
        },
      });
    }
    await finishSync(sync.id, 'REPOSITORY', count);
    return count;
  } catch (error) {
    await failSync(sync.id, 'REPOSITORY', error);
    throw error;
  }
}

export async function syncDeployments(client: GitHubClient, repoId: string, fullName: string): Promise<number> {
  const [owner, name] = fullName.split('/');
  try {
    const deployments = await fetchDeployments(client, owner, name);
    let count = 0;
    for (const dep of deployments) {
      count++;
      const id = dep.id ? `dep-${dep.id}` : `dep-${repoId}-${dep.created_at}`;
      const creatorId = dep.creator ? await resolveDeveloperId({ login: dep.creator.login, id: dep.creator.id }) : null;
      await prisma.deployment.upsert({
        where: { id },
        update: {
          ref: dep.ref,
          sha: dep.sha ?? null,
          task: dep.task,
          environment: dep.environment,
          description: dep.description,
          state: dep.state,
          creatorId,
        },
        create: {
          id,
          repositoryId: repoId,
          githubId: dep.id,
          ref: dep.ref,
          sha: dep.sha ?? null,
          task: dep.task,
          environment: dep.environment,
          description: dep.description,
          state: dep.state,
          creatorId,
          createdAt: new Date(dep.created_at),
        },
      });
    }
    return count;
  } catch (error) {
    logger.warn('deployments sync failed', { fullName, error: redact(error) });
    return 0;
  }
}

export async function syncWorkflows(client: GitHubClient, repoId: string, fullName: string): Promise<number> {
  const [owner, name] = fullName.split('/');
  const sync = await startSync(repoId, 'WORKFLOWS');
  try {
    const runs = await fetchWorkflowRuns(client, owner, name);
    let count = 0;
    for (const run of runs.slice(0, 300)) {
      count++;
      const jobs = await fetchWorkflowRunJobs(client, owner, name, run.id);
      const successfulJobs = jobs.filter((j) => j.conclusion === 'success').length;
      const failedJobs = jobs.filter((j) => j.conclusion === 'failure' || j.conclusion === 'startup_failure').length;
      await prisma.workflowRun.upsert({
        where: { githubId: run.id },
        update: {
          name: run.name,
          workflowId: run.workflow_id,
          headBranch: run.head_branch,
          headSha: run.head_sha,
          event: run.event,
          runNumber: run.run_number,
          status: mapWorkflowStatus(run.status),
          conclusion: mapWorkflowConclusion(run.conclusion),
          totalJobs: jobs.length,
          successfulJobs,
          failedJobs,
          startedAt: new Date(run.created_at),
          completedAt: run.conclusion ? new Date(run.updated_at) : null,
          updatedAt: new Date(run.updated_at),
        },
        create: {
          repositoryId: repoId,
          githubId: run.id,
          name: run.name,
          workflowId: run.workflow_id,
          headBranch: run.head_branch,
          headSha: run.head_sha,
          event: run.event,
          runNumber: run.run_number,
          status: mapWorkflowStatus(run.status),
          conclusion: mapWorkflowConclusion(run.conclusion),
          totalJobs: jobs.length,
          successfulJobs,
          failedJobs,
          createdAt: new Date(run.created_at),
          startedAt: new Date(run.created_at),
          completedAt: run.conclusion ? new Date(run.updated_at) : null,
          updatedAt: new Date(run.updated_at),
        },
      });
    }
    await finishSync(sync.id, 'WORKFLOWS', count);
    return count;
  } catch (error) {
    await failSync(sync.id, 'WORKFLOWS', error);
    logger.warn('workflow sync failed', { fullName, error: redact(error) });
    return 0;
  }
}

function mapWorkflowStatus(status: string): 'QUEUED' | 'IN_PROGRESS' | 'WAITING' | 'REQUESTED' | 'PENDING' | 'COMPLETED' {
  const map: Record<string, 'QUEUED' | 'IN_PROGRESS' | 'WAITING' | 'REQUESTED' | 'PENDING' | 'COMPLETED'> = {
    queued: 'QUEUED',
    in_progress: 'IN_PROGRESS',
    waiting: 'WAITING',
    requested: 'REQUESTED',
    pending: 'PENDING',
    completed: 'COMPLETED',
  };
  return map[status] ?? 'PENDING';
}

function mapWorkflowConclusion(
  conclusion: string | null,
): 'SUCCESS' | 'FAILURE' | 'NEUTRAL' | 'CANCELLED' | 'SKIPPED' | 'TIMED_OUT' | 'ACTION_REQUIRED' | 'STARTUP_FAILURE' | null {
  if (!conclusion) return null;
  switch (conclusion) {
    case 'success': return 'SUCCESS';
    case 'failure': return 'FAILURE';
    case 'neutral': return 'NEUTRAL';
    case 'cancelled': return 'CANCELLED';
    case 'skipped': return 'SKIPPED';
    case 'timed_out': return 'TIMED_OUT';
    case 'action_required': return 'ACTION_REQUIRED';
    case 'startup_failure': return 'STARTUP_FAILURE';
    default: return null;
  }
}

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

export async function syncSecurity(client: GitHubClient, repoId: string, fullName: string): Promise<number> {
  const [owner, name] = fullName.split('/');
  const sync = await startSync(repoId, 'SECURITY');
  try {
    let count = 0;
    const dependabot = await fetchDependabotAlerts(client, owner, name);
    for (const alert of dependabot) {
      count++;
      const key = String(alert.number ?? alert.id ?? `${repoId}-${Date.now()}-${count}`);
      await prisma.securityAlert.upsert({
        where: { githubId: key },
        update: {
          type: 'DEPENDABOT',
          severity: mapAlertSeverity(alert.severity ?? alert.security_advisory?.severity ?? 'LOW'),
          state: mapAlertState(alert.state),
          title: alert.security_advisory?.summary ?? alert.dependency?.package?.name ?? 'Dependabot alert',
          externalIdentifier: alert.security_advisory?.cve_id ?? null,
          packageName: alert.dependency?.package?.name ?? null,
          manifestPath: alert.dependency?.manifest_path ?? null,
          ecosystem: alert.dependency?.package?.ecosystem ?? null,
          dismissReason: alert.dismissed_reason,
          dismissedAt: alert.dismissed_at ? new Date(alert.dismissed_at) : null,
          firstDetectedAt: alert.created_at ? new Date(alert.created_at) : null,
        },
        create: {
          repositoryId: repoId,
          githubId: key,
          type: 'DEPENDABOT',
          severity: mapAlertSeverity(alert.severity ?? alert.security_advisory?.severity ?? 'LOW'),
          state: mapAlertState(alert.state),
          title: alert.security_advisory?.summary ?? alert.dependency?.package?.name ?? 'Dependabot alert',
          externalIdentifier: alert.security_advisory?.cve_id ?? null,
          packageName: alert.dependency?.package?.name ?? null,
          manifestPath: alert.dependency?.manifest_path ?? null,
          ecosystem: alert.dependency?.package?.ecosystem ?? null,
          dismissReason: alert.dismissed_reason,
          dismissedAt: alert.dismissed_at ? new Date(alert.dismissed_at) : null,
          firstDetectedAt: alert.created_at ? new Date(alert.created_at) : null,
        },
      });
    }

    const codeScanning = await fetchCodeScanningAlerts(client, owner, name);
    for (const alert of codeScanning) {
      if (!alert.number) continue;
      count++;
      const key = `cs-${alert.number}`;
      await prisma.securityAlert.upsert({
        where: { githubId: key },
        update: {
          type: 'CODE_SCANNING',
          severity: mapAlertSeverity(alert.severity ?? 'LOW'),
          state: mapAlertState(alert.state),
          title: alert.rule?.description ?? alert.most_recent_instance?.ref ?? 'Code scanning alert',
        },
        create: {
          repositoryId: repoId,
          githubId: key,
          type: 'CODE_SCANNING',
          severity: mapAlertSeverity(alert.severity ?? 'LOW'),
          state: mapAlertState(alert.state),
          title: alert.rule?.description ?? alert.most_recent_instance?.ref ?? 'Code scanning alert',
        },
      });
    }

    const secretScanning = await fetchSecretScanningAlerts(client, owner, name);
    for (const alert of secretScanning) {
      if (!alert.number) continue;
      count++;
      const key = `ss-${alert.number}`;
      await prisma.securityAlert.upsert({
        where: { githubId: key },
        update: {
          type: 'SECRET_SCANNING',
          severity: 'CRITICAL',
          state: mapAlertState(alert.state),
          title: `Secret scanning alert ${alert.number}`,
        },
        create: {
          repositoryId: repoId,
          githubId: key,
          type: 'SECRET_SCANNING',
          severity: 'CRITICAL',
          state: mapAlertState(alert.state),
          title: `Secret scanning alert ${alert.number}`,
        },
      });
    }

    await finishSync(sync.id, 'SECURITY', count);
    return count;
  } catch (error) {
    await failSync(sync.id, 'SECURITY', error);
    logger.warn('security sync failed', { fullName, error: redact(error) });
    return 0;
  }
}

function mapAlertSeverity(severity: string | null): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NOTE' {
  switch ((severity ?? 'LOW').toUpperCase()) {
    case 'CRITICAL': return 'CRITICAL';
    case 'HIGH': return 'HIGH';
    case 'MEDIUM': return 'MEDIUM';
    case 'NOTE': return 'NOTE';
    default: return 'LOW';
  }
}

function mapAlertState(state: string): 'OPEN' | 'FIXED' | 'DISMISSED' {
  switch (state) {
    case 'fixed': return 'FIXED';
    case 'dismissed': return 'DISMISSED';
    default: return 'OPEN';
  }
}

// ---------------------------------------------------------------------------
// Full repository sync orchestration
// ---------------------------------------------------------------------------

export async function syncFullRepository(repoId: string): Promise<{ commits: number; prs: number; issues: number }> {
  const repo = await prisma.repository.findUnique({
    where: { id: repoId },
    include: { organization: true },
  });
  if (!repo) throw new Error('Repository not found');

  let account = null;
  if (repo.organization?.id) {
    account = await prisma.gitHubAccount.findFirst({ where: { scope: { contains: 'read:org' } } });
  }
  if (!account) account = await prisma.gitHubAccount.findFirst();

  if (!account) throw new Error('No GitHub account available to sync');

  const client = new GitHubClient(decryptSecret(account.accessTokenEncrypted));
  const sinceStart = repo.lastCommitSyncedAt ?? new Date(Date.now() - SETTINGS.initialHistoryDays * 24 * 60 * 60 * 1000);

  const fullName = repo.fullName;
  const results = { commits: 0, prs: 0, issues: 0 };

  const [commitCount, prCount, issueCount] = await Promise.all([
    syncCommits(client, repoId, fullName, { since: sinceStart }),
    syncPullRequests(client, repoId, fullName, { since: sinceStart }),
    syncIssues(client, repoId, fullName, { since: sinceStart }),
  ]);
  results.commits = commitCount;
  results.prs = prCount;
  results.issues = issueCount;

  await syncBranches(client, repoId, fullName, repo.defaultBranch);
  await syncDeployments(client, repoId, fullName);
  await syncWorkflows(client, repoId, fullName);
  await syncSecurity(client, repoId, fullName);

  await prisma.repository.update({
    where: { id: repoId },
    data: { syncStatus: 'COMPLETED', lastSyncedAt: new Date() },
  });

  return results;
}

// ---------------------------------------------------------------------------
// Sync tracking helpers
// ---------------------------------------------------------------------------

async function startSync(repositoryId: string, type: import('@prisma/client').SyncType) {
  await prisma.repository.update({
    where: { id: repositoryId },
    data: { syncStatus: 'RUNNING', lastSyncedAt: new Date() },
  });
  return prisma.repositorySync.create({
    data: { repositoryId, type, status: 'RUNNING', startedAt: new Date(), itemsProcessed: 0 },
  });
}

async function finishSync(syncId: string, type: import('@prisma/client').SyncType, itemsProcessed: number) {
  await prisma.repositorySync.update({
    where: { id: syncId },
    data: { status: 'COMPLETED', finishedAt: new Date(), itemsProcessed },
  });
}

async function failSync(syncId: string, type: import('@prisma/client').SyncType, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  await prisma.repositorySync.update({
    where: { id: syncId },
    data: { status: 'FAILED', finishedAt: new Date(), error: message.slice(0, 2000) },
  });
}

export function isRateLimitError(error: unknown): error is GitHubRateLimitError {
  return error instanceof GitHubRateLimitError;
}