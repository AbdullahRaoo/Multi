# MagicQC - Laravel React Application

A modern, full-stack web application built with Laravel 12 and React, featuring Inertia.js for seamless server-side rendering and Laravel's built-in authentication.

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Architecture](#architecture)
- [Authentication](#authentication)
- [Theme System](#theme-system)
- [Routes & API](#routes--api)
- [Database Schema](#database-schema)
- [Frontend Components](#frontend-components)
- [Backend Structure](#backend-structure)
- [Key Files](#key-files)
- [Scripts](#scripts)
- [Contributing](#contributing)

## 🎯 Overview

MagicQC is a Laravel 12 application built on the Laravel React Starter Kit. It provides a modern, single-page application experience with server-side rendering capabilities using Inertia.js. The application uses WorkOS for authentication and features a beautiful, responsive UI built with React, TypeScript, and Tailwind CSS.

### Key Characteristics

- **Full-Stack Framework**: Laravel 12 backend with React 19 frontend
- **SPA Experience**: Inertia.js provides seamless navigation without page reloads
- **Type-Safe Routes**: Wayfinder generates type-safe route helpers
- **Modern UI**: Built with Radix UI and Tailwind CSS 4
- **SSR Support**: Server-side rendering configured and ready
- **Authentication**: WorkOS integration for secure user management

## 🛠 Technology Stack

### Backend

- **Laravel 12**: PHP framework
- **PHP 8.2+**: Programming language
- **SQLite**: Default database (easily switchable)
- **WorkOS**: Authentication and user management
- **Inertia.js**: Server-side adapter for Laravel

### Frontend

- **React 19**: UI library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS 4**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Headless UI**: Unstyled UI components
- **Lucide React**: Icon library
- **Vite**: Build tool and dev server

### Development Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Laravel Pail**: Log viewer
- **Laravel Pint**: Code style fixer

## ✨ Features

### Authentication & User Management

- ✅ WorkOS-powered authentication
- ✅ Secure login/logout flow
- ✅ Session validation middleware
- ✅ User profile management
- ✅ Account deletion with WorkOS integration
- ✅ Avatar support

### Theme System

- ✅ Light/Dark/System theme modes
- ✅ Persistent theme preferences (cookies + localStorage)
- ✅ SSR-compatible theme switching
- ✅ Automatic system theme detection
- ✅ Smooth theme transitions

### UI/UX Features

- ✅ Responsive sidebar navigation
- ✅ Collapsible sidebar with icon mode
- ✅ Breadcrumb navigation
- ✅ Modern, accessible components
- ✅ Mobile-responsive design
- ✅ Loading states and transitions
- ✅ Form validation and error handling

## 📁 Project Structure

```
magicQC/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Controller.php
│   │   │   └── Settings/
│   │   │       └── ProfileController.php
│   │   └── Middleware/
│   │       ├── HandleAppearance.php
│   │       └── HandleInertiaRequests.php
│   ├── Models/
│   │   └── User.php
│   └── Providers/
│       └── AppServiceProvider.php
├── bootstrap/
│   └── app.php
├── config/
│   ├── app.php
│   ├── auth.php
│   ├── database.php
│   ├── inertia.php
│   └── ...
├── database/
│   ├── factories/
│   │   └── UserFactory.php
│   ├── migrations/
│   │   ├── 0001_01_01_000000_create_users_table.php
│   │   ├── 0001_01_01_000001_create_cache_table.php
│   │   └── 0001_01_01_000002_create_jobs_table.php
│   ├── seeders/
│   │   └── DatabaseSeeder.php
│   └── database.sqlite
├── public/
│   ├── index.php
│   └── ...
├── resources/
│   ├── css/
│   │   └── app.css
│   ├── js/
│   │   ├── actions/          # Type-safe action helpers
│   │   ├── components/       # React components
│   │   │   ├── ui/           # Reusable UI components
│   │   │   └── ...
│   │   ├── hooks/            # Custom React hooks
│   │   ├── layouts/          # Layout components
│   │   ├── pages/            # Page components
│   │   ├── routes/           # Type-safe route helpers
│   │   ├── types/           # TypeScript definitions
│   │   ├── wayfinder/       # Wayfinder configuration
│   │   ├── app.tsx          # Inertia app entry point
│   │   └── ssr.tsx          # SSR entry point
│   └── views/
│       └── app.blade.php    # Root Blade template
├── routes/
│   ├── auth.php             # Authentication routes
│   ├── console.php          # Artisan commands
│   ├── settings.php         # Settings routes
│   └── web.php              # Main web routes
├── storage/
├── tests/
├── vendor/
├── .env.example
├── composer.json
├── package.json
├── phpunit.xml
├── tsconfig.json
└── vite.config.ts
```

## 🚀 Installation

### Prerequisites

- PHP 8.2 or higher
- Composer
- Node.js 18+ and npm
- SQLite (or MySQL/PostgreSQL)

### Step 1: Clone and Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install Node dependencies
npm install
```

### Step 2: Environment Configuration

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### Step 3: Configure Environment Variables

Edit `.env` file with your configuration:

```env
APP_NAME="MagicQC"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=sqlite
# DB_DATABASE=database.sqlite (default)

# No additional authentication configuration needed
# Laravel's built-in authentication is used
```

### Step 4: Database Setup

```bash
# Create database file (if using SQLite)
touch database/database.sqlite

# Run migrations
php artisan migrate

# (Optional) Seed database
php artisan db:seed
```

### Step 5: Build Assets

```bash
# Development build
npm run dev

# Production build
npm run build
```

### Step 6: Start Development Server

```bash
# Using Composer script (recommended)
composer dev

# Or manually:
php artisan serve
npm run dev
```

The application will be available at `http://localhost:8000`

## ⚙️ Configuration

### Application Configuration

Main configuration files are located in `config/`:

- `app.php`: Application name, environment, timezone
- `auth.php`: Authentication configuration
- `database.php`: Database connections
- `inertia.php`: Inertia.js configuration
- `session.php`: Session configuration

### Middleware Configuration

Middleware is registered in `bootstrap/app.php`:

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
    
    $middleware->web(append: [
        HandleAppearance::class,
        HandleInertiaRequests::class,
        AddLinkHeadersForPreloadedAssets::class,
    ]);
})
```

### Vite Configuration

Vite is configured in `vite.config.ts`:

- React plugin for JSX support
- Tailwind CSS plugin
- Wayfinder plugin for type-safe routes
- Laravel Vite plugin for asset management

## 💻 Development

### Development Workflow

The project uses a concurrent development setup:

```bash
composer dev
```

This command runs:
- Laravel development server
- Queue worker
- Laravel Pail (log viewer)
- Vite dev server

### Code Quality

```bash
# Format code (Prettier)
npm run format

# Check formatting
npm run format:check

# Lint code (ESLint)
npm run lint

# Type check (TypeScript)
npm run types
```

### PHP Code Style

```bash
# Format PHP code
./vendor/bin/pint
```

## 🏗 Architecture

### Inertia.js Architecture

The application uses Inertia.js to create a SPA experience:

1. **Server-Side**: Laravel controllers return Inertia responses
2. **Client-Side**: React components receive props from server
3. **Navigation**: Inertia handles page transitions without full reloads
4. **SSR**: Server-side rendering supported for initial page load

### Data Flow

```
User Action → Inertia Request → Laravel Controller → Inertia Response → React Component
```

### Shared Data

The `HandleInertiaRequests` middleware shares data to all pages:

- `name`: Application name
- `quote`: Random inspiring quote
- `auth.user`: Current authenticated user
- `sidebarOpen`: Sidebar state

## 🔐 Authentication

### WorkOS Integration

The application uses WorkOS for authentication:

1. **Login**: Redirects to WorkOS login page
2. **Callback**: `/authenticate` route handles OAuth callback
3. **Session**: WorkOS validates session on each request
4. **Logout**: WorkOS logout with account cleanup

### Authentication Flow

```
1. User clicks "Login" → Redirects to WorkOS
2. User authenticates with WorkOS
3. WorkOS redirects to /authenticate
4. Laravel creates/updates user with workos_id
5. User redirected to dashboard
```

### Protected Routes

Routes protected with authentication middleware:

```php
Route::middleware([
    'auth',
    ValidateSessionWithWorkOS::class,
])->group(function () {
    // Protected routes
});
```

### User Model

The `User` model includes:

- `workos_id`: Unique WorkOS identifier
- `name`: User's display name
- `email`: User's email address
- `avatar`: User's avatar URL

## 🎨 Theme System

### Theme Modes

The application supports three theme modes:

- **Light**: Always light mode
- **Dark**: Always dark mode
- **System**: Follows OS preference

### Implementation

Theme management is handled by:

1. **Frontend Hook**: `use-appearance.tsx`
   - Manages theme state
   - Persists to localStorage
   - Sets cookie for SSR

2. **Middleware**: `HandleAppearance.php`
   - Reads appearance cookie
   - Shares to Blade template

3. **Blade Template**: `app.blade.php`
   - Applies dark class immediately
   - Prevents flash of wrong theme

### Theme Persistence

- **Client-side**: localStorage for instant access
- **Server-side**: Cookie for SSR compatibility
- **System Detection**: Media query listener for system theme changes

## 🛣 Routes & API

### Web Routes

#### Public Routes

- `GET /` - Welcome page
- `GET /login` - Login page (redirects to WorkOS)
- `GET /authenticate` - OAuth callback

#### Protected Routes

- `GET /dashboard` - Main dashboard
- `GET /settings/profile` - Profile settings
- `PATCH /settings/profile` - Update profile
- `DELETE /settings/profile` - Delete account
- `GET /settings/appearance` - Appearance settings
- `POST /logout` - Logout

### Type-Safe Routes

Routes are generated by Wayfinder and available in `resources/js/routes/index.ts`:

```typescript
import { dashboard, login, logout } from '@/routes';

// Usage
<Link href={dashboard()}>Dashboard</Link>
router.post(logout());
```

### Route Helpers

All routes have type-safe helpers:

- `route()` - Get route definition
- `route.url()` - Get URL string
- `route.form()` - Get form definition
- `route.get()`, `route.post()`, etc. - Method-specific definitions

## 🗄 Database Schema

### Users Table

```sql
users
├── id (bigint, primary key)
├── name (string)
├── email (string, unique)
├── email_verified_at (timestamp, nullable)
├── workos_id (string, unique)
├── avatar (text)
├── remember_token (string, nullable)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### Sessions Table

```sql
sessions
├── id (string, primary key)
├── user_id (bigint, nullable, indexed)
├── ip_address (string, nullable)
├── user_agent (text, nullable)
├── payload (longtext)
└── last_activity (integer, indexed)
```

### Cache & Jobs Tables

Standard Laravel cache and queue tables for background processing.

## 🎨 Frontend Components

### Layout Components

- **AppLayout**: Main application layout with sidebar
- **AppSidebar**: Collapsible sidebar navigation
- **AppHeader**: Top header with breadcrumbs
- **SettingsLayout**: Settings page layout

### UI Components

Located in `resources/js/components/ui/`:

- `Button`: Styled button component
- `Input`: Form input with validation
- `Card`: Container component
- `Dialog`: Modal dialogs
- `DropdownMenu`: Dropdown menus
- `Sidebar`: Sidebar component
- `Avatar`: User avatar display
- And more...

### Feature Components

- `AppearanceDropdown`: Theme selector
- `AppearanceTabs`: Theme settings tabs
- `DeleteUser`: Account deletion form
- `NavUser`: User menu in sidebar
- `NavMain`: Main navigation items
- `NavFooter`: Footer navigation links

### Custom Hooks

- `use-appearance.tsx`: Theme management
- `use-mobile.tsx`: Mobile device detection
- `use-initials.tsx`: Generate user initials
- `use-mobile-navigation.ts`: Mobile navigation state

## 🔧 Backend Structure

### Controllers

#### ProfileController

Located at `app/Http/Controllers/Settings/ProfileController.php`:

- `edit()`: Display profile settings page
- `update()`: Update user profile (name)
- `destroy()`: Delete user account (with WorkOS integration)

### Middleware

#### HandleInertiaRequests

Shares data to all Inertia pages:

- Application name
- Random quote
- Authenticated user
- Sidebar state

#### HandleAppearance

Reads appearance cookie and shares to Blade template for SSR.

### Models

#### User Model

- Mass assignable: `name`, `email`, `workos_id`, `avatar`
- Hidden: `workos_id`, `remember_token`
- Casts: `email_verified_at` (datetime), `password` (hashed)

## 📄 Key Files

### Backend Files

1. **`bootstrap/app.php`**
   - Application bootstrap
   - Middleware registration
   - Route configuration

2. **`app/Http/Middleware/HandleInertiaRequests.php`**
   - Inertia middleware
   - Shared data definition
   - Asset versioning

3. **`app/Http/Controllers/Settings/ProfileController.php`**
   - Profile management
   - Account deletion

4. **`routes/web.php`**
   - Main application routes
   - Route groups and middleware

### Frontend Files

1. **`resources/js/app.tsx`**
   - Inertia app initialization
   - React root setup
   - Theme initialization

2. **`resources/views/app.blade.php`**
   - Root Blade template
   - Inertia mounting point
   - Theme detection script

3. **`resources/js/layouts/app-layout.tsx`**
   - Main layout wrapper
   - Breadcrumb support

4. **`vite.config.ts`**
   - Build configuration
   - Plugin setup

## 📜 Scripts

### Composer Scripts

```bash
# Setup project (install dependencies, generate key, migrate, build)
composer setup

# Development (server, queue, logs, vite)
composer dev

# Development with SSR
composer dev:ssr

# Run tests
composer test
```

### NPM Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# SSR build
npm run build:ssr

# Format code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint

# Type check
npm run types
```

## 🧪 Testing

### PHP Tests

```bash
# Run PHPUnit tests
php artisan test

# Or using Composer
composer test
```

### Frontend Tests

Currently, frontend testing is not configured. Consider adding:

- Jest for unit tests
- React Testing Library for component tests
- Playwright for E2E tests

## 🚢 Deployment

### Production Build

```bash
# Install dependencies
composer install --no-dev --optimize-autoloader
npm ci

# Build assets
npm run build

# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Environment Variables

Ensure all production environment variables are set:

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://yourdomain.com`
- Database credentials
- Session and cache drivers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

## 🔗 Resources

- [Laravel Documentation](https://laravel.com/docs)
- [Inertia.js Documentation](https://inertiajs.com)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com)

## 📞 Support

For issues and questions:

1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

---

**Built with ❤️ using Laravel and React**

