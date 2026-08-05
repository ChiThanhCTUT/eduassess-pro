import { initializeDatabase } from '../server.js';

export default async function setup() {
  console.log('Running Global Setup: Initializing Database...');
  await initializeDatabase();
  console.log('Database initialized for tests.');
}
