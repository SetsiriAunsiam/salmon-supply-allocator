export type OrderType = 'EMERGENCY' | 'OVERDUE' | 'DAILY';

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
  status: 'FULL' | 'PARTIAL' | 'NONE';
}

export interface Stock {
  warehouseId: string;
  supplierId: string;
  itemId: string;
  quantity: number;
}

export interface Customer {
  id: string;
  creditLimit: number;
  usedCredit: number;
}