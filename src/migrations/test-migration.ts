import { turso } from '../utils/turso';

/**
 * Test Migration Script
 * 
 * This script tests the Turso database setup and verifies that:
 * 1. Tables exist
 * 2. We can insert test data
 * 3. We can query test data
 * 4. The schema matches expectations
 */

async function testMigration() {
  console.log('🧪 Testing Turso Migration...\n');
  
  try {
    // Test 1: Check if tables exist
    console.log('Test 1: Checking if tables exist...');
    const tablesResult = await turso.execute({
      sql: "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
      args: []
    });
    
    const tableNames = tablesResult.rows.map((row: any) => row.name);
    console.log('✓ Found tables:', tableNames.join(', '));
    
    if (!tableNames.includes('heroRatings')) {
      throw new Error('heroRatings table not found!');
    }
    if (!tableNames.includes('votes')) {
      throw new Error('votes table not found!');
    }
    console.log('✓ All required tables exist\n');
    
    // Test 2: Insert test hero rating
    console.log('Test 2: Inserting test hero rating...');
    await turso.execute({
      sql: `
        INSERT OR REPLACE INTO heroRatings 
        (hero_id, rating, games, wins, losses, is_provisional, peak_rating, lowest_rating, win_rate, current_streak, last_updated, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `,
      args: [999, 1500, 0, 0, 0, 1, 1500, 1500, 0, 0]
    });
    console.log('✓ Test hero rating inserted\n');
    
    // Test 3: Query test hero rating
    console.log('Test 3: Querying test hero rating...');
    const heroResult = await turso.execute({
      sql: "SELECT * FROM heroRatings WHERE hero_id = ?",
      args: [999]
    });
    
    if (heroResult.rows.length === 0) {
      throw new Error('Failed to retrieve test hero rating!');
    }
    
    const testHero: any = heroResult.rows[0];
    console.log('✓ Retrieved test hero:', {
      hero_id: testHero.hero_id,
      rating: testHero.rating,
      games: testHero.games
    });
    console.log('✓ Test hero rating query successful\n');
    
    // Test 4: Insert test vote
    console.log('Test 4: Inserting test vote...');
    await turso.execute({
      sql: "INSERT INTO votes (voted_for, voted_against, created_at) VALUES (?, ?, datetime('now'))",
      args: [999, 998]
    });
    console.log('✓ Test vote inserted\n');
    
    // Test 5: Query test vote
    console.log('Test 5: Querying test votes...');
    const votesResult = await turso.execute({
      sql: "SELECT * FROM votes WHERE voted_for = ? OR voted_against = ?",
      args: [999, 999]
    });
    
    if (votesResult.rows.length === 0) {
      throw new Error('Failed to retrieve test vote!');
    }
    
    console.log(`✓ Retrieved ${votesResult.rows.length} test vote(s)\n`);
    
    // Test 6: Check schema structure
    console.log('Test 6: Verifying heroRatings schema...');
    const schemaResult = await turso.execute({
      sql: "PRAGMA table_info(heroRatings)",
      args: []
    });
    
    const columns = schemaResult.rows.map((row: any) => row.name);
    const expectedColumns = [
      'hero_id', 'rating', 'games', 'wins', 'losses', 
      'is_provisional', 'peak_rating', 'lowest_rating', 
      'win_rate', 'current_streak', 'last_updated', 'created_at'
    ];
    
    for (const col of expectedColumns) {
      if (!columns.includes(col)) {
        throw new Error(`Missing column: ${col}`);
      }
    }
    console.log('✓ All expected columns present:', columns.join(', '));
    console.log('✓ Schema verification successful\n');
    
    // Test 7: Clean up test data
    console.log('Test 7: Cleaning up test data...');
    await turso.execute({
      sql: "DELETE FROM heroRatings WHERE hero_id = ?",
      args: [999]
    });
    await turso.execute({
      sql: "DELETE FROM votes WHERE voted_for = ? OR voted_against = ?",
      args: [999, 998]
    });
    console.log('✓ Test data cleaned up\n');
    
    // Summary
    console.log('✅ All tests passed! Migration is successful.');
    console.log('\nNext steps:');
    console.log('1. Set up your Turso database: turso db create hero-rank-turso');
    console.log('2. Get your database URL and auth token: turso db show hero-rank-turso');
    console.log('3. Update your .env file with TURSO_DB_URL and TURSO_AUTH_TOKEN');
    console.log('4. Run the data migration: npm run migrate');
    console.log('5. Start your development server: npm run dev');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
testMigration().catch(console.error);
