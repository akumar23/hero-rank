import { turso } from '../utils/turso';
import { firestore } from '../utils/firebase';
import { HeroRating } from '../types/heroRating';

async function migrateFirestoreToTurso() {
  console.log('Starting Firestore to Turso migration...');
  
  try {
    // Initialize database schema in Turso
    await initializeTursoSchema();
    
    // Fetch all hero ratings from Firestore
    const heroRatings = await fetchAllHeroRatings();
    
    // Migrate hero ratings to Turso
    await migrateHeroRatingsToTurso(heroRatings);
    
    // Fetch all votes from Firestore
    const votes = await fetchAllVotes();
    
    // Migrate votes to Turso
    await migrateVotesToTurso(votes);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

async function initializeTursoSchema() {
  console.log('Initializing Turso database schema...');
  
  // Create tables for hero ratings and votes
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS heroRatings (
      id INTEGER PRIMARY KEY,
      hero_id INTEGER NOT NULL,
      rating REAL NOT NULL,
      games INTEGER NOT NULL,
      wins INTEGER NOT NULL,
      losses INTEGER NOT NULL,
      is_provisional BOOLEAN NOT NULL,
      peak_rating REAL NOT NULL,
      lowest_rating REAL NOT NULL,
      win_rate REAL NOT NULL,
      current_streak INTEGER NOT NULL,
      last_updated TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      voted_for INTEGER NOT NULL,
      voted_against INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  
  console.log('Turso schema initialized successfully');
}

async function fetchAllHeroRatings() {
  if (!firestore) {
    throw new Error('Firebase Firestore is not configured');
  }
  
  console.log('Fetching all hero ratings from Firestore...');
  const db = firestore;
  const snapshot = await db.collection('heroRatings').get();
  const heroRatings: HeroRating[] = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data() as HeroRating;
    heroRatings.push({ ...data, heroId: parseInt(doc.id, 10) });
  });
  
  console.log(`Fetched ${heroRatings.length} hero ratings from Firestore`);
  return heroRatings;
}

async function migrateHeroRatingsToTurso(heroRatings: HeroRating[]) {
  console.log(`Migrating ${heroRatings.length} hero ratings to Turso...`);
  
  for (const rating of heroRatings) {
    try {
      await turso.execute({
        sql: `
          INSERT OR REPLACE INTO heroRatings (id, hero_id, rating, games, wins, losses, is_provisional, 
            peak_rating, lowest_rating, win_rate, current_streak, 
            last_updated, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          rating.heroId,
          rating.heroId,
          rating.rating,
          rating.games,
          rating.wins,
          rating.losses,
          rating.isProvisional ? 1 : 0,
          rating.peakRating,
          rating.lowestRating,
          rating.winRate,
          rating.currentStreak,
          rating.lastUpdated?.toDate ? rating.lastUpdated.toDate().toISOString() : rating.lastUpdated?.toString() || new Date().toISOString(),
          rating.createdAt?.toDate ? rating.createdAt.toDate().toISOString() : rating.createdAt?.toString() || new Date().toISOString()
        ]
      });
    } catch (error) {
      console.error(`Error migrating hero rating ${rating.heroId}:`, error);
    }
  }
  
  console.log(`Successfully migrated ${heroRatings.length} hero ratings to Turso`);
}

async function fetchAllVotes() {
  if (!firestore) {
    throw new Error('Firebase Firestore is not configured');
  }
  
  console.log('Fetching all votes from Firestore...');
  const db = firestore;
  const snapshot = await db.collection('votes').get();
  const votes: any[] = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    votes.push({ 
      id: doc.id, 
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt?.toString() || new Date().toISOString()
    });
  });
  
  console.log(`Fetched ${votes.length} votes from Firestore`);
  return votes;
}

async function migrateVotesToTurso(votes: any[]) {
  console.log(`Migrating ${votes.length} votes to Turso...`);
  
  for (const vote of votes) {
    try {
      await turso.execute({
        sql: `
          INSERT OR REPLACE INTO votes (id, voted_for, voted_against, created_at) 
          VALUES (?, ?, ?, ?)
        `,
        args: [
          vote.id,
          vote.votedFor,
          vote.votedAgainst,
          vote.createdAt
        ]
      });
    } catch (error) {
      console.error(`Error migrating vote ${vote.id}:`, error);
    }
  }
  
  console.log(`Successfully migrated ${votes.length} votes to Turso`);
}

// Run the migration
migrateFirestoreToTurso().catch(console.error);