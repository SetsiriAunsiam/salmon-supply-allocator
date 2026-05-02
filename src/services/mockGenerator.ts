import { type Order, type OrderType, type Stock, type Customer } from '../types/allocation';

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const getRandomDate = () => {
  const start = new Date(2025, 0, 1);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
};

export const generateMockOrders = (count: number = 5000): Order[] => {
  const items = ['Item-1', 'Item-2', 'Item-3'];
  const warehouses = ['WH-001', 'WH-002', 'WH-000'];
  const suppliers = ['SP-001', 'SP-002', 'SP-000'];
  const types: OrderType[] = ['DAILY', 'EMERGENCY', 'OVERDUE'];
  const customers = ['CT-0001', 'CT-0002', 'CT-0003', 'CT-0004', 'CT-0005'];

  return Array.from({ length: count }, (_, i) => {
    const orderNum = (i + 1).toString().padStart(4, '0');
    return {
      id: `ORDER-${orderNum}`,
      subOrderId: `ORDER-${orderNum}-001`,
      itemId: getRandom(items),
      warehouseId: getRandom(warehouses),
      supplierId: getRandom(suppliers),
      requestQty: Math.floor(Math.random() * 100) + 1,
      type: getRandom(types),
      createDate: getRandomDate(),
      customerId: getRandom(customers),
      allocatedQty: 0,
      allocatedWarehouseId: '',
      allocatedSupplierId: '',
      unitPrice: 0,
      totalPrice: 0,
      status: 'NONE',
    };
  });
};

export const generateMockStocks = (): Stock[] => [
  { warehouseId: 'WH-001', supplierId: 'SP-001', itemId: 'Item-1', quantity: 8000, originalQuantity: 8000 },
  { warehouseId: 'WH-001', supplierId: 'SP-002', itemId: 'Item-1', quantity: 5000, originalQuantity: 5000 },
  { warehouseId: 'WH-002', supplierId: 'SP-001', itemId: 'Item-1', quantity: 4000, originalQuantity: 4000 },
  { warehouseId: 'WH-002', supplierId: 'SP-002', itemId: 'Item-1', quantity: 3000, originalQuantity: 3000 },
  { warehouseId: 'WH-001', supplierId: 'SP-001', itemId: 'Item-2', quantity: 6000, originalQuantity: 6000 },
  { warehouseId: 'WH-001', supplierId: 'SP-002', itemId: 'Item-2', quantity: 4500, originalQuantity: 4500 },
  { warehouseId: 'WH-002', supplierId: 'SP-001', itemId: 'Item-2', quantity: 3500, originalQuantity: 3500 },
  { warehouseId: 'WH-002', supplierId: 'SP-002', itemId: 'Item-2', quantity: 2000, originalQuantity: 2000 },
  { warehouseId: 'WH-001', supplierId: 'SP-001', itemId: 'Item-3', quantity: 5000, originalQuantity: 5000 },
  { warehouseId: 'WH-001', supplierId: 'SP-002', itemId: 'Item-3', quantity: 3000, originalQuantity: 3000 },
  { warehouseId: 'WH-002', supplierId: 'SP-001', itemId: 'Item-3', quantity: 2500, originalQuantity: 2500 },
  { warehouseId: 'WH-002', supplierId: 'SP-002', itemId: 'Item-3', quantity: 1500, originalQuantity: 1500 },
];

export const generateMockCustomers = (): Customer[] => [
  { id: 'CT-0001', name: 'Ocean Fresh Co.',   creditLimit: 50000, usedCredit: 0 },
  { id: 'CT-0002', name: 'Pacific Seafood',   creditLimit: 75000, usedCredit: 0 },
  { id: 'CT-0003', name: 'Nordic Fish Ltd.',  creditLimit: 30000, usedCredit: 0 },
  { id: 'CT-0004', name: 'Atlantic Harvest',  creditLimit: 100000, usedCredit: 0 },
  { id: 'CT-0005', name: 'Deep Blue Foods',   creditLimit: 45000, usedCredit: 0 },
];
