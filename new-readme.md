# SupResto - Smart Digital Meal Ticketing System

## 🍽️ Overview

**SupResto** is a comprehensive digital meal ticketing system designed to modernize university canteen operations. By leveraging existing student ID QR codes containing CIN (Citizen Identity Number), the system provides secure, efficient, and environmentally-friendly meal management while maintaining full offline functionality.

### ✨ Key Features

- **Digital Meal Tickets**: Replace traditional paper tickets with secure digital alternatives
- **QR Code Integration**: Uses existing student ID QR codes for seamless authentication
- **Offline-First**: Full functionality during network outages with intelligent sync
- **Role-Based Access**: Six distinct user roles with tailored permissions
- **Real-Time Analytics**: Kitchen forecasting and usage statistics
- **Multi-Language Support**: Arabic, English, and French interfaces
- **Financial Management**: Credit-based system with emergency access capabilities

---

## 🏗️ System Architecture

### Tech Stack
- **Frontend**: Next.js 14 + React + TypeScript + TailwindCSS
- **Backend**: tRPC + Drizzle ORM + PostgreSQL
- **Authentication**: Session-based with JWT tokens
- **Deployment**: Node.js with offline synchronization
- **Internationalization**: i18next for multi-language support

### User Roles & Permissions

| Role | Permissions | Price per Meal |
|------|-------------|----------------|
| **Student** | Change password, check balance, schedule/cancel meals | 200 millimes |
| **Teacher** | Same as student (different pricing tier) | 2000 millimes |
| **Payment Staff** | Accept payments, scan QR codes to deposit money | N/A |
| **Verification Staff** | Payment functionality + meal time verification scanning | N/A |
| **Admin** | Full system control, user management, system parameters | N/A |
| **Visitor** | Read-only access to public information | N/A |
| **Chef** *(planned)* | View scheduled meals and attendance forecasts | N/A |

---

## 📁 Current Project Structure

```
sup-resto/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Main dashboard
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx          # Landing page
│   ├── components/
│   │   ├── auth/             # Authentication components
│   │   ├── dashboards/       # Role-specific dashboards
│   │   ├── elements/         # UI components (Navbar, Spinner)
│   │   ├── layouts/          # Layout components
│   │   └── providers/        # Context providers
│   ├── server/
│   │   ├── db/              # Database schema & migrations
│   │   ├── trpc/            # API routes & business logic
│   │   └── middleware/      # Authentication middleware
│   ├── lib/                 # Utilities & configurations
│   └── config/              # App configuration
```

---

## 🚀 Current Implementation Status

### ✅ Completed Features

1. **Authentication System**
   - ✅ Multi-role login/logout
   - ✅ Session management with JWT
   - ✅ Role-based route protection
   - ✅ Password hashing and validation

2. **Dashboard Infrastructure**
   - ✅ Role-specific dashboard components
   - ✅ Higher-Order Component for dashboard layouts
   - ✅ Responsive navigation system
   - ✅ User profile management

3. **Database Foundation**
   - ✅ PostgreSQL schema with migrations
   - ✅ User accounts with role management
   - ✅ Seeding scripts for development

4. **UI/UX Framework**
   - ✅ Responsive design with TailwindCSS
   - ✅ Multi-language support (AR, EN, FR)
   - ✅ Loading states and error handling
   - ✅ Theme provider setup

5. **Others**
   - ✅ tRPC router expansion for meal management
   - ✅ Meal purchasing and scheduling system
   - ✅ QR code scanning for payments and verification

6. Phase 1: Core Meal Management (Current Priority)

#### 1.1 Database Schema Enhancement
```bash
# Add meal-related tables
- meal_schedules (id, user_id, meal_date, meal_type, status)
- transactions (id, user_id, amount, type, timestamp)
- meal_settings (daily_limits, prices, availability)
```

#### 1.2 Meal Management tRPC Routers
```typescript
// Create these new routers:
src/server/trpc/routers/
├── meal.router.ts      # Schedule, cancel, view meals
├── transaction.router.ts # Balance, payments, history
└── settings.router.ts   # System configuration
```

#### 1.3 Student/Teacher Dashboard Features
```typescript
// Implement these components:
src/components/meal-management/
├── meal-scheduler.tsx   # Schedule meals interface
├── balance-display.tsx  # Account balance & history
├── meal-calendar.tsx   # Weekly meal view
└── transaction-history.tsx # Payment history
```



### 🔄 In Progress

- Dashboard content implementation for each role (completed student, teacher and payment staff)
- tRPC router expansion for meal management

### ⏳ Planned Features

- Offline synchronization capabilities
- Analytics dashboard for kitchen staff
- Admin panel for user management

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ and npm/pnpm
- PostgreSQL database
- Git for version control

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd sup-resto

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Configure your database connection and JWT secrets

# Setup database
npm run db:generate
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate database migrations
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:reset     # Reset database (caution: deletes all data)
```

---

## 📋 Next Development Steps


### Phase 2: Staff Functionality

#### 2.1 Payment Staff Features
- QR code scanner integration
- Money deposit interface
- Daily transaction reports

#### 2.2 Verification Staff Features
- Meal time scanning system
- Real-time meal verification
- Attendance tracking

### Phase 3: Admin Panel
- User account management
- System settings configuration
- Analytics and reporting

### Phase 4: Offline Capabilities
- Local storage implementation
- Sync conflict resolution
- Network status monitoring

---

## 🎯 Immediate Next Steps (This Week)

### Day 1-2: Meal Database Schema
1. **Update `src/server/db/schema.ts`**:
   ```sql
   -- Add tables for meals, transactions, and settings
   CREATE TABLE meal_schedules (...)
   CREATE TABLE transactions (...)
   CREATE TABLE system_settings (...)
   ```

2. **Create migration**: `npm run db:generate`

3. **Update seed data** with sample meals and transactions

### Day 3-4: Meal Management tRPC Routes
1. **Create `src/server/trpc/routers/meal.router.ts`**:
   - `scheduleMeal` - Book a meal
   - `cancelMeal` - Cancel booking
   - `getUserMeals` - Get user's scheduled meals
   - `checkMealAvailability` - Verify capacity

2. **Create `src/server/trpc/routers/transaction.router.ts`**:
   - `getUserBalance` - Get account balance
   - `addFunds` - Deposit money (staff only)
   - `getTransactionHistory` - Payment history

3. **Update root router** to include new routes

### Day 5-7: Student Dashboard Implementation
1. **Create meal scheduling interface**
2. **Implement balance display**
3. **Add meal calendar view**
4. **Test end-to-end meal booking flow**

---

## 📊 Database Schema Improvements

### Current Tables
- `users` - User accounts with roles
- Authentication and session management

### Required Tables (Next Sprint)
```sql
-- Meal scheduling
meal_schedules (
  id, user_id, meal_date, meal_type,
  status, created_at, updated_at
)

-- Financial transactions
transactions (
  id, user_id, amount, type, description,
  staff_id, timestamp
)

-- System configuration
system_settings (
  key, value, updated_by, updated_at
)

-- Meal capacity management
meal_capacity (
  date, meal_type, max_capacity, current_count
)
```

---

## 🔧 Configuration Management

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/supresto

# Authentication
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# App Settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Meal System
STUDENT_MEAL_PRICE=200
TEACHER_MEAL_PRICE=2000
MAX_DAILY_MEALS=500
```

---

## 🚦 Quality Assurance

### Development Guidelines
- Follow TypeScript strict mode
- Use Zod for input validation
- Implement proper error handling
- Write comprehensive tests for critical features
- Follow accessibility best practices

### Security Considerations
- Validate all user inputs
- Implement rate limiting
- Use secure session management
- Audit financial transactions
- Regular security dependency updates

---

## 📈 Future Enhancements

### Advanced Features (Later Phases)
- **Mobile PWA**: Progressive Web App for better mobile experience
- **Push Notifications**: Meal reminders and system alerts
- **Nutritional Information**: Meal content and dietary preferences
- **Integration APIs**: Connect with existing university systems

### Analytics & Reporting
- Daily meal consumption reports
- Financial transaction summaries
- User activity analytics
- Kitchen forecasting algorithms
- Waste reduction insights

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/meal-scheduling`
3. Commit changes: `git commit -m 'Add meal scheduling feature'`
4. Push to branch: `git push origin feature/meal-scheduling`
5. Submit a pull request

---

## 📞 Support & Contact

For questions, issues, or feature requests, please create an issue in the repository or contact the development team.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

*Last Updated: July 2025*
*Version: 1.0.0-alpha*