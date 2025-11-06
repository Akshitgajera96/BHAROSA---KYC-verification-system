// 🌐 Server Entry Point
import app from './app.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import { logDummyModeStatus } from './utils/dummyAiVerifier.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start server
const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Bharosa Backend Server Started');
  console.log('='.repeat(50));
  console.log(`   🌐 Server running on port ${PORT}`);
  console.log(`   🔗 URL: http://localhost:${PORT}`);
  console.log(`   📝 API Docs: http://localhost:${PORT}/`);
  console.log(`   🏥 Health Check: http://localhost:${PORT}/health`);
  console.log('='.repeat(50) + '\n');
  
  // Log AI verification mode status
  logDummyModeStatus();
  console.log('');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  console.log('⚠️  Shutting down server...');
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default server;
