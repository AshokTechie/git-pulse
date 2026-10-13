import { prisma } from '../../db/client.js';
import type { AlertSeverity, AlertType } from '@prisma/client';

export interface SecurityAnalytics {
  dependabotAlerts: number;
  codeScanningAlerts: number;
  secretScanningAlerts: number;
  openAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  vulnerableDependencies: number;
  outdatedDependencies: number;
  byType: { type: AlertType; severity: AlertSeverity; count: number }[];
}

export async function getSecurityAnalytics(repoId: string): Promise<SecurityAnalytics> {
  const alerts = await prisma.securityAlert.findMany({
    where: { repositoryId: repoId },
    select: { type: true, severity: true, state: true, packageName: true, externalIdentifier: true },
  });

  const counted = (type: AlertType) => alerts.filter((a) => a.type === type).length;
  const openAlerts = alerts.filter((a) => a.state === 'OPEN');
  const critical = openAlerts.filter((a) => a.severity === 'CRITICAL').length;
  const high = openAlerts.filter((a) => a.severity === 'HIGH').length;
  const medium = openAlerts.filter((a) => a.severity === 'MEDIUM').length;

  return {
    dependabotAlerts: counted('DEPENDABOT'),
    codeScanningAlerts: counted('CODE_SCANNING'),
    secretScanningAlerts: counted('SECRET_SCANNING'),
    openAlerts: openAlerts.length,
    criticalAlerts: critical,
    highAlerts: high,
    mediumAlerts: medium,
    vulnerableDependencies: alerts.filter((a) => a.type === 'DEPENDABOT' && a.state === 'OPEN' && a.packageName).length,
    outdatedDependencies: alerts.filter((a) => a.type === 'DEPENDABOT' && a.state === 'OPEN').length,
    byType: [
      { type: 'DEPENDABOT' as const, severity: 'CRITICAL' as const, count: critical },
      { type: 'CODE_SCANNING' as const, severity: 'HIGH' as const, count: high },
      { type: 'SECRET_SCANNING' as const, severity: 'MEDIUM' as const, count: medium },
    ],
  };
}