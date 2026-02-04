const { Client } = require('pg');

async function listDbs() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'zzzz',
    database: 'postgres',
  });

  try {
    await client.connect();
    const res = await client.query('SELECT datname FROM pg_database');
    console.log('Databases:', res.rows.map(r => r.datname));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

listDbs();
