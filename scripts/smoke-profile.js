#!/usr/bin/env node
// Simple smoke profiling script: measures TTFB and total time for key endpoints
const base = process.env.BASE_URL || 'http://localhost:3000';
const endpoints = ['/', '/about', '/pricing', '/login', '/onboarding', '/api/auth/providers', '/api/dashboard/billing', '/api/dashboard/gmail'];

function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function waitForServer(timeout = 30000){
  const start = Date.now();
  while (Date.now() - start < timeout){
    try{
      const res = await fetch(base + '/', { method: 'GET' });
      if (res) return true;
    }catch(e){}
    await sleep(500);
  }
  return false;
}

function now(){ return Date.now(); }

async function measure(path){
  const url = base + path;
  const start = now();
  try{
    const res = await fetch(url, { method: 'GET' });
    const ttfb = now() - start;
    let size = 0;
    try{ const ab = await res.arrayBuffer(); size = ab.byteLength; }catch(e){}
    const total = now() - start;
    console.log(`${path} ${res.status} ttfb=${ttfb}ms total=${total}ms size=${size}`);
  }catch(err){
    console.log(`${path} ERROR ${err.message}`);
  }
}

(async ()=>{
  console.log('Smoke profile base URL:', base);
  const ok = await waitForServer(30000);
  if (!ok){ console.error('Server did not respond in 30s'); process.exit(2); }
  console.log('Server responsive — running measurements');
  for (const p of endpoints){
    await measure(p);
    await sleep(100); // slight gap
  }
  console.log('Smoke profiling complete');
})();
