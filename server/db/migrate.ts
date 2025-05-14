import { drizzle } from 'drizzle-orm/node-postgres';
import { pool } from './db';
import * as schema from '@shared/schema';

// This script will create all the tables and relationships defined in schema.ts
async function main() {
  const db = drizzle(pool, { schema });
  
  console.log('Running migrations...');
  
  // Create the tables if they don't exist
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      data JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS rewards (
      id CHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      points INTEGER NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS users_rewards (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL REFERENCES users(id),
      reward_id CHAR(36) NOT NULL REFERENCES rewards(id),
      status VARCHAR(255) NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS logs (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL REFERENCES users(id),
      action VARCHAR(255) NOT NULL,
      code VARCHAR(255) NOT NULL,
      description TEXT,
      data JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  console.log('Migrations completed successfully!');
  
  pool.end();
}

main().catch(e => {
  console.error('Migration failed:');
  console.error(e);
  process.exit(1);
});