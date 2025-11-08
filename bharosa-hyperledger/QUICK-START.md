# 🚀 BHAROSA KYC - Quick Start Guide

## ✅ System Ready!

Your BHAROSA KYC system is configured and ready to use.

---

## 📁 Essential Files (Clean Structure)

```
bharosa-hyperledger/
├── .env                          ✅ Your configuration (MongoDB Atlas connected)
├── .env.example                  📋 Template for reference
├── .env.production              🚀 Production template for Render
├── README.md                     📖 Main documentation
├── HOW-TO-GET-API-KEYS.md       🔑 API keys guide
├── render.yaml                  ☁️ Render deployment config (at repository root)
│
├── backend/                      🔧 Node.js API
├── frontend/                     💻 React app
├── ai_service/                   🤖 Python AI service
├── blockchain/                   ⛓️ Smart contracts
└── docker-compose.dev.yml       🐳 Docker setup
```

---

## 🎯 How to Use

### **1. Local Development (Right Now!)**

```bash
# Terminal 1 - Start Backend
cd backend
npm install
npm start

# Terminal 2 - Start Frontend
cd frontend
npm install
npm start

# Open: http://localhost:3000
```

**Your MongoDB Atlas is already connected!** ✅

---

### **2. Deploy to Render**

1. **Go to**: https://dashboard.render.com
2. **Click**: "New +" → "Blueprint"
3. **Select**: Your GitHub repository
4. **Add Environment Variables**:
   ```env
   MONGODB_URI=mongodb+srv://gajeraakshit53_db_user:lvbGcIFW0ul5Bao6@akshit.thyfwea.mongodb.net/bharosa_kyc?retryWrites=true&w=majority
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=bharosa_kyc_super_secret_jwt_key_2024_production_ready_secure_token_12345
   JWT_EXPIRE=7d
   DUMMY_AI_VERIFICATION=true
   SKIP_ARIES_CREDENTIAL=true
   ENABLE_IPFS=false
   FACE_MATCH_THRESHOLD=75
   OCR_CONFIDENCE_THRESHOLD=60
   IMAGE_QUALITY_THRESHOLD=50
   TAMPERING_THRESHOLD=70
   ```
5. **After deployment**, add:
   ```env
   CORS_ORIGIN=https://your-app.onrender.com
   ALLOWED_ORIGINS=https://your-app.onrender.com
   ```

---

## 🔑 Optional API Keys

Get these only if you need specific features:

### **IPFS Storage (Pinata)** - For file persistence on Render
- Website: https://pinata.cloud
- Time: 10 minutes
- See: `HOW-TO-GET-API-KEYS.md`

### **Blockchain (Infura/Alchemy)** - Already configured! ✅
- Your Infura endpoint is ready
- Update in `.env` if you want to activate it

### **Email (Gmail)** - For notifications
- Website: https://myaccount.google.com/apppasswords
- Time: 5 minutes
- See: `HOW-TO-GET-API-KEYS.md`

---

## ⚡ Current Configuration

```
✅ MongoDB Atlas - Connected (bharosa_kyc database)
✅ Backend API - Ready
✅ Frontend - Ready
✅ JWT Auth - Configured
✅ Blockchain - Infura endpoint ready
⚪ IPFS - Disabled (optional)
⚪ Email - Not configured (optional)
```

---

## 🧪 Test Your System

### **1. Register User**
```bash
POST http://localhost:5000/api/auth/register
{
  "email": "test@example.com",
  "password": "Test123!",
  "fullName": "Test User"
}
```

### **2. Login**
```bash
POST http://localhost:5000/api/auth/login
{
  "email": "test@example.com",
  "password": "Test123!"
}
```

### **3. Health Check**
```bash
GET http://localhost:5000/health
```

---

## 🆘 Need Help?

- **API Keys**: See `HOW-TO-GET-API-KEYS.md`
- **Full Docs**: See `README.md`
- **Issues**: Check backend logs for errors

---

## 📝 Quick Commands

```bash
# Start backend only
cd backend && npm start

# Start frontend only
cd frontend && npm start

# Docker (all services)
docker-compose -f docker-compose.dev.yml up -d

# Check logs
docker logs bharosa-backend -f
```

---

## ✨ You're All Set!

**System Status**: ✅ Ready to use  
**Database**: ✅ MongoDB Atlas connected  
**Deployment**: ✅ Ready for Render  

**Next Step**: Start coding or deploy! 🚀
