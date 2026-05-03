// backend/src/database/index.ts
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'horus',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
})

export async function initDatabase() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS collected_matches (
        match_id TEXT PRIMARY KEY,
        region TEXT NOT NULL,
        game_datetime BIGINT NOT NULL,
        game_version TEXT,
        collected_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())
      );

      CREATE TABLE IF NOT EXISTS compositions (
        id SERIAL PRIMARY KEY,
        match_id TEXT NOT NULL,
        region TEXT NOT NULL,
        placement INTEGER NOT NULL,
        level INTEGER,
        last_round INTEGER,
        gold_left INTEGER,
        damage INTEGER,
        top4 BOOLEAN,
        win BOOLEAN,
        game_datetime BIGINT
      );

      CREATE TABLE IF NOT EXISTS comp_units (
        id SERIAL PRIMARY KEY,
        comp_id INTEGER NOT NULL,
        character_id TEXT NOT NULL,
        tier INTEGER,
        items JSONB
      );

      CREATE TABLE IF NOT EXISTS comp_traits (
        id SERIAL PRIMARY KEY,
        comp_id INTEGER NOT NULL,
        trait_name TEXT NOT NULL,
        num_units INTEGER,
        tier_current INTEGER,
        tier_total INTEGER
      );

      CREATE TABLE IF NOT EXISTS comp_augments (
        id SERIAL PRIMARY KEY,
        comp_id INTEGER NOT NULL,
        augment_name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS collection_log (
        id SERIAL PRIMARY KEY,
        region TEXT NOT NULL,
        status TEXT NOT NULL,
        matches_collected INTEGER DEFAULT 0,
        started_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()),
        finished_at BIGINT
      );

      CREATE INDEX IF NOT EXISTS idx_comps_placement ON compositions(placement);
      CREATE INDEX IF NOT EXISTS idx_comps_region ON compositions(region);
      CREATE INDEX IF NOT EXISTS idx_comps_datetime ON compositions(game_datetime);
      CREATE INDEX IF NOT EXISTS idx_units_character ON comp_units(character_id);
      CREATE INDEX IF NOT EXISTS idx_traits_name ON comp_traits(trait_name);
      CREATE INDEX IF NOT EXISTS idx_augments_name ON comp_augments(augment_name);
    `)
    console.log('✅ Banco de dados inicializado')
  } finally {
    client.release()
  }
}
