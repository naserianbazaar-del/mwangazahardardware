"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Package, Users, ShoppingCart, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { formatCurrency, formatDate } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import type { Customer, Expense, Order, Product, SupplierPurchase } from "@/types";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";

const COLORS = ["#C46A32", "#E8D7C5", "#2F2F2F"];

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [supplierPurchases, setSupplierPurchases] = useState<SupplierPurchase[]>([]);
  const refreshKey = useRefreshOnFocus();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productList, orderList, customerList, expenseList, purchaseList] = await Promise.all([
          apiGet<Product[]>("/products"),
          apiGet<Order[]>("/orders"),
          apiGet<Customer[]>("/customers"),
          apiGet<Expense[]>("/expenses"),
          apiGet<SupplierPurchase[]>("/supplier-purchases"),
        ]);
        setProducts(productList);
        setOrders(orderList);
        setCustomers(customerList);
        setExpenses(expenseList);
        setSupplierPurchases(purchaseList);
      } catch (error) {
        console.error("Unable to load dashboard data", error);
      }
    };

    loadData();
  }, [refreshKey]);

  const dashboardMetrics = useMemo(() => {
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);
    const todayOrders = orders.filter(
      (order) => new Date(order.createdAt).toISOString().slice(0, 10) === todayKey
    );
    const yesterdayOrders = orders.filter(
      (order) => new Date(order.createdAt).toISOString().slice(0, 10) === yesterdayKey
    );
    const totalSalesToday = todayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const expensesToday = expenses
      .filter((expense) => new Date(expense.expenseDate).toISOString().slice(0, 10) === todayKey)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const supplierBalance = supplierPurchases.reduce(
      (sum, purchase) => sum + Number(purchase.balance || 0),
      0
    );
    const totalOrders = todayOrders.length;
    const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const lowStockProducts = products.filter((product) => product.quantity <= 20).length;
    const totalCustomers = customers.length;
    const revenueChange = yesterdayRevenue ? ((totalSalesToday - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;
    const ordersChange = yesterdayOrders.length
      ? ((totalOrders - yesterdayOrders.length) / yesterdayOrders.length) * 100
      : 0;

    return {
      totalSalesToday,
      expensesToday,
      supplierBalance,
      totalOrders,
      lowStockProducts,
      totalCustomers,
      revenueChange,
      ordersChange,
    };
  }, [orders, products, customers, expenses, supplierPurchases]);

  const topProducts = useMemo(
    () =>
      [...products]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
        .map((product) => ({
          name: product.name,
          sales: Math.max(5, Math.round(product.quantity / 3)),
          revenue: product.price * product.quantity,
        })),
    [products]
  );

  const pieData = useMemo(() => {
    const amounts = ["cash", "card", "mobile"].map((method) => ({
      name: method[0].toUpperCase() + method.slice(1),
      amount: orders
        .filter((order) => order.paymentMethod === method)
        .reduce((sum, order) => sum + Number(order.total || 0), 0),
    }));
    const total = amounts.reduce((sum, method) => sum + method.amount, 0);

    return amounts.map((method) => ({
      name: method.name,
      value: total ? Math.round((method.amount / total) * 100) : 0,
    }));
  }, [orders]);

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

  return (
      <div className="min-w-0 p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-ceramic-accent mb-2">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Welcome back! Here's your business overview for today.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 md:gap-6">
          {/* Total Sales Card */}
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Sales Today
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-ceramic-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl md:text-3xl font-bold">
                  {formatCurrency(dashboardMetrics.totalSalesToday)}
                </p>
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-medium text-green-500">
                    +{dashboardMetrics.revenueChange}% from yesterday
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Orders Card */}
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-ceramic-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl md:text-3xl font-bold">
                  {dashboardMetrics.totalOrders}
                </p>
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-medium text-green-500">
                    +{dashboardMetrics.ordersChange}% from yesterday
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Products Card */}
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Low Stock Items
                </CardTitle>
                <Package className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl md:text-3xl font-bold text-orange-600">
                  {dashboardMetrics.lowStockProducts}
                </p>
                <p className="text-xs text-muted-foreground">
                  Need restock attention
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total Customers Card */}
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Customers
                </CardTitle>
                <Users className="h-4 w-4 text-ceramic-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl md:text-3xl font-bold">
                  {dashboardMetrics.totalCustomers}
                </p>
                <p className="text-xs text-muted-foreground">
                  Active in system
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Expenses Today
                </CardTitle>
                <DollarSign className="h-4 w-4 text-ceramic-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl md:text-3xl font-bold">
                  {formatCurrency(dashboardMetrics.expensesToday)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supplier balances due: {formatCurrency(dashboardMetrics.supplierBalance)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Revenue Chart */}
          <Card className="card-premium lg:col-span-2">
            <CardHeader>
              <CardTitle>Weekly Revenue</CardTitle>
              <CardDescription>Your sales performance this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260} minWidth={0}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#999" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#999" width={42} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#f9f7f4", border: "1px solid #e8d7c5" }} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#C46A32" 
                    dot={{ fill: "#C46A32", r: 5 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Methods Pie Chart */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Sales by method</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260} minWidth={0}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Recent Orders */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between pb-3 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(new Date(order.createdAt))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(order.total)}</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {order.paymentMethod}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best selling items</CardDescription>
            </CardHeader>
            <CardContent>
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                <BarChart
                  data={topProducts}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip contentStyle={{ backgroundColor: "#f9f7f4", border: "1px solid #e8d7c5" }} />
                  <Bar dataKey="sales" fill="#C46A32" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
