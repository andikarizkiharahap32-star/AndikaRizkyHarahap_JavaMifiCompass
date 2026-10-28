import { describe, it, expect } from 'vitest';
import {
  AdvisorySeverityEnum,
  AdvisoryDispositionEnum,
  VersionPinningStyleEnum,
  classifyVersionPinning,
  validateDependencyPinning,
  evaluateSupplyChainCompliance,
  WORKSPACE_BASELINE_PACKAGES,
  SbomPackage,
} from '../src';

describe('SEC-P09: Dependencies and Software Supply Chain', () => {
  describe('Version Pinning Classification (SEC-P09-CTRL-0019)', () => {
    it('classifies exact semantic versions as EXACT_PINNED', () => {
      expect(classifyVersionPinning('10.4.22')).toBe('EXACT_PINNED');
      expect(classifyVersionPinning('3.23.8')).toBe('EXACT_PINNED');
      expect(classifyVersionPinning('1.0.0-rc.1')).toBe('EXACT_PINNED');
    });

    it('classifies bounded ranges properly', () => {
      expect(classifyVersionPinning('^19.0.0')).toBe('CARET_BOUNDED');
      expect(classifyVersionPinning('~1.2.0')).toBe('TILDE_BOUNDED');
    });

    it('classifies wildcards, latest, and unbounded ranges as WILDCARD_UNSAFE', () => {
      expect(classifyVersionPinning('*')).toBe('WILDCARD_UNSAFE');
      expect(classifyVersionPinning('latest')).toBe('WILDCARD_UNSAFE');
      expect(classifyVersionPinning('>=0.0.0')).toBe('WILDCARD_UNSAFE');
      expect(classifyVersionPinning('')).toBe('WILDCARD_UNSAFE');
    });
  });

  describe('Dependency Pinning Policy Validation (INV-01, INV-04)', () => {
    it('approves exact and bounded versions in production scope', () => {
      const exactResult = validateDependencyPinning('@nestjs/core', '10.4.22', 'PRODUCTION');
      expect(exactResult.isSafeForProduction).toBe(true);
      expect(exactResult.pinningStyle).toBe('EXACT_PINNED');

      const caretResult = validateDependencyPinning('zod', '^3.23.8', 'PRODUCTION');
      expect(caretResult.isSafeForProduction).toBe(true);
      expect(caretResult.pinningStyle).toBe('CARET_BOUNDED');
    });

    it('strictly rejects wildcard or unbounded dependencies in production scope (INV-04)', () => {
      const wildcardResult = validateDependencyPinning('untrusted-lib', '*', 'PRODUCTION');
      expect(wildcardResult.isSafeForProduction).toBe(false);
      expect(wildcardResult.pinningStyle).toBe('WILDCARD_UNSAFE');
      expect(wildcardResult.reason).toContain('strictly forbidden in production');
    });

    it('permits development scope flexibility for build tools', () => {
      const devResult = validateDependencyPinning('eslint', '^8.57.0', 'DEVELOPMENT');
      expect(devResult.isSafeForProduction).toBe(true);
    });
  });

  describe('Workspace Baseline Software Bill of Materials (SBOM) (SEC-P09-CTRL-0019)', () => {
    it('verifies all baseline packages have integrity flags and approved licenses', () => {
      expect(WORKSPACE_BASELINE_PACKAGES.length).toBeGreaterThan(5);

      for (const pkg of WORKSPACE_BASELINE_PACKAGES) {
        expect(pkg.name).toBeDefined();
        expect(pkg.version).toBeDefined();
        expect(pkg.integrityVerified).toBe(true);
        expect(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC']).toContain(pkg.license);
      }
    });

    it('ensures zero wildcard dependencies exist in baseline production packages', () => {
      const prodPackages = WORKSPACE_BASELINE_PACKAGES.filter((p) => p.scope === 'PRODUCTION');
      for (const pkg of prodPackages) {
        expect(pkg.pinningStyle).not.toBe('WILDCARD_UNSAFE');
      }
    });
  });

  describe('Advisory Triage and Boundary Mitigation (INV-02, INV-03, INV-04)', () => {
    it('verifies that all baseline advisories have documented mitigations and accountable risk owners', () => {
      for (const pkg of WORKSPACE_BASELINE_PACKAGES) {
        for (const advisory of pkg.advisories) {
          expect(advisory.id).toBeDefined();
          expect(advisory.disposition).not.toBe('UNREVIEWED');
          expect(advisory.riskOwner).toBeDefined();
          expect(advisory.justification).toBeDefined();
          expect(advisory.justification!.length).toBeGreaterThan(15);
          expect(advisory.reviewedAt).toBeDefined();
        }
      }
    });
  });

  describe('Supply Chain Release Invariants Evaluation (INV-04, SEC-P09-CTRL-0019, CTRL-0020)', () => {
    it('evaluates baseline workspace as COMPLIANT with all invariants passing', () => {
      const report = evaluateSupplyChainCompliance();

      expect(report.status).toBe('COMPLIANT');
      expect(report.phase).toBe('SEC-P09');
      expect(report.invariants['INV-01'].passed).toBe(true);
      expect(report.invariants['INV-02'].passed).toBe(true);
      expect(report.invariants['INV-03'].passed).toBe(true);
      expect(report.invariants['INV-04'].passed).toBe(true);
      expect(report.controls['SEC-P09-CTRL-0001'].verified).toBe(true);
      expect(report.controls['SEC-P09-CTRL-0019'].verified).toBe(true);
      expect(report.controls['SEC-P09-CTRL-0020'].verified).toBe(true);
      expect(report.metrics.unpinnedProductionPackagesCount).toBe(0);
      expect(report.metrics.unreviewedAdvisoriesCount).toBe(0);
    });

    it('blocks release (NON_COMPLIANT) if an unpinned wildcard dependency exists in production (INV-04)', () => {
      const poisonedPackages: SbomPackage[] = [
        ...WORKSPACE_BASELINE_PACKAGES,
        {
          name: 'malicious-unpinned-dep',
          version: '*',
          scope: 'PRODUCTION',
          license: 'MIT',
          pinningStyle: 'WILDCARD_UNSAFE',
          integrityVerified: false,
          advisories: [],
        },
      ];

      const report = evaluateSupplyChainCompliance({ packages: poisonedPackages });

      expect(report.status).toBe('NON_COMPLIANT');
      expect(report.invariants['INV-04'].passed).toBe(false);
      expect(report.controls['SEC-P09-CTRL-0019'].verified).toBe(false);
      expect(report.metrics.unpinnedProductionPackagesCount).toBe(1);
    });

    it('blocks release (NON_COMPLIANT) if an unreviewed critical advisory exists (INV-04)', () => {
      const vulnerablePackages: SbomPackage[] = [
        {
          name: 'vulnerable-core-dep',
          version: '1.0.0',
          scope: 'PRODUCTION',
          license: 'MIT',
          pinningStyle: 'EXACT_PINNED',
          integrityVerified: true,
          advisories: [
            {
              id: 'GHSA-new-zero-day',
              packageName: 'vulnerable-core-dep',
              vulnerableVersions: '<2.0.0',
              severity: 'CRITICAL',
              disposition: 'UNREVIEWED',
            },
          ],
        },
      ];

      const report = evaluateSupplyChainCompliance({ packages: vulnerablePackages });

      expect(report.status).toBe('NON_COMPLIANT');
      expect(report.invariants['INV-04'].passed).toBe(false);
      expect(report.metrics.unreviewedAdvisoriesCount).toBe(1);
    });
  });
});
