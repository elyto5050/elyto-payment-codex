#!/usr/bin/env node
const base = process.env.BASE_URL || 'http://localhost:3000';
const fetch = global.fetch || require('node-fetch');

(async () => {
  try {
    const res = await fetch(base + '/api/dashboard/stats', {
      method: 'GET',
      headers: { 'x-trace-org': 'trace-org-1' }
    });
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      console.log(JSON.stringify(json.debug ?? { status: res.status, data: json }, null, 2));
    } catch (e) {
      console.log('Non-JSON response:');
      console.log(text.slice(0, 1000));
    }
  } catch (err) {
    console.error('Request failed:', err.message);
    process.exit(2);
  }
})();
