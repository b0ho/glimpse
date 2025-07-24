# 🍃 Glimpse Dating App - Monorepo

Anonymous group-based dating app built with React Native + Node.js TypeScript stack.

## 📋 Project Structure

```
glimpse/
├── mobile/          # React Native mobile app (Expo)
├── server/          # Node.js + Express backend
├── shared/          # Common types, utilities, constants
├── tests/           # E2E tests (Playwright)
└── docs/            # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Expo CLI
- Android Studio or Xcode (for mobile development)

### Installation

```bash
# Install all dependencies
npm install

# Setup database
createdb glimpse
npm run db:migrate

# Start development servers
npm run dev
```

This will start:
- Mobile app on http://localhost:8081 (Expo)
- Server API on http://localhost:8080

### Individual Services

```bash
# Mobile app only
npm run dev:mobile

# Server only  
npm run dev:server

# Database management
npm run db:studio
```

## 🛠 Tech Stack

### Mobile (React Native + Expo)
- **React Native 0.79** with Expo 53
- **TypeScript** for type safety
- **Zustand** for state management
- **React Navigation** for routing
- **Socket.IO Client** for real-time features
- **Expo Secure Store** for sensitive data
- **Stripe React Native** for payments

### Backend (Node.js)
- **Express.js** web framework
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL
- **Socket.IO** for real-time messaging
- **JWT** authentication
- **Stripe** for payment processing
- **Firebase Admin** for push notifications

### Shared
- **TypeScript** types and interfaces
- **Utility functions** for validation, formatting
- **Constants** for app configuration

## 📱 Core Features

### ✅ Implemented
- **SMS Authentication** - Korean phone number verification
- **Anonymous Like System** - Group-based matching with credits
- **Real-time Chat** - Encrypted messaging via WebSocket
- **Premium Subscriptions** - Stripe integration for Korean market
- **Group Management** - 4 types: Official, Created, Instance, Location
- **Push Notifications** - Firebase Cloud Messaging

### 🚧 In Development
- **Company Verification** - 4 verification methods
- **Location-based Groups** - GPS/QR code check-in
- **OCR Verification** - ID card scanning
- **Korean Payment Integration** - TossPay, KakaoPay

## 🔧 Development

### Testing
```bash
# Run all tests
npm test

# E2E tests
npx playwright test

# Server tests
npm run test:server

# Mobile tests  
npm run test:mobile
```

### Code Quality
```bash
# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix
```

### Database
```bash
# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Generate Prisma client
npm run db:generate
```

## 📦 Deployment

### Production Build
```bash
# Build all packages
npm run build

# Build mobile app for stores
cd mobile && eas build --platform all

# Build server for production
cd server && npm run build
```

### Environment Variables

#### Root `.env`
```bash
# Development URLs
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
EXPO_PUBLIC_SOCKET_URL=ws://localhost:8080
```

#### Server `.env`
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/glimpse"
JWT_SECRET="your-secret-key"
STRIPE_SECRET_KEY="sk_test_..."
FIREBASE_PRIVATE_KEY="..."
```

## 🏗 Architecture

### API Design
- **RESTful APIs** for CRUD operations
- **WebSocket** for real-time features (chat, typing, presence)
- **JWT Authentication** with refresh tokens
- **Rate limiting** for security

### Database Schema
- **Users** - Profile, verification, credits, premium status
- **Groups** - 4 types with different business rules
- **Matches** - Mutual likes create matches
- **Messages** - Encrypted chat history
- **Payments** - Stripe transaction records

### Mobile App Structure
- **Screens** - React Native screens with navigation
- **Components** - Reusable UI components
- **Services** - API calls, WebSocket, push notifications
- **Stores** - Zustand state management
- **Utils** - Helper functions, constants

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Mobile App Guide](./docs/mobile.md)
- [Database Schema](./docs/database.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Stripe Documentation](https://stripe.com/docs/)