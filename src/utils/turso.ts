import { createClient } from '@libsql/client';
import path from 'path';

// Check if we have the required environment variables
const tursoDbUrl = process.env.TURSO_DB_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

let client: ReturnType<typeof createClient>;

if (!tursoDbUrl || tursoDbUrl === 'your_turso_db_url' || !tursoAuthToken || tursoAuthToken === 'your_turso_auth_token') {
  console.warn('Turso configuration not found. Please set TURSO_DB_URL and TURSO_AUTH_TOKEN environment variables.');
  // Create a mock client for development with absolute path
  const dbPath = path.join(process.cwd(), 'local.db');
  client = createClient({
    url: `file:${dbPath}`,
  });
} else {
  client = createClient({
    url: tursoDbUrl,
    authToken: tursoAuthToken,
  });
}

export { client as turso };