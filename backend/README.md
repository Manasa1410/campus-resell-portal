# Campus Resell Portal Backend

Express, MongoDB, and Socket.IO backend for the Campus Resell marketplace. The API supports authentication, products, wishlist, reviews, chat, reports, notifications, admin moderation, uploads, and password reset flows.

## Architecture & Design Patterns

The backend follows a layered MVC-style structure:

- `routes/` map HTTP endpoints to controller functions.
- `controllers/` contain request orchestration and response handling.
- `models/` define Mongoose schemas and relationships.
- `middleware/` handles authentication, admin authorization, uploads, and errors.
- `services/` contains reusable domain services such as chat and email.
- `sockets/` and `config/socket.js` handle real-time chat events.

```text
Request -> Route -> Middleware -> Controller -> Model/Service -> MongoDB
                                  |
                                  -> Socket.IO notifications/chat events
```

## Database Schema Overview

| Model | Purpose | Key Relationships |
| --- | --- | --- |
| User | Accounts, roles, avatar, wishlist, password reset metadata | `wishlist[] -> Product` |
| Product | Marketplace listing, images, status, reviews, seller | `seller -> User`, `reviews.user -> User` |
| Chat | Conversation around a product | `participants[] -> User`, `product -> Product` |
| Message | Chat messages, read status, delete states | `chat -> Chat`, `sender -> User` |
| Report | User/product moderation reports | `reporter -> User`, `targetId -> Product/User` |
| Notification | In-app notifications | `recipient -> User`, `sender -> User`, `product -> Product` |

## API Documentation

Base path: `/api`

| Method | Route | Description | Protected |
| --- | --- | --- | --- |
| POST | `/auth/register` | Register user with optional avatar upload | No |
| POST | `/auth/login` | Login and receive JWT | No |
| GET | `/auth/profile` | Get authenticated profile | Yes |
| PUT | `/auth/profile` | Update profile details | Yes |
| PUT | `/auth/profile/avatar` | Upload/update avatar | Yes |
| PUT | `/auth/password` | Change password | Yes |
| POST | `/auth/forgot-password` | Generate reset token | No |
| PUT | `/auth/reset-password/:token` | Reset password | No |
| GET | `/products` | List products | No |
| POST | `/products` | Create product with images | Yes |
| GET | `/products/my-products` | Get current user's listings | Yes |
| GET | `/products/wishlist` | Get wishlist products | Yes |
| GET | `/products/:id` | Get product details | No |
| PUT | `/products/:id` | Update product | Yes |
| DELETE | `/products/:id` | Delete product | Yes |
| PUT | `/products/:id/status` | Toggle available/sold status | Yes |
| POST | `/products/:id/reviews` | Add product review | Yes |
| POST | `/products/:id/wishlist` | Toggle wishlist item | Yes |
| POST | `/chats` | Create/find product chat | Yes |
| GET | `/chats` | Get user's chats | Yes |
| GET | `/chats/:chatId/messages` | Get chat messages | Yes |
| DELETE | `/chats/message/:id` | Delete message | Yes |
| DELETE | `/chats/:conversationId` | Delete chat | Yes |
| POST | `/reports` | Create report | Yes |
| GET | `/reports` | List reports | Yes, Admin |
| PUT | `/reports/:id` | Update report status | Yes, Admin |
| PUT | `/reports/ban/:userId` | Ban user from report workflow | Yes, Admin |
| PUT | `/reports/unban/:userId` | Unban user from report workflow | Yes, Admin |
| GET | `/notifications` | Get notifications | Yes |
| PUT | `/notifications/:id/read` | Mark notification read | Yes |
| DELETE | `/notifications/clear` | Clear notifications | Yes |
| GET | `/users/admin/stats` | Admin stats | Yes, Admin |
| GET | `/users/admin/all` | List users | Yes, Admin |
| PUT | `/users/admin/ban/:id` | Toggle user ban | Yes, Admin |

## Environment Configuration

Create `backend/.env`:

```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/campus-resell
JWT_SECRET=replace-with-a-secure-secret
EMAIL_USER=your-smtp-user
EMAIL_PASS=your-smtp-password
```

## Security Features

- JWT-protected API routes.
- Admin-only middleware for moderation endpoints.
- Password hashing with `bcryptjs`.
- Email normalization and robust public/institutional email validation.
- Mongoose schema validation and indexed lookup fields.
- Multer upload handling for avatars and product images.
- Banned-user login protection.

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm install --omit=dev
npm start
```

## Operational Notes

- Local uploads are served from `/uploads`; use object storage for multi-instance production deployments.
- Configure CORS for the deployed frontend origin.
- Keep `JWT_SECRET` long, random, and environment-specific.
- Run database backups before schema migrations.
