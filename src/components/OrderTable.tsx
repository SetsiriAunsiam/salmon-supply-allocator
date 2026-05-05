import { memo, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { type Order, type OrderStatus, type OrderType } from '../types/allocation';

interface Props {
  orders: Order[];
  onEditOrder: (order: Order) => void;
}

const COL_WIDTHS = {
  INDEX: 45,
  ORDER_ID: 110,
  SUB_ORDER: 110,
  CUSTOMER: 100,
  ITEM: 80,
  WAREHOUSE: 100,
  SUPPLIER: 90,
  TYPE: 105,
  DATE: 95,
  REQUESTED: 100,
  ALLOCATED: 100,
  PRICE: 90,
  TOTAL: 100,
  STATUS: 90,
  REMARK: 150,
  ACTIONS: 55,
};
const TOTAL_WIDTH = Object.values(COL_WIDTHS).reduce((a, b) => a + b, 0);
const ROW_HEIGHT = 45;
const COLUMN_WIDTHS = Object.values(COL_WIDTHS);

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

const HEADERS = [
  '#', 'Order ID', 'Sub-Order', 'Customer', 'Item', 'Warehouse', 'Supplier',
  'Type', 'Date', 'Requested', 'Allocated', 'Unit Price', 'Total', 'Status', '',
];

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
      <Cell width={COL_WIDTHS.INDEX}  className="text-gray-400 text-xs">{(index + 1).toLocaleString()}</Cell>
      <Cell width={COL_WIDTHS.ORDER_ID}  className="font-mono text-xs font-medium text-gray-800">{order.id}</Cell>
      <Cell width={COL_WIDTHS.SUB_ORDER}  className="font-mono text-xs text-gray-500">{order.subOrderId}</Cell>
      <Cell width={COL_WIDTHS.CUSTOMER}  className="text-xs text-gray-700">{order.customerId}</Cell>
      <Cell width={COL_WIDTHS.ITEM}  className="text-xs text-gray-700">{order.itemId}</Cell>
      <Cell width={COL_WIDTHS.WAREHOUSE}  className="text-xs text-gray-600">
        {order.warehouseId === 'WH-000'
          ? <span className="italic text-gray-400">Any</span>
          : order.allocatedWarehouseId || order.warehouseId}
      </Cell>
      <Cell width={COL_WIDTHS.SUPPLIER}  className="text-xs text-gray-600">
        {order.supplierId === 'SP-000'
          ? <span className="italic text-gray-400">Any</span>
          : order.allocatedSupplierId || order.supplierId}
      </Cell>
      <Cell width={COL_WIDTHS.TYPE}>
        <Badge text={order.type} style={TYPE_STYLE[order.type]} />
      </Cell>
      <Cell width={COL_WIDTHS.DATE}  className="text-xs text-gray-500">
        {new Date(order.createDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
      </Cell>
      <Cell width={COL_WIDTHS.REQUESTED}  className="text-xs font-medium text-gray-700 text-right pr-4">{order.requestQty.toLocaleString()}</Cell>
      <Cell width={COL_WIDTHS.ALLOCATED} className={`text-xs font-semibold text-right pr-4 ${order.allocatedQty > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
        {order.allocatedQty.toLocaleString()}
      </Cell>
      <Cell width={COL_WIDTHS.PRICE} className="text-xs text-gray-600 text-right pr-4">
        {order.unitPrice > 0 ? `$${order.unitPrice.toFixed(2)}` : '—'}
      </Cell>
      <Cell width={COL_WIDTHS.TOTAL} className="text-xs font-medium text-gray-700 text-right pr-4">
        {order.totalPrice > 0
          ? `$${order.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : '—'}
      </Cell>
      <Cell width={COL_WIDTHS.STATUS}>
        <Badge text={order.status} style={STATUS_STYLE[order.status]} />
      </Cell>
      <Cell width={COL_WIDTHS.REMARK} className="text-xs text-gray-500 italic">
        {order.remark || '—'}
      </Cell>
      <Cell width={COL_WIDTHS.ACTIONS}>
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

export default function OrderTable({ orders, onEditOrder }: Props) {
  'use no memo';

  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: orders.length,
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
          {HEADERS.map((h, i) => (
            <div
              key={i}
              style={{ width: COLUMN_WIDTHS[i], minWidth: COLUMN_WIDTHS[i] }}
              className="px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide select-none truncate"
            >
              {h}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll container */}
      <div ref={parentRef} className="flex-1 overflow-auto min-h-0">
        <div
          style={{
            height: rowVirtualizer.getTotalSize(),
            minWidth: TOTAL_WIDTH,
            position: 'relative',
          }}
        >
          {virtualItems.map(virtualRow => (
            <OrderRow
              key={orders[virtualRow.index].id}
              index={virtualRow.index}
              order={orders[virtualRow.index]}
              start={virtualRow.start}
              onEdit={handleEdit}
            />
          ))}
        </div>
      </div>

      {orders.length === 0 && (
        <div className="flex items-center justify-center flex-1 text-sm text-gray-400">
          No orders match the current filters.
        </div>
      )}
    </div>
  );
}

function Cell({ width, className = '', children }: { width: number; className?: string; children: React.ReactNode }) {
  return (
    <div style={{ width, minWidth: width }} className={`px-3 truncate flex items-center ${className}`}>
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
