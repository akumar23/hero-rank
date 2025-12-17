import { turso } from '../utils/turso';

/**
 * Fix Games Count and Win Rate Inconsistency
 *
 * This migration fixes a data integrity issue where the `games` column
 * doesn't match `wins + losses`, causing incorrect win rate calculations.
 *
 * Run with: npx tsx src/migrations/fix-games-count.ts
 */

interface HeroRow {
  hero_id: number;
  hero_name: string | null;
  games: number;
  wins: number;
  losses: number;
  win_rate: number;
}

async function fixGamesCount() {
  console.log('🔍 Scanning for heroes with inconsistent games count...\n');

  try {
    // Find all heroes where games != wins + losses
    const result = await turso.execute({
      sql: `
        SELECT hero_id, hero_name, games, wins, losses, win_rate
        FROM heroRatings
        WHERE games != (wins + losses)
        ORDER BY hero_id
      `,
      args: []
    });

    if (result.rows.length === 0) {
      console.log('✅ No inconsistencies found. All heroes have correct games count.');
      return;
    }

    console.log(`Found ${result.rows.length} heroes with inconsistent data:\n`);

    // Display affected heroes
    for (const row of result.rows) {
      const hero = row as unknown as HeroRow;
      const correctGames = hero.wins + hero.losses;
      const correctWinRate = correctGames > 0 ? (hero.wins / correctGames) * 100 : 0;

      console.log(`Hero #${hero.hero_id} (${hero.hero_name || 'Unknown'}):`);
      console.log(`  Current:  games=${hero.games}, wins=${hero.wins}, losses=${hero.losses}, win_rate=${hero.win_rate.toFixed(1)}%`);
      console.log(`  Expected: games=${correctGames}, win_rate=${correctWinRate.toFixed(1)}%`);
      console.log('');
    }

    // Fix the games count
    console.log('🔧 Fixing games count (setting games = wins + losses)...');
    await turso.execute({
      sql: `UPDATE heroRatings SET games = wins + losses WHERE games != (wins + losses)`,
      args: []
    });
    console.log('✓ Games count fixed\n');

    // Recalculate win rates
    console.log('🔧 Recalculating win rates...');
    await turso.execute({
      sql: `UPDATE heroRatings SET win_rate = CASE WHEN games > 0 THEN (wins * 100.0 / games) ELSE 0 END`,
      args: []
    });
    console.log('✓ Win rates recalculated\n');

    // Verify the fix
    const verifyResult = await turso.execute({
      sql: `
        SELECT hero_id, hero_name, games, wins, losses, win_rate
        FROM heroRatings
        WHERE games != (wins + losses)
      `,
      args: []
    });

    if (verifyResult.rows.length === 0) {
      console.log('✅ Verification passed! All heroes now have consistent data.\n');
    } else {
      console.log(`⚠️ Warning: ${verifyResult.rows.length} heroes still have inconsistent data.`);
    }

    // Show summary of fixed heroes
    console.log('📊 Summary of fixed heroes:\n');
    const fixedResult = await turso.execute({
      sql: `
        SELECT hero_id, hero_name, games, wins, losses, win_rate
        FROM heroRatings
        WHERE hero_id IN (${result.rows.map((r: any) => r.hero_id).join(',')})
        ORDER BY hero_id
      `,
      args: []
    });

    for (const row of fixedResult.rows) {
      const hero = row as unknown as HeroRow;
      console.log(`Hero #${hero.hero_id} (${hero.hero_name || 'Unknown'}): ${hero.wins}-${hero.losses} (${hero.win_rate.toFixed(1)}% win rate)`);
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixGamesCount().catch(console.error);
