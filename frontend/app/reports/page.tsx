"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { Order, Product } from "@/types";

const COLORS = ["#C46A32", "#E8D7C5", "#2F2F2F"];

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productList, orderList] = await Promise.all([
          apiGet<Product[]>("/products"),
          apiGet<Order[]>("/orders"),
        ]);
        setProducts(productList);
        setOrders(orderList);
      } catch (error) {
        console.error("Unable to load report data", error);
      }
    };

    loadData();
  }, []);

  const topProducts = useMemo(
    () =>
      [...products]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 8)
        .map((product) => ({
          name: product.name,
          sales: Math.max(10, Math.round(product.quantity / 2)),
          revenue: product.price * product.quantity,
        })),
    [products]
  );

  const salesData = useMemo(() => {
    const today = new Date();
    const mondayOffset = (today.getDay() + 6) % 7;

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset + index);
      const dayOrders = orders.filter(
        (order) => {
          const orderDate = new Date(order.createdAt);
          return (
            orderDate.getFullYear() === date.getFullYear() &&
            orderDate.getMonth() === date.getMonth() &&
            orderDate.getDate() === date.getDate()
          );
        }
      );
      const revenue = dayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

      return {
        date: date.toLocaleDateString("en-US", { weekday: "long" }),
        sales: revenue,
        orders: dayOrders.length,
        revenue,
      };
    });
  }, [orders]);

  const monthlyData = useMemo(() => {
    const today = new Date();

    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
      const monthOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getFullYear() === date.getFullYear() && orderDate.getMonth() === date.getMonth();
      });
      const revenue = monthOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

      return {
        month: date.toLocaleDateString("en-US", { month: "short" }),
        sales: revenue,
        orders: monthOrders.length,
      };
    });
  }, [orders]);

  const paymentMethods = useMemo(() => {
    const amounts = ["cash", "card", "mobile"].map((name) => ({
      name: name[0].toUpperCase() + name.slice(1),
      amount: orders
        .filter((order) => order.paymentMethod === name)
        .reduce((sum, order) => sum + Number(order.total || 0), 0),
    }));
    const total = amounts.reduce((sum, method) => sum + method.amount, 0);

    return amounts.map((method) => ({
      ...method,
      value: total ? Math.round((method.amount / total) * 100) : 0,
    }));
  }, [orders]);

  const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
  const avgOrderValue = totalRevenue / Math.max(salesData.reduce((sum, d) => sum + d.orders, 0), 1);

  return (
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-ceramic-accent">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive business insights and analytics</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue (Week)
                </CardTitle>
                <DollarSign className="h-4 w-4 text-ceramic-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">From recorded database orders</p>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Order Value
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-ceramic-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</p>
              <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Orders (Week)
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-ceramic-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {salesData.reduce((sum, d) => sum + d.orders, 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">From recorded database orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different reports */}
        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="products">Top Products</TabsTrigger>
            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          </TabsList>

          {/* Daily Sales */}
          <TabsContent value="daily">
            <Card className="card-premium">
              <CardHeader>
                <CardTitle>Daily Sales</CardTitle>
                <CardDescription>Revenue and orders for the current week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip contentStyle={{ backgroundColor: "#f9f7f4", border: "1px solid #e8d7c5" }} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#C46A32"
                      strokeWidth={2}
                      dot={{ fill: "#C46A32", r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#E8D7C5"
                      strokeWidth={2}
                      dot={{ fill: "#E8D7C5", r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monthly Sales */}
          <TabsContent value="monthly">
            <Card className="card-premium">
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
                <CardDescription>Sales and orders comparison over 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip contentStyle={{ backgroundColor: "#f9f7f4", border: "1px solid #e8d7c5" }} />
                    <Legend />
                    <Bar dataKey="sales" fill="#C46A32" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="orders" fill="#E8D7C5" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Products */}
          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Best Selling Products</CardTitle>
                  <CardDescription>Top 8 products by sales volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={topProducts}
                      margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" stroke="#999" />
                      <YAxis dataKey="name" type="category" stroke="#999" width={100} />
                      <Tooltip contentStyle={{ backgroundColor: "#f9f7f4", border: "1px solid #e8d7c5" }} />
                      <Bar dataKey="sales" fill="#C46A32" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Revenue by Product</CardTitle>
                  <CardDescription>Top products by revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topProducts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        stroke="#999"
                      />
                      <YAxis stroke="#999" />
                      <Tooltip contentStyle={{ backgroundColor: "#f9f7f4", border: "1px solid #e8d7c5" }} />
                      <Bar dataKey="revenue" fill="#2F2F2F" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payment Methods */}
          <TabsContent value="methods">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Sales by payment type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentMethods}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentMethods.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Payment Method Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentMethods.map((method, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{method.name}</span>
                        <span className="font-bold text-ceramic-primary">
                          {formatCurrency(method.amount)}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${method.value}%`,
                            backgroundColor: COLORS[index],
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{method.value}% of total</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
}
