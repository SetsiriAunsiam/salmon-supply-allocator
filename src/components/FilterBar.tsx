import { memo, useState, useEffect, useRef } from 'react';
import { type FilterState, type Order, type OrderStatus, type OrderType } from '../types/allocation';

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  orders: Order[];
  filteredCount: number;
}

const ALL_STATUSES: (OrderStatus | 'ALL STATUS')[] = ['ALL STATUS', 'FULL', 'PARTIAL', 'NONE'];
const ALL_TYPES: (OrderType | 'ALL TYPES')[] = ['ALL TYPES', 'EMERGENCY', 'OVERDUE', 'DAILY'];

export default memo(function FilterBar({ filters, onChange, orders, filteredCount }: Props) {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { setLocalSearch(filters.search); }, [filters.search]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange({ ...filters, search: value }), 200);
  };

  const set = <K extends keyof FilterState>(key: K, val: FilterState[K]) =>
    onChange({ ...filters, [key]: val });

  const uniqueItems      = [...new Set(orders.map(o => o.itemId))].sort();
  const uniqueWarehouses = [...new Set(orders.map(o => o.warehouseId))].sort();
  const uniqueSuppliers  = [...new Set(orders.map(o => o.supplierId))].sort();
  const uniqueCustomers  = [...new Set(orders.map(o => o.customerId))].sort();

  const isDirty = filters.search || filters.status !== 'ALL STATUS' || filters.type !== 'ALL TYPES'
    || filters.customerId || filters.warehouseId || filters.supplierId || filters.itemId;

  const clearAll = () => {
    clearTimeout(debounceRef.current);
    setLocalSearch('');
    onChange({ search: '', status: 'ALL STATUS', type: 'ALL TYPES', customerId: '', warehouseId: '', supplierId: '', itemId: '' });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-6 py-2 bg-white border-b border-gray-200">
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-2.5 top-2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search order / customer…"
          value={localSearch}
          onChange={e => handleSearchChange(e.target.value)}
          className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-52"
        />
      </div>

      <Select label="Status"    value={filters.status}      onChange={v => set('status', v as FilterState['status'])}>
        {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
      </Select>

      <Select label="Type"      value={filters.type}        onChange={v => set('type', v as FilterState['type'])}>
        {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </Select>

      <Select label="Item"      value={filters.itemId}      onChange={v => set('itemId', v)}>
        <option value="">ALL ITEMS</option>
        {uniqueItems.map(i => <option key={i} value={i}>{i}</option>)}
      </Select>

      <Select label="Warehouse" value={filters.warehouseId} onChange={v => set('warehouseId', v)}>
        <option value="">ALL WAREHOUSES</option>
        {uniqueWarehouses.map(w => <option key={w} value={w}>{w}</option>)}
      </Select>

      <Select label="Supplier"  value={filters.supplierId}  onChange={v => set('supplierId', v)}>
        <option value="">ALL SUPPLIERS</option>
        {uniqueSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
      </Select>

      <Select label="Customer"  value={filters.customerId}  onChange={v => set('customerId', v)}>
        <option value="">ALL CUSTOMERS</option>
        {uniqueCustomers.map(c => <option key={c} value={c}>{c}</option>)}
      </Select>

      {isDirty && (
        <button
          onClick={clearAll}
          className="px-2 py-1 text-xs text-gray-500 hover:text-red-500 border border-gray-300 rounded-lg transition-colors"
        >
          Clear
        </button>
      )}

      <span className="ml-auto text-xs text-gray-500">
        Showing <span className="font-semibold text-gray-700">{filteredCount.toLocaleString()}</span> of {orders.length.toLocaleString()} orders
      </span>
    </div>
  );
});

const Select = memo(function Select({ label, value, onChange, children }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
    >
      {children}
    </select>
  );
});
