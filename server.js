import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import appointmentRoutes from './routes/appointments.js';
import authRoutes from './routes/auth.js';
import { initializeDatabase } from './database/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initializeDatabase();

// Serve frontend static files
app.use(express.static(join(__dirname, '.')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

// Fallback — serve index.html for any unmatched route
app.use((req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Barber Max Backend running on http://localhost:${PORT}`);
  console.log(`📅 Google Calendar Integration Active`);
});

export default app;
