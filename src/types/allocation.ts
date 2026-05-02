export type OrderType = 'EMERGENCY' | 'OVERDUE' | 'DAILY';
export type OrderStatus = 'FULL' | 'PARTIAL' | 'NONE';

export interface Order {
  id: string;
  subOrderId: string;
  itemId: string;
  warehouseId: string;
  supplierId: string;
  requestQty: number;
  type: OrderType;
  createDate: string;
  customerId: string;
  remark?: string;
  allocatedQty: number;
  allocatedWarehouseId: string;
  allocatedSupplierId: string;
  unitPrice: number;
  totalPrice: number;
  status: OrderStatus;
}

export interface Stock {
  warehouseId: string;
  supplierId: string;
  itemId: string;
  quantity: number;
  originalQuantity: number;
}

export interface Customer {
  id: string;
  name: string;
  creditLimit: number;
  usedCredit: number;
}

export interface FilterState {
  search: string;
  status: OrderStatus | 'ALL';
  type: OrderType | 'ALL';
  customerId: string;
  warehouseId: string;
  supplierId: string;
  itemId: string;
}

export interface AllocationResult {
  orders: Order[];
  stocks: Stock[];
  customers: Customer[];
}
