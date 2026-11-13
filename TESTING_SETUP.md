# Testing Setup Guide

## Overview

This guide covers setting up and running tests for the Mwazanga Hardware POS application using Jest, React Testing Library, and other testing tools.

---

## Installation

### Install Testing Dependencies

```bash
npm install --save-dev \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest-environment-jsdom \
  @types/jest
```

### Update package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## Jest Configuration

### Create `jest.config.js`

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/*.test.ts',
    '**/*.test.tsx',
  ],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

### Create `jest.setup.js`

```javascript
import '@testing-library/jest-dom'
```

---

## Component Testing

### Example: Button Component Test

Create `components/ui/__tests__/button.test.tsx`:

```typescript
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  test('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  test('handles click events', async () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const user = userEvent.setup()
    await user.click(screen.getByText('Click me'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('renders with different variants', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByText('Delete')).toHaveClass('bg-red-600')
  })

  test('renders with different sizes', () => {
    render(<Button size="lg">Large Button</Button>)
    expect(screen.getByText('Large Button')).toHaveClass('h-11')
  })

  test('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText('Disabled')).toBeDisabled()
  })
})
```

### Example: Input Component Test

Create `components/ui/__tests__/input.test.tsx`:

```typescript
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  test('renders input element', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  test('handles user input', async () => {
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText('Enter text') as HTMLInputElement
    
    const user = userEvent.setup()
    await user.type(input, 'Hello')
    
    expect(input.value).toBe('Hello')
  })

  test('handles different input types', () => {
    render(<Input type="email" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
  })

  test('disables input when disabled prop is true', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})
```

---

## Hook Testing

### Example: useCart Hook Test

Create `hooks/__tests__/useCart.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCart } from '@/hooks/useCart'
import { useStore } from '@/store'

// Mock the store
jest.mock('@/store', () => ({
  useStore: jest.fn(),
}))

describe('useCart Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns cart items and functions', () => {
    const mockStore = {
      cart: [],
      addToCart: jest.fn(),
      removeFromCart: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
      getCartTotal: jest.fn(() => 0),
    }
    ;(useStore as jest.Mock).mockReturnValue(mockStore)

    const { result } = renderHook(() => useCart())

    expect(result.current.cart).toEqual([])
    expect(result.current.handleAddToCart).toBeDefined()
    expect(result.current.handleRemoveFromCart).toBeDefined()
  })

  test('handles add to cart', () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 100,
      quantity: 5,
    }

    const mockStore = {
      cart: [],
      addToCart: jest.fn(),
      removeFromCart: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
      getCartTotal: jest.fn(() => 0),
    }
    ;(useStore as jest.Mock).mockReturnValue(mockStore)

    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.handleAddToCart(mockProduct as any)
    })

    expect(mockStore.addToCart).toHaveBeenCalledWith(mockProduct)
  })
})
```

---

## Page Testing

### Example: Dashboard Page Test

Create `app/dashboard/__tests__/page.test.tsx`:

```typescript
import React from 'react'
import { render, screen } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'

// Mock the components and hooks
jest.mock('@/components/layouts/main-layout', () => {
  return function MockMainLayout({ children }: any) {
    return <div>{children}</div>
  }
})

jest.mock('@/data/mock-data', () => ({
  PRODUCTS: [],
  ORDERS: [],
  CUSTOMERS: [],
  SALES_DATA: [],
}))

describe('Dashboard Page', () => {
  test('renders dashboard metrics', () => {
    render(<DashboardPage />)
    
    expect(screen.getByText(/Total Sales/i)).toBeInTheDocument()
    expect(screen.getByText(/Total Orders/i)).toBeInTheDocument()
    expect(screen.getByText(/Low Stock/i)).toBeInTheDocument()
  })

  test('displays KPI cards', () => {
    render(<DashboardPage />)
    
    const cards = screen.getAllByRole('heading', { level: 2 })
    expect(cards.length).toBeGreaterThan(0)
  })
})
```

---

## Store Testing

### Example: Zustand Store Test

Create `store/__tests__/store.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react'
import { useStore } from '@/store'
import { Product } from '@/types'

describe('Zustand Store', () => {
  beforeEach(() => {
    // Reset store state between tests
    const { result } = renderHook(() => useStore())
    act(() => {
      result.current.clearCart()
    })
  })

  describe('Cart Operations', () => {
    test('adds item to cart', () => {
      const { result } = renderHook(() => useStore())

      const product: Product = {
        id: '1',
        name: 'Test Product',
        price: 100,
        quantity: 5,
        sku: 'TEST-001',
        category: 'test',
        size: 'M',
        brand: 'Test',
        image: '',
        status: 'in_stock',
        description: '',
        type: 'tile',
      }

      act(() => {
        result.current.addToCart(product)
      })

      expect(result.current.cart.length).toBe(1)
      expect(result.current.cart[0].product).toEqual(product)
    })

    test('removes item from cart', () => {
      const { result } = renderHook(() => useStore())

      const product: Product = {
        id: '1',
        name: 'Test Product',
        price: 100,
        quantity: 5,
        sku: 'TEST-001',
        category: 'test',
        size: 'M',
        brand: 'Test',
        image: '',
        status: 'in_stock',
        description: '',
        type: 'tile',
      }

      act(() => {
        result.current.addToCart(product)
        result.current.removeFromCart('1')
      })

      expect(result.current.cart.length).toBe(0)
    })

    test('updates item quantity', () => {
      const { result } = renderHook(() => useStore())

      const product: Product = {
        id: '1',
        name: 'Test Product',
        price: 100,
        quantity: 5,
        sku: 'TEST-001',
        category: 'test',
        size: 'M',
        brand: 'Test',
        image: '',
        status: 'in_stock',
        description: '',
        type: 'tile',
      }

      act(() => {
        result.current.addToCart(product)
        result.current.updateQuantity('1', 3)
      })

      expect(result.current.cart[0].quantity).toBe(3)
    })

    test('clears cart', () => {
      const { result } = renderHook(() => useStore())

      const product: Product = {
        id: '1',
        name: 'Test Product',
        price: 100,
        quantity: 5,
        sku: 'TEST-001',
        category: 'test',
        size: 'M',
        brand: 'Test',
        image: '',
        status: 'in_stock',
        description: '',
        type: 'tile',
      }

      act(() => {
        result.current.addToCart(product)
        result.current.clearCart()
      })

      expect(result.current.cart.length).toBe(0)
    })
  })

  describe('Theme Operations', () => {
    test('toggles dark mode', () => {
      const { result } = renderHook(() => useStore())

      const initialMode = result.current.isDarkMode

      act(() => {
        result.current.toggleDarkMode()
      })

      expect(result.current.isDarkMode).toBe(!initialMode)
    })
  })

  describe('Order Operations', () => {
    test('adds order to orders list', () => {
      const { result } = renderHook(() => useStore())

      const order = {
        id: '1',
        orderNumber: 'ORD-001',
        items: [],
        subtotal: 100,
        discount: 0,
        total: 100,
        paymentMethod: 'cash' as const,
        status: 'completed',
        createdAt: new Date(),
      }

      act(() => {
        result.current.addOrder(order)
      })

      expect(result.current.orders.length).toBe(1)
      expect(result.current.orders[0]).toEqual(order)
    })
  })
})
```

---

## Utility Testing

### Example: Format Utilities Test

Create `utils/__tests__/format.test.ts`:

```typescript
import {
  formatCurrency,
  formatDate,
  calculateDiscount,
  getStockStatus,
} from '@/utils/format'

describe('Format Utilities', () => {
  describe('formatCurrency', () => {
    test('formats currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(100)).toBe('$100.00')
      expect(formatCurrency(0.99)).toBe('$0.99')
    })

    test('handles zero', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })
  })

  describe('formatDate', () => {
    test('formats date correctly', () => {
      const date = new Date('2024-05-15')
      expect(formatDate(date)).toBe('May 15, 2024')
    })
  })

  describe('calculateDiscount', () => {
    test('calculates discount correctly', () => {
      expect(calculateDiscount(100, 10)).toBe(90)
      expect(calculateDiscount(500, 50)).toBe(450)
    })
  })

  describe('getStockStatus', () => {
    test('returns correct stock status', () => {
      expect(getStockStatus(0)).toBe('out_of_stock')
      expect(getStockStatus(5)).toBe('low_stock')
      expect(getStockStatus(50)).toBe('in_stock')
    })
  })
})
```

---

## Integration Testing

### Example: POS Checkout Flow Test

Create `app/pos/__tests__/checkout.integration.test.tsx`:

```typescript
import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import POSPage from '@/app/pos/page'

jest.mock('@/components/layouts/main-layout', () => {
  return function MockMainLayout({ children }: any) {
    return <div>{children}</div>
  }
})

jest.mock('@/data/mock-data', () => ({
  PRODUCTS: [
    {
      id: '1',
      name: 'Test Tile',
      price: 100,
      quantity: 10,
      sku: 'TEST-001',
      category: 'Ceramic',
      size: 'M',
      brand: 'Test',
      image: '/test.jpg',
      status: 'in_stock',
      description: 'Test tile',
      type: 'tile',
    },
  ],
  CATEGORIES: [
    { id: '1', name: 'Ceramic Tiles', description: 'Test' },
  ],
}))

describe('POS Checkout Flow', () => {
  test('completes full checkout workflow', async () => {
    const user = userEvent.setup()
    render(<POSPage />)

    // 1. Search for product
    const searchInput = screen.getByPlaceholderText(/search products/i)
    await user.type(searchInput, 'Test')
    expect(screen.getByText('Test Tile')).toBeInTheDocument()

    // 2. Add to cart
    const addButton = screen.getByRole('button', { name: /add to cart/i })
    await user.click(addButton)
    expect(screen.getByText(/1 items in cart/i)).toBeInTheDocument()

    // 3. Adjust quantity
    const increaseButton = screen.getByRole('button', { name: /\+/i })
    await user.click(increaseButton)
    expect(screen.getByDisplayValue('2')).toBeInTheDocument()

    // 4. Apply discount
    const discountInput = screen.getByPlaceholderText(/discount/i)
    await user.type(discountInput, '10')

    // 5. Select payment method
    const paymentButtons = screen.getAllByRole('button', { name: /cash|card|mobile/i })
    await user.click(paymentButtons[0])

    // 6. Checkout
    const checkoutButton = screen.getByRole('button', { name: /checkout/i })
    await user.click(checkoutButton)

    // 7. Confirm order
    const confirmButton = screen.getByRole('button', { name: /confirm order|complete/i })
    await user.click(confirmButton)

    expect(screen.getByText(/receipt|order confirmed/i)).toBeInTheDocument()
  })
})
```

---

## Snapshot Testing

### Example: Component Snapshot Test

Create `components/ui/__tests__/card.snapshot.test.tsx`:

```typescript
import React from 'react'
import { render } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

describe('Card Component Snapshot', () => {
  test('renders correctly', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
          <CardDescription>Test description</CardDescription>
        </CardHeader>
        <CardContent>Test content</CardContent>
      </Card>
    )

    expect(container.firstChild).toMatchSnapshot()
  })
})
```

---

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="Cart"
```

### Coverage Report

```
Statements   : 80%
Branches     : 75%
Functions    : 80%
Lines        : 80%
```

---

## Best Practices

✅ **Do:**
- Test user interactions, not implementation
- Use `screen` queries instead of `getByTestId`
- Write integration tests for flows
- Use `act()` for state updates
- Mock external dependencies
- Keep tests simple and focused
- Use descriptive test names

❌ **Don't:**
- Test implementation details
- Use shallow rendering
- Write overly complex tests
- Mock things you shouldn't
- Skip error cases
- Have flaky tests
- Test third-party libraries

---

## Common Test Patterns

### Testing Async Operations

```typescript
test('handles async data loading', async () => {
  const user = userEvent.setup()
  
  render(<ComponentWithAsync />)
  
  expect(screen.getByText(/loading/i)).toBeInTheDocument()
  
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    expect(screen.getByText(/data/i)).toBeInTheDocument()
  })
})
```

### Testing Error States

```typescript
test('displays error message on failure', async () => {
  const errorMessage = 'Something went wrong'
  
  jest.spyOn(console, 'error').mockImplementation(() => {})
  
  render(<ComponentWithError error={errorMessage} />)
  
  expect(screen.getByText(errorMessage)).toBeInTheDocument()
  
  jest.restoreAllMocks()
})
```

### Testing Form Submission

```typescript
test('submits form with data', async () => {
  const handleSubmit = jest.fn()
  const user = userEvent.setup()
  
  render(<Form onSubmit={handleSubmit} />)
  
  await user.type(screen.getByLabelText('Email'), 'test@test.com')
  await user.click(screen.getByRole('button', { name: /submit/i }))
  
  expect(handleSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ email: 'test@test.com' })
  )
})
```

---

## Testing Checklist

- [ ] Unit tests for components
- [ ] Unit tests for hooks
- [ ] Unit tests for utilities
- [ ] Integration tests for features
- [ ] Snapshot tests for critical components
- [ ] Accessibility tests
- [ ] E2E tests for critical flows
- [ ] Error boundary tests
- [ ] Performance tests
- [ ] Security tests

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://testingjavascript.com/)
- [Next.js Testing](https://nextjs.org/docs/testing)
