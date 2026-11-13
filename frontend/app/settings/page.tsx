"use client";

import { useState } from "react";
import { Save, Moon, Sun, Bell, Lock, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MainLayout } from "@/components/layouts/main-layout";
import { useStore } from "@/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function SettingsPage() {
  const isDarkMode = useStore((state) => state.isDarkMode);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);

  const [businessInfo, setBusinessInfo] = useState({
    name: "Mwazanga Hardware",
    phone: "+1234567890",
    email: "info@mwangazahardware.com",
    address: "123 Main Street, City, State",
    website: "www.mwangazahardware.com",
  });

  const [etimsSettings, setEtimsSettings] = useState({
    enabled: true,
    tin: "TIN-123456789",
    vatNumber: "VAT-123456789",
    branchCode: "BR-001",
    cashRegisterId: "POS-01",
    invoicePrefix: "MHW-",
    apiEndpoint: "https://etims.mwangazahardware.com/api",
    autoSync: true,
  });

  const [receiptSettings, setReceiptSettings] = useState({
    businessName: "Mwazanga Hardware",
    footerText: "Thank you for shopping with Mwazanga Hardware!",
    showLogo: true,
  });

  const [userSettings, setUserSettings] = useState({
    username: "Admin User",
    email: "admin@mwangazahardware.com",
    language: "en",
    timezone: "UTC",
  });

  const handleSaveBusinessInfo = () => {
    toast.success("Business information updated");
  };

  const handleSaveEtimsSettings = () => {
    toast.success("ETIMS settings updated");
  };

  const handleSaveReceiptSettings = () => {
    toast.success("Receipt settings updated");
  };

  const handleSaveUserSettings = () => {
    toast.success("User settings updated");
  };

  return (
    <MainLayout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-ceramic-accent">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your POS system</p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="etims">ETIMS</TabsTrigger>
            <TabsTrigger value="receipt">Receipt</TabsTrigger>
            <TabsTrigger value="user">User</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {/* Business Information */}
          <TabsContent value="business">
            <Card className="card-premium">
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                  Manage your store details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-name">Business Name</Label>
                    <Input
                      id="business-name"
                      value={businessInfo.name}
                      onChange={(e) =>
                        setBusinessInfo({ ...businessInfo, name: e.target.value })
                      }
                      placeholder="Your business name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={businessInfo.phone}
                      onChange={(e) =>
                        setBusinessInfo({ ...businessInfo, phone: e.target.value })
                      }
                      placeholder="Phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={businessInfo.email}
                      onChange={(e) =>
                        setBusinessInfo({ ...businessInfo, email: e.target.value })
                      }
                      placeholder="Email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={businessInfo.address}
                      onChange={(e) =>
                        setBusinessInfo({ ...businessInfo, address: e.target.value })
                      }
                      placeholder="Business address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={businessInfo.website}
                      onChange={(e) =>
                        setBusinessInfo({ ...businessInfo, website: e.target.value })
                      }
                      placeholder="Website URL"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveBusinessInfo}
                  className="bg-ceramic-primary hover:bg-ceramic-primary/90 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ETIMS Integration */}
          <TabsContent value="etims">
            <Card className="card-premium">
              <CardHeader>
                <CardTitle>ETIMS Configuration</CardTitle>
                <CardDescription>
                  Configure tax integration and invoice syncing for Mwazanga Hardware
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-md border border-border p-3 bg-muted/30">
                    <div>
                      <p className="font-medium">Enable ETIMS</p>
                      <p className="text-xs text-muted-foreground">Use ETIMS for compliant invoice submissions</p>
                    </div>
                    <input
                      id="etims-enabled"
                      type="checkbox"
                      checked={etimsSettings.enabled}
                      onChange={(e) =>
                        setEtimsSettings({ ...etimsSettings, enabled: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-border"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="etims-tin">TIN / Tax ID</Label>
                      <Input
                        id="etims-tin"
                        value={etimsSettings.tin}
                        onChange={(e) =>
                          setEtimsSettings({ ...etimsSettings, tin: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="etims-vat">VAT Number</Label>
                      <Input
                        id="etims-vat"
                        value={etimsSettings.vatNumber}
                        onChange={(e) =>
                          setEtimsSettings({ ...etimsSettings, vatNumber: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="etims-branch">Branch Code</Label>
                      <Input
                        id="etims-branch"
                        value={etimsSettings.branchCode}
                        onChange={(e) =>
                          setEtimsSettings({ ...etimsSettings, branchCode: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="etims-cash-register">Cash Register ID</Label>
                      <Input
                        id="etims-cash-register"
                        value={etimsSettings.cashRegisterId}
                        onChange={(e) =>
                          setEtimsSettings({ ...etimsSettings, cashRegisterId: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="etims-prefix">Invoice Prefix</Label>
                      <Input
                        id="etims-prefix"
                        value={etimsSettings.invoicePrefix}
                        onChange={(e) =>
                          setEtimsSettings({ ...etimsSettings, invoicePrefix: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="etims-endpoint">API Endpoint</Label>
                      <Input
                        id="etims-endpoint"
                        value={etimsSettings.apiEndpoint}
                        onChange={(e) =>
                          setEtimsSettings({ ...etimsSettings, apiEndpoint: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-md border border-border p-3 bg-muted/30">
                    <div>
                      <p className="font-medium">Auto sync invoices</p>
                      <p className="text-xs text-muted-foreground">Automatically push sales to ETIMS after payment</p>
                    </div>
                    <input
                      id="etims-auto-sync"
                      type="checkbox"
                      checked={etimsSettings.autoSync}
                      onChange={(e) =>
                        setEtimsSettings({ ...etimsSettings, autoSync: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-border"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveEtimsSettings}
                  className="bg-ceramic-primary hover:bg-ceramic-primary/90 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save ETIMS Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receipt Customization */}
          <TabsContent value="receipt">
            <Card className="card-premium">
              <CardHeader>
                <CardTitle>Receipt Customization</CardTitle>
                <CardDescription>
                  Customize your receipt template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="receipt-name">Business Name on Receipt</Label>
                    <Input
                      id="receipt-name"
                      value={receiptSettings.businessName}
                      onChange={(e) =>
                        setReceiptSettings({
                          ...receiptSettings,
                          businessName: e.target.value,
                        })
                      }
                      placeholder="Business name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footer-text">Footer Text</Label>
                    <Input
                      id="footer-text"
                      value={receiptSettings.footerText}
                      onChange={(e) =>
                        setReceiptSettings({
                          ...receiptSettings,
                          footerText: e.target.value,
                        })
                      }
                      placeholder="Thank you message"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="show-logo"
                      type="checkbox"
                      checked={receiptSettings.showLogo}
                      onChange={(e) =>
                        setReceiptSettings({
                          ...receiptSettings,
                          showLogo: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-border"
                    />
                    <Label htmlFor="show-logo" className="cursor-pointer">
                      Show logo on receipt
                    </Label>
                  </div>
                </div>

                {/* Receipt Preview */}
                <div className="border border-border rounded-lg p-4 bg-muted">
                  <div className="bg-white p-4 rounded text-center space-y-2 text-sm">
                    {receiptSettings.showLogo && (
                      <div className="h-8 w-8 rounded bg-ceramic-primary mx-auto flex items-center justify-center">
                        <span className="text-white font-bold text-xs">MH</span>
                      </div>
                    )}
                    <p className="font-bold">{receiptSettings.businessName}</p>
                    <p className="text-xs text-muted-foreground">
                      {receiptSettings.footerText}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleSaveReceiptSettings}
                  className="bg-ceramic-primary hover:bg-ceramic-primary/90 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Receipt Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Settings */}
          <TabsContent value="user">
            <Card className="card-premium">
              <CardHeader>
                <CardTitle>User Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={userSettings.username}
                      onChange={(e) =>
                        setUserSettings({ ...userSettings, username: e.target.value })
                      }
                      placeholder="Username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-email">Email</Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={userSettings.email}
                      onChange={(e) =>
                        setUserSettings({ ...userSettings, email: e.target.value })
                      }
                      placeholder="Email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <select
                      id="language"
                      value={userSettings.language}
                      onChange={(e) =>
                        setUserSettings({ ...userSettings, language: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    >
                      <option value="en">English</option>
                      <option value="ar">العربية (Arabic)</option>
                      <option value="fr">Français (French)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      value={userSettings.timezone}
                      onChange={(e) =>
                        setUserSettings({ ...userSettings, timezone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">EST</option>
                      <option value="CST">CST</option>
                      <option value="MST">MST</option>
                      <option value="PST">PST</option>
                    </select>
                  </div>
                </div>

                {/* Password Section */}
                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Change Password
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSaveUserSettings}
                  className="bg-ceramic-primary hover:bg-ceramic-primary/90 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance">
            <Card className="card-premium">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the application looks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <Globe className="h-4 w-4" />
                    Theme
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        if (isDarkMode) toggleDarkMode();
                      }}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        !isDarkMode
                          ? "border-ceramic-primary bg-ceramic-primary/5"
                          : "border-border"
                      }`}
                    >
                      <Sun className="h-6 w-6 mx-auto mb-2 text-ceramic-primary" />
                      <p className="font-medium text-sm">Light Mode</p>
                    </button>

                    <button
                      onClick={() => {
                        if (!isDarkMode) toggleDarkMode();
                      }}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        isDarkMode
                          ? "border-ceramic-primary bg-ceramic-primary/5"
                          : "border-border"
                      }`}
                    >
                      <Moon className="h-6 w-6 mx-auto mb-2 text-ceramic-primary" />
                      <p className="font-medium text-sm">Dark Mode</p>
                    </button>
                  </div>

                  <div className="border-t border-border pt-4 space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Notifications
                    </h3>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="low-stock-alert" className="cursor-pointer">
                        Low Stock Alerts
                      </Label>
                      <input
                        id="low-stock-alert"
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 rounded border-border"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="order-notification" className="cursor-pointer">
                        Order Notifications
                      </Label>
                      <input
                        id="order-notification"
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 rounded border-border"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-alerts" className="cursor-pointer">
                        Email Alerts
                      </Label>
                      <input
                        id="email-alerts"
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 rounded border-border"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => toast.success("Appearance settings saved")}
                  className="bg-ceramic-primary hover:bg-ceramic-primary/90 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Appearance
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
