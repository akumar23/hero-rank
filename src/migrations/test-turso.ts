import { turso } from '../utils/turso';

async function testTurso() {
  try {
    console.log('Testing Turso connection...');
    // Test the connection by running a simple query
    const result = await turso.execute('SELECT sqlite_version() as version');
    console.log('Turso is working correctly. SQLite version:', result);
  } catch (error) {
    console.error('Error testing Turso:', error);
  }
}

testTurso().catch(console.error);