import { memo } from 'react';
import { type Order } from '../types/allocation';

interface Props {
  orders: Order[];
  onRunAllocation: () => void;
  isAllocating: boolean;
}

export default memo(function SummaryBar({ orders, onRunAllocation, isAllocating }: Props) {
  const full    = orders.filter(o => o.status === 'FULL').length;
  const partial = orders.filter(o => o.status === 'PARTIAL').length;
  const none    = orders.filter(o => o.status === 'NONE').length;
  const totalValue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalAllocated = orders.reduce((sum, o) => sum + o.allocatedQty, 0);

  return (
    <div className="flex flex-wrap items-center gap-3 px-6 py-3 bg-white border-b border-gray-200">
      <StatCard label="Total Orders" value={orders.length.toLocaleString()} color="text-gray-800" />
      <div className="w-px h-8 bg-gray-200" />
      <StatCard label="Full"    value={full.toLocaleString()}    color="text-emerald-600" dot="bg-emerald-500" />
      <StatCard label="Partial" value={partial.toLocaleString()} color="text-amber-600"   dot="bg-amber-500" />
      <StatCard label="None"    value={none.toLocaleString()}    color="text-red-500"     dot="bg-red-400" />
      <div className="w-px h-8 bg-gray-200" />
      <StatCard label="Total Allocated" value={`${totalAllocated.toLocaleString()} kg`} color="text-blue-600" />
      <StatCard label="Total Value"     value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="text-indigo-600" />
      <div className="ml-auto">
        <button
          onClick={onRunAllocation}
          disabled={isAllocating}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isAllocating ? 'Allocating…' : 'Run Auto Allocation'}
        </button>
      </div>
    </div>
  );
});

function StatCard({ label, value, color, dot }: { label: string; value: string; color: string; dot?: string }) {
  return (
    <div className="flex items-center gap-2">
      {dot && <span className={`w-2 h-2 rounded-full ${dot}`} />}
      <div>
        <div className="text-xs text-gray-500 leading-none">{label}</div>
        <div className={`text-sm font-bold leading-tight ${color}`}>{value}</div>
      </div>
    </div>
  );
}
