# Supabase Setup Instructions

## 1. Create Environment File

Create a `.env.local` file in the root directory with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xkholdgzgnhelzgkklwg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhraG9sZGd6Z25oZWx6Z2trbHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDc3MjMsImV4cCI6MjA3OTkyMzcyM30.rzZpmO_OE6cbO1do7BcjK23r74Edd4IJ--oRTMlhI0Q

# Service Role Key - Get this from Supabase Dashboard > Settings > API
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
```

**Important:** Replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual service role key from:
- Supabase Dashboard → Settings → API → `service_role` key (secret)

## 2. Run Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/xkholdgzgnhelzgkklwg
2. Navigate to SQL Editor
3. Copy the contents of `supabase-migration.sql`
4. Paste and run the SQL migration
5. Verify all tables were created successfully

## 3. Verify Setup

After completing the above steps:

1. Restart your Next.js development server
2. The default admin user will be created automatically:
   - Username: `admin`
   - Password: `admin123`
3. Test by:
   - Registering a new user
   - Creating a room
   - Adding songs to the room
   - Making comparisons

## What Was Migrated

- ✅ User authentication and management (now using bcrypt for password hashing)
- ✅ Room creation and management
- ✅ Song management
- ✅ Comments system
- ✅ Comparison/voting system
- ✅ All API routes updated to use async Supabase queries

## Notes

- All data is now persisted in Supabase PostgreSQL database
- Password hashing upgraded from base64 to bcrypt
- The system maintains backward compatibility with existing API interfaces
- Default admin user is created automatically if none exists

