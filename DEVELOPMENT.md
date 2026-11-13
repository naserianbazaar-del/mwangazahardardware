# Development Guide - Mwazanga Hardware POS

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm
- Python 3.10 or higher
- PostgreSQL database

### Initial Setup

1. **Install frontend and backend dependencies**
   ```bash
   npm ci --prefix frontend
   python -m pip install -r backend/requirements.txt
   ```

2. **Configure environment variables**
   ```powershell
   if (!(Test-Path backend/.env)) {
     Copy-Item backend/.env.example backend/.env
   }
   if (!(Test-Path frontend/.env.local)) {
     Copy-Item frontend/.env.example frontend/.env.local
   }
   ```
   Add private backend credentials to `backend/.env`. Keep only public
   `NEXT_PUBLIC_*` settings in `frontend/.env.local`.

3. **Initialize the database and start the backend**
   ```bash
   python backend/init_db.py
   python -m uvicorn backend.main:app --reload --port 8000
   ```

4. **Start the frontend** in a second terminal
   ```bash
   npm run dev
   ```

5. **Open Browser**
   Navigate to `http://localhost:3000`

## 📝 Project Structure

The repository is split into two deployable applications:

- `frontend/` contains the Next.js UI: `app/` routes, `components/`, React
  `hooks/`, the API client in `lib/`, client state in `store/`, TypeScript
  contracts in `types/`, and static assets in `public/`.
- `backend/` contains the FastAPI service, PostgreSQL schema and initializer,
  Python dependencies, Dockerfile, and automated tests in `tests/`.
- The root `package.json` provides convenience commands. The ignored root
  `backend/.env` is for backend-only configuration; `frontend/.env.local` is for
  public frontend settings.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the complete folder map and clear
frontend/backend responsibility boundaries.

## 🛠️ Development Workflow

### Adding a New Page

1. Create a route directory in `frontend/app`
   ```bash
   mkdir frontend/app/new-feature
   ```

2. Create `page.tsx`
   ```typescript
   "use client";
   import { MainLayout } from "@/components/layouts/main-layout";
   
   export default function NewFeaturePage() {
     return (
       <MainLayout>
         <div className="p-6 md:p-8">
           {/* Your content */}
         </div>
       </MainLayout>
     );
   }
   ```

3. Update sidebar navigation in `frontend/components/layouts/sidebar.tsx`

### Adding a New UI Component

1. Create component in `frontend/components/ui/component-name.tsx`
2. Export from `frontend/components/ui/index.ts`
3. Use in pages/layouts

Example:
```typescript
import { Button } from "@/components/ui/button";
```

### Adding a New Store Slice

Edit `frontend/store/index.ts`:
```typescript
export const useStore = create<StoreState>((set, get) => ({
  // Your state and actions
  newFeature: false,
  toggleNewFeature: () => set((state) => ({
    newFeature: !state.newFeature,
  })),
}));
```

## 🎨 Styling Guidelines

### Using Tailwind CSS

```typescript
<div className="p-6 md:p-8 space-y-6">
  <h1 className="text-3xl md:text-4xl font-bold text-ceramic-accent">
    Page Title
  </h1>
</div>
```

### Ceramic Brand Colors

```typescript
// Use these predefined colors
className="text-ceramic-primary"      // #C46A32
className="bg-ceramic-primary"        // #C46A32
className="text-ceramic-secondary"    // #E8D7C5
className="text-ceramic-accent"       // #2F2F2F
className="bg-ceramic-background"     // #F9F7F4
```

### Responsive Breakpoints

- `sm` - 640px
- `md` - 768px
- `lg` - 1024px
- `xl` - 1280px
- `2xl` - 1536px

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* responsive grid */}
</div>
```

## 🔄 State Management with Zustand

### Using the Store

```typescript
import { useStore } from "@/store";

export default function Component() {
  const cart = useStore((state) => state.cart);
  const addToCart = useStore((state) => state.addToCart);
  
  return (
    <button onClick={() => addToCart(product)}>
      Add to Cart
    </button>
  );
}
```

### Creating a New Store Slice

```typescript
// In store/index.ts
myFeature: [],
addMyFeature: (item) => set((state) => ({
  myFeature: [...state.myFeature, item],
})),
```

## 📊 Using Recharts

```typescript
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="revenue" stroke="#C46A32" />
  </LineChart>
</ResponsiveContainer>
```

## 🔧 Common Tasks

### Display Toast Notification

```typescript
import { toast } from "sonner";

// Success
toast.success("Operation successful");

// Error
toast.error("Something went wrong");

// Loading
const promise = new Promise((resolve, reject) => {
  setTimeout(() => resolve("Done"), 2000);
});
toast.promise(promise, {
  loading: "Loading...",
  success: "Success!",
  error: "Error!",
});
```

### Format Currency

```typescript
import { formatCurrency } from "@/utils/format";

<span>{formatCurrency(1234.56)}</span>
// Output: $1,234.56
```

### Format Date

```typescript
import { formatDate, formatDateTime } from "@/utils/format";

<span>{formatDate(new Date())}</span>
// Output: May 11, 2024

<span>{formatDateTime(new Date())}</span>
// Output: May 11, 2024, 02:30 PM
```

## 🧪 Testing

Currently, the project doesn't have testing setup. To add:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest @types/jest
```

## 📦 Building for Production

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Test Production Build Locally**
   ```bash
   npm start
   ```

3. **Deploy**
   - **Vercel**: `vercel deploy`
   - **Docker**: `docker build -t pos . && docker run -p 3000:3000 pos`
   - **Traditional Server**: Copy `.next` folder and run `npm start`

## 🐛 Debugging

### Next.js Inspector

```typescript
// In development mode, press 'Shift + Click' on any element
```

### Console Logging

```typescript
console.log("Debug info", variableName);
```

### React DevTools Browser Extension

Install the React DevTools Chrome/Firefox extension for better component debugging.

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [ShadCN UI](https://ui.shadcn.com/)
- [Zustand Docs](https://zustand-demo.vercel.app/)
- [Recharts Docs](https://recharts.org/)

## 🤝 Code Style

### TypeScript
- Use explicit types instead of `any`
- Use interfaces for objects
- Use proper naming conventions

### React
- Use functional components
- Use hooks for state management
- Keep components small and focused

### Tailwind CSS
- Use utility classes for styling
- Avoid inline styles
- Use responsive prefixes (sm, md, lg)

## 💡 Tips & Tricks

### Faster Development
1. Use the browser dev tools
2. Use Next.js fast refresh feature
3. Keep components modular
4. Use TypeScript for better error detection

### Performance
1. Use lazy loading for images
2. Memoize expensive computations
3. Use `next/dynamic` for code splitting
4. Optimize bundle size

### Maintenance
1. Keep code DRY (Don't Repeat Yourself)
2. Use consistent naming conventions
3. Write self-documenting code
4. Add comments for complex logic

## 🚀 Deployment Checklist

- [ ] Remove console.log statements
- [ ] Update environment variables
- [ ] Test all functionality
- [ ] Check mobile responsiveness
- [ ] Verify performance
- [ ] Setup monitoring
- [ ] Configure error tracking
- [ ] Test on production domain
- [ ] Setup CI/CD pipeline
- [ ] Document API endpoints

---

Happy coding! 🎉
