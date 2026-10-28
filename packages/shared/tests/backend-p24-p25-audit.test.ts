import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { CanaryController, CanaryMetrics, canaryController } from '../../../infra/deploy/canary';

describe('Backend and Workflows - P24: CI/CD Pipeline & Progressive Delivery', () => {
  const ciWorkflowPath = path.resolve(__dirname, '../../../.github/workflows/ci.yml');

  it('P24-1: CI/CD workflow contains all required pipeline stages', () => {
    expect(fs.existsSync(ciWorkflowPath)).toBe(true);
    const workflowContent = fs.readFileSync(ciWorkflowPath, 'utf-8');

    // 1. Audit / Secret Scan
    expect(workflowContent).toContain('security-audit');
    expect(workflowContent).toContain('Gitleaks Secret Scanner');
    expect(workflowContent).toContain('pnpm audit');

    // 2. Quality Checks (lint, typecheck, unit, integration, build)
    expect(workflowContent).toContain('quality-checks');
    expect(workflowContent).toContain('pnpm lint');
    expect(workflowContent).toContain('pnpm typecheck');
    expect(workflowContent).toContain('pnpm test:unit');
    expect(workflowContent).toContain('pnpm test:integration');
    expect(workflowContent).toContain('pnpm build');

    // 3. SBOM (CycloneDX) & Trivy Image Scan
    expect(workflowContent).toContain('sbom-and-trivy');
    expect(workflowContent).toContain('cyclonedx-npm');
    expect(workflowContent).toContain('trivy-action');
    expect(workflowContent).toContain("exit-code: '1'"); // P24: Never skip failing security scans

    // 4. Staging Deploy & Smoke Test
    expect(workflowContent).toContain('deploy-staging');
    expect(workflowContent).toContain('curl --fail');

    // 5. Production Progressive Canary Delivery
    expect(workflowContent).toContain('deploy-production-canary');
    expect(workflowContent).toContain('environment: production');
  });

  it('P24-2: Uses OIDC to cloud with zero static cloud credentials stored in repo secrets', () => {
    const workflowContent = fs.readFileSync(ciWorkflowPath, 'utf-8');

    // OIDC token write permission required
    expect(workflowContent).toContain('id-token: write');

    // OIDC role assumption without static AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY
    expect(workflowContent).toContain('role-to-assume');
    expect(workflowContent).toContain('audience: sts.amazonaws.com');
    expect(workflowContent).not.toContain('AWS_ACCESS_KEY_ID: ${{ secrets.');
    expect(workflowContent).not.toContain('AWS_SECRET_ACCESS_KEY: ${{ secrets.');
  });

  it('P24-3: Canary controller advances progressively (5% -> 50% -> 100%) when SLO metrics are healthy', () => {
    const controller = new CanaryController({
      maxErrorRate: 0.001, // 0.1% max errors
      maxP95LatencyMs: 250, // 250ms max p95
    });

    const healthyMetrics: CanaryMetrics = {
      totalRequests: 10000,
      errorCount: 5, // 0.05% error rate <= 0.1%
      p95LatencyMs: 140, // 140ms <= 250ms
    };

    // Step 0: 5%
    const step0 = controller.progressCanary(0, healthyMetrics);
    expect(step0.nextWeight).toBe(5);
    expect(step0.rolledBack).toBe(false);
    expect(controller.getCurrentWeight()).toBe(5);

    // Step 1: 50%
    const step1 = controller.progressCanary(1, healthyMetrics);
    expect(step1.nextWeight).toBe(50);
    expect(step1.rolledBack).toBe(false);
    expect(controller.getCurrentWeight()).toBe(50);

    // Step 2: 100%
    const step2 = controller.progressCanary(2, healthyMetrics);
    expect(step2.nextWeight).toBe(100);
    expect(step2.rolledBack).toBe(false);
    expect(controller.getCurrentWeight()).toBe(100);
  });

  it('P24-4: Canary controller immediately triggers auto-rollback on SLO error rate or latency breach', () => {
    const controller = new CanaryController({
      maxErrorRate: 0.001,
      maxP95LatencyMs: 250,
    });

    // 1. Error rate breach: 15 errors in 1000 requests = 1.5% > 0.1%
    const errorBreachMetrics: CanaryMetrics = {
      totalRequests: 1000,
      errorCount: 15,
      p95LatencyMs: 100,
    };

    const rollbackOnError = controller.progressCanary(0, errorBreachMetrics);
    expect(rollbackOnError.rolledBack).toBe(true);
    expect(rollbackOnError.nextWeight).toBe(0);
    expect(controller.getCurrentWeight()).toBe(0);
    expect(controller.isRollbackActive()).toBe(true);
    expect(rollbackOnError.reason).toContain('Auto-rollback triggered');
    expect(rollbackOnError.reason).toContain('Error rate 1.50% breached SLO threshold');

    // 2. Latency breach: 320ms > 250ms
    const latencyBreachMetrics: CanaryMetrics = {
      totalRequests: 1000,
      errorCount: 0,
      p95LatencyMs: 320,
    };

    const rollbackOnLatency = controller.progressCanary(0, latencyBreachMetrics);
    expect(rollbackOnLatency.rolledBack).toBe(true);
    expect(rollbackOnLatency.nextWeight).toBe(0);
    expect(rollbackOnLatency.reason).toContain('P95 latency 320ms breached SLO threshold');
  });

  it('P24-5: Rollback drill executes successfully and verifies instant auto-rollback recovery', () => {
    const drillResult = canaryController.executeRollbackDrill();
    expect(drillResult.success).toBe(true);
    expect(drillResult.initialWeight).toBe(5);
    expect(drillResult.rolledBackToWeight).toBe(0);
    expect(drillResult.rollbackDurationMs).toBeGreaterThanOrEqual(0);
    expect(drillResult.drillTimestamp).toBeDefined();
    expect(drillResult.reason).toContain('Auto-rollback triggered');
  });
});

describe('Backend and Workflows - P25: Infrastructure and Containers', () => {
  const dockerfilePath = path.resolve(__dirname, '../../../infra/docker/api.Dockerfile');
  const terraformPath = path.resolve(__dirname, '../../../infra/terraform/main.tf');
  const k8sPath = path.resolve(__dirname, '../../../infra/k8s/app.yaml');

  it('P25-1: Multi-stage Dockerfile enforces non-root execution, capability drops, and Alpine minimal base', () => {
    expect(fs.existsSync(dockerfilePath)).toBe(true);
    const dockerContent = fs.readFileSync(dockerfilePath, 'utf-8');

    // Multi-stage verification
    expect(dockerContent).toContain('FROM node:20-alpine AS base');
    expect(dockerContent).toContain('FROM base AS builder');
    expect(dockerContent).toContain('FROM node:20-alpine AS runner');

    // Non-root user with explicit UID/GID
    expect(dockerContent).toContain('addgroup -g 10001 -S appgroup');
    expect(dockerContent).toContain('adduser -u 10001 -S appuser -G appgroup');
    expect(dockerContent).toContain('USER 10001:10001');

    // Read-only filesystem volume compatibility
    expect(dockerContent).toContain('VOLUME ["/tmp"]');

    // Production environment
    expect(dockerContent).toContain('ENV NODE_ENV=production');
  });

  it('P25-2: Terraform config enforces remote backend with locking, private data subnets, and zero public data store exposure', () => {
    expect(fs.existsSync(terraformPath)).toBe(true);
    const tfContent = fs.readFileSync(terraformPath, 'utf-8');

    // Remote backend with DynamoDB locking
    expect(tfContent).toContain('backend "s3"');
    expect(tfContent).toContain('dynamodb_table = "javamifi-terraform-locks"');
    expect(tfContent).toContain('encrypt        = true');

    // Private subnets for data stores (NEVER public)
    expect(tfContent).toContain('aws_subnet" "private_data_a"');
    expect(tfContent).toContain('aws_subnet" "private_data_b"');
    expect(tfContent).toContain('map_public_ip_on_launch = false');

    // RDS PostgreSQL configuration
    expect(tfContent).toContain('publicly_accessible    = false');
    expect(tfContent).toContain('storage_encrypted      = true');
    expect(tfContent).toContain('security_groups = [aws_security_group.app_sg.id]');

    // Prohibit 0.0.0.0/0 ingress on DB and Redis
    const dbSgBlock = tfContent.substring(tfContent.indexOf('aws_security_group" "db_sg"'));
    const redisSgBlock = tfContent.substring(tfContent.indexOf('aws_security_group" "redis_sg"'));
    expect(dbSgBlock.indexOf('cidr_blocks = ["0.0.0.0/0"]')).toBe(-1);
    expect(redisSgBlock.indexOf('cidr_blocks = ["0.0.0.0/0"]')).toBe(-1);

    // Private S3 object storage with public access blocks
    expect(tfContent).toContain('aws_s3_bucket_public_access_block" "media_block"');
    expect(tfContent).toContain('block_public_acls       = true');
    expect(tfContent).toContain('block_public_policy     = true');
  });

  it('P25-3: Kubernetes manifests define resource limits, PodDisruptionBudgets, and hardened security context', () => {
    expect(fs.existsSync(k8sPath)).toBe(true);
    const k8sContent = fs.readFileSync(k8sPath, 'utf-8');

    // PodDisruptionBudgets for API and Worker
    expect(k8sContent).toContain('kind: PodDisruptionBudget');
    expect(k8sContent).toContain('name: javamifi-api-pdb');
    expect(k8sContent).toContain('name: javamifi-worker-pdb');
    expect(k8sContent).toContain('minAvailable: 1');

    // SecurityContext hardening
    expect(k8sContent).toContain('runAsNonRoot: true');
    expect(k8sContent).toContain('runAsUser: 10001');
    expect(k8sContent).toContain('readOnlyRootFilesystem: true');
    expect(k8sContent).toContain('drop:');
    expect(k8sContent).toContain('- ALL');

    // Resource requests & limits
    expect(k8sContent).toContain('cpu: "250m"');
    expect(k8sContent).toContain('memory: "512Mi"');
    expect(k8sContent).toContain('cpu: "1000m"');
    expect(k8sContent).toContain('memory: "1024Mi"');
  });
});
