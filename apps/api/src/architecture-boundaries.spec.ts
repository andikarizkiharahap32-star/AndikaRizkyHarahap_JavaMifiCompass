import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';
import { HealthController } from './modules/health/health.controller';

describe('Architecture & Module Boundary Verification', () => {
  const modulesDir = path.resolve(__dirname, 'modules');

  describe('Core Domain Modules & V1 Trimming', () => {
    it('defines the 8 core domain modules of JavaMifi Compass', () => {
      const coreV1Modules = [
        'auth',
        'catalog',
        'planner',
        'orders',
        'payments',
        'fulfillment',
        'content',
        'automation',
      ];

      for (const mod of coreV1Modules) {
        const modPath = path.join(modulesDir, mod);
        expect(fs.existsSync(modPath)).toBe(true);
        expect(fs.existsSync(path.join(modPath, `${mod}.module.ts`))).toBe(true);
      }
    });

    it('folds RBAC strictly into auth module and eliminates standalone rbac module', () => {
      const standaloneRbac = path.join(modulesDir, 'rbac');
      expect(fs.existsSync(standaloneRbac)).toBe(false);

      const foldedRbacDir = path.join(modulesDir, 'auth', 'rbac');
      expect(fs.existsSync(foldedRbacDir)).toBe(true);
      expect(fs.existsSync(path.join(foldedRbacDir, 'roles.guard.ts'))).toBe(true);
      expect(fs.existsSync(path.join(foldedRbacDir, 'roles.decorator.ts'))).toBe(true);
    });

    it('keeps health as a direct controller in AppModule and eliminates health.module', () => {
      const healthModulePath = path.join(modulesDir, 'health', 'health.module.ts');
      expect(fs.existsSync(healthModulePath)).toBe(false);

      const healthControllerPath = path.join(modulesDir, 'health', 'health.controller.ts');
      expect(fs.existsSync(healthControllerPath)).toBe(true);

      // Verify HealthController is bound directly in AppModule controllers
      const appModuleMetadata = Reflect.getMetadata('controllers', AppModule) || [];
      expect(appModuleMetadata).toContain(HealthController);
    });

    it('keeps audit as an internal shared library/provider and eliminates standalone notifications module', () => {
      const notificationsDir = path.join(modulesDir, 'notifications');
      expect(fs.existsSync(notificationsDir)).toBe(false);

      const auditServicePath = path.join(modulesDir, 'audit', 'audit.service.ts');
      expect(fs.existsSync(auditServicePath)).toBe(true);
    });
  });

  describe('Module Boundary & Interface Encapsulation Rules', () => {
    it('enforces that domain controllers never inject PrismaService directly (services own data access)', () => {
      const domainControllers = [
        'admin/admin.controller.ts',
        'auth/auth.controller.ts',
        'automation/automation.controller.ts',
        'catalog/catalog.controller.ts',
        'content/content.controller.ts',
        'dining/dining.controller.ts',
        'fulfillment/fulfillment.controller.ts',
        'integrations/integrations.controller.ts',
        'orders/orders.controller.ts',
        'payments/payments.controller.ts',
        'planner/planner.controller.ts',
        'support/support.controller.ts',
      ];

      for (const ctrlRelPath of domainControllers) {
        const fullPath = path.join(modulesDir, ctrlRelPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          // Domain controllers must delegate to services and must not inject PrismaService
          const hasPrismaImport = /import\s+{[^}]*PrismaService[^}]*}\s+from/.test(content);
          expect(hasPrismaImport).toBe(false);
          const hasPrismaConstructor = /constructor\([^)]*prisma:\s*PrismaService[^)]*\)/.test(content);
          expect(hasPrismaConstructor).toBe(false);
        }
      }
    });

    it('verifies cross-module imports do not reach into internal adapter implementations', () => {
      const getTsFiles = (dir: string): string[] => {
        let results: string[] = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            results = results.concat(getTsFiles(full));
          } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
            results.push(full);
          }
        }
        return results;
      };

      const allTsFiles = getTsFiles(modulesDir);
      const violations: string[] = [];

      for (const file of allTsFiles) {
        const currentMod = path.relative(modulesDir, file).split(path.sep)[0];
        const content = fs.readFileSync(file, 'utf-8');
        const importLines = content.split('\n').filter((l) => l.trim().startsWith('import '));

        for (const line of importLines) {
          // Check relative imports across modules: e.g. from orders into ../payments/adapters/
          const match = line.match(/from\s+['"](\.\.\/[^'"]+)['"]/);
          if (match && match[1]) {
            const relTarget = match[1];
            // If target reaches into an internal /adapters/ folder of another module
            if (relTarget.includes('/adapters/') && !file.includes(path.sep + 'adapters' + path.sep)) {
              violations.push(`${path.relative(modulesDir, file)} violates boundary by importing internal adapter: ${line}`);
            }
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });
});
