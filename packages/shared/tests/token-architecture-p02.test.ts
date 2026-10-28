import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  transitLineTokens,
  surfaceTokens,
  inkTokens,
  borderTokens,
} from '../../ui/src/tokens/semantics';
import {
  motionTokens,
  zIndexTokens,
  elevationTokens,
  spacingTokens,
  radiiTokens,
} from '../../ui/src/tokens/spacing';

describe('Token Architecture and Semantic Aliases (P02)', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  it('centralizes border roles with tactile paper edge and outline variants', () => {
    expect(borderTokens.default).toBe('#CDD4D0');
    expect(borderTokens.paperEdge).toBe('#CDD4D0');
    expect(borderTokens.outline).toBe('#6B7570');
    expect(borderTokens.outlineVariant).toBe('#C6C5D1');
    expect(borderTokens.divider).toBe('#E1E6E3');
    expect(borderTokens.focus).toBe('#18215A');
  });

  it('enforces mechanical and transit motion tokens (150ms-200ms)', () => {
    expect(motionTokens.durationMechanical).toBe('150ms');
    expect(motionTokens.durationTransit).toBe('200ms');
    expect(motionTokens.easeTransit).toBe('cubic-bezier(0, 0, 0.2, 1)');
  });

  it('enforces structured z-index layering tokens', () => {
    expect(zIndexTokens.surface).toBe(0);
    expect(zIndexTokens.elevated).toBe(10);
    expect(zIndexTokens.sticky).toBe(20);
    expect(zIndexTokens.drawer).toBe(30);
    expect(zIndexTokens.modal).toBe(40);
    expect(zIndexTokens.toast).toBe(50);
  });

  it('defines elevation tokens without drop shadows', () => {
    expect(elevationTokens.flat).toContain('border border-paper-edge');
    expect(elevationTokens.card).toContain('border-b-2');
    expect(elevationTokens.raised).toContain('border-b-4');
    expect(elevationTokens.sunken).toContain('bg-sunken');

    // Never use drop shadow classes in elevation definitions
    expect(elevationTokens.flat).not.toContain('shadow');
    expect(elevationTokens.card).not.toContain('shadow');
    expect(elevationTokens.raised).not.toContain('shadow');
    expect(elevationTokens.sunken).not.toContain('shadow');
  });

  it('verifies CSS custom properties and elevation classes in tokens.css', () => {
    const cssPath = path.join(rootDir, 'packages/ui/src/styles/tokens.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Motion variables
    expect(cssContent).toContain('--duration-mechanical: 150ms;');
    expect(cssContent).toContain('--duration-transit: 200ms;');
    expect(cssContent).toContain('--ease-transit: cubic-bezier(0, 0, 0.2, 1);');

    // Z-Index variables
    expect(cssContent).toContain('--z-surface: 0;');
    expect(cssContent).toContain('--z-elevated: 10;');
    expect(cssContent).toContain('--z-sticky: 20;');
    expect(cssContent).toContain('--z-drawer: 30;');
    expect(cssContent).toContain('--z-modal: 40;');
    expect(cssContent).toContain('--z-toast: 50;');

    // Focus ring variables
    expect(cssContent).toContain('--focus-ring-color: #18215A;');
    expect(cssContent).toContain('--focus-ring-offset: 2px;');
    expect(cssContent).toContain('--focus-ring-width: 2px;');

    // Elevation classes without drop shadows
    expect(cssContent).toContain('.elevation-flat');
    expect(cssContent).toContain('.elevation-card');
    expect(cssContent).toContain('.elevation-raised');
    expect(cssContent).toContain('.elevation-sunken');
    expect(cssContent).not.toContain('box-shadow: 0');
  });

  it('enforces preset configuration suppressing shadow-* and providing motion & z-index utilities', () => {
    const preset = require('../../ui/src/preset.js');

    // Shadow suppression
    expect(preset.theme.boxShadow).toEqual({ none: 'none' });

    // Motion durations
    expect(preset.theme.extend.transitionDuration.mechanical).toBe('150ms');
    expect(preset.theme.extend.transitionDuration.transit).toBe('200ms');
    expect(preset.theme.extend.transitionTimingFunction.transit).toBe('cubic-bezier(0, 0, 0.2, 1)');

    // Z-Index
    expect(preset.theme.extend.zIndex.surface).toBe('0');
    expect(preset.theme.extend.zIndex.elevated).toBe('10');
    expect(preset.theme.extend.zIndex.sticky).toBe('20');
    expect(preset.theme.extend.zIndex.drawer).toBe('30');
    expect(preset.theme.extend.zIndex.modal).toBe('40');
    expect(preset.theme.extend.zIndex.toast).toBe('50');

    // Border widths for tactile elevation
    expect(preset.theme.extend.borderWidth['2']).toBe('2px');
    expect(preset.theme.extend.borderWidth['4']).toBe('4px');
  });
});
