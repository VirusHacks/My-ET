# My ET - AI-Native Financial News Platform

A premium financial news platform built with cutting-edge technologies for curated AI-powered financial insights.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 with custom design tokens
- **UI Components**: Shadcn UI
- **Animation**: Framer Motion
- **Authentication**: Clerk
- **Database**: Neon (Serverless PostgreSQL)
- **ORM**: Drizzle ORM
- **Form Handling**: React Hook Form + Zod validation

## Project Structure

```
my-et/
├── app/
│   ├── layout.tsx                 # Root layout with Clerk provider
│   ├── page.tsx                   # Home page with marketing landing
│   ├── onboarding/
│   │   └── page.tsx              # Onboarding form page
│   ├── dashboard/
│   │   └── page.tsx              # Protected dashboard
│   ├── actions/
│   │   └── saveProfile.ts        # Server action for profile persistence
│   └── globals.css               # Global styles with design tokens
├── components/
│   ├── onboarding-form.tsx       # Form component with validation
│   ├── dashboard-header.tsx      # Dashboard header with user info
│   └── ui/                        # Shadcn UI components
├── lib/
│   ├── db/
│   │   ├── schema.ts             # Drizzle ORM schema definition
│   │   └── client.ts             # Database client setup
│   └── schemas/
│       └── onboarding.ts         # Zod validation schemas
├── scripts/
│   └── init-db.sql               # Database initialization script
├── middleware.ts                  # Clerk middleware for route protection
├── .env.example                   # Environment variables template
└── package.json                   # Dependencies
```

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Neon PostgreSQL Database
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

#### Getting Your Credentials:

**Neon Database:**
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from your database settings
4. Update `DATABASE_URL` in `.env.local`

**Clerk Authentication:**
1. Go to [clerk.com](https://clerk.com)
2. Create a new application
3. Copy the keys from your Clerk dashboard
4. Update both Clerk environment variables

### 3. Initialize the Database

The database tables are created automatically via the SQL script. When you run the application for the first time with a valid `DATABASE_URL`, the tables will be created.

Alternatively, manually run the initialization script:
```bash
psql $DATABASE_URL < scripts/init-db.sql
```

### 4. Run the Development Server

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## User Flow

1. **Landing Page** (`/`) - Anonymous users see the marketing landing page
2. **Authentication** - Clerk handles all sign-in/sign-up flows
3. **Onboarding** (`/onboarding`) - New users complete their profile:
   - Select their sector persona (Finance, Law, Founder, Student)
   - Add stock tickers to their watchlist (e.g., TCS, RELIANCE)
   - Specify their location
4. **Dashboard** (`/dashboard`) - Protected route showing:
   - User profile with selected sector and watchlist
   - Personalized content area (scaffold for future expansion)

## Key Features

### Authentication & Authorization
- Clerk handles all user authentication
- Middleware protects `/dashboard` route
- Automatic redirect to sign-in for unauthenticated users

### Form Validation
- Zod schemas ensure data integrity
- Real-time form validation with React Hook Form
- Custom error messages for better UX

### Database Schema
```typescript
users {
  id: string          // Clerk user ID (primary key)
  sector: enum        // Finance, Law, Founder, Student
  watchlist: string[] // Array of stock tickers
  location: string    // User's location
}
```

### Design System
The app uses a sophisticated color system inspired by The Economic Times:
- **Primary Color**: Deep Red (#8B2D2D) for brand identity
- **Secondary**: Slate Gray for neutral balance
- **Accents**: Complementary reds and grays
- **Glassmorphism UI**: Frosted glass effects with backdrop blur

### Animations
- Smooth page transitions with Framer Motion
- Animated background gradient orbs on landing and onboarding pages
- Form submission with loading spinner feedback

## API Routes

The application uses Next.js Server Actions for data mutations:
- `saveProfile` - Saves user profile to database (called from onboarding form)

## Styling

Custom design tokens are defined in `globals.css`:
- Colors use OKLch color space for better perceptual consistency
- Responsive typography with semantic sizing
- Glass-morphism effects with Tailwind CSS utilities
- Dark mode support via `.dark` class

## Development Tips

### Adding New Routes
1. Create new directories under `/app`
2. Add `page.tsx` for content
3. If protected, the middleware will handle auth checks based on the route pattern

### Extending the Database Schema
1. Update `schema.ts` in `/lib/db/`
2. Run migrations via `drizzle-kit`
3. Update Zod schemas if form validation is needed

### Styling Components
- Use Shadcn UI components from `/components/ui/`
- Apply Tailwind CSS classes with custom design tokens
- Reference the theme colors: `text-foreground`, `bg-primary`, etc.

## Deployment

Deploy to Vercel (recommended):
```bash
npm install -g vercel
vercel
```

Make sure to add environment variables in Vercel project settings:
- Go to Settings → Environment Variables
- Add all variables from `.env.example`
- Redeploy

## Troubleshooting

### "User not authenticated" error
- Ensure Clerk is properly configured with valid API keys
- Check that middleware is protecting the correct routes
- Verify user session exists in Clerk dashboard

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check Neon database status
- Ensure all required tables exist (run init-db.sql)

### Form validation failing
- Check that watchlist input matches expected format (comma-separated)
- Verify all required fields are filled
- Check browser console for Zod validation errors

## Future Enhancements

The foundation is set up for:
- Real-time news feeds based on user sector and watchlist
- AI-powered news summarization and analysis
- Portfolio tracking and alerts
- Social features for financial professionals
- Mobile app support
- Advanced analytics dashboard

## License

MIT
