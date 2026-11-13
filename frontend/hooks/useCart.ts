"use client";

import { useStore } from "@/store";
import { useCallback } from "react";
import { toast } from "sonner";

export function useCart() {
  const cart = useStore((state) => state.cart);
  const addToCart = useStore((state) => state.addToCart);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const updateQuantity = useStore((state) => state.updateQuantity);
  const clearCart = useStore((state) => state.clearCart);
  
  const getCartTotal = useStore((state) => state.getCartTotal);

  const handleAddToCart = useCallback(
    (product: any, quantity: number = 1) => {
      if (product.quantity < quantity) {
        toast.error("Insufficient stock");
        return;
      }
      addToCart(product, quantity);
      toast.success(`${product.name} added to cart`);
    },
    [addToCart]
  );

  const handleRemoveFromCart = useCallback(
    (productId: string) => {
      removeFromCart(productId);
      toast.success("Item removed from cart");
    },
    [removeFromCart]
  );

  return {
    cart,
    addToCart: handleAddToCart,
    removeFromCart: handleRemoveFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    itemCount: cart.length,
    total: getCartTotal(),
  };
}
