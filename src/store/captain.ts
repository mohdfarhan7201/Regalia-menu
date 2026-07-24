import { create } from "zustand";
import type { IItem, ILocation } from "@/types";

export interface CaptainOrderItem {
  itemId: string;
  name: string;
  price: number;
  discountPrice?: number;
  quantity: number;
  notes: string;
  isVegetarian: boolean;
  preparationTtlMinutes: number;
  imageUrl?: string;
  isNoCharge?: boolean; // complimentary line — billed ₹0
  ncReason?: string;
}

interface CaptainStore {
  // Selected table
  selectedTable: ILocation | null;

  // Items being ordered
  orderItems: CaptainOrderItem[];

  // Overall special instructions
  specialInstructions: string;

  // UI state
  step: "table_select" | "order_build" | "order_summary" | "active_orders";

  // Actions
  selectTable: (table: ILocation) => void;
  clearTable: () => void;

  addItem: (item: IItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateNotes: (itemId: string, notes: string) => void;
  setNoCharge: (itemId: string, on: boolean, reason?: string) => void;

  setSpecialInstructions: (value: string) => void;
  setStep: (step: CaptainStore["step"]) => void;

  resetOrder: () => void;

  // Computed
  totalItems: () => number;
  subtotal: () => number;
}

const defaultState = {
  selectedTable: null,
  orderItems: [],
  specialInstructions: "",
  step: "table_select" as const,
};

export const useCaptainStore = create<CaptainStore>()((set, get) => ({
  ...defaultState,

  selectTable: (table) =>
    set({ selectedTable: table, step: "order_build", orderItems: [] }),

  clearTable: () => set({ selectedTable: null, step: "table_select" }),

  addItem: (item) => {
    const { orderItems } = get();
    const existing = orderItems.find((i) => i.itemId === item._id);
    if (existing) {
      set({
        orderItems: orderItems.map((i) =>
          i.itemId === item._id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      });
    } else {
      const newItem: CaptainOrderItem = {
        itemId: item._id,
        name: item.name,
        price: item.price,
        discountPrice: item.discountPrice,
        quantity: 1,
        notes: "",
        isVegetarian: item.isVegetarian,
        preparationTtlMinutes: item.preparationTtlMinutes,
        imageUrl: item.imageUrl,
      };
      set({ orderItems: [...orderItems, newItem] });
    }
  },

  removeItem: (itemId) =>
    set({ orderItems: get().orderItems.filter((i) => i.itemId !== itemId) }),

  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    set({
      orderItems: get().orderItems.map((i) =>
        i.itemId === itemId ? { ...i, quantity } : i,
      ),
    });
  },

  updateNotes: (itemId, notes) =>
    set({
      orderItems: get().orderItems.map((i) =>
        i.itemId === itemId ? { ...i, notes } : i,
      ),
    }),

  setNoCharge: (itemId, on, reason) =>
    set({
      orderItems: get().orderItems.map((i) =>
        i.itemId === itemId
          ? { ...i, isNoCharge: on, ncReason: on ? reason : undefined }
          : i,
      ),
    }),

  setSpecialInstructions: (value) => set({ specialInstructions: value }),

  setStep: (step) => set({ step }),

  resetOrder: () => set(defaultState),

  totalItems: () => get().orderItems.reduce((sum, i) => sum + i.quantity, 0),

  subtotal: () =>
    get().orderItems.reduce(
      (sum, i) =>
        sum + (i.isNoCharge ? 0 : (i.discountPrice ?? i.price) * i.quantity),
      0,
    ),
}));
