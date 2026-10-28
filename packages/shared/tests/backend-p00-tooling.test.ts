import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Backend and Workflows - P00: Monorepo and Tooling Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  it('verifies .nvmrc pins Node 22 LTS as required by P00 Instruction 1', () => {
    const nvmrcPath = path.join(rootDir, '.nvmrc');
    expect(fs.existsSync(nvmrcPath)).toBe(true);
    const content = fs.readFileSync(nvmrcPath, 'utf8').trim();
    expect(content).toMatch(/22/);
  });

  it('verifies root package.json pins packageManager to pnpm', () => {
    const pkgPath = path.join(rootDir, 'package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    expect(pkg.packageManager).toBeDefined();
    expect(pkg.packageManager).toMatch(/^pnpm@/);
  });

  it('verifies pnpm-workspace.yaml configures apps and packages workspaces', () => {
    const workspacePath = path.join(rootDir, 'pnpm-workspace.yaml');
    expect(fs.existsSync(workspacePath)).toBe(true);
    const content = fs.readFileSync(workspacePath, 'utf8');
    expect(content).toContain('apps/*');
    expect(content).toContain('packages/*');
  });

  it('verifies turbo.json configures build, lint, and typecheck tasks', () => {
    const turboPath = path.join(rootDir, 'turbo.json');
    expect(fs.existsSync(turboPath)).toBe(true);
    const turbo = JSON.parse(fs.readFileSync(turboPath, 'utf8'));
    expect(turbo.tasks.build).toBeDefined();
    expect(turbo.tasks.build.dependsOn).toContain('^build');
    expect(turbo.tasks.lint).toBeDefined();
    expect(turbo.tasks.typecheck).toBeDefined();
  });

  it('verifies tsconfig.base.json enables strict, noUncheckedIndexedAccess, and exactOptionalPropertyTypes', () => {
    const tsconfigBasePath = path.join(rootDir, 'tsconfig.base.json');
    expect(fs.existsSync(tsconfigBasePath)).toBe(true);
    const tsconfigBase = JSON.parse(fs.readFileSync(tsconfigBasePath, 'utf8'));
    expect(tsconfigBase.compilerOptions.strict).toBe(true);
    expect(tsconfigBase.compilerOptions.noUncheckedIndexedAccess).toBe(true);
    expect(tsconfigBase.compilerOptions.exactOptionalPropertyTypes).toBe(true);
  });

  it('verifies Husky pre-commit hook runs lint-staged', () => {
    const hookPath = path.join(rootDir, '.husky/pre-commit');
    expect(fs.existsSync(hookPath)).toBe(true);
    const content = fs.readFileSync(hookPath, 'utf8');
    expect(content).toContain('lint-staged');
  });

  it('verifies package.json configures lint-staged and license:report', () => {
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    expect(pkg['lint-staged']).toBeDefined();
    expect(pkg['lint-staged']['*.{ts,tsx}']).toBeDefined();
    expect(pkg.scripts['license:report']).toBeDefined();
    expect(pkg.scripts['license:report']).toContain('pnpm licenses list');
  });

  it('verifies prohibition: no relative imports across packages in apps/ (must use package specifiers)', () => {
    const appsDir = path.join(rootDir, 'apps');
    const relativeImportRegex = /from\s+['"]\.\.\/\.\.\/packages/g;

    function walkDir(dir: string, results: string[] = []) {
      const list = fs.readdirSync(dir);
      for (const item of list) {
        if (item === 'node_modules' || item === '.next' || item === 'dist' || item === '.turbo') {
          continue;
        }
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walkDir(fullPath, results);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (relativeImportRegex.test(content)) {
            results.push(fullPath);
          }
        }
      }
      return results;
    }

    const violations = walkDir(appsDir);
    expect(violations).toEqual([]);
  });
});
