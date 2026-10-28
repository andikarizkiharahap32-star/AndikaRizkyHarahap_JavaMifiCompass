import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Voice Assistant n8n Guarded Workflows (Audit §6 Implementation)', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const transcribeWfPath = path.join(
    rootDir,
    'automation/n8n/voice-assistant/voice-transcribe-confirm.json'
  );
  const processorWfPath = path.join(
    rootDir,
    'automation/n8n/voice-assistant/voice-query-processor.json'
  );

  it('verifies voice-transcribe-confirm.json exists, parses cleanly, and enforces push-to-talk confirmation', () => {
    expect(fs.existsSync(transcribeWfPath)).toBe(true);

    const raw = fs.readFileSync(transcribeWfPath, 'utf8');
    const wf = JSON.parse(raw);

    expect(wf.name).toBe('Voice Assistant - 1. Transcribe & Confirm');
    expect(wf.nodes.length).toBe(9);

    // Validate Audio Input node enforces push-to-talk sanity checks
    const validateNode = wf.nodes.find((n: any) => n.name === 'Validate Audio Input');
    expect(validateNode).toBeDefined();
    expect(validateNode.parameters.jsCode).toContain('MAX_DURATION_SECONDS = 30');
    expect(validateNode.parameters.jsCode).toContain('missing sessionId');

    // Format Transcript Response node requires user confirmation before downstream query execution
    const formatNode = wf.nodes.find((n: any) => n.name === 'Format Transcript Response');
    expect(formatNode).toBeDefined();
    expect(formatNode.parameters.jsCode).toContain('requiresConfirmation: true');
  });

  it('verifies voice-query-processor.json contains rate limiting, language lock, and intent-only LLM', () => {
    expect(fs.existsSync(processorWfPath)).toBe(true);

    const raw = fs.readFileSync(processorWfPath, 'utf8');
    const wf = JSON.parse(raw);

    expect(wf.name).toBe('Voice Assistant - 2. Process Confirmed Query');
    expect(wf.nodes.length).toBe(33);

    // Rate limiting per session
    const rateLimitNode = wf.nodes.find((n: any) => n.name === 'Rate Limit Check');
    expect(rateLimitNode).toBeDefined();
    expect(rateLimitNode.parameters.jsCode).toContain('MAX_REQUESTS = 20');
    expect(rateLimitNode.parameters.jsCode).toContain('WINDOW_MS = 10 * 60 * 1000');

    // Session language lock
    const langNode = wf.nodes.find((n: any) => n.name === 'Resolve Session Language');
    expect(langNode).toBeDefined();
    expect(langNode.parameters.jsCode).toContain('languageBySession');

    // LLM intent extraction strictly forbids halal determinations
    const llmNode = wf.nodes.find((n: any) => n.name === 'LLM Intent Extraction');
    expect(llmNode).toBeDefined();
    const systemPrompt = llmNode.parameters.jsonBody;
    expect(systemPrompt).toContain('You must NEVER assess, state, or imply a halal determination');
  });

  it('verifies two trust levels, Overpass circuit breaker, OSM age-gating, hedge responses, and audit logging', () => {
    const raw = fs.readFileSync(processorWfPath, 'utf8');
    const wf = JSON.parse(raw);

    // Two trust levels split in Switch node
    const switchNode = wf.nodes.find((n: any) => n.name === 'Switch - Route By Intent');
    expect(switchNode).toBeDefined();

    // Overpass circuit breaker with timeout and error fallback
    const overpassNode = wf.nodes.find((n: any) => n.name === 'Query Overpass OSM');
    expect(overpassNode).toBeDefined();
    expect(overpassNode.onError).toBe('continueErrorOutput');
    expect(overpassNode.parameters.options.timeout).toBe(4000);

    // Age-gating on OSM tags (180 days limit)
    const ageGateNode = wf.nodes.find((n: any) => n.name === 'Age-Gate OSM Tags');
    expect(ageGateNode).toBeDefined();
    expect(ageGateNode.parameters.jsCode).toContain('const STALE_DAYS = 180');

    // Mandatory hedge response for OSM-sourced places
    const hedgeNode = wf.nodes.find((n: any) => n.name === 'Build OSM Hedge Response');
    expect(hedgeNode).toBeDefined();
    expect(hedgeNode.parameters.jsCode).toContain('dari data komunitas OpenStreetMap');
    expect(hedgeNode.parameters.jsCode).toContain('belum kami verifikasi - konfirmasi ke staf');

    // Mandatory audit logging node
    const auditNode = wf.nodes.find((n: any) => n.name === 'Log OSM Recommendation');
    expect(auditNode).toBeDefined();
    expect(auditNode.parameters.url).toContain('/api/audit/osm-recommendation');
  });
});
