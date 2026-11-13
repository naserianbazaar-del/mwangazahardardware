"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Heart, Eye, Mail, Phone, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layouts/main-layout";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/utils/format";
import { apiGet, apiPost } from "@/lib/api";
import type { Customer, Order } from "@/types";
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
import { toast } from "sonner";

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [customerList, orderList] = await Promise.all([
          apiGet<Customer[]>("/customers"),
          apiGet<Order[]>("/orders"),
        ]);
        setCustomers(customerList);
        setOrders(orderList);
      } catch (error) {
        toast.error("Unable to load customer data from the database");
      }
    };

    loadData();
  }, []);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCustomer = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const newCustomer = await apiPost<Customer>("/customers", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      });
      setCustomers((current) => [newCustomer, ...current]);
      setFormData({ name: "", email: "", phone: "", address: "" });
      toast.success("Customer added successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add customer");
    }
  };

  return (
    <MainLayout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-ceramic-accent">Customers</h1>
            <p className="text-muted-foreground mt-1">Manage customer relationships</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-ceramic-primary hover:bg-ceramic-primary/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Customer name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+1234567890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Customer address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleAddCustomer} className="bg-ceramic-primary hover:bg-ceramic-primary/90 text-white">
                  Add Customer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="card-premium hover:shadow-md transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <CardDescription className="mt-1">{customer.email}</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-ceramic-primary">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{customer.address}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Purchases</p>
                    <p className="text-lg font-bold">{customer.totalPurchases}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Loyalty Points</p>
                    <p className="text-lg font-bold text-ceramic-primary">
                      {customer.loyaltyPoints}
                    </p>
                  </div>
                </div>

                {/* Last Purchase */}
                {customer.lastPurchase && (
                  <p className="text-xs text-muted-foreground">
                    Last purchase: {formatDate(customer.lastPurchase)}
                  </p>
                )}

                {/* Action Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  {selectedCustomer?.id === customer.id && (
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{customer.name}</DialogTitle>
                        <DialogDescription>Customer profile and history</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Email</Label>
                          <p className="font-medium">{customer.email}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Phone</Label>
                          <p className="font-medium">{customer.phone || "-"}</p>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs text-muted-foreground">Address</Label>
                          <p className="font-medium">{customer.address || "-"}</p>
                        </div>
                      </div>

                      {/* Purchase History */}
                      <div className="space-y-3 mt-4">
                        <h3 className="font-semibold">Purchase History</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {orders.filter((o) => o.customerId === customer.id).length > 0 ? (
                            orders.filter((o) => o.customerId === customer.id).map((order) => (
                              <div
                                key={order.id}
                                className="flex justify-between items-center p-2 bg-muted rounded"
                              >
                                <div>
                                  <p className="font-medium text-sm">{order.orderNumber}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(new Date(order.createdAt))}
                                  </p>
                                </div>
                                <Badge variant="secondary">{formatCurrency(order.total)}</Badge>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No purchases yet</p>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
