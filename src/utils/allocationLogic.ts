import { type Order, type Stock, type Customer, type OrderType, type AllocationResult } from '../types/allocation';
import { bankersRound } from './math';
import { getUnitPrice } from '../data/pricing';

const PRIORITY_SCORE: Record<OrderType, number> = {
  EMERGENCY: 1,
  OVERDUE: 2,
  DAILY: 3,
};

export const autoAllocate = (
  initialOrders: Order[],
  initialStocks: Stock[],
  initialCustomers: Customer[]
): AllocationResult => {
  const stocks = initialStocks.map(s => ({ ...s }));
  const customers = initialCustomers.map(c => ({ ...c }));

  const sortedOrders = [...initialOrders].sort((a, b) => {
    const priorityDiff = PRIORITY_SCORE[a.type] - PRIORITY_SCORE[b.type];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.createDate).getTime() - new Date(b.createDate).getTime();
  });

  const orders = sortedOrders.map(order => {
    let allocated = 0;
    let allocatedWarehouseId = order.warehouseId;
    let allocatedSupplierId = order.supplierId;

    const customer = customers.find(c => c.id === order.customerId);
    const remainingCredit = customer
      ? bankersRound(customer.creditLimit - customer.usedCredit)
      : Infinity;

    const availableStocks = stocks.filter(s => {
      const matchItem = s.itemId === order.itemId;
      const matchWH = order.warehouseId === 'WH-000' || s.warehouseId === order.warehouseId;
      const matchSP = order.supplierId === 'SP-000' || s.supplierId === order.supplierId;
      return matchItem && matchWH && matchSP && s.quantity > 0;
    });

    // Prioritize highest remaining stock to minimize fragmentation
    availableStocks.sort((a, b) => b.quantity - a.quantity);

    if (availableStocks.length > 0) {
      const bestStock = availableStocks[0];
      const canAllocate = bankersRound(
        Math.min(order.requestQty, bestStock.quantity, remainingCredit)
      );

      if (canAllocate > 0) {
        allocated = canAllocate;
        allocatedWarehouseId = bestStock.warehouseId;
        allocatedSupplierId = bestStock.supplierId;

        bestStock.quantity = bankersRound(bestStock.quantity - allocated);
        if (customer) {
          customer.usedCredit = bankersRound(customer.usedCredit + allocated);
        }
      }
    }

    const unitPrice  = allocated > 0 ? getUnitPrice(allocatedSupplierId, order.type) : 0;
    const totalPrice = bankersRound(allocated * unitPrice);

    let status: Order['status'] = 'NONE';
    if (allocated > 0 && allocated >= order.requestQty) status = 'FULL';
    else if (allocated > 0) status = 'PARTIAL';

    return {
      ...order,
      allocatedQty: allocated,
      allocatedWarehouseId,
      allocatedSupplierId,
      unitPrice,
      totalPrice,
      status,
    };
  });

  return { orders, stocks, customers };
};

// Compute max units a user can manually set for an order, given current live stocks/customers.
export const getMaxAllocatable = (
  order: Order,
  stocks: Stock[],
  customers: Customer[]
): number => {
  const tempStocks = stocks.map(s => {
    if (
      s.warehouseId === order.allocatedWarehouseId &&
      s.supplierId === order.allocatedSupplierId &&
      s.itemId === order.itemId
    ) {
      return { ...s, quantity: bankersRound(s.quantity + order.allocatedQty) };
    }
    return s;
  });

  const tempCustomer = customers.find(c => c.id === order.customerId);
  const availableCredit = tempCustomer
    ? bankersRound(tempCustomer.creditLimit - tempCustomer.usedCredit + order.allocatedQty)
    : Infinity;

  const matchingStocks = tempStocks.filter(s => {
    const matchItem = s.itemId === order.itemId;
    const matchWH = order.warehouseId === 'WH-000' || s.warehouseId === order.warehouseId;
    const matchSP = order.supplierId === 'SP-000' || s.supplierId === order.supplierId;
    return matchItem && matchWH && matchSP && s.quantity > 0;
  });

  matchingStocks.sort((a, b) => b.quantity - a.quantity);
  const maxStock = matchingStocks[0]?.quantity ?? 0;

  return bankersRound(Math.min(order.requestQty, maxStock, availableCredit));
};
