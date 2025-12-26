# Migration from WorkOS to Laravel Basic Authentication

This document outlines the changes made to remove WorkOS and implement Laravel's built-in authentication system.

## Changes Made

### 1. Package Removal
- ✅ Removed `laravel/workos` from `composer.json`
- ✅ Removed WorkOS configuration from `config/services.php`

### 2. Database Changes
- ✅ Updated `users` table migration:
  - Removed `workos_id` column
  - Added `password` column
  - Made `avatar` nullable
- ✅ Created migration to update existing database: `2025_12_25_063216_update_users_table_remove_workos_add_password.php`

### 3. Authentication Controllers
- ✅ Created `AuthenticatedSessionController` for login/logout
- ✅ Created `RegisteredUserController` for user registration
- ✅ Updated `ProfileController`:
  - Removed WorkOS dependencies
  - Added email editing capability
  - Added password update functionality
  - Updated account deletion to require password confirmation

### 4. Routes
- ✅ Updated `routes/auth.php` to use Laravel authentication
- ✅ Removed `ValidateSessionWithWorkOS` middleware from all routes
- ✅ Added registration route

### 5. Frontend Pages
- ✅ Created `resources/js/pages/auth/login.tsx`
- ✅ Created `resources/js/pages/auth/register.tsx`
- ✅ Updated profile page to allow email editing
- ✅ Added password change section to profile page
- ✅ Updated delete user component to require password
- ✅ Updated welcome page to show register link

### 6. User Model
- ✅ Removed `workos_id` from fillable and hidden arrays
- ✅ Added `password` to fillable array
- ✅ Password casting already configured

## Next Steps

### 1. Update Dependencies

```bash
composer update
```

This will remove the WorkOS package from your vendor directory.

### 2. Run Migrations

If you have an existing database, run the migration:

```bash
php artisan migrate
```

This will:
- Remove the `workos_id` column
- Add the `password` column
- Make `avatar` nullable

**Important:** If you have existing users in your database, you'll need to:
- Set passwords for existing users, OR
- Delete existing users and have them register again

### 3. Update Existing Users (Optional)

If you want to keep existing users, you can create a seeder or use tinker:

```bash
php artisan tinker
```

```php
$user = User::find(1);
$user->password = Hash::make('new-password');
$user->save();
```

### 4. Clear Configuration Cache

```bash
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### 5. Regenerate Routes (Already Done)

Routes have been regenerated using Wayfinder. If needed, run:

```bash
php artisan wayfinder:generate
```

## Authentication Flow

### Registration
1. User visits `/register`
2. Fills in name, email, password, and password confirmation
3. Account is created and user is automatically logged in
4. Redirected to dashboard

### Login
1. User visits `/login`
2. Enters email and password
3. Optional "Remember me" checkbox
4. Redirected to dashboard (or intended URL)

### Logout
1. User clicks logout
2. Session is invalidated
3. Redirected to home page

### Profile Management
- Users can update their name and email
- Users can change their password (requires current password)
- Users can delete their account (requires password confirmation)

## Environment Variables

You can now remove these from your `.env` file (if they exist):

```env
WORKOS_CLIENT_ID=
WORKOS_API_KEY=
WORKOS_REDIRECT_URL=
```

## Testing

1. **Register a new user:**
   - Visit `/register`
   - Fill in the form
   - Should be redirected to dashboard

2. **Login:**
   - Visit `/login`
   - Enter credentials
   - Should be redirected to dashboard

3. **Update profile:**
   - Visit `/settings/profile`
   - Update name/email
   - Should see success message

4. **Change password:**
   - Visit `/settings/profile`
   - Scroll to password section
   - Enter current password and new password
   - Should see success message

5. **Delete account:**
   - Visit `/settings/profile`
   - Scroll to delete section
   - Enter password to confirm
   - Should be logged out and redirected to home

## Notes

- All authentication now uses Laravel's built-in session-based authentication
- Passwords are hashed using Laravel's default hashing (bcrypt)
- Email verification is available but not enforced (can be enabled if needed)
- The application no longer depends on external authentication services

## Troubleshooting

### "Class 'Laravel\WorkOS\...' not found"
- Run `composer update` to remove the package
- Clear config cache: `php artisan config:clear`

### "Column 'workos_id' doesn't exist"
- Run migrations: `php artisan migrate`

### "Password field required"
- Make sure you've run the migration
- Check that the `password` column exists in the users table

### Can't login after migration
- Existing users won't have passwords set
- Either set passwords manually or have users register again
- You can reset a user's password using tinker or a seeder

