import { turso } from '../utils/turso';

/**
 * Add hero_name column to heroRatings table
 *
 * This migration adds a hero_name column to store hero names in the database,
 * avoiding the need to fetch names from the SuperHero API during static generation.
 *
 * Run with: npx tsx src/migrations/add-hero-name.ts
 */

async function addHeroNameColumn() {
  console.log('Adding hero_name column to heroRatings table...');

  try {
    // Check if column already exists
    const tableInfo = await turso.execute(`PRAGMA table_info(heroRatings)`);
    const hasHeroName = tableInfo.rows.some((row: any) => row.name === 'hero_name');

    if (hasHeroName) {
      console.log('Column hero_name already exists, skipping migration.');
      return;
    }

    // Add nullable column (SQLite limitation - can't add NOT NULL without default)
    await turso.execute(`
      ALTER TABLE heroRatings ADD COLUMN hero_name TEXT
    `);

    console.log('Successfully added hero_name column to heroRatings table');

    // Verify column was added
    const verifyResult = await turso.execute(`PRAGMA table_info(heroRatings)`);
    console.log('\nCurrent heroRatings table schema:');
    verifyResult.rows.forEach((row: any) => {
      console.log(`  - ${row.name} (${row.type})`);
    });

    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addHeroNameColumn().catch(console.error);
