import sqlite3
import os
import json
import uuid

db_path = os.path.expanduser('~/.n8n/database.sqlite')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

def sync_workflow(wf_id, wf_path, wf_name, webhook_path, webhook_node):
    if not os.path.exists(wf_path):
        print(f"File not found: {wf_path}")
        return

    with open(wf_path, 'r', encoding='utf-8') as f:
        wf_data = json.load(f)

    cur.execute("SELECT versionId FROM workflow_entity WHERE id = ?", (wf_id,))
    row = cur.fetchone()
    wf_ver = row[0] if (row and row[0]) else str(uuid.uuid4())

    nodes_json = json.dumps(wf_data.get('nodes', []))
    conns_json = json.dumps(wf_data.get('connections', {}))
    settings_json = json.dumps(wf_data.get('settings', {}))

    cur.execute("""
        UPDATE workflow_entity 
        SET active = 1, 
            nodes = ?, 
            connections = ?, 
            settings = ?,
            versionId = ?, 
            activeVersionId = ?, 
            triggerCount = 1 
        WHERE id = ?
    """, (nodes_json, conns_json, settings_json, wf_ver, wf_ver, wf_id))

    cur.execute("DELETE FROM workflow_history WHERE workflowId = ?", (wf_id,))
    cur.execute("""
        INSERT INTO workflow_history (versionId, workflowId, authors, nodes, connections, name, autosaved, nodeGroups)
        VALUES (?, ?, 'JavaMifi System', ?, ?, ?, 0, '[]')
    """, (wf_ver, wf_id, nodes_json, conns_json, wf_name))

    cur.execute("DELETE FROM workflow_published_version WHERE workflowId = ?", (wf_id,))
    cur.execute("INSERT INTO workflow_published_version (workflowId, publishedVersionId) VALUES (?, ?)", (wf_id, wf_ver))

    if webhook_path and webhook_node:
        cur.execute("DELETE FROM webhook_entity WHERE workflowId = ?", (wf_id,))
        cur.execute("""
            INSERT INTO webhook_entity (workflowId, webhookPath, method, node, webhookId, pathLength)
            VALUES (?, ?, 'POST', ?, NULL, NULL)
        """, (wf_id, webhook_path, webhook_node))

    cur.execute("DELETE FROM shared_workflow WHERE workflowId = ?", (wf_id,))
    cur.execute("INSERT INTO shared_workflow (workflowId, projectId, role, createdAt, updatedAt) VALUES (?, 'JlBEXd1LvnCfPYBB', 'workflow:owner', datetime('now'), datetime('now'))", (wf_id,))

    print(f"Workflow '{wf_name}' ({wf_id}) published & activated with webhook '/webhook/{webhook_path}' (ver {wf_ver}).")

# 1. Sync & Publish Workflow 11 (Voice Halal Scout)
sync_workflow(
    'v7nK4m2x8Zb51QpW',
    r'c:\JavaMifiProject\automation\n8n\11-voice-halal-osm-google-scraper.json',
    '11 - Voice-to-Output Halal & Star Rating Scraper',
    'voice-halal-scout',
    'Webhook: Voice or Text Ingest'
)

# 2. Sync & Publish Workflow 12 (Mock Payment Gateway Relay)
sync_workflow(
    'p8nM0ckP4ym3ntR3l4y',
    r'c:\JavaMifiProject\automation\n8n\12-mock-payment-gateway-relay.json',
    '12 - Mock Payment Gateway Relay & Verification',
    'mock-payment-gateway',
    'Webhook: MockGateway Inbound'
)

# 3. Sync & Publish Voice Assistant 1: Transcribe & Confirm
sync_workflow(
    'cbOkWBDNXlDpIYFZ',
    r'c:\JavaMifiProject\automation\n8n\voice-assistant\voice-transcribe-confirm.json',
    'Voice Assistant - 1. Transcribe & Confirm',
    'voice/transcribe',
    'Receive Audio Upload'
)

# 4. Sync & Publish Voice Assistant 2: Process Confirmed Query (with NVIDIA Minimax)
sync_workflow(
    'NvJA4Oo04m6jXh8s',
    r'c:\JavaMifiProject\automation\n8n\voice-assistant\voice-query-processor.json',
    'Voice Assistant - 2. Process Confirmed Query',
    'voice/query',
    'Receive Confirmed Query'
)

conn.commit()
conn.close()
print("All workflows successfully synchronized to n8n database.")
