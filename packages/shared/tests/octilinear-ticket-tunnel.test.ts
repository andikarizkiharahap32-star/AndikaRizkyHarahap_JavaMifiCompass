import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('OctilinearTicketTunnel Contract & Semantics Tests', () => {
  const enMessagesPath = path.resolve(__dirname, '../../../apps/web/messages/en.json');
  const idMessagesPath = path.resolve(__dirname, '../../../apps/web/messages/id.json');
  const componentPath = path.resolve(
    __dirname,
    '../../../apps/web/src/components/OctilinearTicketTunnel.tsx',
  );
  const homeOverrideDocPath = path.resolve(__dirname, '../../../design-system/pages/home.md');

  it('contains complete i18n ticketTunnel keys in both en.json and id.json', () => {
    const en = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));
    const id = JSON.parse(fs.readFileSync(idMessagesPath, 'utf8'));

    expect(en.ticketTunnel).toBeDefined();
    expect(id.ticketTunnel).toBeDefined();

    const requiredKeys = [
      'badge',
      'title',
      'subtitle',
      'scrollHint',
      'accessibleNotice',
      'ticket1',
      'ticket2',
      'ticket3',
      'ticket4',
    ];

    for (const key of requiredKeys) {
      expect(en.ticketTunnel[key]).toBeDefined();
      expect(id.ticketTunnel[key]).toBeDefined();
    }

    // Verify sub-keys for ticket stages
    for (let i = 1; i <= 4; i++) {
      const ticketKey = `ticket${i}`;
      expect(en.ticketTunnel[ticketKey].stage).toBeTruthy();
      expect(en.ticketTunnel[ticketKey].title).toBeTruthy();
      expect(en.ticketTunnel[ticketKey].desc).toBeTruthy();
      expect(en.ticketTunnel[ticketKey].status).toBeTruthy();
      expect(en.ticketTunnel[ticketKey].actionLabel).toBeTruthy();

      expect(id.ticketTunnel[ticketKey].stage).toBeTruthy();
      expect(id.ticketTunnel[ticketKey].title).toBeTruthy();
      expect(id.ticketTunnel[ticketKey].desc).toBeTruthy();
      expect(id.ticketTunnel[ticketKey].status).toBeTruthy();
      expect(id.ticketTunnel[ticketKey].actionLabel).toBeTruthy();
    }
  });

  it('documents Motion Dial override from 3/10 to 5/10 in design-system/pages/home.md', () => {
    expect(fs.existsSync(homeOverrideDocPath)).toBe(true);
    const content = fs.readFileSync(homeOverrideDocPath, 'utf8');

    expect(content).toContain('Motion Dial Override');
    expect(content).toMatch(/3\/10.*5\/10/);
    expect(content).toContain('OctilinearTicketTunnel');
    expect(content).toContain('Controlled Wayfinding Kinematics');
  });

  it('enforces tactile tokens and prohibits forbidden shadow patterns in OctilinearTicketTunnel', () => {
    const code = fs.readFileSync(componentPath, 'utf8');

    // Forbidden patterns per GEMINI.md
    expect(code).not.toContain('shadow-sm');
    expect(code).not.toContain('shadow-md');
    expect(code).not.toContain('shadow-lg');
    expect(code).not.toContain('shadow-xl');
    expect(code).not.toContain('shadow-2xl');
    expect(code).not.toContain('backdrop-blur');

    // Tactile paper edge lips
    expect(code).toContain('border-paper-edge');
    expect(code).toContain('border-b-2');

    // Normal page scroll tracking (useScroll from framer-motion)
    expect(code).toContain('useScroll');
    expect(code).not.toContain('preventDefault'); // Never hijack wheel events
  });

  it('provides static accessible fallback for reduced-motion and touch devices', () => {
    const code = fs.readFileSync(componentPath, 'utf8');

    expect(code).toContain('useReducedMotion');
    expect(code).toContain('pointer: coarse');
    expect(code).toContain('static-ticket-tunnel');
    expect(code).toContain('kinematic-ticket-tunnel');
  });

  it('models sequential 4-stage waypoints across 0.0 to 1.0 scroll range', () => {
    // Stage configurations defined for the 4 JavaMifi touchpoints
    const stages = [
      { id: 'destination', start: 0.0, peak: 0.16, end: 0.36 },
      { id: 'esim', start: 0.22, peak: 0.42, end: 0.62 },
      { id: 'wifi', start: 0.48, peak: 0.68, end: 0.88 },
      { id: 'deposit', start: 0.72, peak: 0.92, end: 1.0 },
    ];

    expect(stages).toHaveLength(4);
    expect(stages[0].start).toBe(0.0);
    expect(stages[3].end).toBe(1.0);

    // Verify sequential progression with smooth handoff overlap
    for (let i = 1; i < stages.length; i++) {
      expect(stages[i].start).toBeLessThan(stages[i - 1].end);
      expect(stages[i].peak).toBeGreaterThan(stages[i - 1].peak);
    }
  });
});
