#!/usr/bin/env node
// Runs three autocannon profiles: low, medium, high against /api/dashboard/stats
import autocannon from 'autocannon';
import fs from 'fs';
const base = process.env.BASE_URL || 'http://localhost:3000';
const url = base + '/api/dashboard/stats';

// Optional: provide a single header via env TRACE_HEADER like "x-trace-org: trace-org-1"
const headerStr = process.env.TRACE_HEADER || '';
const suffix = process.env.SUFFIX || '';
const headers = {};
if (headerStr) {
  const parts = headerStr.split(":");
  if (parts.length >= 2) {
    const k = parts.shift().trim();
    const v = parts.join(":").trim();
    if (k && v) headers[k] = v;
  }
}

const configs = [
  { name: 'low', connections: 10, duration: 10, pipelining: 1 },
  { name: 'medium', connections: 50, duration: 15, pipelining: 1 },
  { name: 'high', connections: 200, duration: 20, pipelining: 1 }
];

async function run(cfg){
  return new Promise((resolve, reject) => {
    const opts = { url, connections: cfg.connections, duration: cfg.duration, pipelining: cfg.pipelining };
    if (Object.keys(headers).length) opts.headers = headers;
    const inst = autocannon(opts, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
    autocannon.track(inst, { renderProgressBar: false });
  });
}

(async ()=>{
  const results = {};
  for (const c of configs){
    console.log('Running', c.name, '...');
    try{
      const res = await run(c);
      results[c.name] = res;
      fs.writeFileSync(`./tmp-load-${c.name}${suffix}.json`, JSON.stringify(res, null, 2));
      console.log('Completed', c.name);
    }catch(e){
      console.error('Error running', c.name, e.message);
      results[c.name] = { error: e.message };
    }
    await new Promise(r=>setTimeout(r, 1000));
  }
  console.log('All done');
  fs.writeFileSync(`./tmp-load-summary${suffix}.json`, JSON.stringify(results, null, 2));
})();
