"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, Edit, Trash2, Search, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/format";
import { apiAssetUrl, apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { Category, Product } from "@/types";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    size: "",
    brand: "",
    price: "",
    quantity: "",
    image: "",
    description: "",
    type: "general",
  });
  const refreshKey = useRefreshOnFocus();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const [productList, categoryList] = await Promise.all([
          apiGet<Product[]>("/products"),
          apiGet<Category[]>("/categories"),
        ]);
        setProducts(productList);
        setCategories(categoryList);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load products");
      }
    };

    loadProducts();
  }, [refreshKey]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetProductForm = () => {
    setFormData({
      name: "",
      sku: "",
      category: "",
      size: "",
      brand: "",
      price: "",
      quantity: "",
      image: "",
      description: "",
      type: "general",
    });
    setEditingId(null);
  };

  const openEditDialog = (product: Product) => {
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      size: product.size,
      brand: product.brand,
      price: String(product.price),
      quantity: String(product.quantity),
      image: product.image || "",
      description: product.description || "",
      type: product.type,
    });
    setEditingId(product.id);
    setIsProductDialogOpen(true);
  };

  const handleSaveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = formData.name.trim();
    const sku = formData.sku.trim();
    const brand = formData.brand.trim();
    const price = Number(formData.price);
    const quantity = Number(formData.quantity || 0);

    if (!name || !sku || !brand || !formData.category || !formData.size.trim()) {
      toast.error("Fill in the required product details");
      return;
    }
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(quantity) || quantity < 0) {
      toast.error("Enter a valid non-negative price and whole-number quantity");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name,
        sku,
        category: formData.category,
        size: formData.size.trim(),
        brand,
        price,
        quantity,
        image: formData.image.trim(),
        description: formData.description.trim() || null,
        type: formData.type.trim() || "general",
      };

      if (editingId) {
        const updated = await apiPut<Product>(`/products/${editingId}`, payload);
        setProducts((current) =>
          current
            .map((product) => (product.id === updated.id ? updated : product))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        toast.success("Product updated successfully");
      } else {
        const created = await apiPost<Product>("/products", payload);
        setProducts((current) =>
          [...current, created].sort((a, b) => a.name.localeCompare(b.name))
        );
        toast.success("Product added successfully");
      }
      setIsProductDialogOpen(false);
      resetProductForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await apiDelete(`/products/${id}`);
      setProducts((current) => current.filter((product) => product.id !== id));
      setDeleteId(null);
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-ceramic-accent">Products</h1>
            <p className="text-muted-foreground mt-1">Manage your product catalog</p>
          </div>
          <Dialog
            open={isProductDialogOpen}
            onOpenChange={(open) => {
              setIsProductDialogOpen(open);
              if (!open && !isSaving) resetProductForm();
            }}
          >
            <DialogTrigger asChild>
              <Button
                className="bg-ceramic-primary hover:bg-ceramic-primary/90 text-white"
                onClick={() => resetProductForm()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Product" : "Add New Product"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Update the product details below" : "Fill in the product details below"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Premium Marble Tiles"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    maxLength={200}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      placeholder="e.g., TIL-001"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="" disabled>Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <Input
                      id="size"
                      placeholder="e.g., 30x30 cm"
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      maxLength={100}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand *</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Product Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";
                      if (!file) return;
                      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
                        toast.error("Choose a JPEG, PNG, WebP, or GIF image");
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("Product images must be 5 MB or smaller");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        const result = reader.result;
                        if (typeof result === "string") {
                          setFormData((current) => ({ ...current, image: result }));
                        }
                      };
                      reader.onerror = () => toast.error("Unable to read the selected image");
                      reader.readAsDataURL(file);
                    }}
                  />
                  {formData.image && (
                    <div className="flex items-center gap-3">
                      <img
                        src={apiAssetUrl(formData.image)}
                        alt="Product preview"
                        className="h-20 w-20 rounded-md object-cover"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData((current) => ({ ...current, image: "" }))}
                      >
                        Remove image
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    maxLength={1000}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Product Type</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    maxLength={100}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsProductDialogOpen(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving || categories.length === 0}
                    className="bg-ceramic-primary hover:bg-ceramic-primary/90 text-white"
                  >
                    {isSaving ? "Saving..." : editingId ? "Save Changes" : "Add Product"}
                  </Button>
                </DialogFooter>
              </form>
              {categories.length === 0 && (
                <p className="text-sm text-destructive">
                  Add a category before creating a product.
                </p>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
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

        {/* Products Table */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle>Product Catalog</CardTitle>
            <CardDescription>
              {filteredProducts.length} products found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Image</th>
                    <th className="text-left py-3 px-4 font-semibold">Product Name</th>
                    <th className="text-left py-3 px-4 font-semibold">SKU</th>
                    <th className="text-left py-3 px-4 font-semibold">Category</th>
                    <th className="text-left py-3 px-4 font-semibold">Price</th>
                    <th className="text-left py-3 px-4 font-semibold">Quantity</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-ceramic-secondary/20 to-ceramic-primary/10 overflow-hidden">
                          {product.image ? (
                            <img
                              src={apiAssetUrl(product.image)}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                              No image
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{product.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{product.sku}</td>
                      <td className="py-3 px-4">{product.category}</td>
                      <td className="py-3 px-4 font-semibold text-ceramic-primary">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{product.quantity}</span>
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
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label={`Edit ${product.name}`}
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog
                            open={deleteId === product.id}
                            onOpenChange={(open) => {
                              if (!open) setDeleteId(null);
                            }}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(product.id)}
                              aria-label={`Delete ${product.name}`}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="flex gap-3 justify-end">
                                  <AlertDialogCancel
                                    onClick={() => setDeleteId(null)}
                                    disabled={isDeleting}
                                  >
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => void handleDelete(product.id)}
                                    className="bg-destructive hover:bg-destructive/90 text-white"
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
