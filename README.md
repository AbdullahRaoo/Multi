# MagicQC - Quality Control Management System

A full-stack quality control management application built with Laravel 12 and React 19, featuring MindVision industrial camera integration, annotation management, measurement tracking, and inspection workflows for garment manufacturing.

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

MagicQC is a quality control management system for garment manufacturing. It handles brand/article management, purchase orders, operator workflows, measurement inspections, camera image capture, and annotation management — all through a modern SPA built with Inertia.js.

### Key Characteristics

- **Full-Stack Framework**: Laravel 12 backend with React 19 frontend
- **SPA Experience**: Inertia.js provides seamless navigation without page reloads
- **Camera Integration**: MindVision industrial camera via Python Flask bridge server
- **Annotation System**: Upload, manage, and visualize garment annotations with reference images
- **Measurement Tracking**: Size-based measurements with tolerance validation (cm/inches/fractions)
- **Role-Based Access**: System login (Manager QC, MEB), developer mode, and operator PIN auth
- **Modern UI**: Built with Radix UI, shadcn/ui components, and Tailwind CSS 4
- **SSR Support**: Server-side rendering configured and ready

## 🛠 Technology Stack

### Backend

- **Laravel 12**: PHP framework
- **PHP 8.2+**: Programming language
- **MySQL**: Database (via XAMPP)
- **Inertia.js**: Server-side adapter for Laravel

### Python

- **Python 3.x**: Camera server runtime
- **Flask**: HTTP server for camera API
- **OpenCV**: Image processing and JPEG encoding
- **NumPy**: Frame buffer handling

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

### Quality Control Core

- ✅ Brand & article management (CRUD)
- ✅ Purchase order tracking with client references
- ✅ Measurement definitions with size grading and tolerances
- ✅ Measurement sessions with pass/fail validation
- ✅ Inspection records with operator tracking
- ✅ Director analytics dashboard

### Camera & Image System

- ✅ MindVision industrial camera integration via Python Flask server
- ✅ MJPEG live preview streaming
- ✅ Black/Other garment mode with gain & exposure presets
- ✅ High-resolution capture (5456×2812)
- ✅ File upload fallback when camera offline

### Annotation System

- ✅ Upload annotation JSON + reference images per article/size/side
- ✅ Front/back side support
- ✅ Annotation data visualization
- ✅ API for external annotation uploads
- ✅ Base64 + file storage for reference images

### Authentication & Access Control

- ✅ System login (Manager QC, MEB roles)
- ✅ Developer login with settings access
- ✅ Operator PIN-based authentication
- ✅ Role-based middleware (EnsureManagerQC, EnsureMEB, EnsureDeveloper)
- ✅ Session-based auth with Inertia

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
│   │   │   ├── AnnotationUploadController.php
│   │   │   ├── ArticleController.php
│   │   │   ├── ArticleImageController.php
│   │   │   ├── ArticleRegistrationController.php
│   │   │   ├── BrandController.php
│   │   │   ├── CameraCaptureController.php
│   │   │   ├── DirectorAnalyticsController.php
│   │   │   ├── MeasurementController.php
│   │   │   ├── OperatorController.php
│   │   │   ├── PurchaseOrderController.php
│   │   │   ├── SystemSettingsController.php
│   │   │   ├── DeveloperSettingsController.php
│   │   │   ├── Api/
│   │   │   │   └── CameraImageController.php
│   │   │   ├── Auth/
│   │   │   │   ├── DeveloperLoginController.php
│   │   │   │   └── FixedCredentialLoginController.php
│   │   │   └── Settings/
│   │   │       └── ProfileController.php
│   │   └── Middleware/
│   │       ├── EnsureAuthenticatedOrDeveloper.php
│   │       ├── EnsureDeveloper.php
│   │       ├── EnsureManagerQC.php
│   │       ├── EnsureMEB.php
│   │       ├── EnsureSystemRole.php
│   │       ├── HandleAppearance.php
│   │       └── HandleInertiaRequests.php
│   ├── Models/
│   │   ├── Article.php
│   │   ├── ArticleAnnotation.php
│   │   ├── ArticleImage.php
│   │   ├── ArticleType.php
│   │   ├── Brand.php
│   │   ├── CameraCalibration.php
│   │   ├── InspectionRecord.php
│   │   ├── Measurement.php
│   │   ├── MeasurementSize.php
│   │   ├── Operator.php
│   │   ├── PurchaseOrder.php
│   │   ├── PurchaseOrderArticle.php
│   │   ├── PurchaseOrderClientReference.php
│   │   ├── SystemCredential.php
│   │   ├── UploadedAnnotation.php
│   │   └── User.php
│   └── Providers/
│       └── AppServiceProvider.php
├── python/
│   ├── camera_server.py         # Flask camera bridge (port 5555)
│   └── image_annotator.py       # Annotation helper tools
├── resources/
│   ├── css/
│   │   └── app.css
│   └── js/
│       ├── pages/
│       │   ├── dashboard.tsx
│       │   ├── annotation-upload/index.tsx
│       │   ├── article-registration/index.tsx
│       │   ├── articles/{index,show,create,edit,camera-capture}.tsx
│       │   ├── brands/{index,show,create,edit}.tsx
│       │   ├── measurements/{index,show,create,edit}.tsx
│       │   ├── operators/{index,show,create,edit}.tsx
│       │   ├── purchase-orders/{index,show,create,edit}.tsx
│       │   ├── director-analytics/index.tsx
│       │   ├── developer-settings/index.tsx
│       │   ├── system-settings/index.tsx
│       │   ├── auth/{system-login,developer-login}.tsx
│       │   └── settings/{profile,appearance}.tsx
│       ├── components/       # Reusable React/shadcn components
│       ├── layouts/          # AppLayout, sidebar, header
│       ├── hooks/            # Custom React hooks
│       └── types/            # TypeScript definitions
├── routes/
│   ├── web.php               # Main web routes
│   ├── api.php               # API routes
│   ├── auth.php              # Auth routes
│   ├── settings.php          # Settings routes
│   └── console.php           # Artisan commands
├── database/
│   ├── migrations/
│   └── seeders/
├── config/
├── storage/
├── tests/
├── composer.json
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🚀 Installation

### Prerequisites

- PHP 8.2 or higher
- Composer
- Node.js 18+ and npm
- MySQL (via XAMPP or standalone)
- Python 3.x with pip (for camera server)

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
### Step 5: Python Camera Server Setup

```bash
# Create virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows

# Install Python dependencies
pip install flask flask-cors opencv-python numpy
```

### Step 6: Build Assets

```bash
# Development build
npm run dev

# Production build
npm run build
```

### Step 7: Start Development Server

```bash
# Laravel + Vite (recommended)
composer dev

# Or manually:
php artisan serve
npm run dev

# Camera server (separate terminal)
python python/camera_server.py
# → runs on http://localhost:5555
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

### Laravel Authentication

The application uses Laravel's built-in authentication system:

1. **Registration**: Users can create accounts with email and password
2. **Login**: Email and password authentication
3. **Session**: Laravel manages sessions automatically
4. **Logout**: Session invalidation and cleanup

### Authentication Flow

```
1. User visits /register or /login
2. User enters credentials (email/password)
3. Laravel validates and authenticates
4. Session is created
5. User redirected to dashboard
```

### Protected Routes

Routes protected with authentication middleware:

```php
Route::middleware(['auth'])->group(function () {
    // Protected routes
});
```

### User Model

The `User` model includes:

- `name`: User's display name
- `email`: User's email address
- `password`: Hashed password
- `avatar`: User's avatar URL (optional)

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
- `GET /login` - Login page
- `POST /login` - Handle login
- `GET /register` - Registration page
- `POST /register` - Handle registration

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

### Core Business Tables

#### brands
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, auto_increment |
| name | varchar(255) | unique |
| description | text | nullable |
| created_at / updated_at | timestamp | |

#### articles
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, auto_increment |
| brand_id | bigint | FK → brands |
| article_type_id | bigint | FK → article_types |
| article_style | varchar(255) | |
| description | text | nullable |
| created_at / updated_at | timestamp | |

#### article_types
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| name | varchar(255) | unique |

#### measurements
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| article_id | bigint | FK → articles |
| code | varchar(255) | |
| measurement | varchar(255) | |
| tol_plus / tol_minus | decimal(10,2) | nullable |
| side | varchar(20) | default: front |

#### measurement_sizes
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| measurement_id | bigint | FK → measurements |
| size | varchar(255) | |
| value | decimal(10,2) | |
| unit | varchar(10) | default: cm |

### Purchase Orders

#### purchase_orders
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| po_number | varchar(255) | unique |
| date | date | |
| brand_id | bigint | FK → brands |
| country | varchar(255) | |
| status | enum | Active, Pending, Completed |

#### purchase_order_articles
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| purchase_order_id | bigint | FK → purchase_orders |
| article_type_id | bigint | FK → article_types |
| article_style | varchar(255) | |
| article_description | text | nullable |
| article_color | varchar(255) | nullable |
| order_quantity | int | |

#### purchase_order_client_references
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| purchase_order_id | bigint | FK → purchase_orders |
| reference_name | varchar(255) | |
| reference_number / email / subject | varchar(255) | nullable |
| email_date | date | nullable |

### Inspection & Measurement Results

#### inspection_records
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| operator_id | bigint | FK → operators |
| article_id | bigint | FK → articles |
| brand_id | bigint | FK → brands |
| purchase_order_id | bigint | FK, nullable |
| article_style | varchar(255) | |
| size | varchar(255) | nullable |
| result | enum | pass, fail |
| remarks | text | nullable |
| measurement_data | longtext (JSON) | nullable |
| inspected_at | datetime | |

#### measurement_results
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| purchase_order_article_id | bigint | FK |
| measurement_id | bigint | FK → measurements |
| size | varchar(50) | |
| measured_value | decimal(10,2) | nullable |
| status | enum | PASS, FAIL, PENDING |
| operator_id | bigint | FK, nullable |
| tol_plus / tol_minus | decimal(10,2) | nullable |
| expected_value | decimal(10,2) | nullable |

#### measurement_sessions
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| operator_id | bigint | FK → operators |
| purchase_order_id | bigint | FK, nullable |
| article_id | bigint | FK → articles |
| size | varchar(255) | |
| status | enum | in_progress, completed, cancelled |
| started_at / completed_at | timestamp | |

### Images & Annotations

#### article_images
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| article_id | bigint | FK → articles |
| article_style | varchar(255) | |
| size | varchar(255) | |
| image_path | varchar(255) | |
| image_name | varchar(255) | nullable |

#### article_annotations
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| article_id | bigint | FK → articles |
| article_image_id | bigint | FK → article_images |
| article_style / size | varchar(255) | |
| name | varchar(255) | nullable |
| annotations | longtext (JSON) | |
| target_distances / placement_box / keypoints_pixels | longtext (JSON) | nullable |
| image_width / image_height | int | nullable |
| native_width / native_height | int | defaults: 5488×3672 |
| capture_source | varchar(50) | default: webcam |
| reference_image_path | varchar(255) | nullable |
| image_data | longtext (base64) | nullable |
| json_file_path | varchar(255) | nullable |

#### uploaded_annotations
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| article_id | bigint | FK, nullable |
| article_style | varchar(255) | |
| size | varchar(255) | |
| side | varchar(10) | default: front |
| name | varchar(255) | nullable |
| annotation_data | longtext (JSON) | |
| reference_image_path | varchar(255) | nullable |
| reference_image_data | longtext (base64) | nullable |
| reference_image_filename | varchar(255) | nullable |
| reference_image_mime_type | varchar(255) | nullable |
| reference_image_size | bigint | nullable |
| image_width / image_height | int | nullable |
| original_json_filename | varchar(255) | nullable |
| api_image_url | varchar(255) | nullable |
| upload_source | varchar(255) | default: manual |
| annotation_date | timestamp | nullable |
| **Unique constraint**: `(article_id, size, side)` |

### Camera & Calibration

#### camera_calibrations
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| name | varchar(255) | nullable |
| pixels_per_cm | float | |
| reference_length_cm | float | |
| pixel_distance | int | nullable |
| calibration_image | text | nullable |
| calibration_points | longtext (JSON) | nullable |
| is_active | tinyint(1) | default: 1 |

### Users & Auth

#### operators
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| full_name | varchar(255) | |
| employee_id | varchar(255) | unique |
| department | varchar(255) | nullable |
| contact_number | varchar(255) | nullable |
| login_pin | varchar(255) | hashed |

#### system_credentials
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| role | varchar(255) | unique (manager_qc, meb) |
| username | varchar(255) | |
| password | varchar(255) | hashed |
| display_name | varchar(255) | |

#### users
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| login_id | varchar(255) | |
| name | varchar(255) | |
| email | varchar(255) | unique |
| password | varchar(255) | hashed |
| avatar | text | nullable |
| is_admin | tinyint(1) | default: 0 |

#### api_keys
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| name | varchar(255) | |
| key | varchar(64) | unique |
| is_active | tinyint(1) | default: 1 |
| last_used_at | timestamp | nullable |

### Infrastructure Tables

Standard Laravel tables: `sessions`, `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`, `migrations`.

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
- `destroy()`: Delete user account (requires password confirmation)

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

- Mass assignable: `name`, `email`, `password`, `avatar`
- Hidden: `password`, `remember_token`
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


