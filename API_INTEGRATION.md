# API Integration Guide

## Overview

This guide explains how to integrate the Mwazanga Hardware POS frontend with the FastAPI backend in `backend/`, backed by Neon PostgreSQL.

---

## Current Architecture

### Backend Structure
- **API**: `backend/main.py`
- **Database schema**: `backend/schema.sql`
- **Database initialization**: `backend/init_db.py`
- **Data types**: Products, Customers, Orders, Categories, Inventory Movements
- **Database**: Neon PostgreSQL via `DATABASE_URL`

### API Integration Path
API calls → Zustand store → Components

---

## Step 1: Setup API Client

### Create API Configuration

Create `frontend/lib/api.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async delete(endpoint: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
  },
};

function getToken(): string {
  // Retrieve token from localStorage or state
  return typeof window !== 'undefined' 
    ? localStorage.getItem('authToken') || '' 
    : '';
}
```

### Environment Configuration

Update `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_NAME=Mwazanga Hardware
```

---

## Step 2: Update Store with API Calls

### Zustand Store Integration

Modify `frontend/store/index.ts` to fetch from API:

```typescript
import { apiClient } from '@/lib/api';

interface State {
  // Products
  products: Product[];
  loadProducts: () => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // ... other domains
}

export const useStore = create<State>((set) => ({
  products: [],

  loadProducts: async () => {
    try {
      const products = await apiClient.get<Product[]>('/products');
      set({ products });
    } catch (error) {
      console.error('Failed to load products:', error);
      throw error;
    }
  },

  addProduct: async (product: Product) => {
    try {
      const newProduct = await apiClient.post<Product>('/products', product);
      set((state) => ({ products: [...state.products, newProduct] }));
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  },

  updateProduct: async (id: string, updates: Partial<Product>) => {
    try {
      const updated = await apiClient.put<Product>(`/products/${id}`, updates);
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? updated : p)),
      }));
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  },

  deleteProduct: async (id: string) => {
    try {
      await apiClient.delete(`/products/${id}`);
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  },

  // ... other actions
}));
```

---

## Step 3: Update Pages to Use API

### Dashboard Example

Before (mock data):
```typescript
// app/dashboard/page.tsx
import { SALES_DATA, PRODUCTS, ORDERS, CUSTOMERS } from '@/data/mock-data';

export default function DashboardPage() {
  const metrics = {
    totalSalesToday: calculateTotal(SALES_DATA),
    // ...
  };
}
```

After (API):
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  
  const loadSalesData = useStore((state) => state.loadSalesData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadSalesData();
        const data = await apiClient.get('/dashboard/metrics');
        setMetrics(data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  
  return (
    <MainLayout>
      {/* Dashboard content */}
    </MainLayout>
  );
}
```

---

## Step 4: Authentication

### Subscription and Paystack M-Pesa

The POS requires an active 30-day subscription costing KSh 3,000. The customer enters only their M-Pesa number. The backend sends a Paystack M-Pesa STK push and activates the subscription after Paystack verifies payment.

Configure these server-side environment variables in the ignored `backend/.env` file. The backend and database initializer both load this file; public frontend settings belong in `frontend/.env.local`:

```env
DATABASE_URL=your-postgresql-connection-string
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-admin-password
PAYSTACK_SECRET_KEY=your-server-side-paystack-secret
AUTH_TOKEN_SECRET=at-least-32-random-characters
PAYSTACK_CUSTOMER_EMAIL=billing@example.com
CORS_ORIGINS=https://your-frontend.example
```

Paystack requires an email in its charge API, so the backend uses `PAYSTACK_CUSTOMER_EMAIL` or falls back to `NEXT_PUBLIC_BUSINESS_EMAIL`. `ADMIN_USERNAME` is the separate username used to sign in; the billing email is server-configured and is not requested from the customer.

Public payment endpoints:

- `POST /subscription/payments/initialize` with `{ "phone": "0712345678" }` and the short-lived bearer token returned by login sends a KSh 3,000 M-Pesa prompt to that number.
- `GET /subscription/payments/verify/{reference}` verifies the Paystack transaction and activates access only when the reference, successful status, KES currency, and KSh 3,000 amount match.
- `POST /paystack/webhook` accepts signed Paystack events and performs server-side verification before activating the subscription. Set this URL in the Paystack dashboard. The subscription activates automatically after Paystack confirms payment, and the subscription page polls while waiting for confirmation.
- `GET /auth/session` validates the signed bearer token and active subscription for the frontend guard.
- `POST /auth/complete-login` exchanges the short-lived login token for an access token after payment succeeds.

`POST /auth/login` verifies credentials before checking subscription status. When the subscription is inactive, it returns HTTP 402 with a 15-minute `subscription_token`; this token can only start payment or be exchanged after payment is confirmed. The frontend stores it in session storage, not as a POS access token. All `/api/*` POS endpoints require a normal access token and active subscription, so direct API calls cannot bypass the dashboard gate. Customers initiate monthly renewals on the subscription page.

Apply the updated database schema with `python backend/init_db.py`. The setup creates `subscriptions` and `subscription_payments` tables. For local testing, use Paystack test credentials. For production, configure the frontend URL in `NEXT_PUBLIC_APP_URL`, the backend API URL in `NEXT_PUBLIC_API_URL`, and the matching frontend origin in `CORS_ORIGINS`. The live secret belongs only in the backend environment, never in a `NEXT_PUBLIC_*` variable.

### Login Integration

Replace demo login with API authentication:

```typescript
// app/page.tsx (login page)
const handleLogin = async (username: string, password: string) => {
  try {
    const response = await fetch(apiRootUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const result = await response.json();

    if (response.status === 402) {
      router.push('/subscribe');
      return;
    }
    if (!response.ok) throw new Error(result.detail || 'Invalid credentials');

    localStorage.setItem('authToken', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    router.push('/dashboard');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Unable to sign in');
  }
};
```

---

## Required Backend Endpoints

### Authentication
- `POST /auth/login` - Login user
- `POST /auth/complete-login` - Complete login after subscription payment
- `GET /auth/session` - Validate the current session and subscription
- `POST /subscription/payments/initialize` - Start Paystack M-Pesa checkout
- `GET /subscription/payments/verify/:reference` - Verify payment and grant access
- `POST /paystack/webhook` - Verify Paystack payment events

### Products
- `GET /products` - List all products
- `GET /products/:id` - Get single product
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Customers
- `GET /customers` - List customers
- `GET /customers/:id` - Get customer details
- `POST /customers` - Create customer
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer

### Orders
- `GET /orders` - List orders
- `GET /orders/:id` - Get order details
- `POST /orders` - Create order (checkout)
- `PUT /orders/:id` - Update order status

### Categories
- `GET /categories` - List categories
- `POST /categories` - Create category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

### Inventory
- `GET /inventory` - List inventory
- `POST /inventory/restock` - Restock items

### Reports
- `GET /reports/dashboard` - Dashboard metrics
- `GET /reports/sales` - Sales data with date range
- `GET /reports/products` - Product performance

---

## Error Handling

### Create Error Boundary

```typescript
'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    toast.error('Something went wrong');
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Error</h1>
      <p className="mb-4 text-gray-600">{error.message}</p>
      <button onClick={reset} className="px-4 py-2 bg-blue-500 text-white rounded">
        Try again
      </button>
    </div>
  );
}
```

---

## Loading States

### Add Loading Skeletons

```typescript
export function ProductSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}
```

---

## Data Persistence

### Session Storage

```typescript
// Store auth token
sessionStorage.setItem('authToken', token);

// Retrieve on app load
const token = sessionStorage.getItem('authToken');
```

### API Response Caching

```typescript
const cache = new Map();

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 5 * 60 * 1000 // 5 minutes
): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

---

## Real-time Updates (Optional)

### WebSocket Integration

```typescript
// lib/websocket.ts
export class WSClient {
  private ws: WebSocket;

  constructor(url: string) {
    this.ws = new WebSocket(url);
  }

  on(event: string, callback: (data: any) => void) {
    this.ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === event) callback(msg.data);
    });
  }

  send(event: string, data: any) {
    this.ws.send(JSON.stringify({ type: event, data }));
  }
}
```

---

## Testing API Integration

### Mock API Responses

```typescript
// __mocks__/api.ts
export const mockApiClient = {
  get: jest.fn().mockResolvedValue([]),
  post: jest.fn().mockResolvedValue({}),
  put: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue(undefined),
};
```

### Test Example

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { mockApiClient } from '@/__mocks__/api';
import DashboardPage from '@/app/dashboard/page';

jest.mock('@/lib/api', () => ({
  apiClient: mockApiClient,
}));

test('loads and displays dashboard metrics', async () => {
  mockApiClient.get.mockResolvedValueOnce([]);
  
  render(<DashboardPage />);
  
  await waitFor(() => {
    expect(screen.getByText(/Total Sales/i)).toBeInTheDocument();
  });
});
```

---

## Migration Timeline

1. **Phase 1**: Setup API client and update store (1-2 days)
2. **Phase 2**: Migrate pages one by one (3-5 days)
3. **Phase 3**: Implement authentication (1-2 days)
4. **Phase 4**: Testing and bug fixes (2-3 days)
5. **Phase 5**: Performance optimization (1-2 days)

---

## Best Practices

✅ **Do:**
- Use consistent error handling
- Add loading states for all API calls
- Implement proper authentication
- Cache frequently accessed data
- Validate API responses
- Log errors for debugging

❌ **Don't:**
- Make API calls in components without useEffect
- Store sensitive data in localStorage
- Ignore network errors
- Hardcode API URLs
- Make too many simultaneous requests

---

## Resources

- [Fetch API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [REST API Best Practices](https://restfulapi.net/)
