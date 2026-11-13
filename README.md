# Mwazanga Hardware POS

A full-stack point-of-sale system for a hardware business. The frontend uses **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **Radix UI**. The backend uses **FastAPI**, **PostgreSQL**, and **Paystack M-Pesa** for monthly subscriptions.

## 🎯 Features

### Dashboard
- Real-time sales metrics and KPIs
- Revenue and order analytics
- Weekly sales charts
- Recent transactions overview
- Top-selling products visualization
- Payment method breakdown

### Point of Sale (POS)
- Fast checkout interface
- Product search and category filtering
- Real-time inventory status
- Shopping cart with quantity adjustment
- Discount management
- Multiple payment methods (Cash, Card, Mobile Money)
- Receipt generation and printing
- Payment confirmation dialogs

### Product Management
- Complete product catalog
- SKU and category management
- Stock quantity tracking
- Product status (In Stock, Low Stock, Out of Stock)
- Add/Edit/Delete products
- Quick product search

### Inventory Management
- Stock level overview
- Low stock alerts
- Inventory valuation
- Restock management
- Inventory history tracking
- Real-time stock updates

### Customer Management
- Customer database
- Contact information
- Loyalty points tracking
- Purchase history
- Customer profiles
- Add new customers

### Reports & Analytics
- Daily sales reports
- Monthly performance trends
- Top-selling products analysis
- Revenue by product
- Payment method analytics
- Pie charts and bar charts
- Customizable date ranges

### Expenses & Suppliers
- Track rent, electricity, wages, transport, repairs, supplies, and other operating expenses
- Maintain supplier contact details and invoice references
- Record multi-item stock purchases and automatically update inventory
- Track partial supplier payments and outstanding balances

### Settings
- Business information configuration
- Receipt customization
- User account settings
- Language and timezone selection
- Theme preferences (Light/Dark mode)
- Notification settings
- Multi-branch support

## 🏗️ Project Structure

```
pos/
├── backend/
│   ├── main.py                 # FastAPI API, auth, POS, subscriptions, Paystack
│   ├── schema.sql              # PostgreSQL schema
│   ├── init_db.py              # Database setup
│   └── tests/                  # Backend tests
├── frontend/
│   ├── app/                    # Login and POS routes
│   ├── components/             # UI controls and layouts
│   ├── hooks/                  # Reusable React hooks
│   ├── lib/                    # API client and shared helpers
│   ├── store/                  # Client-side state
│   ├── types/                  # TypeScript types
│   └── public/                 # Static frontend assets
├── docker-compose.yml          # Local frontend/backend services
└── package.json                # Root convenience commands
```

## 🎨 Color Palette

- **Primary**: #C46A32 (Warm Ceramic Orange)
- **Secondary**: #E8D7C5 (Soft Beige)
- **Accent**: #2F2F2F (Deep Charcoal)
- **Background**: #F9F7F4 (Cream White)

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Radix UI
- **Backend**: FastAPI, Python, PostgreSQL
- **Payments**: Paystack M-Pesa STK push and verified webhooks
- **Language**: TypeScript
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Notifications**: Sonner
- **Date Handling**: date-fns

## 📋 Installation & Setup

### Prerequisites
- Node.js 18.x or higher
- Python 3.10 or higher
- PostgreSQL database
- npm

### Installation Steps

1. **Configure environment**
   - Put backend settings and secrets in the ignored `backend/.env` file.
   - Put public `NEXT_PUBLIC_*` settings in `frontend/.env.local`.
   - See `backend/.env.example`, `frontend/.env.example`, and [ARCHITECTURE.md](ARCHITECTURE.md).

2. **Install dependencies**
   ```bash
   npm ci --prefix frontend
   python -m pip install -r backend/requirements.txt
   ```

3. **Initialize the database and start the backend**
   ```bash
   python backend/init_db.py
   python -m uvicorn backend.main:app --reload --port 8000
   ```

4. **Start the frontend** in a second terminal
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   Navigate to `http://localhost:3000`

### Login Credentials
Use the admin username configured in the ignored `backend/.env` file.

## 🔧 Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Run linter
npm --prefix frontend run lint
```

## 🎯 Key Features Implemented

### Authentication
- Premium login interface with glassmorphism effect
- Username and password authentication
- Remember me functionality
- Forgot password link

### State Management
- Zustand store for cart, orders, customers
- Theme toggle (Light/Dark mode)
- Branch selector for multi-location support

### UI/UX
- Fully responsive design (mobile, tablet, desktop)
- Smooth animations and transitions
- Toast notifications for user feedback
- Loading states and skeleton loaders
- Empty states for better UX
- Confirmation dialogs for destructive actions

### Data Management
- PostgreSQL is the source of truth for saved POS records
- FastAPI validates and persists data
- Zustand manages temporary client-side interaction state
- TypeScript types and shared components keep the frontend consistent

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full-width layout with sidebar navigation
- **Tablet**: Collapsible sidebar with optimized layouts
- **Mobile**: Mobile-first design with hamburger menu

## 🔐 Security Considerations

Authentication, subscription checks, database access, and Paystack requests are
handled by the backend. Keep private keys in `backend/.env`; never put them in
frontend source or `NEXT_PUBLIC_*` variables. Use HTTPS and configure CORS with
only the deployed frontend origin.

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t top-notch-pos .
docker run -p 3000:3000 top-notch-pos
```

### Traditional Server
```bash
npm run build
npm start
```

## 📚 Component Library

The application includes a comprehensive set of reusable UI components:

- **Button**: Multiple variants and sizes
- **Card**: Flexible card component with header, content, footer
- **Input**: Text input with various types
- **Label**: Form label component
- **Dialog**: Modal dialogs for interactions
- **Alert Dialog**: Confirmation dialogs
- **Dropdown Menu**: Context menus
- **Tabs**: Tab navigation
- **Badge**: Status badges

## 🎨 Styling System

The project uses Tailwind CSS with custom extensions:

- Ceramic brand colors
- Custom animations (fade-in, slide-down, slide-up, pulse-soft)
- Glassmorphism effects
- Responsive typography system
- Premium card styles with shadows and rounded corners

## 📝 Code Structure

### Type Safety
All components and functions use TypeScript for type safety:

```typescript
interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  size: string;
  price: number;
  quantity: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
}
```

### State Management Example
```typescript
const { cart, addToCart, removeFromCart, getCartTotal } = useCart();
```

### Component Structure
```typescript
export default function ComponentName() {
  return (
    <MainLayout>
      {/* Component content */}
    </MainLayout>
  );
}
```

## 🔄 Frontend and Backend Responsibilities

The frontend renders pages, collects input, and calls the API. The backend
validates requests, enforces login and subscription access, stores POS data,
and communicates with Paystack. See [ARCHITECTURE.md](ARCHITECTURE.md) for the
folder map and data flow.

## 📞 Support & Contact

For issues, questions, or feature requests related to this POS system, please reach out to the Mwazanga Hardware development team.

## 📄 License

This project is proprietary to Mwazanga Hardware. All rights reserved.

## ✨ Performance Optimizations

- Image optimization with Next.js Image component
- Code splitting and lazy loading
- Efficient state management with Zustand
- Memoized components to prevent unnecessary re-renders
- Optimized bundle size
- CSS-in-JS optimizations

## 🌍 Internationalization Ready

The settings page includes language selection, making the app ready for multi-language support:
- English (en)
- Arabic (ar)
- French (fr)

## 🎓 Learning Resources

This project demonstrates best practices for:
- Next.js 14 App Router
- TypeScript in React
- Tailwind CSS responsive design
- Component composition
- State management
- Form handling
- Data visualization with Recharts

---

**Built with ❤️ for Mwazanga Hardware**
