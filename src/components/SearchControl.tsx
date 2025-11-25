'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Spinner } from './Loading';
import type { Map as LeafletMap } from 'leaflet';

type Result = {
  display_name: string;
  lat: number;
  lon: number;
  boundingbox?: [string, string, string, string] | number[];
};

export default function SearchControl({ map, className = '', placeholder = 'Search places or address…' }: { map: LeafletMap | null; className?: string; placeholder?: string; }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<number | null>(null);

  const wrapperClass = useMemo(
    () => `pointer-events-auto bg-white/90 backdrop-blur rounded-lg shadow relative h-10 flex items-center px-2 w-full max-w-[520px] z-[1001] ${className}`,
    [className]
  );

  useEffect(() => {
    return () => { if (debounce.current) window.clearTimeout(debounce.current); };
  }, []);

  const search = (value: string) => {
    const term = value.trim();
    if (!term || term.length < 2) { setResults([]); return; }
    setLoading(true);
    fetch(`/api/geocode?q=${encodeURIComponent(term)}&limit=6`, { cache: 'no-store' })
      .then(async (r) => ({ ok: r.ok, data: await r.json() }))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data?.error || 'Search failed');
        setResults((data.results || []) as Result[]);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  };

  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value;
    setQ(value);
    if (debounce.current) window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => search(value), 300);
    setOpen(true);
  };

  const onClear = () => {
    setQ('');
    setResults([]);
    setOpen(false);
    if (debounce.current) {
      window.clearTimeout(debounce.current);
      debounce.current = null;
    }
  };

  const onPick = (r: Result) => {
    setOpen(false);
    setQ(r.display_name);
    if (!map) return;
    const lat = r.lat;
    const lon = r.lon;
    // Prefer fitBounds if bounding box available
    if (r.boundingbox && r.boundingbox.length === 4) {
      const [south, north, west, east] = (r.boundingbox as [string | number, string | number, string | number, string | number]).map((v) => parseFloat(String(v)));
      import('leaflet').then(({ latLngBounds }) => {
        const b = latLngBounds([south, west], [north, east]);
        map.fitBounds(b, { padding: [40, 40] });
      }).catch(() => map.setView([lat, lon], 14));
    } else {
      map.setView([lat, lon], 14);
    }
  };

  return (
    <div className={wrapperClass}>
      <div className="relative flex-1">
        <input
          type="text"
          value={q}
          onChange={onChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full pr-9 pl-3 h-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
        />
        {q && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={onClear}
            className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        )}
      </div>
      {open && (results.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-full mt-2 max-h-72 overflow-auto rounded-md border border-gray-200 bg-white shadow z-[1001]">
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
              <Spinner size="sm" />
              <span>Searching…</span>
            </div>
          )}
          {!loading && results.map((r, i) => (
            <button
              key={`${r.display_name}-${i}`}
              onClick={() => onPick(r)}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
