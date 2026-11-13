# Component Reference Guide

## UI Components

All UI components are located in `components/ui/` and built on top of Radix UI primitives with Tailwind CSS styling.

---

## Button Component

**Location**: `components/ui/button.tsx`

### Usage

```tsx
import { Button } from '@/components/ui/button';

export function MyComponent() {
  return (
    <>
      <Button>Default Button</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">🔍</Button>
      
      <Button disabled>Disabled</Button>
    </>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'secondary' \| 'destructive' \| 'outline' \| 'ghost' \| 'link'` | `'default'` | Button style variant |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Button size |
| `disabled` | `boolean` | `false` | Disable button |
| `asChild` | `boolean` | `false` | Render as child element |

---

## Input Component

**Location**: `components/ui/input.tsx`

### Usage

```tsx
import { Input } from '@/components/ui/input';

export function MyComponent() {
  return (
    <>
      <Input placeholder="Enter text..." />
      <Input type="email" placeholder="Email address" />
      <Input type="password" placeholder="Password" />
      <Input type="number" placeholder="Quantity" />
      <Input disabled placeholder="Disabled input" />
    </>
  );
}
```

### Props

All HTML input attributes are supported:
- `type` - Input type (text, email, password, number, etc.)
- `placeholder` - Placeholder text
- `disabled` - Disable input
- `value` - Input value
- `onChange` - Change handler
- `ref` - Forward ref

---

## Card Component

**Location**: `components/ui/card.tsx`

### Usage

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        Content area
      </CardContent>
      <CardFooter>
        Footer content
      </CardFooter>
    </Card>
  );
}
```

### Composability

All card parts can be used together or separately for flexible layouts.

---

## Label Component

**Location**: `components/ui/label.tsx`

### Usage

```tsx
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function MyComponent() {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email Address</Label>
      <Input id="email" type="email" />
    </div>
  );
}
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `htmlFor` | `string` | Associated input ID |
| `disabled` | `boolean` | Disable label styling |

---

## Dialog Component

**Location**: `components/ui/dialog.tsx`

### Usage

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function MyComponent() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            This is a dialog description
          </DialogDescription>
        </DialogHeader>
        <div>Dialog content goes here</div>
        <DialogFooter>
          <Button>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Features

- Modal backdrop with blur effect
- Smooth animations
- Accessible focus management
- Escape key to close

---

## Alert Dialog Component

**Location**: `components/ui/alert-dialog.tsx`

### Usage

```tsx
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export function MyComponent() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Item</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleDelete()}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Use Cases

- Destructive action confirmations
- Important warnings
- One-time confirmations

---

## Badge Component

**Location**: `components/ui/badge.tsx`

### Usage

```tsx
import { Badge } from '@/components/ui/badge';

export function MyComponent() {
  return (
    <>
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </>
  );
}
```

### Variants

- `default` - Primary ceramic color
- `secondary` - Secondary color
- `destructive` - Red for errors/warnings
- `outline` - Bordered style

### Use Cases

- Status indicators
- Category tags
- Stock levels
- Payment methods

---

## Tabs Component

**Location**: `components/ui/tabs.tsx`

### Usage

```tsx
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';

export function MyComponent() {
  return (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        Content for tab 1
      </TabsContent>
      <TabsContent value="tab2">
        Content for tab 2
      </TabsContent>
      <TabsContent value="tab3">
        Content for tab 3
      </TabsContent>
    </Tabs>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultValue` | `string` | - | Active tab by default |
| `value` | `string` | - | Controlled active tab |
| `onValueChange` | `(value: string) => void` | - | Tab change handler |

---

## Dropdown Menu Component

**Location**: `components/ui/dropdown-menu.tsx`

### Usage

```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function MyComponent() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Delete</DropdownMenuItem>
        <DropdownMenuCheckboxItem>
          Enable notifications
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Features

- Keyboard navigation
- Nested submenus
- Checkboxes and radio groups
- Icon support

---

## Layout Components

### Sidebar Component

**Location**: `components/layouts/sidebar.tsx`

Used for main navigation menu.

```tsx
import { Sidebar } from '@/components/layouts/sidebar';

export function MyLayout() {
  return <Sidebar />;
}
```

### Features

- 8 main navigation items
- Active state highlighting
- Branch selector
- Sync time display
- Mobile responsive

---

### Navbar Component

**Location**: `components/layouts/navbar.tsx`

Used for top navigation bar.

```tsx
import { Navbar } from '@/components/layouts/navbar';

export function MyLayout() {
  return <Navbar />;
}
```

### Features

- Search bar
- Notifications dropdown
- Theme toggle
- User menu
- Responsive mobile view

---

### Main Layout Component

**Location**: `components/layouts/main-layout.tsx`

Wrapper combining Sidebar and Navbar.

```tsx
import { MainLayout } from '@/components/layouts/main-layout';

export default function Page() {
  return (
    <MainLayout>
      {/* Page content */}
    </MainLayout>
  );
}
```

---

## Creating New Components

### Component Structure

```tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const MyComponent = React.forwardRef<
  HTMLDivElement,
  MyComponentProps
>(({ className, variant = 'default', size = 'md', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'base-classes',
      {
        'variant-default': variant === 'default',
        'variant-secondary': variant === 'secondary',
        'size-sm': size === 'sm',
        'size-md': size === 'md',
        'size-lg': size === 'lg',
      },
      className
    )}
    {...props}
  />
));

MyComponent.displayName = 'MyComponent';
```

### Best Practices

✅ **Do:**
- Use `forwardRef` for wrapper components
- Set `displayName` for debugging
- Support HTML attributes via spreading
- Use `cn()` utility for class merging
- Document props with TypeScript interfaces

❌ **Don't:**
- Hardcode class names without merging
- Forget `forwardRef` when needed
- Create overly complex components
- Mix styled and unstyled components

---

## Component Library

Import all UI components from `components/ui/index.ts`:

```tsx
import {
  Button,
  Input,
  Card,
  Dialog,
  Badge,
  Tabs,
  // ... other components
} from '@/components/ui';
```

---

## Styling Components

### Using Tailwind CSS

```tsx
<div className="p-4 bg-ceramic-primary text-white rounded-lg shadow-md">
  Styled content
</div>
```

### Custom Ceramic Colors

```tsx
// Primary: #C46A32 (ceramic-primary)
// Secondary: #E8D7C5 (ceramic-secondary)
// Dark: #2F2F2F (ceramic-dark)
// Light: #F9F7F4 (ceramic-light)

<Button className="bg-ceramic-primary">
  Ceramic Button
</Button>
```

---

## Accessibility

All components include:
- ARIA attributes
- Keyboard navigation
- Focus management
- Screen reader support
- Proper semantic HTML

---

## Theming

Components automatically support:
- Light mode
- Dark mode
- Custom color schemes (via Tailwind config)
- RTL layouts (ready for implementation)

---

## Resources

- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Accessibility Best Practices](https://www.w3.org/WAI/WCAG21/quickref/)

