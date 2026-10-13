import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding GitPulse database...');

  // 1. Create or upsert Demo User
  const user = await prisma.user.upsert({
    where: { githubId: 583231 },
    update: {},
    create: {
      githubId: 583231,
      githubLogin: 'octocat',
      name: 'The Octocat',
      email: 'octocat@github.com',
      avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
    },
  });

  // 2. Create GitHub Account
  await prisma.gitHubAccount.upsert({
    where: { githubId: 583231 },
    update: {},
    create: {
      userId: user.id,
      githubId: 583231,
      login: 'octocat',
      name: 'The Octocat',
      email: 'octocat@github.com',
      avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
      accessTokenEncrypted: 'mock-encrypted-token',
      tokenType: 'dev',
      scope: 'read:user repo',
    },
  });

  // 3. Create Developers
  const devData = [
    { githubId: 101, login: 'octocat', name: 'The Octocat', avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4' },
    { githubId: 102, login: 'sarah-dev', name: 'Sarah Chen', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { githubId: 103, login: 'alex-engineer', name: 'Alex Rivera', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { githubId: 104, login: 'priya-tech', name: 'Priya Sharma', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
  ];

  const developers: any[] = [];
  for (const d of devData) {
    const dev = await prisma.developer.upsert({
      where: { login: d.login },
      update: {},
      create: d,
    });
    developers.push(dev);
  }

  // 4. Create Repositories
  const repoData = [
    {
      name: 'gitpulse-core',
      fullName: 'octocat/gitpulse-core',
      description: 'Core analytics engine for GitPulse AI platform',
      defaultBranch: 'main',
      githubId: 1001,
      private: false,
      stars: 1842,
      watchers: 142,
      forksCount: 234,
      openIssuesCount: 12,
      primaryLanguage: 'TypeScript',
      ownerId: user.id,
    },
    {
      name: 'react-dashboard',
      fullName: 'octocat/react-dashboard',
      description: 'Engineering metrics visualization dashboard',
      defaultBranch: 'main',
      githubId: 1002,
      private: false,
      stars: 3201,
      watchers: 280,
      forksCount: 581,
      openIssuesCount: 5,
      primaryLanguage: 'TypeScript',
      ownerId: user.id,
    },
    {
      name: 'api-gateway',
      fullName: 'octocat/api-gateway',
      description: 'High performance API proxy and authentication service',
      defaultBranch: 'main',
      githubId: 1003,
      private: false,
      stars: 892,
      watchers: 95,
      forksCount: 101,
      openIssuesCount: 23,
      primaryLanguage: 'Go',
      ownerId: user.id,
    },
  ];

  for (const r of repoData) {
    const repo = await prisma.repository.upsert({
      where: { fullName: r.fullName },
      update: {},
      create: {
        ...r,
        url: `https://github.com/${r.fullName}`,
        htmlUrl: `https://github.com/${r.fullName}`,
      },
    });

    // Create Branches
    await prisma.branch.upsert({
      where: { repositoryId_name: { repositoryId: repo.id, name: 'main' } },
      update: {},
      create: {
        repositoryId: repo.id,
        name: 'main',
        isDefault: true,
      },
    });

    // Create Commits
    for (let i = 0; i < 25; i++) {
      const dev = developers[i % developers.length];
      const daysAgo = Math.floor(Math.random() * 20);
      const commitDate = new Date(Date.now() - daysAgo * 86_400_000 - Math.random() * 36_000_000);

      const commit = await prisma.commit.upsert({
        where: { sha: `sha-${repo.name}-${i}` },
        update: {},
        create: {
          sha: `sha-${repo.name}-${i}`,
          message: i % 4 === 0 ? `feat(core): enhance analytics data pipeline #${i}` : `fix: resolve edge case bug #${i}`,
          authoredAt: commitDate,
          additions: 30 + Math.floor(Math.random() * 120),
          deletions: 5 + Math.floor(Math.random() * 40),
          repositoryId: repo.id,
          authorId: dev.id,
        },
      });

      await prisma.commitFile.create({
        data: {
          repositoryId: repo.id,
          commitId: commit.id,
          path: `src/services/service-${i % 5}.ts`,
          additions: commit.additions,
          deletions: commit.deletions,
        },
      });
    }

    // Create Pull Requests
    for (let i = 1; i <= 6; i++) {
      const dev = developers[i % developers.length];
      const reviewer = developers[(i + 1) % developers.length];
      const isMerged = i % 2 === 0;
      const createdAt = new Date(Date.now() - (i * 3 + 1) * 86_400_000);
      const mergedAt = isMerged ? new Date(createdAt.getTime() + 28 * 3_600_000) : null;

      const pr = await prisma.pullRequest.upsert({
        where: { githubId: repo.githubId * 100 + i },
        update: {},
        create: {
          number: i,
          title: `Implement feature module improvements part #${i}`,
          state: isMerged ? 'MERGED' : 'OPEN',
          merged: isMerged,
          mergedAt,
          githubId: repo.githubId * 100 + i,
          repositoryId: repo.id,
          authorId: dev.id,
          createdAt,
          updatedAt: new Date(),
        },
      });

      // Create Review
      await prisma.pullRequestReview.create({
        data: {
          pullRequestId: pr.id,
          reviewerId: reviewer.id,
          state: isMerged ? 'APPROVED' : 'COMMENTED',
          submittedAt: new Date(createdAt.getTime() + 14 * 3_600_000),
          body: 'LGTM! Great test coverage and clean documentation.',
        },
      });
    }

    // Create Issues
    for (let i = 1; i <= 5; i++) {
      await prisma.issue.upsert({
        where: { githubId: repo.githubId * 200 + i },
        update: {},
        create: {
          number: i,
          title: `Enhance error handling and add retry logic #${i}`,
          state: i <= 2 ? 'CLOSED' : 'OPEN',
          githubId: repo.githubId * 200 + i,
          repositoryId: repo.id,
          createdAt: new Date(Date.now() - i * 5 * 86_400_000),
          closedAt: i <= 2 ? new Date() : null,
        },
      });
    }

    // Create Workflow Runs
    for (let i = 1; i <= 8; i++) {
      const isSuccess = i % 4 !== 0;
      await prisma.workflowRun.create({
        data: {
          repositoryId: repo.id,
          name: 'CI / Test & Build',
          conclusion: isSuccess ? 'SUCCESS' : 'FAILURE',
          status: 'completed',
          failedJobs: isSuccess ? 0 : 1,
          startedAt: new Date(Date.now() - i * 2 * 86_400_000),
          completedAt: new Date(Date.now() - i * 2 * 86_400_000 + 420_000),
        },
      });
    }

    // Create Health Score
    await prisma.healthScore.upsert({
      where: { id: `${repo.id}-THIRTY_DAYS` },
      update: {},
      create: {
        id: `${repo.id}-THIRTY_DAYS`,
        repositoryId: repo.id,
        range: 'THIRTY_DAYS',
        score: 86.5,
        breakdown: {
          codeQuality: 88,
          testCoverage: 84,
          documentation: 90,
          velocity: 85,
        },
        technicalDebt: 12.4,
        criticalFiles: 2,
        staleIssues: 1,
        outdatedDependencies: 0,
        busFactor: [{ developer: 'octocat', percentage: 48 }],
      },
    });

    // Create AI Insights
    await prisma.aiInsight.create({
      data: {
        repositoryId: repo.id,
        category: 'RECOMMENDATION',
        severity: 'MEDIUM',
        status: 'OPEN',
        title: `PR Review turnaround can be improved for ${repo.name}`,
        description: 'Average time to first review is 14 hours. Designating rotating code review duty can lower review cycle time to under 4 hours.',
        evidence: { avgReviewHours: 14.2 },
      },
    });
  }

  console.log('✅ Seed finished successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
