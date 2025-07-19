# Smart Digital Meal Ticketing System - Project Architecture

## Project Overview

The **Smart Digital Meal Ticketing System** is a comprehensive solution designed to modernize university canteen operations by replacing traditional paper-based meal tickets with a fully digital system. The system leverages existing student ID QR codes (containing CIN - Citizen Identity Number) to provide secure, efficient, and environmentally-friendly meal management.

### Core Problem Statement
Traditional paper ticket systems (10 tickets for 2 TND) are inefficient, prone to abuse, environmentally harmful, and require manual cutting/stamping processes. This digital solution addresses these issues while maintaining accessibility and operational continuity even during network outages.

### Key Value Propositions
- **Operational Efficiency**: Eliminates manual paper handling and streamlines meal access
- **Security & Authentication**: Uses unique CIN-based identification to prevent unauthorized access  
- **Environmental Impact**: Reduces paper waste and ink consumption
- **Predictive Planning**: Enables kitchen staff to forecast meal requirements accurately
- **Offline Resilience**: Maintains full functionality during network disruptions
- **Financial Flexibility**: Supports credit-based access for emergency situations

---

## Technical Stack
- **Frontend**: React + Next.js + TailwindCSS
- **Backend**: tRPC + Drizzle ORM + PostgreSQL
- **Authentication**: Session-based with role management
- **Deployment**: Node.js environment with offline sync capabilities

---

## Project Architecture

### Application Layer (`src/app/`)

#### `layout.tsx`
**Purpose**: Root application layout and providers
**Functionality**:
- Global navigation structure
- Authentication state management
- Theme and styling providers
- PWA manifest and offline detection

#### `page.tsx` (Root)
**Purpose**: Public landing page
**Functionality**:
- System overview and instructions
- Quick access to login/dashboard
- System status indicators (online/offline)
- Student guide for QR code usage

#### `auth/login/page.tsx`
**Purpose**: Authentication entry point
**Functionality**:
- Student/staff login interface
- CIN-based authentication
- Role-based dashboard redirection
- Offline authentication fallback

#### `dashboard/page.tsx`
**Purpose**: Main application dashboard
**Functionality**:
- Role-based dashboard rendering
- Quick actions (buy meals, schedule, check balance)
- Recent transaction history
- System notifications and announcements

---

### Component Architecture (`src/components/`)

#### `auth/login-form.tsx`
**Purpose**: Authentication form component
**Functionality**:
- Secure login with CIN validation
- Role selection (student/staff/admin)
- Form validation and error handling
- Offline login capabilities

#### `auth/use-auth.ts`
**Purpose**: Authentication state management hook
**Functionality**:
- User session management
- Role-based permissions
- Login/logout functionality
- Offline authentication state sync

#### `dashboards/` (Directory)
**Purpose**: Role-specific dashboard components
**Planned Components**:
- `student-dashboard.tsx`: Meal purchasing, scheduling, balance management
- `staff-dashboard.tsx`: Meal verification, offline sync, daily reports
- `admin-dashboard.tsx`: User management, system settings, analytics
- `kitchen-dashboard.tsx`: Meal planning, attendance forecasts

#### `meal-management/` (Planned Directory)
**Components**:
- `meal-purchase.tsx`: Ticket buying interface
- `meal-scheduler.tsx`: Advance meal booking system
- `qr-scanner.tsx`: QR code scanning for check-ins
- `balance-display.tsx`: Account balance and transaction history

#### `offline/` (Planned Directory)
**Components**:
- `sync-status.tsx`: Online/offline indicators
- `offline-queue.tsx`: Pending transaction display
- `data-sync.tsx`: Manual sync trigger interface

#### `providers/trpc-provider.tsx`
**Purpose**: tRPC client configuration
**Functionality**:
- API client setup with authentication
- Error handling and retry logic
- Offline request queuing
- Data caching strategies

---

### Server Architecture (`src/server/`)

#### Database Layer (`db/`)

##### `schema.ts`
**Purpose**: Database schema definitions
**Functionality**:
- User accounts with CIN-based identification
- Meal schedules with status tracking
- Transaction history with role-based processing
- Offline sync logging and conflict resolution
- Settings and configuration storage

##### `database.ts`
**Purpose**: Database connection and configuration
**Functionality**:
- PostgreSQL connection pooling
- Transaction management
- Query optimization and indexing
- Connection retry logic for resilience

##### `migrations/`
**Purpose**: Database version control
**Functionality**:
- Schema evolution tracking
- Data migration scripts
- Rollback capabilities
- Environment-specific migrations

##### `seeds/`
**Purpose**: Development and testing data
**Functionality**:
- Sample user accounts (students, staff, admin)
- Mock meal schedules and transactions
- System configuration presets
- Performance testing datasets

#### tRPC Layer (`trpc/`)

##### `routers/auth.router.ts`
**Purpose**: Authentication API endpoints
**Functionality**:
- Login/logout with CIN validation
- Session management
- Password reset and security
- Role-based authorization

##### `routers/` (Additional Planned Routers)
**Planned Files**:
- `meal.router.ts`: Meal purchasing, scheduling, cancellation
- `transaction.router.ts`: Balance management, payment processing
- `sync.router.ts`: Offline data synchronization
- `admin.router.ts`: User management, system configuration
- `analytics.router.ts`: Usage reports, meal forecasting

##### `services/`
**Purpose**: Business logic layer
**Current**:
- `auth-service.ts`: Authentication business logic
- `user-service.ts`: User management operations

**Planned**:
- `meal-service.ts`: Meal scheduling and validation
- `payment-service.ts`: Transaction processing
- `sync-service.ts`: Offline synchronization logic
- `notification-service.ts`: System alerts and updates

#### Middleware (`middleware/`)

##### `auth-middleware.ts`
**Purpose**: Request authentication and authorization
**Functionality**:
- JWT token validation
- Role-based access control
- Session management
- Offline token verification

**Planned Middleware**:
- `rate-limiting.ts`: API request throttling
- `offline-sync.ts`: Data synchronization handling
- `audit-logging.ts`: System activity tracking

---

### Features Architecture (`src/features/`)

#### Planned Feature Modules

##### `meal-management/`
**Purpose**: Core meal ticketing functionality
**Components**:
- Meal purchasing workflows
- Scheduling interfaces
- Cancellation and refund logic
- Balance management

##### `qr-scanning/`
**Purpose**: QR code verification system
**Components**:
- Camera integration for scanning
- CIN validation and verification
- Manual CIN entry fallback
- Offline validation capabilities

##### `offline-sync/`
**Purpose**: Offline operation management
**Components**:
- Data synchronization algorithms
- Conflict resolution strategies
- Queue management for pending operations
- Network status monitoring

##### `analytics/`
**Purpose**: Reporting and insights
**Components**:
- Daily/weekly meal reports
- Financial transaction summaries
- User activity analytics
- Kitchen planning forecasts

##### `admin-panel/`
**Purpose**: System administration
**Components**:
- User account management
- System configuration
- Bulk operations (imports/exports)
- Maintenance and monitoring tools

---

### Configuration and Utilities (`src/lib/`, `src/config/`)

#### `lib/utils.ts`
**Purpose**: Shared utility functions
**Functionality**:
- Date/time formatting for meal schedules
- CIN validation and formatting
- Currency and balance calculations
- Offline storage helpers

#### `config/logger.ts`
**Purpose**: Application logging
**Functionality**:
- Structured logging for debugging
- Error tracking and reporting
- Performance monitoring
- Offline log storage and sync

#### Planned Configuration Files
- `offline-config.ts`: Offline mode settings
- `payment-config.ts`: Transaction processing rules
- `security-config.ts`: Authentication and authorization settings
- `sync-config.ts`: Data synchronization parameters

---

## Implementation Phases

### Phase 1: Core Authentication & User Management
- Complete user authentication system
- Role-based access control
- Basic dashboard functionality

### Phase 2: Meal Management System
- Meal purchasing and scheduling
- Balance management
- Basic QR code integration

### Phase 3: Offline Capabilities
- Offline data storage and sync
- Network status monitoring
- Conflict resolution algorithms

### Phase 4: Advanced Features
- Analytics and reporting
- Administrative tools
- Performance optimization

### Phase 5: Production Deployment
- Security hardening
- Monitoring and logging
- User training and documentation

---

## Key Technical Considerations

### Offline-First Design
The system must maintain full functionality during network outages by:
- Caching essential data locally
- Queuing transactions for later sync
- Providing immediate user feedback
- Handling sync conflicts gracefully

### Security & Privacy
- CIN-based identification without storing sensitive data
- Encrypted local storage for offline data
- Role-based access control throughout the system
- Audit logging for all financial transactions

### Scalability & Performance
- Database indexing for fast lookups
- Efficient QR code scanning algorithms
- Optimized sync protocols to minimize data transfer
- Caching strategies for frequently accessed data