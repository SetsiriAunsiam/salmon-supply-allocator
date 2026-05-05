import { useState, useEffect } from 'react';
import { type Order, type Stock, type Customer } from '../types/allocation';
import { getMaxAllocatable } from '../utils/allocationLogic';
import { bankersRound } from '../utils/math';
import { getUnitPrice } from '../data/pricing';

interface Props {
  order: Order | null;
  stocks: Stock[];
  customers: Customer[];
  onConfirm: (order: Order, newQty: number) => void;
  onClose: () => void;
}

export default function ManualAllocateModal({ order, stocks, customers, onConfirm, onClose }: Props) {
  const [qty, setQty] = useState('');
  const [error, setError] = useState('');

  const max = order ? getMaxAllocatable(order, stocks, customers) : 0;
  const customer = order ? customers.find(c => c.id === order.customerId) : undefined;
  const creditAvailable = customer
    ? bankersRound(customer.creditLimit - customer.usedCredit + (order?.allocatedQty ?? 0))
    : 0;

  useEffect(() => {
    if (order) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQty(String(order.allocatedQty));
      setError('');
    }
  }, [order]);

  if (!order) return null;

  const numQty = parseFloat(qty) || 0;
  const previewPrice = getUnitPrice(
    order.allocatedSupplierId || order.supplierId,
    order.type
  );
  const previewTotal = bankersRound(numQty * previewPrice);

  const validate = (v: string) => {
    const n = parseFloat(v);
    if (isNaN(n) || n < 0) return 'Must be a non-negative number.';
    if (n > order.requestQty) return `Cannot exceed requested qty (${order.requestQty}).`;
    if (n > max) return `Exceeds available allocation (max ${max}).`;
    return '';
  };

  const handleChange = (v: string) => {
    setQty(v);
    setError(validate(v));
  };

  const handleConfirm = () => {
    const err = validate(qty);
    if (err) { setError(err); return; }
    onConfirm(order, bankersRound(numQty));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Manual Allocation</h2>
            <p className="text-xs text-gray-500 mt-0.5">{order.id} · {order.subOrderId}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Order details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Customer"  value={order.customerId} />
            <Detail label="Item"      value={order.itemId} />
            <Detail label="Warehouse" value={order.warehouseId === 'WH-000' ? 'Any (WH-000)' : order.allocatedWarehouseId || order.warehouseId} />
            <Detail label="Supplier"  value={order.supplierId === 'SP-000'  ? 'Any (SP-000)'  : order.allocatedSupplierId  || order.supplierId} />
            <Detail label="Type"      value={order.type} />
            <Detail label="Requested" value={`${order.requestQty} kg`} />
          </div>

          {/* Constraints */}
          <div className="bg-blue-50 rounded-xl px-4 py-3 space-y-1.5">
            <ConstraintRow
              label="Available stock"
              value={`${max} kg`}
              sub="(after releasing current allocation)"
            />
            <ConstraintRow
              label="Customer credit available"
              value={`${creditAvailable} kg`}
              sub={customer ? `limit ${customer.creditLimit.toLocaleString()} kg` : ''}
            />
            <ConstraintRow
              label="Max allocatable"
              value={`${max} kg`}
              highlight
            />
          </div>

          {/* Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              New Allocation (kg)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                max={max}
                step={0.01}
                value={qty}
                onChange={e => handleChange(e.target.value)}
                className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  error ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-400'
                }`}
              />
              <button
                onClick={() => handleChange(String(max))}
                className="px-3 py-2 text-xs font-semibold text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
              >
                Max
              </button>
              <button
                onClick={() => handleChange('0')}
                className="px-3 py-2 text-xs font-semibold text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
          </div>

          {/* Price preview */}
          {numQty > 0 && (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 text-sm">
              <span className="text-gray-600">Price preview</span>
              <span className="font-semibold text-gray-900">
                {numQty} kg × ${previewPrice.toFixed(2)} = <span className="text-blue-700">${previewTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!!error}
            className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Allocation
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm font-medium text-gray-800">{value}</div>
    </div>
  );
}

function ConstraintRow({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className={`text-xs ${highlight ? 'font-bold text-blue-800' : 'text-blue-700'}`}>{label}</span>
        {sub && <span className="ml-1 text-xs text-blue-500">({sub})</span>}
      </div>
      <span className={`text-xs font-bold ${highlight ? 'text-blue-800' : 'text-blue-700'}`}>{value}</span>
    </div>
  );
}
