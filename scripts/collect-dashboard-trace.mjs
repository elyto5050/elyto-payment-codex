#!/usr/bin/env node
const base = process.env.BASE_URL || 'http://localhost:3000';
const traceOrg = process.env.TRACE_ORG || 'cmq92zgqm0000slrw2dimgbl8';
const endpoints = [
  { name: 'stats', path: '/api/dashboard/stats' },
  { name: 'projects', path: '/api/dashboard/projects' },
  { name: 'orders', path: '/api/dashboard/orders' },
  { name: 'notifications', path: '/api/dashboard/notifications' }
];

async function fetchOne(endpoint) {
  const url = base + endpoint.path;
  const headers = { 'x-trace-org': traceOrg };
  const start = Date.now();
  const res = await fetch(url, { headers });
  const end = Date.now();
  const duration = end - start;
  const serverTiming = res.headers.get('server-timing');
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }
  return { name: endpoint.name, url, start, end, duration, status: res.status, serverTiming, body };
}

async function main(){
  const resultsSequential = [];
  for (const e of endpoints) {
    const r = await fetchOne(e);
    resultsSequential.push(r);
    console.log(`SEQUENTIAL ${e.name}: ${r.duration}ms, Server-Timing: ${r.serverTiming}`);
  }

  // Parallel
  const promises = endpoints.map((e) => fetchOne(e));
  const resultsParallel = await Promise.all(promises);
  for (const r of resultsParallel) {
    console.log(`PARALLEL ${r.name}: ${r.duration}ms, Server-Timing: ${r.serverTiming}`);
  }

  const out = { base, traceOrg, sequential: resultsSequential, parallel: resultsParallel, timestamp: new Date().toISOString() };
  const fs = await import('fs/promises');
  await fs.writeFile('tmp/dashboard-trace.json', JSON.stringify(out, null, 2));
  console.log('Wrote tmp/dashboard-trace.json');
  console.log(JSON.stringify(out, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
