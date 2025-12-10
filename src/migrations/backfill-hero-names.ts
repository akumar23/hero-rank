import { turso } from '../utils/turso';

/**
 * Backfill hero names for existing heroes in the database
 *
 * This script fetches hero names from the SuperHero API for heroes
 * that don't have names stored yet, using batched requests to avoid rate limiting.
 *
 * Run with: npx tsx src/migrations/backfill-hero-names.ts
 */

const BATCH_SIZE = 5;
const DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function backfillHeroNames() {
  console.log('Fetching heroes without names...');

  try {
    const result = await turso.execute({
      sql: "SELECT hero_id FROM heroRatings WHERE hero_name IS NULL OR hero_name = ''",
      args: [],
    });

    const heroIds = result.rows.map((row: any) => Number(row.hero_id));
    console.log(`Found ${heroIds.length} heroes without names`);

    if (heroIds.length === 0) {
      console.log('All heroes already have names. Nothing to backfill.');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < heroIds.length; i += BATCH_SIZE) {
      const batch = heroIds.slice(i, i + BATCH_SIZE);
      console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(heroIds.length / BATCH_SIZE)}...`);

      await Promise.all(
        batch.map(async (heroId) => {
          try {
            const res = await fetch(
              `https://www.superheroapi.com/api.php/2422583714549928/${heroId}`
            );
            const data = await res.json();
            const name = data.name || null;

            if (name) {
              await turso.execute({
                sql: 'UPDATE heroRatings SET hero_name = ? WHERE hero_id = ?',
                args: [name, heroId],
              });
              console.log(`  Updated hero ${heroId}: ${name}`);
              successCount++;
            } else {
              console.log(`  No name found for hero ${heroId}`);
              failCount++;
            }
          } catch (error) {
            console.error(`  Failed to update hero ${heroId}:`, error);
            failCount++;
          }
        })
      );

      // Rate limit delay between batches
      if (i + BATCH_SIZE < heroIds.length) {
        console.log(`  Waiting ${DELAY_MS}ms before next batch...`);
        await sleep(DELAY_MS);
      }
    }

    console.log(`\nBackfill complete!`);
    console.log(`  Successfully updated: ${successCount} heroes`);
    console.log(`  Failed/missing: ${failCount} heroes`);
  } catch (error) {
    console.error('Backfill failed:', error);
    process.exit(1);
  }
}

backfillHeroNames().catch(console.error);
