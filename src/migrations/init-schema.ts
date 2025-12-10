import { turso } from '../utils/turso';

/**
 * Initialize Turso Database Schema
 * 
 * This script creates the necessary tables in the Turso database.
 * Run with: npx tsx src/migrations/init-schema.ts
 */

async function initializeSchema() {
  console.log('Initializing Turso database schema...');
  
  try {
    // Create heroRatings table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS heroRatings (
        hero_id INTEGER PRIMARY KEY,
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
    
    console.log('✓ Created heroRatings table');
    
    // Create votes table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        voted_for INTEGER NOT NULL,
        voted_against INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    
    console.log('✓ Created votes table');
    
    // Verify tables were created
    const result = await turso.execute(`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `);
    
    console.log('\nTables in database:');
    result.rows.forEach((row: any) => {
      console.log(`  - ${row.name}`);
    });
    
    console.log('\n✓ Schema initialization completed successfully!');
  } catch (error) {
    console.error('✗ Schema initialization failed:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeSchema().catch(console.error);
