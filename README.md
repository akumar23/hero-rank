# Hero Rank

A full-stack web application that ranks superheroes through head-to-head voting using the Elo rating system. Users vote on matchups between random heroes, and the app calculates sophisticated ratings to determine who truly reigns supreme.

## What Does This Do?

Hero Rank presents you with two random superheroes and asks: "Who would win?" Your votes power an Elo rating system (the same algorithm used in chess rankings) to create a definitive superhero leaderboard. The more you vote, the more accurate the rankings become.

## Features

- **Head-to-Head Voting**: Compare two random superheroes and cast your vote
- **Elo Rating System**: Dynamic ratings that adjust based on match outcomes and rating differences
- **Wilson Score Confidence**: Statistical confidence intervals that account for sample size
- **Real-Time Rating Updates**: See immediate rating changes after each vote
- **Comprehensive Statistics**: Track wins, losses, streaks, peak ratings, and more
- **Responsive Rankings Grid**: Browse all heroes sorted by rating with detailed stats
- **Incremental Static Regeneration**: Fast page loads with 60-second revalidation
- **Provisional Rating System**: New heroes get higher volatility for faster rating discovery

## Tech Stack

This project is built with the **T3 Stack** - a modern, type-safe web development stack:

- **[Next.js 14](https://nextjs.org/)** - React framework for server-rendered and statically-generated pages
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety across the entire application
- **[tRPC v9](https://trpc.io/)** - End-to-end type-safe API layer (no code generation needed)
- **[React Query v3](https://tanstack.com/query/v3)** - Data fetching and caching (integrated with tRPC)
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework for styling
- **[Turso](https://turso.tech/)** - Distributed SQLite database (libSQL)
- **[Firebase](https://firebase.google.com/)** - Legacy data source (migration to Turso complete)
- **[SuperHero API](https://superheroapi.com/)** - External API for hero metadata and images
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library for smooth transitions

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **pnpm**
- **A Turso account** - [Sign up free](https://turso.tech/)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hero-rank
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Your Database

This project uses **Turso**, a distributed SQLite database. Follow these steps:

#### Install Turso CLI

```bash
# macOS/Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Windows (PowerShell)
iwr https://get.tur.so/install.ps1 -useb | iex
```

#### Create Your Database

```bash
# Create a new Turso database
turso db create hero-rank-turso

# Get your database URL
turso db show hero-rank-turso --url

# Generate an auth token
turso db tokens create hero-rank-turso
```

### 4. Configure Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and add your Turso credentials:

```env
# Turso Configuration (Required)
TURSO_DB_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token

# Firebase Configuration (Optional - only needed for data migration)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 5. Initialize Database Schema

Run the migration script to create the necessary tables:

```bash
npm run init-schema
```

This creates two tables:
- `heroRatings`: Stores Elo ratings and statistics for each hero
- `votes`: Records all vote history

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on localhost:3000 |
| `npm run build` | Build production-optimized application |
| `npm run start` | Start production server (run `build` first) |
| `npm run lint` | Run ESLint to check code quality |
| `npm run init-schema` | Initialize Turso database schema |
| `npm run migrate` | Migrate data from Firebase to Turso |

## Project Structure

```
src/
├── backend/
│   └── router/
│       └── index.ts              # tRPC router with API endpoints
├── components/
│   ├── RatingChangeToast.tsx     # Toast notification for rating changes
│   └── StatsDashboard.tsx        # Dashboard showing aggregate statistics
├── migrations/
│   ├── init-schema.ts            # Database schema initialization
│   └── migrate-firebase-to-turso.ts  # Data migration script
├── pages/
│   ├── api/
│   │   ├── hero-image/[id].ts    # Dynamic image proxy endpoint
│   │   └── trpc/[trpc].ts        # tRPC API handler
│   ├── index.tsx                 # Main voting page
│   └── results.tsx               # Rankings leaderboard (ISR)
├── types/
│   └── heroRating.ts             # TypeScript interfaces for hero data
└── utils/
    ├── elo.ts                    # Elo rating calculation utilities
    ├── firebase.ts               # Firebase configuration (legacy)
    ├── getRandomHero.ts          # Random hero ID generator
    ├── trpc.ts                   # tRPC client configuration
    ├── turso.ts                  # Turso database client
    └── wilsonScore.ts            # Wilson score confidence intervals
```

## How the Rating System Works

### Elo Rating

The app uses the **Elo rating system**, originally developed for chess:

1. **Initial Rating**: Every hero starts at 1500
2. **Expected Score**: Before a matchup, we calculate the probability each hero should win based on their rating difference
3. **Actual Result**: Users vote to determine the winner
4. **Rating Adjustment**: Both heroes' ratings change based on how surprising the result was
   - If a highly-rated hero beats a lower-rated one: small rating change
   - If a lower-rated hero upsets a higher-rated one: large rating change

### K-Factor (Rating Volatility)

The **K-factor** controls how much ratings can change from a single vote:

- **Provisional heroes** (< 10 games): K = 48 (higher volatility to find true rating quickly)
- **Established heroes** (≥ 10 games): K = 32 (more stable ratings)

### Wilson Score Confidence

To complement Elo ratings, the app calculates **Wilson score confidence intervals**:

- Accounts for **sample size** - a hero with 100 games is rated more confidently than one with 5 games
- Provides a **lower bound** on win rate that we can be 95% confident about
- Prevents heroes with 1-0 records from appearing at the top of rankings

### Provisional Status

Heroes are marked **provisional** until they have at least 20 games. Provisional ratings are:
- Less reliable (small sample size)
- Subject to larger swings
- Indicated with a badge in the UI

### Statistics Tracked

For each hero, the system tracks:
- **Current Rating**: Elo rating (updated after each vote)
- **Games/Wins/Losses**: Total matchups and outcomes
- **Win Rate**: Percentage of victories
- **Peak Rating**: Highest rating ever achieved
- **Lowest Rating**: Lowest rating ever recorded
- **Current Streak**: Consecutive wins (positive) or losses (negative)
- **Wilson Score**: Statistical confidence-adjusted win rate

## API Endpoints (tRPC)

The application exposes two tRPC procedures:

### Queries

- **`get-hero-by-id`**: Fetches hero metadata from SuperHero API
  - Input: `{ id: number }`
  - Returns: Hero data (name, images, stats, biography)

### Mutations

- **`cast-vote`**: Records a vote and updates Elo ratings
  - Input: `{ votedFor: number, votedAgainst: number }`
  - Returns: Rating changes and new ratings for both heroes
  - Updates both heroes atomically in the database

## Data Flow

1. **Homepage loads** → Generates two random hero IDs (1-731)
2. **Fetch hero data** → Calls `get-hero-by-id` for both heroes via tRPC
3. **User votes** → Calls `cast-vote` mutation with winner and loser IDs
4. **Update ratings** → Server calculates new Elo ratings and updates database
5. **Show feedback** → Toast notification displays rating changes
6. **New matchup** → Generate two new random heroes

## Migration Notes

This project originally used **Prisma + PlanetScale**, but migrated to **Turso** after PlanetScale removed their free tier.

If you have existing Firebase data:
1. Set up Firebase credentials in `.env`
2. Run `npm run migrate` to transfer data to Turso
3. Firebase integration remains for backward compatibility but is optional

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com/)
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set these in your deployment platform:
- `TURSO_DB_URL`
- `TURSO_AUTH_TOKEN`

Firebase variables are optional unless you're using the legacy migration features.

## Contributing

Contributions are welcome! This project follows standard TypeScript and React best practices:

- Use TypeScript for all new code
- Follow existing code style (run `npm run lint`)
- Keep components focused and reusable
- Add comments for complex logic

## Credits

- Built with the [T3 Stack](https://create.t3.gg/) by [Theo Browne](https://t3.gg)
- Hero data from [SuperHero API](https://superheroapi.com/)
- Inspired by classic ranking systems like [Elo rating](https://en.wikipedia.org/wiki/Elo_rating_system)

## License

This project is open source and available for personal and educational use.
