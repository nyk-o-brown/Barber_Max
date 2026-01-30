import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dbDir, 'appointments.db');

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

export const getDb = () => db;

export const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create appointments table
      db.run(`
        CREATE TABLE IF NOT EXISTS appointments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          clientName TEXT NOT NULL,
          clientEmail TEXT NOT NULL,
          clientPhone TEXT,
          services TEXT NOT NULL,
          barber TEXT NOT NULL,
          location TEXT NOT NULL,
          appointmentDate TEXT NOT NULL,
          appointmentTime TEXT NOT NULL,
          duration INTEGER DEFAULT 60,
          notes TEXT,
          googleEventId TEXT UNIQUE,
          status TEXT DEFAULT 'pending',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating appointments table:', err);
          reject(err);
        } else {
          console.log('✅ Appointments table initialized');
        }
      });

      // Create google auth tokens table
      db.run(`
        CREATE TABLE IF NOT EXISTS google_auth (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          accessToken TEXT NOT NULL,
          refreshToken TEXT,
          expiresAt INTEGER,
          scope TEXT,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating google_auth table:', err);
          reject(err);
        } else {
          console.log('✅ Google Auth table initialized');
          resolve();
        }
      });
    });
  });
};

export const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const getQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const allQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};
