export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  size: string;
  brand: string;
  price: number;
  quantity: number;
  image: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
  description?: string;
  type: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: "cash" | "card" | "mobile";
  status: "completed" | "pending" | "cancelled";
  createdAt: Date;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  loyaltyPoints: number;
  totalPurchases: number;
  lastPurchase?: Date;
  createdAt: Date;
}

export type ExpenseCategory =
  | "rent"
  | "electricity"
  | "wages"
  | "transport"
  | "repairs"
  | "supplies"
  | "other";

export type PaymentMethod = "cash" | "card" | "mobile" | "bank";

export interface Expense {
  id: string;
  category: ExpenseCategory;
  payee: string;
  amount: number;
  paymentMethod: PaymentMethod;
  expenseDate: string;
  reference?: string | null;
  notes?: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface SupplierPurchase {
  id: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  total: number;
  amountPaid: number;
  balance: number;
  status: "unpaid" | "partial" | "paid";
  purchaseDate: string;
  notes?: string | null;
}

export interface SupplierPayment {
  id: string;
  purchaseId: string;
  supplierName: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  reference?: string | null;
  notes?: string | null;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: "in" | "out";
  quantity: number;
  reason: string;
  date: Date;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface SalesData {
  date: string;
  sales: number;
  orders: number;
  revenue: number;
}

export interface DashboardMetrics {
  totalSalestoday: number;
  totalOrders: number;
  lowStockProducts: number;
  totalCustomers: number;
  revenueChange: number;
  ordersChange: number;
}
