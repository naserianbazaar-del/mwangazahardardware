"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Wallet, Truck, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet, apiPost } from "@/lib/api";
import { formatCurrency } from "@/utils/format";
import type {
  Expense,
  ExpenseCategory,
  PaymentMethod,
  Product,
  Supplier,
  SupplierPayment,
  SupplierPurchase,
} from "@/types";
import { toast } from "sonner";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";

const expenseCategories: { value: ExpenseCategory; label: string }[] = [
  { value: "rent", label: "Rent" },
  { value: "electricity", label: "Electricity" },
  { value: "wages", label: "Wages" },
  { value: "transport", label: "Transport" },
  { value: "repairs", label: "Repairs" },
  { value: "supplies", label: "Supplies" },
  { value: "other", label: "Other" },
];

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "mobile", label: "Mobile money" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank transfer" },
];

const today = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};
const localDateTime = (value: string) => new Date(value).toLocaleString();

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<SupplierPurchase[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: "rent" as ExpenseCategory,
    payee: "",
    amount: "",
    paymentMethod: "cash" as PaymentMethod,
    expenseDate: today(),
    reference: "",
    notes: "",
  });
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: "",
    amountPaid: "",
    paymentMethod: "cash" as PaymentMethod,
    invoiceNumber: "",
  });
  const [purchaseItems, setPurchaseItems] = useState([
    { productId: "", quantity: "1", unitCost: "" },
  ]);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [paymentMethodByPurchase, setPaymentMethodByPurchase] = useState<
    Record<string, PaymentMethod>
  >({});
  const refreshKey = useRefreshOnFocus();

  const loadData = async () => {
    const [expenseList, supplierList, purchaseList, paymentList, productList] =
      await Promise.all([
        apiGet<Expense[]>("/expenses"),
        apiGet<Supplier[]>("/suppliers"),
        apiGet<SupplierPurchase[]>("/supplier-purchases"),
        apiGet<SupplierPayment[]>("/supplier-payments"),
        apiGet<Product[]>("/products"),
      ]);
    setExpenses(expenseList);
    setSuppliers(supplierList);
    setPurchases(purchaseList);
    setPayments(paymentList);
    setProducts(productList);
    setPurchaseForm((current) => ({
      ...current,
      supplierId: current.supplierId || supplierList[0]?.id || "",
    }));
    setPurchaseItems((current) =>
      current.map((item, index) => ({
        ...item,
        productId: item.productId || (index === 0 ? productList[0]?.id || "" : ""),
      }))
    );
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      apiGet<Expense[]>("/expenses"),
      apiGet<Supplier[]>("/suppliers"),
      apiGet<SupplierPurchase[]>("/supplier-purchases"),
      apiGet<SupplierPayment[]>("/supplier-payments"),
      apiGet<Product[]>("/products"),
    ])
      .then(([expenseList, supplierList, purchaseList, paymentList, productList]) => {
        if (!active) return;
        setExpenses(expenseList);
        setSuppliers(supplierList);
        setPurchases(purchaseList);
        setPayments(paymentList);
        setProducts(productList);
        setPurchaseForm((current) => ({
          ...current,
          supplierId: current.supplierId || supplierList[0]?.id || "",
        }));
        setPurchaseItems((current) =>
          current.map((item, index) => ({
            ...item,
            productId: item.productId || (index === 0 ? productList[0]?.id || "" : ""),
          }))
        );
      })
      .catch((error: unknown) => {
        if (active) {
          toast.error(
            error instanceof Error ? `Unable to load expenses: ${error.message}` : "Unable to load expenses"
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const operatingExpenseTotal = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [expenses]
  );
  const supplierBalanceTotal = useMemo(
    () => purchases.reduce((sum, purchase) => sum + Number(purchase.balance), 0),
    [purchases]
  );

  const handleExpenseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const created = await apiPost<Expense>("/expenses", {
        category: expenseForm.category,
        payee: expenseForm.payee,
        amount: Number(expenseForm.amount),
        payment_method: expenseForm.paymentMethod,
        expense_date: expenseForm.expenseDate,
        reference: expenseForm.reference || null,
        notes: expenseForm.notes || null,
      });
      setExpenses((current) => [created, ...current]);
      setExpenseForm({
        category: "rent",
        payee: "",
        amount: "",
        paymentMethod: "cash",
        expenseDate: today(),
        reference: "",
        notes: "",
      });
      toast.success("Expense recorded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to record expense");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSupplierSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const created = await apiPost<Supplier>("/suppliers", supplierForm);
      setSuppliers((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setPurchaseForm((current) => ({ ...current, supplierId: current.supplierId || created.id }));
      setSupplierForm({ name: "", phone: "", email: "", address: "" });
      toast.success("Supplier added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add supplier");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePurchaseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !purchaseForm.supplierId ||
      purchaseItems.length === 0 ||
      purchaseItems.some(
        (item) =>
          !item.productId ||
          Number(item.quantity) <= 0 ||
          !Number.isFinite(Number(item.unitCost)) ||
          Number(item.unitCost) < 0
      )
    ) {
      toast.error("Add a supplier and select a product first");
      return;
    }
    setIsSaving(true);
    try {
      await apiPost("/supplier-purchases", {
        supplier_id: purchaseForm.supplierId,
        invoice_number: purchaseForm.invoiceNumber,
        items: purchaseItems.map((item) => ({
          product_id: item.productId,
          quantity: Number(item.quantity),
          unit_cost: Number(item.unitCost),
        })),
        amount_paid: Number(purchaseForm.amountPaid || 0),
        payment_method: purchaseForm.paymentMethod,
      });
      await loadData();
      setPurchaseForm((current) => ({
        ...current,
        invoiceNumber: "",
        amountPaid: "",
      }));
      setPurchaseItems([{ productId: products[0]?.id || "", quantity: "1", unitCost: "" }]);
      toast.success("Supplier purchase recorded and stock updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to record supplier purchase");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSupplierPayment = async (purchase: SupplierPurchase) => {
    const amount = Number(paymentAmounts[purchase.id]);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a payment amount greater than zero");
      return;
    }

    setIsSaving(true);
    try {
      await apiPost(`/supplier-purchases/${purchase.id}/payments`, {
        amount,
        payment_method: paymentMethodByPurchase[purchase.id] || "cash",
      });
      await loadData();
      setPaymentAmounts((current) => ({ ...current, [purchase.id]: "" }));
      toast.success("Supplier payment recorded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to record supplier payment");
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <div className="space-y-6 p-6 md:p-8">
        <header>
          <h1 className="text-3xl font-bold text-ceramic-accent md:text-4xl">Expenses</h1>
          <p className="mt-1 text-muted-foreground">
            Track operating costs, supplier invoices, payments, and incoming stock.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Operating expenses recorded</CardDescription>
              <CardTitle>{formatCurrency(operatingExpenseTotal)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Outstanding supplier balance</CardDescription>
              <CardTitle>{formatCurrency(supplierBalanceTotal)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="operating">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="operating">Operating Expenses</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers & Stock Purchases</TabsTrigger>
          </TabsList>

          <TabsContent value="operating" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" /> Record an expense
                </CardTitle>
                <CardDescription>
                  Use this for rent, electricity, wages, transport, repairs, and other running costs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleExpenseSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="expense-category">Category</Label>
                    <select
                      id="expense-category"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={expenseForm.category}
                      onChange={(event) =>
                        setExpenseForm((current) => ({
                          ...current,
                          category: event.target.value as ExpenseCategory,
                        }))
                      }
                    >
                      {expenseCategories.map((category) => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-payee">Paid to / worker *</Label>
                    <Input id="expense-payee" required value={expenseForm.payee} onChange={(event) => setExpenseForm((current) => ({ ...current, payee: event.target.value }))} placeholder="Landlord or employee name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-amount">Amount (KES) *</Label>
                    <Input id="expense-amount" type="number" min="0.01" step="0.01" required value={expenseForm.amount} onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-method">Payment method</Label>
                    <select id="expense-method" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={expenseForm.paymentMethod} onChange={(event) => setExpenseForm((current) => ({ ...current, paymentMethod: event.target.value as PaymentMethod }))}>
                      {paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-date">Date</Label>
                    <Input id="expense-date" type="date" value={expenseForm.expenseDate} onChange={(event) => setExpenseForm((current) => ({ ...current, expenseDate: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-reference">Receipt / reference</Label>
                    <Input id="expense-reference" value={expenseForm.reference} onChange={(event) => setExpenseForm((current) => ({ ...current, reference: event.target.value }))} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="expense-notes">Notes</Label>
                    <Input id="expense-notes" value={expenseForm.notes} onChange={(event) => setExpenseForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional details" />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" disabled={isSaving}><Plus className="mr-2 h-4 w-4" />Record expense</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Expense history</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? <p className="text-sm text-muted-foreground">Loading expenses…</p> : expenses.length === 0 ? <p className="text-sm text-muted-foreground">No operating expenses recorded yet.</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-sm">
                      <thead><tr className="border-b text-muted-foreground"><th className="p-2">Date</th><th className="p-2">Category</th><th className="p-2">Payee</th><th className="p-2">Method</th><th className="p-2 text-right">Amount</th><th className="p-2">Reference</th></tr></thead>
                      <tbody>{expenses.map((expense) => <tr key={expense.id} className="border-b last:border-0"><td className="p-2">{localDateTime(expense.expenseDate)}</td><td className="p-2 capitalize">{expense.category}</td><td className="p-2">{expense.payee}</td><td className="p-2 capitalize">{expense.paymentMethod}</td><td className="p-2 text-right">{formatCurrency(Number(expense.amount))}</td><td className="p-2">{expense.reference || "—"}</td></tr>)}</tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Add supplier</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleSupplierSubmit} className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2"><Label htmlFor="supplier-name">Supplier name *</Label><Input id="supplier-name" required value={supplierForm.name} onChange={(event) => setSupplierForm((current) => ({ ...current, name: event.target.value }))} /></div>
                    <div className="space-y-2"><Label htmlFor="supplier-phone">Phone</Label><Input id="supplier-phone" value={supplierForm.phone} onChange={(event) => setSupplierForm((current) => ({ ...current, phone: event.target.value }))} /></div>
                    <div className="space-y-2"><Label htmlFor="supplier-email">Email</Label><Input id="supplier-email" type="email" value={supplierForm.email} onChange={(event) => setSupplierForm((current) => ({ ...current, email: event.target.value }))} /></div>
                    <div className="space-y-2 sm:col-span-2"><Label htmlFor="supplier-address">Address</Label><Input id="supplier-address" value={supplierForm.address} onChange={(event) => setSupplierForm((current) => ({ ...current, address: event.target.value }))} /></div>
                    <Button type="submit" disabled={isSaving}><Plus className="mr-2 h-4 w-4" />Add supplier</Button>
                  </form>
                  <div className="mt-5 space-y-2">
                    {suppliers.map((supplier) => <div key={supplier.id} className="rounded-md border p-3 text-sm"><p className="font-medium">{supplier.name}</p><p className="text-muted-foreground">{[supplier.phone, supplier.email].filter(Boolean).join(" • ") || "No contact details"}</p></div>)}
                    {!isLoading && suppliers.length === 0 && <p className="text-sm text-muted-foreground">Add a supplier to record stock purchases.</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Receive a supplier purchase</CardTitle>
                  <CardDescription>Receiving stock increases inventory. Any unpaid balance remains due to the supplier.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePurchaseSubmit} className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2"><Label htmlFor="purchase-supplier">Supplier *</Label><select id="purchase-supplier" required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={purchaseForm.supplierId} onChange={(event) => setPurchaseForm((current) => ({ ...current, supplierId: event.target.value }))}><option value="">Select supplier</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></div>
                    <div className="space-y-3 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <Label>Products received *</Label>
                        <Button type="button" size="sm" variant="outline" onClick={() => setPurchaseItems((current) => [...current, { productId: "", quantity: "1", unitCost: "" }])}><Plus className="mr-1 h-4 w-4" />Add item</Button>
                      </div>
                      {purchaseItems.map((item, index) => (
                        <div key={index} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
                          <select aria-label={`Product received ${index + 1}`} required className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm" value={item.productId} onChange={(event) => setPurchaseItems((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, productId: event.target.value } : line))}><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} (stock: {product.quantity})</option>)}</select>
                          <Input aria-label={`Quantity received ${index + 1}`} type="number" min="1" step="1" required value={item.quantity} onChange={(event) => setPurchaseItems((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, quantity: event.target.value } : line))} placeholder="Quantity" />
                          <Input aria-label={`Unit cost ${index + 1}`} type="number" min="0" step="0.01" required value={item.unitCost} onChange={(event) => setPurchaseItems((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, unitCost: event.target.value } : line))} placeholder="Unit cost" />
                          {purchaseItems.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label={`Remove product ${index + 1}`} onClick={() => setPurchaseItems((current) => current.filter((_, lineIndex) => lineIndex !== index))}><X className="h-4 w-4" /></Button>}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2"><Label htmlFor="purchase-paid">Amount paid now (KES)</Label><Input id="purchase-paid" type="number" min="0" step="0.01" value={purchaseForm.amountPaid} onChange={(event) => setPurchaseForm((current) => ({ ...current, amountPaid: event.target.value }))} placeholder="0.00 if unpaid" /></div>
                    <div className="space-y-2"><Label htmlFor="purchase-method">Payment method</Label><select id="purchase-method" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={purchaseForm.paymentMethod} onChange={(event) => setPurchaseForm((current) => ({ ...current, paymentMethod: event.target.value as PaymentMethod }))}>{paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}</select></div>
                    <div className="space-y-2 sm:col-span-2"><Label htmlFor="purchase-invoice">Invoice / reference</Label><Input id="purchase-invoice" value={purchaseForm.invoiceNumber} onChange={(event) => setPurchaseForm((current) => ({ ...current, invoiceNumber: event.target.value }))} /></div>
                    <Button type="submit" disabled={isSaving || suppliers.length === 0 || products.length === 0}><Plus className="mr-2 h-4 w-4" />Record purchase & receive stock</Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Supplier invoices and balances</CardTitle><CardDescription>Record partial or final payments against outstanding supplier invoices.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {purchases.map((purchase) => (
                  <div key={purchase.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_auto]">
                    <div className="space-y-1">
                      <p className="font-semibold">{purchase.supplierName} <span className="font-normal text-muted-foreground">{purchase.invoiceNumber ? `• ${purchase.invoiceNumber}` : ""}</span></p>
                      <p className="text-sm text-muted-foreground">{localDateTime(purchase.purchaseDate)} · {purchase.status}</p>
                      <p className="text-sm">Invoice: {formatCurrency(Number(purchase.total))} · Paid: {formatCurrency(Number(purchase.amountPaid))} · Balance: <span className="font-semibold">{formatCurrency(Number(purchase.balance))}</span></p>
                    </div>
                    {Number(purchase.balance) > 0 && (
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="space-y-1"><Label htmlFor={`payment-${purchase.id}`}>Payment (KES)</Label><Input id={`payment-${purchase.id}`} className="w-36" type="number" min="0.01" max={purchase.balance} step="0.01" value={paymentAmounts[purchase.id] || ""} onChange={(event) => setPaymentAmounts((current) => ({ ...current, [purchase.id]: event.target.value }))} /></div>
                        <select aria-label="Supplier payment method" className="h-10 rounded-md border border-input bg-background px-2 text-sm" value={paymentMethodByPurchase[purchase.id] || "cash"} onChange={(event) => setPaymentMethodByPurchase((current) => ({ ...current, [purchase.id]: event.target.value as PaymentMethod }))}>{paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}</select>
                        <Button disabled={isSaving} onClick={() => void handleSupplierPayment(purchase)}>Record payment</Button>
                      </div>
                    )}
                  </div>
                ))}
                {!isLoading && purchases.length === 0 && <p className="text-sm text-muted-foreground">No supplier purchases recorded yet.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Supplier payment history</CardTitle></CardHeader>
              <CardContent>
                {payments.length === 0 ? <p className="text-sm text-muted-foreground">No supplier payments recorded yet.</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left text-sm">
                      <thead><tr className="border-b text-muted-foreground"><th className="p-2">Date</th><th className="p-2">Supplier</th><th className="p-2">Invoice</th><th className="p-2">Method</th><th className="p-2 text-right">Amount</th></tr></thead>
                      <tbody>{payments.map((payment) => <tr key={payment.id} className="border-b last:border-0"><td className="p-2">{localDateTime(payment.paymentDate)}</td><td className="p-2">{payment.supplierName}</td><td className="p-2">{payment.invoiceNumber || "—"}</td><td className="p-2 capitalize">{payment.paymentMethod}</td><td className="p-2 text-right">{formatCurrency(Number(payment.amount))}</td></tr>)}</tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
