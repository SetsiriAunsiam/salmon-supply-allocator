import { memo, useRef, useCallback, useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { type Order, type OrderStatus, type OrderType } from '../types/allocation';

interface Props {
  orders: Order[];
  onEditOrder: (order: Order) => void;
}

// ─── Sorting ──────────────────────────────────────────────────────────────────

type SortKey =
  | 'id' | 'customerId' | 'itemId' | 'warehouseId' | 'supplierId'
  | 'type' | 'createDate' | 'requestQty' | 'allocatedQty'
  | 'unitPrice' | 'totalPrice' | 'status';

type SortDir = 'asc' | 'desc';

interface SortConfig { key: SortKey | null; direction: SortDir }

const TYPE_RANK: Record<OrderType, number>   = { EMERGENCY: 0, OVERDUE: 1, DAILY: 2 };
const STATUS_RANK: Record<OrderStatus, number> = { NONE: 0, PARTIAL: 1, FULL: 2 };

function compareOrders(a: Order, b: Order, key: SortKey): number {
  switch (key) {
    case 'type':      return TYPE_RANK[a.type]   - TYPE_RANK[b.type];
    case 'status':    return STATUS_RANK[a.status] - STATUS_RANK[b.status];
    case 'createDate': return new Date(a.createDate).getTime() - new Date(b.createDate).getTime();
    case 'requestQty': case 'allocatedQty': case 'unitPrice': case 'totalPrice':
      return (a[key] as number) - (b[key] as number);
    default:
      return String(a[key]).localeCompare(String(b[key]));
  }
}

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: {
  key: string;
  label: string;
  width: number;
  sortKey?: SortKey;
  align?: 'right';
}[] = [
  { key: 'index',     label: '#',          width: 45 },
  { key: 'id',        label: 'Order ID',   width: 110, sortKey: 'id' },
  { key: 'subOrder',  label: 'Sub-Order',  width: 110 },
  { key: 'customer',  label: 'Customer',   width: 105, sortKey: 'customerId' },
  { key: 'item',      label: 'Item',       width: 80,  sortKey: 'itemId' },
  { key: 'warehouse', label: 'Warehouse',  width: 115, sortKey: 'warehouseId' },
  { key: 'supplier',  label: 'Supplier',   width: 95,  sortKey: 'supplierId' },
  { key: 'type',      label: 'Type',       width: 105, sortKey: 'type' },
  { key: 'date',      label: 'Date',       width: 95,  sortKey: 'createDate' },
  { key: 'requested', label: 'Requested',  width: 115, sortKey: 'requestQty',  align: 'right' },
  { key: 'allocated', label: 'Allocated',  width: 115, sortKey: 'allocatedQty', align: 'right' },
  { key: 'price',     label: 'Unit Price', width: 110,  sortKey: 'unitPrice',   align: 'right' },
  { key: 'total',     label: 'Total',      width: 100, sortKey: 'totalPrice',  align: 'right' },
  { key: 'status',    label: 'Status',     width: 90,  sortKey: 'status' },
  { key: 'remark',    label: 'Remark',     width: 150 },
  { key: 'actions',   label: '',           width: 55 },
];

const TOTAL_WIDTH = COLUMNS.reduce((s, c) => s + c.width, 0);
const ROW_HEIGHT  = 45;

// ─── Styles ───────────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<OrderType, string> = {
  EMERGENCY: 'bg-red-100 text-red-700 border border-red-300',
  OVERDUE:   'bg-orange-100 text-orange-700 border border-orange-300',
  DAILY:     'bg-blue-100 text-blue-700 border border-blue-300',
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  FULL:    'bg-emerald-100 text-emerald-700 border border-emerald-300',
  PARTIAL: 'bg-amber-100 text-amber-700 border border-amber-300',
  NONE:    'bg-gray-100 text-gray-500 border border-gray-300',
};

// ─── SortIcon ─────────────────────────────────────────────────────────────────

function SortIcon({ active, direction }: { active: boolean; direction: SortDir }) {
  return (
    <span className={`ml-1 inline-flex flex-col leading-0 ${active ? 'text-blue-500' : 'text-gray-300'}`}>
      <svg
        className={`w-2.5 h-2.5 transition-opacity ${active && direction === 'asc' ? 'opacity-100' : 'opacity-40'}`}
        viewBox="0 0 10 6" fill="currentColor"
      >
        <path d="M5 0L10 6H0L5 0Z" />
      </svg>
      <svg
        className={`w-2.5 h-2.5 transition-opacity ${active && direction === 'desc' ? 'opacity-100' : 'opacity-40'}`}
        viewBox="0 0 10 6" fill="currentColor"
      >
        <path d="M5 6L0 0H10L5 6Z" />
      </svg>
    </span>
  );
}

// ─── Header cell ──────────────────────────────────────────────────────────────

function HeaderCell({
  col,
  sortConfig,
  onSort,
}: {
  col: typeof COLUMNS[number];
  sortConfig: SortConfig;
  onSort: (key: SortKey) => void;
}) {
  const isActive = col.sortKey != null && sortConfig.key === col.sortKey;
  const sortable = col.sortKey != null;

  return (
    <div
      style={{ width: col.width, minWidth: col.width }}
      onClick={sortable ? () => onSort(col.sortKey!) : undefined}
      className={`
        px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide select-none truncate
        flex items-center
        ${col.align === 'right' ? 'justify-end pr-4' : ''}
        ${sortable ? 'cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors' : ''}
        ${isActive ? 'text-blue-600 bg-blue-50' : ''}
      `}
    >
      <span className="truncate">{col.label}</span>
      {sortable && (
        <SortIcon
          active={isActive}
          direction={isActive ? sortConfig.direction : 'asc'}
        />
      )}
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

const OrderRow = memo(function OrderRow({
  index,
  order,
  start,
  onEdit,
}: {
  index: number;
  order: Order;
  start: number;
  onEdit: (o: Order) => void;
}) {
  const isEven = index % 2 === 0;
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: ROW_HEIGHT,
        transform: `translateY(${start}px)`,
      }}
      className={`flex items-center border-b border-gray-100 hover:bg-blue-50 transition-colors ${isEven ? 'bg-white' : 'bg-gray-50/50'}`}
    >
      <Cell col="index"     align="left">{(index + 1).toLocaleString()}</Cell>
      <Cell col="id"        align="left"   className="font-mono text-xs font-medium text-gray-800">{order.id}</Cell>
      <Cell col="subOrder"  align="left"   className="font-mono text-xs text-gray-500">{order.subOrderId}</Cell>
      <Cell col="customer"  align="left"   className="text-xs text-gray-700">{order.customerId}</Cell>
      <Cell col="item"      align="left"   className="text-xs text-gray-700">{order.itemId}</Cell>
      <Cell col="warehouse" align="left"   className="text-xs text-gray-600">
        {order.warehouseId === 'WH-000'
          ? <span className="italic text-gray-400">Any</span>
          : order.allocatedWarehouseId || order.warehouseId}
      </Cell>
      <Cell col="supplier"  align="left"   className="text-xs text-gray-600">
        {order.supplierId === 'SP-000'
          ? <span className="italic text-gray-400">Any</span>
          : order.allocatedSupplierId || order.supplierId}
      </Cell>
      <Cell col="type"      align="left">
        <Badge text={order.type} style={TYPE_STYLE[order.type]} />
      </Cell>
      <Cell col="date"      align="left"   className="text-xs text-gray-500">
        {new Date(order.createDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
      </Cell>
      <Cell col="requested" align="right"  className="text-xs font-medium text-gray-700">{order.requestQty.toLocaleString()}</Cell>
      <Cell col="allocated" align="right"  className={`text-xs font-semibold ${order.allocatedQty > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
        {order.allocatedQty.toLocaleString()}
      </Cell>
      <Cell col="price"     align="right"  className="text-xs text-gray-600">
        {order.unitPrice > 0 ? `$${order.unitPrice.toFixed(2)}` : '—'}
      </Cell>
      <Cell col="total"     align="right"  className="text-xs font-medium text-gray-700">
        {order.totalPrice > 0
          ? `$${order.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : '—'}
      </Cell>
      <Cell col="status"    align="left">
        <Badge text={order.status} style={STATUS_STYLE[order.status]} />
      </Cell>
      <Cell col="remark"    align="left"   className="text-xs text-gray-500 italic">
        {order.remark || '—'}
      </Cell>
      <Cell col="actions"   align="left">
        <button
          onClick={() => onEdit(order)}
          title="Manual allocate"
          className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </Cell>
    </div>
  );
});

// ─── Table ────────────────────────────────────────────────────────────────────

export default function OrderTable({ orders, onEditOrder }: Props) {
  'use no memo';

  const parentRef = useRef<HTMLDivElement>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  const handleSort = useCallback((key: SortKey) => {
    setSortConfig(prev => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: 'asc' };  // third click clears sort
    });
  }, []);

  const sortedOrders = useMemo(() => {
    if (!sortConfig.key) return orders;
    const key = sortConfig.key;
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    return [...orders].sort((a, b) => compareOrders(a, b, key) * dir);
  }, [orders, sortConfig]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: sortedOrders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const handleEdit = useCallback((o: Order) => onEditOrder(o), [onEditOrder]);

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="shrink-0 border-b border-gray-200 bg-gray-50 overflow-hidden">
        <div style={{ minWidth: TOTAL_WIDTH }} className="flex">
          {COLUMNS.map(col => (
            <HeaderCell key={col.key} col={col} sortConfig={sortConfig} onSort={handleSort} />
          ))}
        </div>
      </div>

      {/* Scroll container */}
      <div ref={parentRef} className="flex-1 overflow-auto min-h-0">
        <div style={{ height: rowVirtualizer.getTotalSize(), minWidth: TOTAL_WIDTH, position: 'relative' }}>
          {virtualItems.map(virtualRow => (
            <OrderRow
              key={sortedOrders[virtualRow.index].id}
              index={virtualRow.index}
              order={sortedOrders[virtualRow.index]}
              start={virtualRow.start}
              onEdit={handleEdit}
            />
          ))}
        </div>
      </div>

      {sortedOrders.length === 0 && (
        <div className="flex items-center justify-center flex-1 text-sm text-gray-400">
          No orders match the current filters.
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COL_MAP = Object.fromEntries(COLUMNS.map(c => [c.key, c.width]));

function Cell({
  col,
  align,
  className = '',
  children,
}: {
  col: string;
  align: 'left' | 'right';
  className?: string;
  children: React.ReactNode;
}) {
  const width = COL_MAP[col];
  return (
    <div
      style={{ width, minWidth: width }}
      className={`px-3 truncate flex items-center ${align === 'right' ? 'justify-end pr-4' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

function Badge({ text, style }: { text: string; style: string }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${style}`}>
      {text}
    </span>
  );
}
