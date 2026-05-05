import { describe, it, expect } from 'vitest';
import { autoAllocate, getMaxAllocatable } from './allocationLogic';
import { type Order, type Stock, type Customer } from '../types/allocation';

const makeOrder = (
  o: Pick<Order, 'id' | 'type' | 'createDate' | 'requestQty' | 'itemId' | 'warehouseId' | 'supplierId' | 'customerId'>
): Order => ({
  subOrderId: `${o.id}-001`,
  allocatedQty: 0,
  allocatedWarehouseId: '',
  allocatedSupplierId: '',
  unitPrice: 0,
  totalPrice: 0,
  status: 'NONE',
  ...o,
});

const BASE_STOCK: Stock[] = [
  { warehouseId: 'WH-001', supplierId: 'SP-001', itemId: 'Item-1', quantity: 10, originalQuantity: 10 },
];

const noCustomers: Customer[] = [];

// ─── Priority ─────────────────────────────────────────────────────────────────

describe('Priority sorting', () => {
  it('EMERGENCY beats DAILY for the same stock', () => {
    const orders = [
      makeOrder({ id: 'O-DAILY',     type: 'DAILY',     createDate: '2025-01-01', requestQty: 10, itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C1' }),
      makeOrder({ id: 'O-EMERGENCY', type: 'EMERGENCY', createDate: '2025-01-02', requestQty: 10, itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C2' }),
    ];
    const { orders: result } = autoAllocate(orders, BASE_STOCK, noCustomers);
    expect(result.find(o => o.id === 'O-EMERGENCY')?.status).toBe('FULL');
    expect(result.find(o => o.id === 'O-DAILY')?.status).toBe('NONE');
  });

  it('EMERGENCY > OVERDUE > DAILY when all three compete', () => {
    const stocks: Stock[] = [
      { warehouseId: 'WH-001', supplierId: 'SP-001', itemId: 'Item-1', quantity: 15, originalQuantity: 15 },
    ];
    const orders = [
      makeOrder({ id: 'O-DAILY',     type: 'DAILY',     createDate: '2025-01-01', requestQty: 10, itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C1' }),
      makeOrder({ id: 'O-OVERDUE',   type: 'OVERDUE',   createDate: '2025-01-01', requestQty: 10, itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C2' }),
      makeOrder({ id: 'O-EMERGENCY', type: 'EMERGENCY', createDate: '2025-01-01', requestQty: 10, itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C3' }),
    ];
    const { orders: result } = autoAllocate(orders, stocks, noCustomers);
    expect(result.find(o => o.id === 'O-EMERGENCY')?.status).toBe('FULL');   // gets 10
    expect(result.find(o => o.id === 'O-OVERDUE')?.status).toBe('PARTIAL');  // gets 5 (5 left)
    expect(result.find(o => o.id === 'O-DAILY')?.status).toBe('NONE');       // 0 left
  });

  it('FIFO: earlier createDate wins within the same priority tier', () => {
    const orders = [
      makeOrder({ id: 'O-NEWER', type: 'EMERGENCY', createDate: '2025-06-01', requestQty: 10, itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C1' }),
      makeOrder({ id: 'O-OLDER', type: 'EMERGENCY', createDate: '2025-01-01', requestQty: 10, itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C2' }),
    ];
    const { orders: result } = autoAllocate(orders, BASE_STOCK, noCustomers);
    expect(result.find(o => o.id === 'O-OLDER')?.status).toBe('FULL');
    expect(result.find(o => o.id === 'O-NEWER')?.status).toBe('NONE');
  });
});

// ─── Status ───────────────────────────────────────────────────────────────────

describe('Allocation status', () => {
  it('FULL when allocatedQty === requestQty', () => {
    const orders = [makeOrder({ id: 'O1', type: 'DAILY', createDate: '2025-01-01', requestQty: 10, itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C1' })];
    const { orders: result } = autoAllocate(orders, BASE_STOCK, noCustomers);
    expect(result[0].status).toBe('FULL');
    expect(result[0].allocatedQty).toBe(10);
  });

  it('PARTIAL when stock covers only part of the request', () => {
    const orders = [makeOrder({ id: 'O1', type: 'DAILY', createDate: '2025-01-01', requestQty: 20, itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C1' })];
    const { orders: result } = autoAllocate(orders, BASE_STOCK, noCustomers);
    expect(result[0].status).toBe('PARTIAL');
    expect(result[0].allocatedQty).toBe(10);
  });

  it('NONE when no matching stock exists', () => {
    const orders = [makeOrder({ id: 'O1', type: 'DAILY', createDate: '2025-01-01', requestQty: 5, itemId: 'Item-3', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C1' })];
    const { orders: result } = autoAllocate(orders, BASE_STOCK, noCustomers);
    expect(result[0].status).toBe('NONE');
    expect(result[0].allocatedQty).toBe(0);
  });
});

// ─── Wildcard routing ─────────────────────────────────────────────────────────

describe('Wildcard routing (WH-000 / SP-000)', () => {
  it('WH-000 picks warehouse with highest remaining stock', () => {
    const stocks: Stock[] = [
      { warehouseId: 'WH-SMALL', supplierId: 'SP-001', itemId: 'Item-1', quantity: 10, originalQuantity: 10 },
      { warehouseId: 'WH-BIG',   supplierId: 'SP-001', itemId: 'Item-1', quantity: 50, originalQuantity: 50 },
    ];
    const orders = [makeOrder({ id: 'O1', type: 'DAILY', createDate: '2025-01-01', requestQty: 5, itemId: 'Item-1', warehouseId: 'WH-000', supplierId: 'SP-001', customerId: 'C1' })];
    const { orders: result } = autoAllocate(orders, stocks, noCustomers);
    expect(result[0].allocatedWarehouseId).toBe('WH-BIG');
  });

  it('SP-000 picks supplier with highest remaining stock', () => {
    const stocks: Stock[] = [
      { warehouseId: 'WH-001', supplierId: 'SP-SMALL', itemId: 'Item-1', quantity: 10, originalQuantity: 10 },
      { warehouseId: 'WH-001', supplierId: 'SP-BIG',   itemId: 'Item-1', quantity: 50, originalQuantity: 50 },
    ];
    const orders = [makeOrder({ id: 'O1', type: 'DAILY', createDate: '2025-01-01', requestQty: 5, itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-000', customerId: 'C1' })];
    const { orders: result } = autoAllocate(orders, stocks, noCustomers);
    expect(result[0].allocatedSupplierId).toBe('SP-BIG');
  });
});

// ─── Credit limits ────────────────────────────────────────────────────────────

describe('Customer credit limits', () => {
  it('allocates only up to credit limit when stock is plentiful', () => {
    const customers: Customer[] = [{ id: 'C1', name: 'Test', creditLimit: 5, usedCredit: 0 }];
    const orders = [makeOrder({ id: 'O1', type: 'DAILY', createDate: '2025-01-01', requestQty: 10, itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C1' })];
    const { orders: result } = autoAllocate(orders, BASE_STOCK, customers);
    expect(result[0].allocatedQty).toBe(5);
    expect(result[0].status).toBe('PARTIAL');
  });

  it('credit accumulates across multiple orders from the same customer', () => {
    const customers: Customer[] = [{ id: 'C1', name: 'Test', creditLimit: 12, usedCredit: 0 }];
    const stocks: Stock[] = [
      { warehouseId: 'WH-001', supplierId: 'SP-001', itemId: 'Item-1', quantity: 20, originalQuantity: 20 },
    ];
    const orders = [
      makeOrder({ id: 'O1', type: 'DAILY', createDate: '2025-01-01', requestQty: 10, itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C1' }),
      makeOrder({ id: 'O2', type: 'DAILY', createDate: '2025-01-02', requestQty: 10, itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C1' }),
    ];
    const { orders: result } = autoAllocate(orders, stocks, customers);
    expect(result.find(o => o.id === 'O1')?.allocatedQty).toBe(10); // 10 ≤ 12 credit
    expect(result.find(o => o.id === 'O2')?.allocatedQty).toBe(2);  // only 2 credit left
    expect(result.find(o => o.id === 'O2')?.status).toBe('PARTIAL');
  });
});

// ─── Pricing ──────────────────────────────────────────────────────────────────

describe('Price calculation on allocated orders', () => {
  it('sets unitPrice and totalPrice based on supplier and order type', () => {
    const orders = [makeOrder({ id: 'O1', type: 'DAILY', createDate: '2025-01-01', requestQty: 5, itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C1' })];
    const { orders: result } = autoAllocate(orders, BASE_STOCK, noCustomers);
    expect(result[0].unitPrice).toBe(111.14);
    expect(result[0].totalPrice).toBe(5 * 111.14); // 555.70
  });

  it('order with NONE status has unitPrice and totalPrice of 0', () => {
    const orders = [makeOrder({ id: 'O1', type: 'DAILY', createDate: '2025-01-01', requestQty: 5, itemId: 'Item-X', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C1' })];
    const { orders: result } = autoAllocate(orders, BASE_STOCK, noCustomers);
    expect(result[0].unitPrice).toBe(0);
    expect(result[0].totalPrice).toBe(0);
  });
});

// ─── Returned state ───────────────────────────────────────────────────────────

describe('Returned stocks and customers reflect allocations', () => {
  it('deducts allocated quantity from the matching stock slot', () => {
    const orders = [makeOrder({ id: 'O1', type: 'DAILY', createDate: '2025-01-01', requestQty: 3, itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C1' })];
    const { stocks } = autoAllocate(orders, BASE_STOCK, noCustomers);
    const slot = stocks.find(s => s.warehouseId === 'WH-001' && s.supplierId === 'SP-001');
    expect(slot?.quantity).toBe(7); // 10 - 3
  });

  it('updates customer usedCredit after allocation', () => {
    const customers: Customer[] = [{ id: 'C1', name: 'Test', creditLimit: 100, usedCredit: 0 }];
    const orders = [makeOrder({ id: 'O1', type: 'DAILY', createDate: '2025-01-01', requestQty: 7, itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C1' })];
    const { customers: result } = autoAllocate(orders, BASE_STOCK, customers);
    expect(result.find(c => c.id === 'C1')?.usedCredit).toBe(7);
  });
});

// ─── getMaxAllocatable ────────────────────────────────────────────────────────

describe('getMaxAllocatable', () => {
  it('returns min of (requestQty, available stock, remaining credit)', () => {
    const order = makeOrder({ id: 'O1', type: 'DAILY', createDate: '2025-01-01', requestQty: 10, itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C1' });
    order.allocatedQty = 3;
    order.allocatedWarehouseId = 'WH-001';
    order.allocatedSupplierId = 'SP-001';
    const stocks: Stock[] = [
      { warehouseId: 'WH-001', supplierId: 'SP-001', itemId: 'Item-1', quantity: 7, originalQuantity: 10 },
    ];
    const customers: Customer[] = [{ id: 'C1', name: 'Test', creditLimit: 20, usedCredit: 3 }];
    expect(getMaxAllocatable(order, stocks, customers)).toBe(10);
  });

  it('is capped by credit when credit is the tightest constraint', () => {
    const order = makeOrder({ id: 'O1', type: 'DAILY', createDate: '2025-01-01', requestQty: 10, itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C1' });
    order.allocatedQty = 0;
    order.allocatedWarehouseId = 'WH-001';
    order.allocatedSupplierId = 'SP-001';
    const stocks: Stock[] = [
      { warehouseId: 'WH-001', supplierId: 'SP-001', itemId: 'Item-1', quantity: 10, originalQuantity: 10 },
    ];
    const customers: Customer[] = [{ id: 'C1', name: 'Test', creditLimit: 4, usedCredit: 0 }];
    expect(getMaxAllocatable(order, stocks, customers)).toBe(4);
  });

  it('returns 0 when no matching stock is available', () => {
    const order = makeOrder({ id: 'O1', type: 'DAILY', createDate: '2025-01-01', requestQty: 5, itemId: 'Item-X', warehouseId: 'WH-001', supplierId: 'SP-001', customerId: 'C1' });
    order.allocatedQty = 0;
    order.allocatedWarehouseId = '';
    order.allocatedSupplierId = '';
    expect(getMaxAllocatable(order, BASE_STOCK, noCustomers)).toBe(0);
  });
});
