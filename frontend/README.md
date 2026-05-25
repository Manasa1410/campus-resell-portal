# Campus Resell Portal Frontend

Modern React frontend for the Campus Resell marketplace. The interface is built as a production-style SaaS dashboard with a responsive sidebar shell, dark mode, reusable UI primitives, skeleton loading states, and toast-driven feedback.

## Core Tech Stack

| Concern | Implementation |
| --- | --- |
| Framework | React 19 with Vite |
| Routing | React Router DOM |
| Styling | Tailwind CSS 4 with utility-first components |
| State | React Context for auth, local component state for forms/views |
| API | Axios service layer |
| Realtime | Socket.IO Client |
| Feedback | React Hot Toast |

## State Management

- `AuthContext` loads the active user from the JWT token and exposes `user`, `setUser`, `login`, `logout`, and `loading`.
- Page-level state handles filters, forms, selected chat, message actions, image previews, and loading states.
- Theme mode is managed by `AppLayout`, persisted in `localStorage`, and applied through the root `dark` class.

## Folder Structure

```text
src/
  assets/                  Static images and Vite assets
  components/
    ui/                    Reusable Button, Card, Badge, Modal, Dropdown, Skeleton, EmptyState, Icon
    AppLayout.jsx          Global shell with sidebar, header, theme toggle
    Sidebar.jsx            Collapsible navigation drawer
    ProductCard.jsx        Marketplace listing card
    NotificationDropdown.jsx
    ProtectedRoute.jsx
    Loader.jsx
  context/
    AuthContext.jsx        Global authentication state
  hooks/
    useAuth.js             Auth context hook
  pages/
    Auth/                  Login, register, forgot/reset password
    Products/              Home, details, add/edit, wishlist, my products
    Chat/                  Messaging UI
    Profile/               Account and profile management
    Admin/                 Reports, users, dashboard
  services/                Axios API functions and feature services
  sockets/                 Socket.IO client setup
  utils/                   Shared formatting and validation helpers
```

## Installation

```bash
npm install
```

## Environment Setup

Create `frontend/.env` when deploying to a non-local API. The current service layer defaults to the local backend, but a deployment can expose:

```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

If you introduce these variables, wire them through `src/services/api.js` and `src/sockets/socket.js`.

## Development

```bash
npm run dev
```

Open `http://localhost:5173`.

## Build

```bash
npm run build
```

The production bundle is emitted to `dist/`.

## Preview Production Build

```bash
npm run preview
```

## Quality Checks

```bash
npm run lint
```

## Deployment Notes

- Run `npm run build` before deployment.
- Configure the backend URL for the target environment.
- Ensure uploaded media URLs are served from the backend or a CDN/object store.
- Keep the `dark` class strategy enabled for predictable theme rendering.
