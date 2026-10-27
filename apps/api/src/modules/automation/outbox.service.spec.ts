import { OutboxService } from './outbox.service';

describe('Outbox Service: Retry After Failure & Dead-Letter Escalation Proof', () => {
  let outboxService: OutboxService;
  let mockPrisma: any;
  let eventStore: Map<string, any>;
  let automationRuns: any[];

  beforeEach(() => {
    eventStore = new Map();
    automationRuns = [];

    mockPrisma = {
      outboxEvent: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(eventStore.get(where.id) || null);
        }),
        create: jest.fn().mockImplementation(({ data }) => {
          const id = data.id || 'evt-' + Math.random().toString(36).substring(2, 9);
          const record = {
            id,
            ...data,
            retryCount: 0,
            maxRetries: 5,
            createdAt: new Date(),
          };
          eventStore.set(id, record);
          return Promise.resolve(record);
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const existing = eventStore.get(where.id);
          const updated = { ...existing, ...data };
          eventStore.set(where.id, updated);
          return Promise.resolve(updated);
        }),
        findMany: jest.fn().mockImplementation(({ where }) => {
          const items = Array.from(eventStore.values()).filter((e) => {
            if (where.status?.in && !where.status.in.includes(e.status)) return false;
            return true;
          });
          return Promise.resolve(items);
        }),
      },
      automationRun: {
        create: jest.fn().mockImplementation(({ data }) => {
          automationRuns.push(data);
          return Promise.resolve({ id: 'run-' + Date.now(), ...data });
        }),
      },
    };

    outboxService = new OutboxService(mockPrisma);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('marks event as FAILED, increments retryCount, and sets exponential backoff when webhook fails', async () => {
    // Mock global fetch to simulate n8n server error
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    } as any);

    const event = await mockPrisma.outboxEvent.create({
      data: {
        eventType: 'order.paid',
        aggregateId: 'ord-101',
        payload: { orderNumber: 'JMF-RETRY-01', totalIdr: 100000 },
        status: 'PENDING',
      },
    });

    const success = await outboxService.deliverEvent(event.id);

    expect(success).toBe(false);
    const updated = eventStore.get(event.id);
    expect(updated.status).toBe('FAILED');
    expect(updated.retryCount).toBe(1);
    expect(updated.lastError).toContain('503');
    expect(updated.nextRetryAt).toBeDefined();
    // Verify exponential backoff: nextRetryAt should be ~2 seconds in future for attempt 1
    const diffMs = updated.nextRetryAt.getTime() - Date.now();
    expect(diffMs).toBeGreaterThan(1000);
    expect(diffMs).toBeLessThanOrEqual(3000);

    // Verify failed run recorded in CMS audit log
    expect(automationRuns.length).toBe(1);
    expect(automationRuns[0].status).toBe('FAILED');
  });

  it('escalates to DEAD_LETTER when maximum retry attempts (5) are exhausted', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network connection timeout'));

    const event = await mockPrisma.outboxEvent.create({
      data: {
        eventType: 'order.paid',
        aggregateId: 'ord-102',
        payload: { orderNumber: 'JMF-DEAD-LETTER-01' },
        status: 'FAILED',
      },
    });
    // Set existing retry count to 4 (so next failure hits 5 == maxRetries)
    eventStore.get(event.id).retryCount = 4;

    const success = await outboxService.deliverEvent(event.id);

    expect(success).toBe(false);
    const updated = eventStore.get(event.id);
    expect(updated.status).toBe('DEAD_LETTER');
    expect(updated.retryCount).toBe(5);
    expect(updated.lastError).toContain('Network connection timeout');
  });

  it('recovers from failure and marks event as DELIVERED upon successful retry', async () => {
    // 1. Initial attempt fails
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Connection reset'));

    const event = await mockPrisma.outboxEvent.create({
      data: {
        eventType: 'order.paid',
        aggregateId: 'ord-103',
        payload: { orderNumber: 'JMF-RECOVER-01' },
        status: 'PENDING',
      },
    });

    const failResult = await outboxService.deliverEvent(event.id);
    expect(failResult).toBe(false);
    expect(eventStore.get(event.id).status).toBe('FAILED');

    // 2. Retry succeeds (n8n is back online)
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ acknowledged: true }),
    } as any);

    const recoverResult = await outboxService.deliverEvent(event.id);
    expect(recoverResult).toBe(true);

    const recovered = eventStore.get(event.id);
    expect(recovered.status).toBe('DELIVERED');
    expect(recovered.lastError).toBeNull();
    expect(recovered.deliveredAt).toBeDefined();

    // Verify success run recorded in CMS
    const successRun = automationRuns.find((r) => r.status === 'SUCCESS');
    expect(successRun).toBeDefined();
    expect(successRun.workflowName).toBe('order.paid');
  });
});
