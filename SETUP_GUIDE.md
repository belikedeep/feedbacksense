# FeedbackSense Setup Guide

## Quick Setup with Prisma

### 1. Database Setup (Choose One Option)

#### Option A: Using Supabase (Recommended)
1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Wait for the project to be ready (2-3 minutes)

2. **Get Database URL**
   - Go to Settings > Database in your Supabase dashboard
   - Copy the connection string under "Connection string" > "URI"
   - It will look like: `postgresql://postgres:[password]@[host]:5432/postgres`

3. **Update Environment Variables**
   ```env
   # Update .env.local with your credentials
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
   ```

#### Option B: Using Local PostgreSQL
1. **Install PostgreSQL locally**
2. **Create a database**: `createdb feedbacksense`
3. **Update DATABASE_URL**: `postgresql://username:password@localhost:5432/feedbacksense`

### 2. Initialize Database with Prisma

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push
```

### 3. Run the Application

```bash
npm run dev
```

That's it! Your app will be running at `http://localhost:3000`

## Development Commands

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio

# Create and apply migrations (production)
npm run db:migrate
```

## Troubleshooting

### Database Connection Issues
- Ensure your DATABASE_URL is correct
- Check if PostgreSQL is running
- Verify network connectivity to Supabase

### Prisma Client Issues
- Run `npm run db:generate` after any schema changes
- Delete `node_modules/.prisma` and regenerate if needed

### Authentication Issues
- Verify Supabase URL and keys are correct
- Check if RLS policies are properly set up

## Development Workflow

1. **Make schema changes** in `prisma/schema.prisma`
2. **Push changes** with `npm run db:push`
3. **Generate client** with `npm run db:generate`
4. **Update API routes** if needed
5. **Test the changes**

## Production Deployment

1. **Set environment variables** in your hosting platform
2. **Run migrations**: `npx prisma migrate deploy`
3. **Generate client**: `npx prisma generate`
4. **Build application**: `npm run build`

## Database Schema

The application uses these main tables:
- `profiles` - User profiles (extends Supabase auth.users)
- `feedback` - Customer feedback entries
- `categories` - Custom feedback categories

All tables have Row Level Security (RLS) enabled for data isolation.