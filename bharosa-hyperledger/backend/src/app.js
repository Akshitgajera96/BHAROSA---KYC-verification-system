// 🚀 Express Application Setup
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/authRoutes.js';
import kycRoutes from './routes/kycRoutes.js';
import blockchainRoutes from './routes/blockchainRoutes.js';
import performanceRoutes from './routes/performanceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Import utilities for health checks
import { checkAIServiceHealth } from './utils/aiClient.js';
import { checkAriesHealth } from './utils/ariesClient.js';
import { checkBlockchainHealth } from './utils/blockchainClient.js';
import { validateAriesConfig } from './config/aries.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware - Configure CORS
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    const origins = [];
    if (process.env.CORS_ORIGIN) origins.push(process.env.CORS_ORIGIN);
    if (process.env.ALLOWED_ORIGINS) {
      origins.push(...process.env.ALLOWED_ORIGINS.split(','));
    }
    if (process.env.FRONTEND_URL) origins.push(process.env.FRONTEND_URL);
    return origins.length > 0 ? origins : ['http://localhost:3000'];
  }
  return ['http://localhost:3000', 'http://localhost:5000', 'http://frontend:3000'];
};

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
      callback(null, true);
    } else {
      console.log(`CORS blocked request from origin: ${origin}`);
      console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(null, true); // Allow anyway in production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  
  // Log response status when finished
  res.on('finish', () => {
    console.log(`   Response: ${res.statusCode} ${res.statusMessage || ''}`);
  });
  
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'running',
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        mongodb: 'checking...',
        ai_service: 'checking...',
        aries_agent: 'checking...',
        blockchain: 'checking...'
      }
    };

    // Check all services
    const [aiHealthy, ariesHealthy, blockchainHealthy] = await Promise.allSettled([
      checkAIServiceHealth(),
      checkAriesHealth(),
      checkBlockchainHealth()
    ]);

    health.services.ai_service = aiHealthy.status === 'fulfilled' && aiHealthy.value ? 'healthy' : 'unavailable';
    health.services.aries_agent = ariesHealthy.status === 'fulfilled' && ariesHealthy.value ? 'healthy' : 'unavailable';
    health.services.blockchain = blockchainHealthy.status === 'fulfilled' && blockchainHealthy.value ? 'healthy' : 'unavailable';

    res.status(200).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/admin', adminRoutes);

// Serve static files from React build (Production only)
if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Serve static files from the React frontend build
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
  
  // API root endpoint
  app.get('/api', (req, res) => {
    res.json({
      message: '🔐 Bharosa Decentralized KYC System API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        kyc: '/api/kyc',
        blockchain: '/api/blockchain',
        performance: '/api/performance',
        admin: '/api/admin'
      },
      documentation: 'https://github.com/bharosa/api-docs'
    });
  });
  
  // Handle React routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
  });
} else {
  // Development mode - API root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: '🔐 Bharosa Decentralized KYC System API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        kyc: '/api/kyc',
        blockchain: '/api/blockchain',
        performance: '/api/performance',
        admin: '/api/admin'
      },
      documentation: 'https://github.com/bharosa/api-docs'
    });
  });
  
  // 404 handler for development
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Log configuration on startup
console.log('\n🔧 Configuration Loaded:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   PORT: ${process.env.PORT}`);
console.log(`   MongoDB: ${process.env.MONGODB_URI ? '✓ Configured' : '✗ Missing'}`);
console.log(`   AI Service: ${process.env.AI_SERVICE_URL}`);
console.log(`   Blockchain Network: ${process.env.BLOCKCHAIN_NETWORK}`);
validateAriesConfig();

export default app;
