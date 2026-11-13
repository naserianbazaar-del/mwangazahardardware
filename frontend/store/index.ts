import { create } from "zustand";
import { CartItem, Order, Customer, Product } from "@/types";

interface StoreState {
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;

  // Orders
  orders: Order[];
  addOrder: (order: Order) => void;
  getOrders: () => Order[];

  // Customers
  customers: Customer[];
  addCustomer: (customer: Customer) => void;
  getCustomers: () => Customer[];

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // UI State
  selectedBranch: string;
  setSelectedBranch: (branch: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  // Cart State
  cart: [],
  addToCart: (product, quantity) =>
    set((state) => {
      const existingItem = state.cart.find((item) => item.product.id === product.id);
      if (existingItem) {
        return {
          cart: state.cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      }
      return {
        cart: [...state.cart, { product, quantity }],
      };
    }),

  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.product.id !== productId),
    })),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    })),

  clearCart: () => set({ cart: [] }),

  getCartTotal: () => {
    const state = get();
    return state.cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  },

  // Orders
  orders: [],
  addOrder: (order) =>
    set((state) => ({
      orders: [...state.orders, order],
    })),

  getOrders: () => get().orders,

  // Customers
  customers: [],
  addCustomer: (customer) =>
    set((state) => ({
      customers: [...state.customers, customer],
    })),

  getCustomers: () => get().customers,

  // Theme
  isDarkMode: false,
  toggleDarkMode: () =>
    set((state) => ({
      isDarkMode: !state.isDarkMode,
    })),

  // UI State
  selectedBranch: "Main Store",
  setSelectedBranch: (branch) =>
    set({
      selectedBranch: branch,
    }),
}));
