"use client";

import { useEffect, useState } from "react";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import apiFetch from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import TutorialCard from "@/components/tutorials/tutorial-card";

export default function TutorialsSearch({ initialQuery = "", initialData = [] }: { initialQuery?: string; initialData?: any[] }) {
  const [q, setQ] = useState(initialQuery);
  const debounced = useDebouncedValue(q, 350);
  const [results, setResults] = useState<any[]>(initialData || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      try {
        const url = debounced ? `/api/tutorials?search=${encodeURIComponent(debounced)}` : `/api/tutorials`;
        const res = await apiFetch(url) as any;
        const payload = res?.data ?? res;
        if (!mounted) return;
        // normalize: payload might be array or envelope
        const items = Array.isArray(payload) ? payload : payload?.data ?? payload;
        setResults(items ?? []);
      } catch (err) {
        // ignore and keep previous results
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [debounced]);

  return (
    <div>
      <Input placeholder="Search tutorials" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-zinc-400">Searching...</div>
        ) : results.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((t: any) => (
              <TutorialCard key={t.id} tutorial={t} />
            ))}
          </div>
        ) : (
          <div className="text-sm text-zinc-400">No tutorials found.</div>
        )}
      </div>
    </div>
  );
}
