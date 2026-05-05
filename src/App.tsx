import { useMemo, useState, useEffect, useCallback, useDeferredValue } from 'react';
import { generateMockOrders, generateMockStocks, generateMockCustomers } from './services/mockGenerator';
import { autoAllocate } from './utils/allocationLogic';
import { bankersRound } from './utils/math';
import { getUnitPrice } from './data/pricing';
import { type Order, type Stock, type Customer, type FilterState } from './types/allocation';
import SummaryBar from './components/SummaryBar';
import StockPanel from './components/StockPanel';
import FilterBar from './components/FilterBar';
import OrderTable from './components/OrderTable';
import ManualAllocateModal from './components/ManualAllocateModal';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import { useToast } from './hooks/useToast';

const DEFAULT_FILTERS: FilterState = {
  search: '',
  status: 'ALL STATUS',
  type: 'ALL TYPES',
  customerId: '',
  warehouseId: '',
  supplierId: '',
  itemId: '',
};

function App() {
  const [orders,    setOrders]    = useState<Order[]>([]);
  const [stocks,    setStocks]    = useState<Stock[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filters,   setFilters]   = useState<FilterState>(DEFAULT_FILTERS);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const { toasts, show: showToast, dismiss: dismissToast } = useToast();
  const [isAllocating, setIsAllocating] = useState(false);

  const seed = useMemo(() => ({
    orders:    generateMockOrders(5000),
    stocks:    generateMockStocks(),
    customers: generateMockCustomers(),
  }), []);

  const runAllocation = useCallback((seedOrders: Order[], seedStocks: Stock[], seedCustomers: Customer[]) => {
    setIsAllocating(true);
    setTimeout(() => {
      const result = autoAllocate(seedOrders, seedStocks, seedCustomers);
      setOrders(result.orders);
      setStocks(result.stocks);
      setCustomers(result.customers);
      setIsAllocating(false);
    }, 0);
  }, []);

  // Auto-run on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runAllocation(seed.orders, seed.stocks, seed.customers);
  }, [runAllocation, seed]);

  const handleRunAllocation = useCallback(() => {
    if (!window.confirm('Re-running auto allocation will reset all manual changes. Continue?')) return;
    const freshOrders    = seed.orders;
    const freshStocks    = seed.stocks.map(s => ({ ...s, quantity: s.originalQuantity }));
    const freshCustomers = seed.customers.map(c => ({ ...c, usedCredit: 0 }));
    runAllocation(freshOrders, freshStocks, freshCustomers);
  }, [seed, runAllocation]);

  const handleManualAllocate = useCallback((order: Order, newQty: number) => {
    if (newQty === order.allocatedQty) return;
    const afterReturn = stocks.map(s => {
      if (
        s.warehouseId === order.allocatedWarehouseId &&
        s.supplierId  === order.allocatedSupplierId  &&
        s.itemId      === order.itemId
      ) {
        return { ...s, quantity: bankersRound(s.quantity + order.allocatedQty) };
      }
      return s;
    });

    let newAllocatedWarehouseId = order.allocatedWarehouseId;
    let newAllocatedSupplierId  = order.allocatedSupplierId;
    let newStocks = afterReturn;

    if (newQty > 0) {
      const best = afterReturn
        .filter(s => {
          const matchItem = s.itemId === order.itemId;
          const matchWH   = order.warehouseId === 'WH-000' || s.warehouseId === order.warehouseId;
          const matchSP   = order.supplierId  === 'SP-000'  || s.supplierId  === order.supplierId;
          return matchItem && matchWH && matchSP && s.quantity >= newQty;
        })
        .sort((a, b) => b.quantity - a.quantity)[0];

      if (best) {
        newAllocatedWarehouseId = best.warehouseId;
        newAllocatedSupplierId  = best.supplierId;
        newStocks = afterReturn.map(s =>
          s.warehouseId === best.warehouseId && s.supplierId === best.supplierId && s.itemId === best.itemId
            ? { ...s, quantity: bankersRound(s.quantity - newQty) }
            : s
        );
      }
    }

    const unitPrice  = getUnitPrice(newAllocatedSupplierId, order.type);
    const totalPrice = bankersRound(newQty * unitPrice);
    const status: Order['status'] = newQty >= order.requestQty ? 'FULL' : newQty > 0 ? 'PARTIAL' : 'NONE';

    setStocks(newStocks);
    setCustomers(prev => prev.map(c =>
      c.id === order.customerId
        ? { ...c, usedCredit: bankersRound(c.usedCredit - order.allocatedQty + newQty) }
        : c
    ));
    setOrders(prev => prev.map(o =>
      o.id === order.id
        ? { ...o, allocatedQty: newQty, allocatedWarehouseId: newAllocatedWarehouseId, allocatedSupplierId: newAllocatedSupplierId, unitPrice, totalPrice, status }
        : o
    ));

    const delta = newQty - order.allocatedQty;
    if (newQty === 0) {
      showToast({
        type: 'warning',
        title: 'Allocation Cleared',
        message: `${order.id} — all ${order.allocatedQty} kg released back to stock`,
      });
    } else {
      const sign = delta > 0 ? '+' : '';
      showToast({
        type: status === 'FULL' ? 'success' : 'info',
        title: status === 'FULL' ? 'Fully Allocated' : 'Partially Allocated',
        message: `${order.id} · ${newQty} kg (${sign}${delta}) · $${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      });
    }
  }, [stocks, showToast]);

  const deferredFilters = useDeferredValue(filters);

  const filteredOrders = useMemo(() => {
    const q = deferredFilters.search.toLowerCase().trim();
    return orders.filter(o => {
      if (q && !o.id.toLowerCase().includes(q) && !o.customerId.toLowerCase().includes(q) && !o.subOrderId.toLowerCase().includes(q)) return false;
      if (deferredFilters.status !== 'ALL STATUS' && o.status !== deferredFilters.status) return false;
      if (deferredFilters.type   !== 'ALL TYPES' && o.type   !== deferredFilters.type)   return false;
      if (deferredFilters.customerId  && o.customerId  !== deferredFilters.customerId)  return false;
      if (deferredFilters.warehouseId && o.warehouseId !== deferredFilters.warehouseId) return false;
      if (deferredFilters.supplierId  && o.supplierId  !== deferredFilters.supplierId)  return false;
      if (deferredFilters.itemId      && o.itemId      !== deferredFilters.itemId)      return false;
      return true;
    });
  }, [orders, deferredFilters]);

  const liveEditingOrder = editingOrder
    ? orders.find(o => o.id === editingOrder.id) ?? null
    : null;

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-3 bg-blue-700 text-white shadow-md shrink-0">
        <h1 className="text-lg font-bold tracking-tight">Salmon Supply Allocator</h1>
      </header>

      {/* Summary bar */}
      <SummaryBar orders={orders} onRunAllocation={handleRunAllocation} isAllocating={isAllocating} />

      {/* Stock panel */}
      <StockPanel stocks={stocks} />

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        orders={orders}
        filteredCount={filteredOrders.length}
      />

      {/* Order table — wrapped with Error Boundary */}
      <ErrorBoundary
        fallback={(error, reset) => (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-sm text-gray-500 bg-gray-50">
            <span className="text-red-500 font-medium">Table failed to render</span>
            <span className="font-mono text-xs text-red-400">{error.message}</span>
            <button onClick={reset} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700">
              Retry
            </button>
          </div>
        )}
      >
        <div className="flex-1 min-h-0 overflow-hidden">
          {isAllocating ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              Running allocation…
            </div>
          ) : (
            <OrderTable orders={filteredOrders} onEditOrder={setEditingOrder} />
          )}
        </div>
      </ErrorBoundary>

      {/* Manual allocation modal */}
      <ManualAllocateModal
        order={liveEditingOrder}
        stocks={stocks}
        customers={customers}
        onConfirm={handleManualAllocate}
        onClose={() => setEditingOrder(null)}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
