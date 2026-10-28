import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('P17 — Motion System and Microinteractions', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const tokensCssPath = path.join(rootDir, 'packages/ui/src/styles/tokens.css');
  const spacingTsPath = path.join(rootDir, 'packages/ui/src/tokens/spacing.ts');
  const globalsCssPath = path.join(rootDir, 'apps/web/src/app/globals.css');
  const heroPath = path.join(rootDir, 'apps/web/src/components/DepartureBoardHero.tsx');

  const tokensCssSource = fs.readFileSync(tokensCssPath, 'utf8');
  const spacingTsSource = fs.readFileSync(spacingTsPath, 'utf8');
  const globalsCssSource = fs.readFileSync(globalsCssPath, 'utf8');
  const heroSource = fs.readFileSync(heroPath, 'utf8');

  describe('WS01, WS02, WS03: Motion Tokens, Duration Tiers, and Easing Roles', () => {
    it('defines standard duration tiers (instant, micro, mechanical, transit, deliberate) in TypeScript tokens', () => {
      expect(spacingTsSource).toContain("durationInstant: '0ms'");
      expect(spacingTsSource).toContain("durationMicro: '100ms'");
      expect(spacingTsSource).toContain("durationMechanical: '150ms'");
      expect(spacingTsSource).toContain("durationTransit: '200ms'");
      expect(spacingTsSource).toContain("durationDeliberate: '300ms'");
    });

    it('defines standard transit, mechanical, and exit easing curves in TypeScript tokens', () => {
      expect(spacingTsSource).toContain("easeTransit: 'cubic-bezier(0, 0, 0.2, 1)'");
      expect(spacingTsSource).toContain("easeMechanical: 'cubic-bezier(0.4, 0, 0.2, 1)'");
      expect(spacingTsSource).toContain("easeExit: 'cubic-bezier(0.4, 0, 1, 1)'");
    });

    it('exports matching CSS custom properties in tokens.css for universal styling', () => {
      expect(tokensCssSource).toContain('--duration-instant: 0ms;');
      expect(tokensCssSource).toContain('--duration-micro: 100ms;');
      expect(tokensCssSource).toContain('--duration-mechanical: 150ms;');
      expect(tokensCssSource).toContain('--duration-transit: 200ms;');
      expect(tokensCssSource).toContain('--duration-deliberate: 300ms;');
      expect(tokensCssSource).toContain('--ease-transit: cubic-bezier(0, 0, 0.2, 1);');
      expect(tokensCssSource).toContain('--ease-mechanical: cubic-bezier(0.4, 0, 0.2, 1);');
      expect(tokensCssSource).toContain('--ease-exit: cubic-bezier(0.4, 0, 1, 1);');
    });
  });

  describe('WS05, WS06, WS16: Hover Lift, Press Compression, and GPU Transforms', () => {
    it('implements GPU-accelerated kinematic utilities in globals.css with will-change and transform', () => {
      expect(globalsCssSource).toContain('.motion-gpu');
      expect(globalsCssSource).toContain('transform: translateZ(0);');
      expect(globalsCssSource).toContain('.motion-lift-transit');
      expect(globalsCssSource).toContain('will-change: transform;');
      expect(globalsCssSource).toContain('transform: translateY(-4px);');
      expect(globalsCssSource).toContain('transform: translateY(1px);');
    });

    it('applies micro-mechanical 150ms transitions, hover lift, and active press compression to DepartureBoardHero controls', () => {
      // 150ms mechanical timing and 4px lift (-translate-y-1 is 4px)
      expect(heroSource).toContain('duration-150');
      expect(heroSource).toContain('motion-safe:hover:-translate-y-1');
      // Active press compression
      expect(heroSource).toContain('motion-safe:active:translate-y-0.5');
      // 200ms transit indicator plate
      expect(heroSource).toContain('duration-200');
    });

    it('WS15 & WS17: Employs GPU transforms (translate/scale) to prevent layout recalculations and 0 CLS without memory thrashing', () => {
      // Avoids heavy memory thrashing (as enforced by performance-cost-governance)
      expect(heroSource).not.toContain('will-change-transform');
      expect(heroSource).not.toContain('translate3d');
      // Zero scroll hijack
      expect(heroSource).not.toContain('preventDefault');
      expect(heroSource).not.toContain('wheel');
    });
  });

  describe('WS13, WS31, WS35: Reduced-Motion Behavior & Accessibility', () => {
    it('neutralizes all animations and transitions when prefers-reduced-motion is requested', () => {
      expect(globalsCssSource).toContain('@media (prefers-reduced-motion: reduce)');
      expect(globalsCssSource).toContain('animation-duration: 0.01ms !important');
      expect(globalsCssSource).toContain('transition-duration: 0.01ms !important');
      expect(globalsCssSource).toContain('scroll-behavior: auto !important');
    });

    it('provides explicit motion-reduce fallbacks on animated hero components', () => {
      expect(heroSource).toContain('motion-reduce:transform-none');
    });

    it('GEMINI.md & WS31: Enforces minimum 48px interactive touch targets across all hero buttons and links', () => {
      expect(heroSource).toContain('min-h-12');
      // No forbidden patterns in hero component
      expect(heroSource).not.toMatch(/shadow-/);
      expect(heroSource).not.toMatch(/backdrop-blur/);
      expect(heroSource).not.toMatch(/bg-gradient/);
    });
  });
});
