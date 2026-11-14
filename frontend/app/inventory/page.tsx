"use client";

import { useEffect, useState } from "react";
import { AlertCircle, TrendingDown, Package, Plus, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { apiGet } from "@/lib/api";
import type { Product } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [restockingId, setRestockingId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await apiGet<Product[]>("/products");
        setProducts(data);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? `Unable to load inventory: ${error.message}`
            : "Unable to load inventory because an unknown error occurred."
        );
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter((p) => p.quantity <= 20);
  const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  const handleRestock = () => {
    if (!restockQty || !restockingId) {
      toast.error("Please enter quantity");
      return;
    }
    setProducts(
      products.map((p) =>
        p.id === restockingId
          ? { ...p, quantity: p.quantity + parseInt(restockQty) }
          : p
      )
    );
    setRestockingId(null);
    setRestockQty("");
    toast.success("Stock updated successfully");
  };

  return (
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-ceramic-accent">Hardware Inventory</h1>
          <p className="text-muted-foreground mt-1">Monitor stock levels and manage inventory</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Products
                </CardTitle>
                <Package className="h-4 w-4 text-ceramic-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{products.length}</p>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Low Stock Items
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{lowStockProducts.length}</p>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Inventory Value
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-ceramic-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Inventory Table */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle>Stock Overview</CardTitle>
            <CardDescription>{filteredProducts.length} products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Product</th>
                    <th className="text-left py-3 px-4 font-semibold">SKU</th>
                    <th className="text-left py-3 px-4 font-semibold">Current Stock</th>
                    <th className="text-left py-3 px-4 font-semibold">Value</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">{product.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{product.sku}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">{product.quantity}</span>
                      </td>
                      <td className="py-3 px-4">
                        {formatCurrency(product.price * product.quantity)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            product.status === "in_stock"
                              ? "default"
                              : product.status === "low_stock"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {product.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {product.quantity <= 20 && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRestockingId(product.id)}
                              >
                                Restock
                              </Button>
                            </DialogTrigger>
                            {restockingId === product.id && (
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Restock Product</DialogTitle>
                                  <DialogDescription>
                                    Add stock for {product.name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      Current Stock: <span className="font-semibold">{product.quantity}</span>
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="qty">Quantity to Add</Label>
                                    <Input
                                      id="qty"
                                      type="number"
                                      placeholder="0"
                                      value={restockQty}
                                      onChange={(e) => setRestockQty(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setRestockingId(null)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleRestock}
                                    className="bg-ceramic-primary hover:bg-ceramic-primary/90 text-white"
                                  >
                                    Add Stock
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            )}
                          </Dialog>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
