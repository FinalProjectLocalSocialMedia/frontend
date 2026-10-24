# Recommended Frontend Project Structure

This document describes a scalable folder structure for a React + TypeScript frontend application built with Vite.

The structure separates:

- Application startup and configuration
- Shared UI components
- Feature-specific code
- API communication
- Types and domain models
- Static assets
- Global styles
- Build and development configuration

It is suitable for small projects and can grow with larger applications.

---

## 1. Project Structure

```text
frontend-project/
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   └── static-images/
│
├── src/
│   ├── api/
│   │   ├── httpClient.ts
│   │   ├── userApi.ts
│   │   └── productApi.ts
│   │
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   ├── providers.tsx
│   │   └── App.css
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── illustrations/
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── navigation.tsx
│   │   │
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── EmptyState.tsx
│   │   │
│   │   └── form/
│   │       ├── TextInput.tsx
│   │       ├── SelectInput.tsx
│   │       └── FormError.tsx
│   │
│   ├── config/
│   │   ├── env.ts
│   │   ├── constants.ts
│   │   └── permissions.ts
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   │   └── authApi.ts
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useCurrentUser.ts
│   │   │   │   └── useLogin.ts
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── users/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   └── types.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   └── types.ts
│   │   │
│   │   └── reports/
│   │       ├── api/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── pages/
│   │       └── types.ts
│   │
│   ├── types/
│   │   ├── User.ts
│   │   ├── Pagination.ts
│   │   ├── ApiResponse.ts
│   │   └── Enums.ts
│   │
│   ├── index.css
│   └── main.tsx
│
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

---

## 2. Root-Level Folders

### `public/`

Contains static files that are copied directly to the final build output.

Use this folder for files that should be referenced by a fixed public URL.

Typical examples include:

- Favicon files
- Public SVG icons
- Robots files
- Static images
- Browser manifest files

Example:

```text
public/
├── favicon.svg
├── logo.svg
└── robots.txt
```

Files in this folder are usually referenced with an absolute path:

```tsx
<img src="/logo.svg" alt="Application logo" />
```

Use `src/assets/` instead when an asset needs to be imported and processed by Vite.

---

### `src/`

Contains the main application source code.

Most application behavior should live inside this directory, including:

- React components
- Pages
- Routing
- API clients
- Feature logic
- TypeScript types
- Styles
- Custom hooks

---

## 3. Application Entry and Setup

### `src/main.tsx`

The main entry point of the React application.

Typical responsibilities include:

- Finding the HTML root element
- Creating the React root
- Loading global CSS
- Registering providers
- Registering routing
- Registering application-wide services

Example:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "./index.css";
import { router } from "./app/router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
```

This file should remain small. It should start the application rather than contain business logic.

---

### `src/app/`

Contains application-level setup.

This folder connects the major parts of the application:

- Root layout
- Routing
- Global providers
- Authentication guards
- Application-wide styles

#### `src/app/App.tsx`

Defines the main layout of the application.

It may render:

- The header
- The sidebar
- The footer
- The current route content

Example:

```tsx
import { Outlet } from "react-router-dom";
import Header from "../components/layout/Header";

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
}
```

`App.tsx` should focus on the application shell. Individual business features should remain inside `features/`.

#### `src/app/router.tsx`

Defines the application’s routes.

It can also contain:

- Public routes
- Private routes
- Admin-only routes
- Route-level layouts
- Redirects
- Loading states

Example:

```tsx
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);
```

Keep route definitions centralized so students can easily understand how pages are connected.

#### `src/app/providers.tsx`

Optional file for application-wide providers.

It can contain providers such as:

- React Query
- Theme provider
- Authentication provider
- Internationalization provider
- State management provider

Example:

```tsx
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

## 4. API Communication

### `src/api/`

Contains shared code for communicating with backend services.

Typical files include:

```text
src/api/
├── httpClient.ts
├── userApi.ts
├── productApi.ts
└── notificationApi.ts
```

### `httpClient.ts`

Creates a reusable HTTP client.

It is a good place for:

- Base URL configuration
- Request headers
- Authentication credentials
- Request interceptors
- Response interceptors
- Common error handling

Example:

```tsx
import axios from "axios";
import { env } from "../config/env";

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
});
```

### Feature API files

Feature-specific API functions should usually be located inside the relevant feature:

```text
src/features/auth/api/authApi.ts
src/features/users/api/usersApi.ts
src/features/orders/api/ordersApi.ts
```

Example:

```tsx
import { httpClient } from "../../../api/httpClient";

export async function getCurrentUser() {
  const response = await httpClient.get("/users/me");
  return response.data;
}
```

This keeps backend operations close to the feature that uses them.

---

## 5. Shared Components

### `src/components/`

Contains reusable components that are not specific to one business feature.

A shared component should be placed here when it can be reused by multiple features.

Examples:

- Buttons
- Dialogs
- Tables
- Form controls
- Loading indicators
- Navigation elements
- Application layout components

---

### `src/components/layout/`

Contains components that define the application’s visual structure.

Typical examples:

```text
src/components/layout/
├── Header.tsx
├── Sidebar.tsx
├── Footer.tsx
├── ProfileDropdown.tsx
└── navigation.tsx
```

Responsibilities may include:

- Main navigation
- User profile menu
- Responsive sidebar
- Page header
- Footer
- Breadcrumbs

Layout components should not contain feature-specific business logic.

For example, `Header.tsx` may display the current user, but the authentication logic should be handled by an authentication hook or provider.

---

### `src/components/common/`

Contains reusable visual components.

Examples:

```text
src/components/common/
├── Button.tsx
├── Modal.tsx
├── Card.tsx
├── LoadingSpinner.tsx
├── ErrorMessage.tsx
└── EmptyState.tsx
```

These components should be generic enough to be used by several features.

A component belongs in `common/` if its name describes a reusable UI concept rather than a business concept.

Good examples:

- `Button`
- `Modal`
- `Pagination`
- `DataTable`

Less suitable examples:

- `DonationApprovalButton`
- `VolunteerTaskCard`
- `AdminUserTable`

Those are probably feature-specific and should live inside their feature folder.

---

### `src/components/form/`

Contains reusable form controls.

Examples include:

- Text inputs
- Select boxes
- Date pickers
- Checkbox controls
- Form validation messages
- File upload controls

This folder prevents every feature from creating its own slightly different input component.

---

## 6. Feature-Based Organization

### `src/features/`

Contains business features.

This is the most important organizational folder in a larger frontend application.

Instead of grouping every component, hook, and API file by technical type, feature-based organization groups code by business purpose.

Example:

```text
src/features/
├── auth/
├── users/
├── dashboard/
├── reports/
└── notifications/
```

Each feature should ideally contain the code needed to understand and maintain that feature.

---

## 7. Feature Folder Structure

A typical feature can use the following structure:

```text
src/features/orders/
├── api/
│   └── ordersApi.ts
├── components/
│   ├── OrderCard.tsx
│   ├── OrderTable.tsx
│   └── OrderStatusBadge.tsx
├── hooks/
│   ├── useOrders.ts
│   └── useOrderDetails.ts
├── pages/
│   ├── OrdersPage.tsx
│   └── OrderDetailsPage.tsx
├── types.ts
├── constants.ts
└── index.ts
```

Not every feature needs every folder. Small features may only need:

```text
src/features/profile/
├── ProfilePage.tsx
└── profileApi.ts
```

The structure should grow when the feature becomes more complex.

---

### `features/<feature>/api/`

Contains backend requests specific to the feature.

Example:

```text
src/features/orders/api/
├── ordersApi.ts
└── orderPaymentsApi.ts
```

This folder should contain functions such as:

- Fetching records
- Creating records
- Updating records
- Deleting records
- Calling feature-specific actions

---

### `features/<feature>/components/`

Contains UI components used only by that feature.

Example:

```text
src/features/orders/components/
├── OrderCard.tsx
├── OrderFilters.tsx
├── OrderTable.tsx
└── OrderStatusBadge.tsx
```

These components can contain business-specific presentation logic.

If a component becomes useful in several unrelated features, move it to `src/components/common/`.

---

### `features/<feature>/hooks/`

Contains custom React hooks for feature behavior.

Examples:

```text
src/features/orders/hooks/
├── useOrders.ts
├── useOrderDetails.ts
└── useCreateOrder.ts
```

Hooks can coordinate:

- API calls
- React Query
- Form state
- Authentication checks
- Feature-specific UI state

Example:

```tsx
export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
  });
}
```

Hooks should hide implementation details from page components.

---

### `features/<feature>/pages/`

Contains route-level components.

Pages usually:

- Read route parameters
- Load feature data
- Arrange feature components
- Display loading and error states
- Connect the feature to the router

Example:

```tsx
export function OrdersPage() {
  const { data, isLoading } = useOrders();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <OrderTable orders={data ?? []} />;
}
```

A page should coordinate the screen rather than contain every small UI detail.

---

### `features/<feature>/types.ts`

Contains TypeScript types that are only relevant to that feature.

Example:

```tsx
export interface Order {
  id: string;
  customerName: string;
  status: OrderStatus;
  total: number;
}
```

Keep feature-specific types close to the feature.

Place a type in the global `src/types/` folder only when multiple unrelated features use it.

---

### `features/<feature>/constants.ts`

Contains feature-specific constants.

Examples:

- Status labels
- Default form values
- Table column definitions
- Feature configuration
- Permission names

Example:

```tsx
export const ORDER_STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  cancelled: "Cancelled",
} as const;
```

---

### `features/<feature>/index.ts`

Optional barrel file for exposing the public API of a feature.

Example:

```tsx
export { OrdersPage } from "./pages/OrdersPage";
export { OrderDetailsPage } from "./pages/OrderDetailsPage";
export type { Order } from "./types";
```

This allows other files to import from the feature root:

```tsx
import { OrdersPage } from "../features/orders";
```

Avoid exporting every internal implementation detail.

---

## 8. Configuration

### `src/config/`

Contains application configuration and environment-related values.

Typical files include:

```text
src/config/
├── env.ts
├── constants.ts
└── permissions.ts
```

### `env.ts`

Reads environment variables and exposes them in one consistent place.

Example:

```tsx
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
  mapsApiKey: import.meta.env.VITE_MAPS_API_KEY ?? "",
};
```

This is better than reading `import.meta.env` throughout the entire application.

It gives the project a single place to:

- Document required variables
- Apply default values
- Validate configuration
- Rename environment variables later

### `constants.ts`

Contains application-wide constants.

Examples:

- Application name
- Pagination defaults
- Date formats
- Feature flags
- Common URL paths

### `permissions.ts`

Contains role and permission definitions.

Example:

```tsx
export const permissions = {
  manageUsers: "manage_users",
  viewReports: "view_reports",
} as const;
```

This helps keep authorization rules consistent.

---

## 9. Static Assets

### `src/assets/`

Contains assets imported by application source files.

Use this folder for:

- Images
- Illustrations
- Local icons
- Fonts
- Feature-specific visual assets

Example:

```text
src/assets/
├── images/
│   ├── hero.png
│   └── empty-state.png
├── icons/
│   ├── search.svg
│   └── calendar.svg
└── illustrations/
    └── no-results.svg
```

Assets inside `src/assets/` can be imported:

```tsx
import heroImage from "../assets/images/hero.png";

<img src={heroImage} alt="Hero illustration" />
```

---

## 10. Type Definitions

### `src/types/`

Contains shared TypeScript types.

Use this folder for types used across multiple features.

Typical files include:

```text
src/types/
├── User.ts
├── Pagination.ts
├── ApiResponse.ts
├── Enums.ts
└── DateRange.ts
```

Examples of suitable shared types:

- `User`
- `Pagination`
- `ApiResponse`
- `SortDirection`
- `Notification`
- `Role`

Avoid putting every type in this folder. If a type belongs only to one feature, keep it inside that feature.

---

### Example shared API types

```tsx
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
```

Shared types make API responses and component props more consistent.

---

## 11. Styling

### `src/index.css`

Contains global styles.

Typical responsibilities include:

- CSS variables
- Font definitions
- Global element styles
- Body defaults
- Theme colors
- Responsive defaults
- Dark mode variables

Example:

```css
:root {
  --color-primary: #2563eb;
  --color-background: #ffffff;
  --color-text: #111827;
  --color-border: #e5e7eb;
}

body {
  margin: 0;
  font-family: system-ui, sans-serif;
}
```

Global CSS should remain limited to application-wide styles.

---

### Component styles

Component-specific styles can be stored next to the component:

```text
src/components/layout/
├── Header.tsx
└── Header.css
```

This makes it easier to find the styles for a component.

Possible styling approaches include:

- Regular CSS
- CSS Modules
- Tailwind CSS
- Styled components
- UI library styling systems

The important rule is consistency.

---

## 12. Root-Level Configuration Files

### `package.json`

Describes the project and its dependencies.

It usually contains:

- Project name
- Scripts
- Runtime dependencies
- Development dependencies

Example scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

Common commands:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

---

### `package-lock.json`

Locks exact dependency versions.

This helps ensure that different developers and CI systems install compatible dependency versions.

Commit this file to version control when using npm.

---

### `vite.config.ts`

Contains Vite configuration.

It may configure:

- React plugins
- Build behavior
- Development server settings
- Path aliases
- Environment handling
- Proxy rules

Example:

```tsx
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

---

### `tsconfig.json`

The main TypeScript configuration.

It may reference other TypeScript configuration files.

---

### `tsconfig.app.json`

Contains TypeScript settings for application source code.

Typical settings include:

- JSX support
- Strict type checking
- Module resolution
- Source directories

---

### `tsconfig.node.json`

Contains TypeScript settings for Node-based configuration files such as:

- `vite.config.ts`
- Build scripts
- Tooling configuration

Separating application and Node configuration keeps TypeScript settings clear.

---

### `eslint.config.js`

Contains code-quality rules.

ESLint can detect:

- Unused variables
- Invalid React patterns
- Hook mistakes
- Inconsistent coding styles
- Potential bugs

Run linting with:

```bash
npm run lint
```

---

### `index.html`

The HTML entry document used by Vite.

It usually contains:

- Page metadata
- Favicon reference
- The root element
- The application entry script

Example:

```html
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
```

React renders the application inside the `#root` element.

---

### `.env.example`

Documents required environment variables without exposing real secrets.

Example:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_MAPS_API_KEY=your-api-key
```

Developers can copy it:

```bash
cp .env.example .env
```

Never commit real secret values.

---

### `.gitignore`

Lists files that Git should not track.

Typical entries include:

```text
node_modules/
dist/
.env
.env.local
```

---

### `README.md`

Documents the project for new developers.

A useful README should explain:

- What the application does
- How to install dependencies
- How to configure environment variables
- How to run the development server
- How to build the application
- How to run linting and tests
- Important architectural decisions

---

## 13. Recommended Runtime Flow

A typical request and rendering flow looks like this:

```text
index.html
    ↓
src/main.tsx
    ↓
Application providers
    ↓
src/app/router.tsx
    ↓
Route guard, if required
    ↓
Feature page
    ↓
Feature hook
    ↓
Feature API module
    ↓
Shared HTTP client
    ↓
Backend API
```

For example:

```text
User visits /orders
    ↓
router.tsx selects OrdersPage
    ↓
OrdersPage calls useOrders()
    ↓
useOrders() calls ordersApi.ts
    ↓
ordersApi.ts uses httpClient.ts
    ↓
The response is displayed by OrderTable.tsx
```

This flow keeps responsibilities separated:

- Routing decides which page to display.
- Pages coordinate the screen.
- Hooks manage data and state.
- API modules communicate with the backend.
- Components render the user interface.
- Types describe the data.

---

## 14. Dependency Direction

A useful rule is to keep dependencies moving in one direction:

```text
Pages
  ↓
Feature components and hooks
  ↓
Feature API modules
  ↓
Shared API client
  ↓
Configuration
```

Shared components should not import feature-specific code.

For example, this is usually a good dependency:

```text
OrdersPage → OrderTable → Button
```

This is usually a problematic dependency:

```text
Button → OrdersPage
```

Generic components should remain independent from business features.

---

## 15. Where Should a New File Go?

Use these questions when deciding where to place a file.

### Is it used by one feature only?

Place it inside that feature:

```text
src/features/orders/components/OrderCard.tsx
```

### Is it reused by multiple features?

Place it in a shared folder:

```text
src/components/common/Card.tsx
```

### Is it related to routing or global setup?

Place it in:

```text
src/app/
```

### Is it responsible for backend requests?

Place it in:

```text
src/api/
```

or inside a feature:

```text
src/features/orders/api/
```

### Is it a shared data model?

Place it in:

```text
src/types/
```

### Is it a feature-only data model?

Place it inside the feature:

```text
src/features/orders/types.ts
```

### Is it a global configuration value?

Place it in:

```text
src/config/
```

---

## 16. Guidelines for Students

1. Keep `main.tsx` small.
2. Keep routing in one predictable location.
3. Group business logic by feature.
4. Keep reusable UI components separate from feature components.
5. Keep API communication out of visual components.
6. Keep shared types in `src/types/`.
7. Keep feature-specific types near the feature.
8. Do not place secrets directly in source code.
9. Use environment variables for environment-specific configuration.
10. Avoid creating large files that contain unrelated responsibilities.
11. Move repeated code into reusable components or hooks.
12. Prefer clear names over overly short names.
13. Keep styles close to the components they belong to.
14. Add tests near the feature they test.
15. Update the README when the setup process changes.

---

## 17. Optional Testing Structure

When tests are added, they can be organized next to the code they test:

```text
src/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx
│
├── features/
│   └── auth/
│       ├── components/
│       │   ├── LoginForm.tsx
│       │   └── LoginForm.test.tsx
│       ├── hooks/
│       │   ├── useCurrentUser.ts
│       │   └── useCurrentUser.test.ts
│       └── pages/
│           ├── LoginPage.tsx
│           └── LoginPage.test.tsx
```

An alternative is to use a dedicated test directory:

```text
tests/
├── components/
├── features/
├── integration/
└── fixtures/
```

Either approach is acceptable if the team follows it consistently.

---

## 18. Summary

The main idea is to organize the project by responsibility and business feature:

```text
src/
├── app/          Application setup and routing
├── api/          Shared backend communication
├── assets/       Imported images and visual resources
├── components/   Reusable interface components
├── config/       Environment and application configuration
├── features/     Business functionality
├── types/        Shared TypeScript models
├── index.css     Global styles
└── main.tsx      Application entry point
```

For teaching and real-world development, the most important principle is:

> Keep code close to the feature that owns it, and move code into shared folders only when it is genuinely reusable.