# 🔐 Bharosa - Decentralized KYC Verification System

**A blockchain-based KYC verification platform with AI-powered document verification**

[![Status](https://img.shields.io/badge/status-production--ready-success)]()
[![Docker](https://img.shields.io/badge/docker-compose-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

---

## 🌟 Features

### Core Capabilities
- ✅ **AI-Powered Verification** - DeepFace, Tesseract OCR, OpenCV
- ✅ **Blockchain Registry** - Immutable KYC records on Ethereum
- ✅ **Decentralized Storage** - IPFS integration for document storage
- ✅ **Privacy-First** - Cryptographic hashing, zero-knowledge proofs
- ✅ **Real-Time Tracking** - Live verification status updates
- ✅ **Performance Monitoring** - Built-in analytics and logging

### Security Features
- 🔐 JWT Authentication
- 🔒 Password encryption (bcrypt)
- 🎭 Document number hashing
- 🌲 Merkle tree verification
- 📦 IPFS content addressing
- 🔍 PII redaction in logs

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    (React + TailwindCSS)                    │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────────────┐
│                      Backend API                             │
│                  (Node.js + Express)                        │
│  ┌─────────────┬──────────────┬──────────────┬───────────┐ │
│  │   Auth      │     KYC      │  Blockchain  │   IPFS    │ │
│  │ Controller  │  Controller  │  Controller  │  Client   │ │
│  └─────────────┴──────────────┴──────────────┴───────────┘ │
└──┬──────────────┬──────────────┬──────────────────────────┘
   │              │              │
   ▼              ▼              ▼
┌─────────┐  ┌──────────┐  ┌──────────────┐
│ MongoDB │  │ AI Service│  │  Ganache     │
│         │  │ (FastAPI) │  │  Blockchain  │
└─────────┘  └──────────┘  └──────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- 4GB+ RAM
- 10GB+ free disk space

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/bharosa-kyc.git
cd bharosa-kyc
```

### 2. Start All Services
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Access Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **AI Service:** http://localhost:8000
- **MongoDB:** localhost:27017

### 4. Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "running",
  "services": {
    "api": "healthy",
    "mongodb": "healthy",
    "ai_service": "healthy",
    "blockchain": "healthy"
  }
}
```

---

## 📋 Services Overview

### Backend API (Port 5000)
**Technology:** Node.js 18, Express  
**Features:**
- RESTful API endpoints
- JWT authentication
- KYC workflow orchestration
- Blockchain integration
- IPFS storage management

### AI Service (Port 8000)
**Technology:** Python, FastAPI  
**Features:**
- Face matching (DeepFace)
- OCR extraction (Tesseract)
- Document validation
- Quality checks
- Tampering detection

### MongoDB (Port 27017)
**Technology:** MongoDB 6.0  
**Collections:**
- users
- kycrecords
- blockchainconfigs

### Blockchain (Port 8545)
**Technology:** Ganache (Ethereum)  
**Smart Contracts:**
- KYCVerification.sol

### Frontend (Port 3000)
**Technology:** React 18, TailwindCSS  
**Pages:**
- Login/Register
- Dashboard
- KYC Submission
- Verification Status

---

## 📤 GitHub Setup

### Before Pushing to GitHub

**IMPORTANT: Protect sensitive data!**

1. **Clean sensitive data:**
```bash
# Remove uploaded documents and logs
rm -rf backend/uploads/* backend/logs/*

# Remove Python cache
find . -type d -name "__pycache__" -exec rm -rf {} +
```

2. **Verify .env is ignored:**
```bash
# Make sure .env is NOT tracked
git status | grep "\.env"
# Should return nothing (or show .env.example only)
```

3. **Push to GitHub:**
```bash
git init
git add .
git status  # Review carefully - .env should NOT appear!
git commit -m "Initial commit: Bharosa decentralized KYC system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bharosa-kyc.git
git push -u origin main
```

**✅ Safe to commit:**
- `.env.example` (template with placeholders)
- Source code files
- Documentation
- Docker configurations

**❌ NEVER commit:**
- `.env` (actual secrets)
- `node_modules/`
- `backend/uploads/` (contains PII)
- `backend/logs/` (may contain sensitive data)
- `*.key`, `*.pem`, `*.cert` files

---

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and update values:
```env
# MongoDB
MONGODB_URI=mongodb://bharosa_admin:YOUR_PASSWORD@mongodb:27017/bharosa_kyc?authSource=admin

# Blockchain
BLOCKCHAIN_NETWORK=http://ganache:8545
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
BLOCKCHAIN_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# AI Service
AI_SERVICE_URL=http://ai_service:8000

# JWT (Generate strong secret: openssl rand -base64 64)
JWT_SECRET=CHANGE_THIS_TO_STRONG_RANDOM_SECRET

# CORS
CORS_ORIGIN=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000

# IPFS (Optional)
ENABLE_IPFS=false
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here
```

See `.env.example` for complete configuration template.

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - Login user
GET    /api/auth/me          - Get current user
```

### KYC Management
```
POST   /api/kyc/submit       - Submit KYC documents
GET    /api/kyc/status/:id   - Get KYC status
GET    /api/kyc/all          - Get all KYC records (admin)
```

### Blockchain
```
GET    /api/blockchain/verify/:hash  - Verify on blockchain
GET    /api/blockchain/stats         - Get blockchain stats
```

### Performance
```
GET    /api/performance/stats        - Get statistics (admin)
GET    /api/performance/logs         - Get recent logs (admin)
GET    /api/performance/status/:id   - Get real-time status
```

---

## 🧪 Testing

### Manual Test Flow

1. **Register User**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "fullName": "Test User"
  }'
```

2. **Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

3. **Submit KYC** (Use Postman/Insomnia for multipart form)
- Upload front image of ID
- Upload selfie
- Provide document type and number

4. **Check Status**
```bash
curl http://localhost:5000/api/kyc/status/{kycRecordId}
```

### Expected Verification Time
- **Normal:** 10-25 seconds
- **First Run:** 35-70 seconds (AI model loading)

---

## 🛠️ Development

### Project Structure
```
bharosa-hyperledger/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation
│   │   └── utils/          # Helper functions
│   ├── uploads/            # Temporary file storage
│   └── logs/               # Application logs
│
├── ai_service/             # Python AI service
│   ├── models/             # AI models
│   ├── utils/              # Helper utilities
│   └── main.py            # FastAPI application
│
├── blockchain/             # Smart contracts
│   ├── contracts/          # Solidity contracts
│   ├── scripts/            # Deployment scripts
│   └── deployments/        # Contract addresses
│
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Route pages
│   │   └── services/       # API client
│   └── public/             # Static assets
│
├── docs/                   # Documentation
├── nginx/                  # Nginx config (production)
└── docker-compose.dev.yml  # Development setup
```

### Rebuild Services
```bash
# Backend
docker-compose -f docker-compose.dev.yml build backend
docker-compose -f docker-compose.dev.yml up -d backend

# AI Service
docker-compose -f docker-compose.dev.yml build ai_service
docker-compose -f docker-compose.dev.yml up -d ai_service

# Frontend
docker-compose -f docker-compose.dev.yml build frontend
docker-compose -f docker-compose.dev.yml up -d frontend
```

### View Logs
```bash
docker logs bharosa-backend -f
docker logs bharosa-ai -f
docker logs bharosa-frontend -f
docker logs bharosa-mongodb -f
docker logs bharosa-ganache -f
```

### Utility Scripts
```bash
# Check all KYC records
node backend/check-kyc.js

# Fix stuck KYC records
node backend/fix-stuck-kyc.js

# View performance metrics
node backend/check-performance.js
```

---

## 📊 Performance Monitoring

### Built-in Metrics
- Request/Response times
- AI processing duration
- IPFS upload times
- Blockchain transaction times
- Database query performance

### Access Logs
```bash
# Performance logs
ls backend/logs/performance/

# AI audit logs
ls ai_service/logs/ai_audit/

# Debug logs
ls backend/logs/debug/
```

---

## 🔒 Security Best Practices

### For Production Deployment

1. **Change Default Credentials**
   - MongoDB username/password
   - JWT secret
   - Blockchain private key

2. **Enable HTTPS**
   - Use SSL/TLS certificates
   - Configure reverse proxy (nginx)

3. **Restrict CORS**
   - Set specific allowed origins
   - Remove `allow_origins=["*"]`

4. **Use Production Database**
   - MongoDB Atlas or self-hosted
   - Enable authentication
   - Set up backups

5. **Use Real Blockchain**
   - Deploy to testnet/mainnet
   - Use proper wallet management
   - Implement gas optimization

6. **Configure IPFS**
   - Use Pinata or Infura
   - Set up API keys
   - Enable CID pinning

---

## 📈 Verification Thresholds

Current production-ready thresholds:

| Check | Threshold | Description |
|-------|-----------|-------------|
| Face Match | 75% | Strict for security |
| OCR Confidence | 60% | Text extraction quality |
| Quality Check | 50% | Image quality minimum |
| Tampering | 70% | Document authenticity |

---

## 🐛 Troubleshooting

### Services Not Starting
```bash
# Check Docker is running
docker --version

# Check logs
docker-compose -f docker-compose.dev.yml logs

# Restart all services
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

### Port Already in Use
```bash
# Check what's using the port
netstat -ano | findstr :5000

# Change port in docker-compose.dev.yml
```

### AI Service Timeout
- First run takes 35-70 seconds for model loading
- Subsequent runs: 10-25 seconds
- Check logs: `docker logs bharosa-ai`

### Face Match Rejection
- Use good quality images
- Ensure proper lighting
- Face should be clearly visible
- No sunglasses or masks

---

## 📚 Additional Documentation

- [Performance Monitoring Guide](docs/PERFORMANCE-MONITORING.md)
- [System Audit Report](SYSTEM-AUDIT-REPORT.md)
- [API Documentation](https://your-api-docs-url.com)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Team

- **Backend Team** - Node.js/Express API
- **AI Team** - Python/FastAPI AI Service
- **Blockchain Team** - Solidity Smart Contracts
- **Frontend Team** - React/TailwindCSS UI

---

## 📞 Support

For issues, questions, or contributions:
- GitHub Issues: [Create an issue](https://github.com/your-org/bharosa-kyc/issues)
- Email: support@bharosa.com
- Documentation: [Wiki](https://github.com/your-org/bharosa-kyc/wiki)

---

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Additional document types (Passport, Voter ID)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Automated testing suite
- [ ] CI/CD pipeline
- [ ] Production deployment guide

---

**Version:** 1.0.0  
**Last Updated:** November 3, 2025  
**Status:** ✅ Production Ready

**Made with ❤️ by Bharosa Team**
