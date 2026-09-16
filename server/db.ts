import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'real_estate.db');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Property {
  id: number;
  square_feet: number;
  num_bedrooms: number;
  num_bathrooms: number;
  num_floors: number;
  year_built: number;
  has_garden: number;
  has_pool: number;
  garage_size: number;
  location_score: number;
  distance_to_center: number;
  price: number;
  created_by?: number | null;
  created_at?: string;
  creator_name?: string;
}

export interface PredictionRecord {
  id: number;
  user_id: number | null;
  input_features: string;
  predicted_price: number;
  selected_model: string;
  k_value: number;
  distance_metric: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}
