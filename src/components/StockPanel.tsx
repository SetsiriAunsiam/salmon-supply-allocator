import { memo, useMemo } from 'react';
import { type Stock } from '../types/allocation';

interface Props {
  stocks: Stock[];
}

export default memo(function StockPanel({ stocks }: Props) {
  const byItem = useMemo(() => {
    const map = new Map<string, { remaining: number; original: number }>();
    for (const s of stocks) {
      const prev = map.get(s.itemId) ?? { remaining: 0, original: 0 };
      map.set(s.itemId, {
        remaining: prev.remaining + s.quantity,
        original:  prev.original  + s.originalQuantity,
      });
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [stocks]);

  const byWarehouse = useMemo(() => {
    const map = new Map<string, { remaining: number; original: number }>();
    for (const s of stocks) {
      const prev = map.get(s.warehouseId) ?? { remaining: 0, original: 0 };
      map.set(s.warehouseId, {
        remaining: prev.remaining + s.quantity,
        original:  prev.original  + s.originalQuantity,
      });
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [stocks]);

  return (
    <div className="flex flex-wrap gap-6 px-6 py-3 bg-gray-50 border-b border-gray-200">
      <Section title="Stock by Item">
        {byItem.map(([id, { remaining, original }]) => (
          <StockBar key={id} label={id} remaining={remaining} original={original} />
        ))}
      </Section>
      <Section title="Stock by Warehouse">
        {byWarehouse.map(([id, { remaining, original }]) => (
          <StockBar key={id} label={id} remaining={remaining} original={original} />
        ))}
      </Section>
      <Section title="Detail (WH × Supplier × Item)">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          {stocks.map(s => (
            <div key={`${s.warehouseId}-${s.supplierId}-${s.itemId}`} className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 w-36 truncate">{s.warehouseId} / {s.supplierId} / {s.itemId}</span>
              <span className="font-medium text-gray-800">{s.quantity.toLocaleString()}</span>
              <span className="text-gray-400">/ {s.originalQuantity.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 min-w-48">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function StockBar({ label, remaining, original }: { label: string; remaining: number; original: number }) {
  const pct = original > 0 ? Math.round((remaining / original) * 100) : 0;
  const barColor = pct > 50 ? 'bg-emerald-400' : pct > 20 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{remaining.toLocaleString()} / {original.toLocaleString()} ({pct}%)</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
