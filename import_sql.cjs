const fs = require('fs');
const mysql = require('./node_modules/mysql2/promise');

async function main() {
  // Connect to MySQL server first without selecting a database
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    charset: 'utf8mb4'
  });

  console.log('Recreating database eduassess_pro with utf8mb4...');
  await connection.query('DROP DATABASE IF EXISTS `eduassess_pro`');
  await connection.query('CREATE DATABASE `eduassess_pro` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  await connection.end();

  // Connect to the newly created clean database
  const dbConnection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'eduassess_pro',
    charset: 'utf8mb4'
  });

  const sqlContent = fs.readFileSync('eduassess_pro.sql', 'utf8');
  
  // Split statements by semicolon followed by newline
  const statements = sqlContent.split(/;(?:\r?\n)+/);
  
  let successCount = 0;
  let failCount = 0;
  for (let statement of statements) {
    statement = statement.trim();
    if (!statement || statement.startsWith('--')) {
      continue;
    }
    // Skip USE and CREATE DATABASE queries since we already set it up cleanly
    if (statement.toUpperCase().startsWith('CREATE DATABASE') || statement.toUpperCase().startsWith('USE ')) {
      continue;
    }
    try {
      await dbConnection.query(statement);
      successCount++;
    } catch (err) {
      console.error('Error executing statement:', statement.substring(0, 150), '...\nError:', err.message);
      failCount++;
    }
  }
  
  console.log(`Database import completed! Success: ${successCount}, Failed: ${failCount}`);
  await dbConnection.end();
}

main().catch(console.error);
