// DSR API Server
// v0.2.0 Enterprise Foundation

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkDatabaseHealth } from '../db/config.js';
import authRoutes from './routes/auth.js';
import orgRoutes from './routes/organizations.js';
import tokenRoutes from './routes/tokens.js';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  const db = await checkDatabaseHealth();
  const status = db.status === 'healthy' ? 200 : 503;
  
  res.status(status).json({
    status: db.status === 'healthy' ? 'healthy' : 'degraded',
    version: '0.2.0',
    components: {
      database: db
    },
    timestamp: new Date().toISOString()
  });
});

// API version prefix
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/orgs', orgRoutes);
app.use('/api/v1/orgs/:orgId/tokens', tokenRoutes);

// API root
app.use('/api/v1', (req, res) => {
  res.json({ 
    message: 'DSR API v0.2.0',
    endpoints: [
      'POST   /api/v1/auth/register  - Create account + organization',
      'POST   /api/v1/auth/login     - Login with email/password',
      'POST   /api/v1/auth/refresh    - Refresh access token',
      'POST   /api/v1/auth/logout    - Logout',
      'GET    /api/v1/auth/me        - Get current user (requires auth)',
      'GET    /api/v1/orgs           - List my organizations (requires auth)',
      'GET    /api/v1/orgs/:orgId    - Get organization details (requires auth)',
      'GET    /api/v1/orgs/:orgId/members - List members (requires auth)',
      'POST   /api/v1/orgs/:orgId/invite - Invite member (requires admin)',
      'PATCH  /api/v1/orgs/:orgId/members/:userId - Update role (requires owner)',
      'DELETE /api/v1/orgs/:orgId/members/:userId - Remove member (requires admin)'
    ],
    status: 'Enterprise Foundation - in development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 DSR API Server v0.2.0 running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
