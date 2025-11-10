import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import presetsRouter from './api/presets';
import previewRouter from './api/preview';
import styleExtractRouter from './api/styleExtract';
import generateImageRouter from './api/generateImage';
import batchRouter from './api/batch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware for debugging
app.use((req, res, next) => {
  if (req.path.includes('style-extract')) {
    console.log(`${req.method} ${req.path}`, {
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
    });
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/presets', presetsRouter);
app.use('/api/preview', previewRouter);
app.use('/api/style-extract', styleExtractRouter);
app.use('/api/generate-image', generateImageRouter);
app.use('/api/batch', batchRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 Bria API URL: ${process.env.BRIA_API_URL || 'https://api.bria.ai/v2'}`);
});

