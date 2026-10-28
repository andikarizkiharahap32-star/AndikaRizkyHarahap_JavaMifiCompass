async function probeVoiceN8n() {
  console.log("Sending query to n8n Voice-to-Output Halal Scout Webhook...");
  try {
    const res = await fetch('http://localhost:5678/webhook/voice-halal-scout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Rekomendasi ramen halal rating tertinggi di Shinjuku Tokyo',
        locale: 'id'
      })
    });

    console.log(`HTTP Status: ${res.status}`);
    const text = await res.text();
    console.log("Response Body:");
    try {
      console.log(JSON.stringify(JSON.parse(text), null, 2));
    } catch {
      console.log(text);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

setTimeout(probeVoiceN8n, 6000);
