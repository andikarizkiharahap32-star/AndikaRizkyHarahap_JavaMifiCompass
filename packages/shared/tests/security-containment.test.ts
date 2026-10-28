import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Security & Infrastructure Containment Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  it('enforces loopback-only (127.0.0.1) port bindings in docker-compose.yml', () => {
    const composePath = path.join(rootDir, 'docker-compose.yml');
    expect(fs.existsSync(composePath)).toBe(true);

    const composeContent = fs.readFileSync(composePath, 'utf8');

    // Extract all port binding lines
    const portLines = composeContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('- "') && l.includes(':'));

    expect(portLines.length).toBeGreaterThan(0);

    for (const line of portLines) {
      // Must be prefixed with 127.0.0.1: to protect local development services
      expect(line).toMatch(/- "127\.0\.0\.1:\d+:\d+"/);
    }
  });

  it('pins docker image tags and prohibits floating latest tags for mailpit and n8n', () => {
    const composePath = path.join(rootDir, 'docker-compose.yml');
    const composeContent = fs.readFileSync(composePath, 'utf8');

    expect(composeContent).not.toContain('axllent/mailpit:latest');
    expect(composeContent).not.toContain('n8nio/n8n:latest');

    expect(composeContent).toMatch(/axllent\/mailpit:v\d+\.\d+/);
    expect(composeContent).toMatch(/n8nio\/n8n:\d+\.\d+/);
  });

  it('centralizes admin public API base URL via environment variable with fallback', () => {
    const adminApiPath = path.join(rootDir, 'apps/admin/src/lib/api.ts');
    expect(fs.existsSync(adminApiPath)).toBe(true);

    const apiContent = fs.readFileSync(adminApiPath, 'utf8');
    expect(apiContent).toContain('VITE_API_BASE_URL');
    expect(apiContent).toContain('export const API_BASE_URL');

    // Verify IntegrationsHealthScreen uses the centralized API_BASE_URL
    const healthScreenPath = path.join(
      rootDir,
      'apps/admin/src/screens/IntegrationsHealthScreen.tsx',
    );
    const healthContent = fs.readFileSync(healthScreenPath, 'utf8');
    expect(healthContent).toContain('API_BASE_URL');
    expect(healthContent).not.toContain("fetch('http://localhost:3001/health')");
  });

  it('strictly fails closed on mock payment mode and mock webhooks in production', () => {
    const servicePath = path.join(rootDir, 'apps/api/src/modules/payments/payments.service.ts');
    expect(fs.existsSync(servicePath)).toBe(true);

    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    // Ensure production guard throws BadRequestException for mock mode
    expect(serviceContent).toContain("isProd && mode === 'mock'");
    expect(serviceContent).toContain(
      'Mock payment gateway is strictly disabled in production environments',
    );

    // Ensure production guard throws BadRequestException for mock webhook notification
    expect(serviceContent).toContain("process.env.NODE_ENV === 'production' && isMock");
    expect(serviceContent).toContain(
      'Mock webhook notifications are strictly disabled in production environments',
    );
  });

  it('uses configurable APP_URL environment variable for payment redirect and trip hub URLs', () => {
    const controllerPath = path.join(
      rootDir,
      'apps/api/src/modules/payments/payments.controller.ts',
    );
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');
    expect(controllerContent).toContain("process.env.APP_URL || 'http://localhost:3000'");
  });
});
