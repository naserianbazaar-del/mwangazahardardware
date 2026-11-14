"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Printer, Plus, Minus, X, Search, Filter, ShoppingCart, MessageCircle, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/utils/format";
import { apiAssetUrl, apiGet, apiPost } from "@/lib/api";
import type { CartItem, Category, Product } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PaymentMethod = "cash" | "card" | "mobile";

interface ReceiptData {
  receiptNumber: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  createdAt: Date;
}

type ReceiptAction = "save-image" | "share-image" | "share-text" | "print";

export default function POSPage() {
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productList, categoryList] = await Promise.all([
          apiGet<Product[]>("/products"),
          apiGet<Category[]>("/categories"),
        ]);
        setProducts(productList);
        setCategories(categoryList);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? `Unable to load POS inventory: ${error.message}`
            : "Unable to load POS inventory because an unknown error occurred."
        );
      }
    };

    loadData();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const subtotal = getCartTotal();
  const total = Math.max(0, subtotal - discountAmount);

  const createReceiptData = (): ReceiptData => ({
    receiptNumber: `REC-${crypto.randomUUID().toUpperCase()}`,
    items: cart.map((item) => ({
      ...item,
      product: { ...item.product },
    })),
    subtotal,
    discount: discountAmount,
    total,
    paymentMethod,
    createdAt: new Date(),
  });

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setReceiptData(createReceiptData());
    setShowCheckoutDialog(false);
    setShowReceiptModal(true);
  };

  const handleSaleConfirmed = (receipt: ReceiptData) => {
    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        const soldItem = receipt.items.find((item) => item.product.id === product.id);
        if (!soldItem) return product;

        const quantity = Math.max(0, product.quantity - soldItem.quantity);
        return {
          ...product,
          quantity,
          status: quantity === 0 ? "out_of_stock" : quantity < 20 ? "low_stock" : "in_stock",
        };
      })
    );
    clearCart();
    setDiscountAmount(0);
    toast.success("Sale recorded and inventory updated");
    void apiGet<Product[]>("/products")
      .then(setProducts)
      .catch(() => {
        toast.error("Sale was recorded, but inventory could not be refreshed");
      });
  };

  return (
    <>
      <div className="p-6 md:p-8 h-full">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-ceramic-accent mb-2">Hardware POS</h1>
          <p className="text-muted-foreground">Fast and intuitive checkout experience</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Product Catalog - Left Side */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Search and Filters */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-5 w-5" />
              </Button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className={selectedCategory === null ? "bg-ceramic-primary" : ""}
              >
                All Products
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={selectedCategory === cat.name ? "bg-ceramic-primary" : ""}
                >
                  {cat.name}
                </Button>
              ))}
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="card-premium hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Product Image */}
                        <div className="w-full h-32 bg-gradient-to-br from-ceramic-secondary/20 to-ceramic-primary/10 rounded-lg overflow-hidden">
                          {product.image ? (
                            <img
                              src={apiAssetUrl(product.image)}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                              No image
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="space-y-1">
                          <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{product.size}</span>
                            <Badge variant="secondary" className="text-xs">
                              {product.category}
                            </Badge>
                          </div>
                        </div>

                        {/* Price and Stock */}
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-ceramic-primary">
                            {formatCurrency(product.price)}
                          </p>
                          <Badge
                            variant={
                              product.status === "in_stock"
                                ? "default"
                                : product.status === "low_stock"
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {product.quantity}
                          </Badge>
                        </div>

                        {/* Add to Cart Button */}
                        <Button
                          onClick={() => addToCart(product)}
                          disabled={product.quantity === 0}
                          className="w-full bg-ceramic-primary hover:bg-ceramic-primary/90 text-white"
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Section - Right Side */}
          <div className="flex flex-col gap-4">
            {/* Cart Card */}
            <Card className="card-premium flex-1 overflow-hidden flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-ceramic-primary" />
                  <CardTitle>Cart ({cart.length})</CardTitle>
                </div>
              </CardHeader>

              {/* Cart Items */}
              <CardContent className="flex-1 overflow-y-auto p-0">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      Your cart is empty. Add products to get started.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {cart.map((item) => (
                      <div key={item.product.id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm line-clamp-2">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.product.size}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.product.id)}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Quantity and Price */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  Math.max(1, item.quantity - 1)
                                )
                              }
                              className="h-7 w-7"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity + 1
                                )
                              }
                              className="h-7 w-7"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="font-semibold text-sm">
                            {formatCurrency(
                              item.product.price * item.quantity
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="card-premium">
              <CardContent className="p-4 space-y-3">
                {/* Discount */}
                <div className="space-y-2">
                  <Label htmlFor="discount" className="text-xs">Discount</Label>
                  <Input
                    id="discount"
                    type="number"
                    value={discountAmount}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    placeholder="0.00"
                    className="text-sm"
                  />
                </div>

                {/* Summary */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-medium text-red-500">
                        -{formatCurrency(discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-ceramic-primary">{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-2 pt-2">
                  <Label className="text-xs">Payment Method</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["cash", "card", "mobile"] as const).map((method) => (
                      <Button
                        key={method}
                        variant={paymentMethod === method ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPaymentMethod(method)}
                        className={paymentMethod === method ? "bg-ceramic-primary" : ""}
                      >
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      clearCart();
                      setDiscountAmount(0);
                    }}
                    disabled={cart.length === 0}
                    size="sm"
                  >
                    Clear Cart
                  </Button>
                  <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-ceramic-primary hover:bg-ceramic-primary/90 text-white"
                        disabled={cart.length === 0}
                        size="sm"
                      >
                        Checkout
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Review Sale</DialogTitle>
                        <DialogDescription>
                        Review the order details before choosing a receipt option
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Items</span>
                            <span className="font-medium">{cart.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Subtotal</span>
                            <span className="font-medium">{formatCurrency(subtotal)}</span>
                          </div>
                          {discountAmount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Discount</span>
                              <span className="font-medium">-{formatCurrency(discountAmount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t border-border">
                            <span className="font-semibold">Total</span>
                            <span className="font-bold text-ceramic-primary">
                              {formatCurrency(total)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Payment Method</Label>
                          <p className="font-medium text-sm mt-1 capitalize">
                            {paymentMethod}
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCheckoutDialog(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCheckout}
                          className="bg-ceramic-primary hover:bg-ceramic-primary/90 text-white"
                        >
                          Continue to Receipt
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Receipt Options Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={cart.length === 0}
                  onClick={() => {
                    setReceiptData(createReceiptData());
                    setShowReceiptModal(true);
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Receipt Options
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && receiptData && (
        <ReceiptModal
          open={showReceiptModal}
          onOpenChange={setShowReceiptModal}
          receipt={receiptData}
          onSaleConfirmed={() => handleSaleConfirmed(receiptData)}
          onDeclineSale={() => {
            setReceiptData(null);
            setShowReceiptModal(false);
            clearCart();
            setDiscountAmount(0);
            toast.info("Sale cancelled; inventory was not changed");
          }}
        />
      )}
    </>
  );
}

function ReceiptModal({
  open,
  onOpenChange,
  receipt,
  onSaleConfirmed,
  onDeclineSale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptData;
  onSaleConfirmed: () => void;
  onDeclineSale: () => void;
}) {
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [isPreparingImage, setIsPreparingImage] = useState(true);
  const [isConfirmingSale, setIsConfirmingSale] = useState(false);
  const [saleConfirmed, setSaleConfirmed] = useState(false);
  const [pendingAction, setPendingAction] = useState<ReceiptAction | null>(null);
  const saleRequestInFlight = useRef(false);
  const receiptMessage = [
    "Mwazanga Hardware",
    "Kajiado County",
    "Kiserian Town",
    `Receipt Code: ${receipt.receiptNumber}`,
    `Date: ${receipt.createdAt.toLocaleString()}`,
    "",
    ...receipt.items.map(
      ({ product, quantity }) =>
        `${product.name} x${quantity} - ${formatCurrency(product.price * quantity)}`
    ),
    "",
    `Subtotal: ${formatCurrency(receipt.subtotal)}`,
    ...(receipt.discount > 0 ? [`Discount: -${formatCurrency(receipt.discount)}`] : []),
    `Total: ${formatCurrency(receipt.total)}`,
    `Payment method: ${receipt.paymentMethod}`,
    "",
    "We are glad to serve you!",
  ].join("\n");

  useEffect(() => {
    let cancelled = false;
    setReceiptImage(null);
    setIsPreparingImage(true);
    createReceiptImage(receipt)
      .then((file) => {
        if (!cancelled) {
          setReceiptImage(file);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Unable to create the receipt image");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsPreparingImage(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [receipt]);

  const downloadReceiptImage = (file: File) => {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const saveReceiptImage = () => {
    if (!receiptImage) {
      toast.error("Receipt image is still being prepared");
      return;
    }
    downloadReceiptImage(receiptImage);
    toast.success("Receipt image saved");
  };

  const shareReceipt = () => {
    if (!receiptImage) {
      toast.error("Receipt image is still being prepared");
      return;
    }

    if (
      typeof navigator.share === "function" &&
      navigator.canShare?.({ files: [receiptImage] })
    ) {
      navigator
        .share({
          files: [receiptImage],
          title: `Receipt ${receipt.receiptNumber}`,
          text: "Mwazanga Hardware receipt",
        })
        .catch((error: unknown) => {
          if (!(error instanceof Error && error.name === "AbortError")) {
            downloadReceiptImage(receiptImage);
            toast.error("Sale recorded. Receipt image saved; attach it in WhatsApp to share.");
          }
        });
        return;
    }

    downloadReceiptImage(receiptImage);
    toast.success("Receipt image saved. Attach it in WhatsApp before sending.");
  };

  const shareReceiptText = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(receiptMessage)}`;
    const whatsappWindow = window.open(whatsappUrl, "_blank");
    if (!whatsappWindow) {
      toast.error("Allow pop-ups to share the receipt through WhatsApp");
      return;
    }
    whatsappWindow.opener = null;
    toast.success("Choose a contact in WhatsApp and send the receipt");
  };

  const printReceipt = (existingWindow?: Window | null) => {
    const receiptElement = document.getElementById("receipt");
    if (!receiptElement) {
      toast.error("Receipt is not available to print");
      return;
    }

    const printWindow =
      existingWindow === undefined
        ? window.open("", "_blank", "width=480,height=720")
        : existingWindow;
    if (!printWindow) {
      toast.error("Allow pop-ups to print the receipt");
      return;
    }
    printWindow.opener = null;

    const stylesheets = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    )
      .map((stylesheet) => `<link rel="stylesheet" href="${stylesheet.href}">`)
      .join("");

    printWindow.addEventListener(
      "load",
      () => {
        printWindow.focus();
        printWindow.print();
      },
      { once: true }
    );

    printWindow.document.write(`<!doctype html>
      <html>
        <head>
          <title>Receipt ${receipt.receiptNumber}</title>
          ${stylesheets}
          <style>
            @page { margin: 12mm; }
            body { background: white; color: black; font-family: Arial, sans-serif; }
            #receipt { max-width: 380px; margin: 0 auto; padding: 16px; }
            #receipt .flex { display: flex; justify-content: space-between; gap: 12px; }
            #receipt .border-t { border-top: 1px dashed #888; }
            #receipt .text-muted-foreground { color: #555; }
            #receipt .bg-ceramic-primary { background: #c46a32; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>${receiptElement.outerHTML}</body>
      </html>`);
    printWindow.document.close();
  };

  const executeReceiptAction = (
    action: ReceiptAction,
    existingWindow?: Window | null
  ) => {
    if (action === "save-image") {
      saveReceiptImage();
    } else if (action === "share-image") {
      shareReceipt();
    } else if (action === "share-text") {
      if (existingWindow) {
        existingWindow.opener = null;
        existingWindow.location.href = `https://wa.me/?text=${encodeURIComponent(receiptMessage)}`;
        toast.success("Choose a contact in WhatsApp and send the receipt");
      } else {
        shareReceiptText();
      }
    } else {
      printReceipt(existingWindow);
    }
  };

  const requestReceiptAction = (action: ReceiptAction) => {
    if (isPreparingImage && (action === "save-image" || action === "share-image")) {
      toast.error("Receipt image is still being prepared");
      return;
    }
    if (saleConfirmed) {
      executeReceiptAction(action);
      return;
    }
    setPendingAction(action);
  };

  const confirmSale = async () => {
    if (!pendingAction || saleRequestInFlight.current) return;

    let actionWindow: Window | null = null;
    if (
      pendingAction === "print" ||
      pendingAction === "share-text" ||
      (pendingAction === "share-image" &&
        !(
          typeof navigator.share === "function" &&
          navigator.canShare?.({ files: receiptImage ? [receiptImage] : [] })
        ))
    ) {
      actionWindow =
        pendingAction === "print"
          ? window.open("", "_blank", "width=480,height=720")
          : window.open("about:blank", "_blank");
      if (!actionWindow) {
        toast.error("Allow pop-ups to continue with this receipt option");
        return;
      }
    }

    saleRequestInFlight.current = true;
    setIsConfirmingSale(true);
    try {
      await apiPost<unknown>("/orders", {
        items: receipt.items.map(({ product, quantity }) => ({
          product_id: product.id,
          quantity,
        })),
        discount: receipt.discount,
        payment_method: receipt.paymentMethod,
      });
    } catch (error) {
      actionWindow?.close();
      toast.error(
        error instanceof Error ? `Sale was not recorded: ${error.message}` : "Sale was not recorded"
      );
      saleRequestInFlight.current = false;
      setIsConfirmingSale(false);
      return;
    }

    saleRequestInFlight.current = false;
    setIsConfirmingSale(false);
    setSaleConfirmed(true);
    setPendingAction(null);
    onSaleConfirmed();
    try {
      executeReceiptAction(pendingAction, actionWindow);
    } catch (error) {
      actionWindow?.close();
      toast.error(
        error instanceof Error
          ? `Sale recorded, but the receipt action failed: ${error.message}`
          : "Sale recorded, but the receipt action failed"
      );
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
          <DialogDescription>
            Choose Save, Share, or Print, then confirm the sale. Declining cancels it without updating inventory.
          </DialogDescription>
        </DialogHeader>
        <p className="text-xs font-semibold text-center text-ceramic-primary">
          {saleConfirmed ? "SALE CONFIRMED" : "SALE NOT YET RECORDED"}
        </p>
        <div id="receipt" className="bg-white p-6 rounded-lg border border-border space-y-4 text-center">
          {/* Logo */}
          <div className="h-12 w-12 rounded-lg bg-ceramic-primary flex items-center justify-center mx-auto">
            <span className="text-white font-bold">MH</span>
          </div>

          {/* Store Info */}
          <div className="space-y-1">
            <h2 className="font-bold text-lg">Mwazanga Hardware</h2>
            <p className="text-xs text-muted-foreground">Kajiado County</p>
            <p className="text-xs text-muted-foreground">Kiserian Town</p>
            <p className="text-xs text-muted-foreground font-mono">
              Receipt Code: {receipt.receiptNumber}
            </p>
            <p className="text-xs text-muted-foreground">
              Date: {receipt.createdAt.toLocaleString()}
            </p>
          </div>

          <div className="border-t border-dashed border-border" />

          {/* Items */}
          <div className="text-left space-y-2">
            <h3 className="font-semibold text-sm">Items</h3>
            {receipt.items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-xs">
                <span>{item.product.name} x{item.quantity}</span>
                <span>{formatCurrency(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-border" />

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(receipt.subtotal)}</span>
            </div>
            {receipt.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-red-500">-{formatCurrency(receipt.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2">
              <span>Total</span>
              <span>{formatCurrency(receipt.total)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-border" />

          {/* Payment Info */}
          <div className="text-left space-y-1 text-xs">
            <p>
              <span className="text-muted-foreground">Payment Method: </span>
              <span className="font-medium capitalize">{receipt.paymentMethod}</span>
            </p>
          </div>

          <div className="border-t border-dashed border-border" />

          {/* Footer */}
          <p className="text-xs text-muted-foreground">
            We are glad to serve you!
          </p>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => requestReceiptAction("save-image")}
            variant="outline"
            disabled={isPreparingImage || isConfirmingSale}
          >
            <Download className="h-4 w-4 mr-2" />
            Save Image
          </Button>
          <Button
            onClick={() => requestReceiptAction("share-image")}
            variant="outline"
            disabled={isPreparingImage || isConfirmingSale}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {isPreparingImage ? "Preparing..." : "Share Image"}
          </Button>
          <Button
            onClick={() => requestReceiptAction("share-text")}
            variant="outline"
            disabled={isConfirmingSale}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp Text
          </Button>
          <Button
            onClick={() => requestReceiptAction("print")}
            disabled={isConfirmingSale}
            className="bg-ceramic-primary hover:bg-ceramic-primary/90 text-white"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <AlertDialog
      open={pendingAction !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isConfirmingSale) {
          setPendingAction(null);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm successful payment?</AlertDialogTitle>
          <AlertDialogDescription>
            Choosing Okay records this sale and deducts the items from inventory before continuing with the receipt. Declining cancels the sale and leaves inventory unchanged.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isConfirmingSale}
            onClick={onDeclineSale}
          >
            Decline Sale
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isConfirmingSale}
            onClick={(event) => {
              event.preventDefault();
              void confirmSale();
            }}
          >
            {isConfirmingSale ? "Recording Sale..." : "Okay, Confirm Sale"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

async function createReceiptImage(receipt: ReceiptData): Promise<File> {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available");
  }

  const width = 800;
  const padding = 64;
  const contentWidth = width - padding * 2;
  const lineHeight = 34;
  const itemLayouts = receipt.items.map(({ product, quantity }) => {
    context.font = "bold 26px Arial";
    const nameLines = wrapCanvasText(context, product.name, contentWidth - 180);
    return { product, quantity, nameLines };
  });
  const itemsHeight = itemLayouts.reduce(
    (height, item) => height + item.nameLines.length * lineHeight + 54,
    0
  );
  const height = 580 + itemsHeight + (receipt.discount > 0 ? 190 : 150);
  canvas.width = width;
  canvas.height = height;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#c46a32";
  context.beginPath();
  context.arc(width / 2, 76, 36, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = "bold 26px Arial";
  context.textAlign = "center";
  context.fillText("MH", width / 2, 85);

  let y = 148;
  const centeredText = (text: string, font: string, color = "#222222") => {
    context.font = font;
    context.fillStyle = color;
    context.textAlign = "center";
    context.fillText(text, width / 2, y);
    y += 38;
  };
  centeredText("Mwazanga Hardware", "bold 32px Arial");
  centeredText("Kajiado County • Kiserian Town", "22px Arial", "#555555");
  centeredText(`Receipt Code: ${receipt.receiptNumber}`, "bold 20px Arial");
  centeredText(`Date: ${receipt.createdAt.toLocaleString()}`, "20px Arial", "#555555");

  const drawRule = () => {
    y += 8;
    context.beginPath();
    context.setLineDash([8, 6]);
    context.strokeStyle = "#999999";
    context.moveTo(padding, y);
    context.lineTo(width - padding, y);
    context.stroke();
    context.setLineDash([]);
    y += 28;
  };

  drawRule();
  context.textAlign = "left";
  context.font = "bold 22px Arial";
  context.fillStyle = "#222222";
  context.fillText("ITEMS SOLD", padding, y);
  y += 42;

  for (const item of itemLayouts) {
    context.font = "bold 24px Arial";
    context.fillStyle = "#222222";
    item.nameLines.forEach((line) => {
      context.textAlign = "left";
      context.fillText(line, padding, y);
      y += lineHeight;
    });

    context.font = "20px Arial";
    context.fillStyle = "#555555";
    context.textAlign = "left";
    context.fillText(
      `${item.quantity} x ${formatCurrency(item.product.price)}`,
      padding,
      y
    );
    context.textAlign = "right";
    context.fillStyle = "#222222";
    context.fillText(
      formatCurrency(item.product.price * item.quantity),
      width - padding,
      y
    );
    y += 42;
  }

  drawRule();
  const drawAmount = (label: string, amount: string, bold = false) => {
    context.font = `${bold ? "bold " : ""}${bold ? 26 : 22}px Arial`;
    context.fillStyle = "#222222";
    context.textAlign = "left";
    context.fillText(label, padding, y);
    context.textAlign = "right";
    context.fillText(amount, width - padding, y);
    y += bold ? 44 : 36;
  };
  drawAmount("Subtotal", formatCurrency(receipt.subtotal));
  if (receipt.discount > 0) {
    drawAmount("Discount", `-${formatCurrency(receipt.discount)}`);
  }
  drawAmount("TOTAL", formatCurrency(receipt.total), true);
  drawAmount("Payment Method", receipt.paymentMethod);

  drawRule();
  centeredText("We are glad to serve you!", "bold 22px Arial", "#555555");

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error("Unable to encode receipt image"));
      }
    }, "image/png");
  });

  return new File([blob], `receipt-${receipt.receiptNumber}.png`, {
    type: "image/png",
  });
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) {
    lines.push(line);
  }
  return lines;
}
