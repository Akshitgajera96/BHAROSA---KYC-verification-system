# 🚀 BHAROSA KYC - Render Deployment Guide

## ✅ Prerequisites Completed

- ✅ MongoDB Atlas configured with database: `bharosa_kyc`
- ✅ Connection string ready: `mongodb+srv://gajeraakshit53_db_user:...@akshit.thyfwea.mongodb.net/bharosa_kyc`
- ✅ Local `.env` file configured
- ✅ Production `.env.production` file created
- ✅ `render.yaml` pushed to GitHub repository root

---

## 📋 Step-by-Step Deployment Instructions

### **Step 1: Verify MongoDB Atlas Setup**

1. ✅ **Database Created**: `bharosa_kyc`
2. ✅ **User Credentials**: `gajeraakshit53_db_user`
3. ✅ **Network Access**: Make sure "Allow Access from Anywhere" (0.0.0.0/0) is enabled
4. ✅ **Test Connection**: 
   ```bash
   # Test locally first
   cd backend
   npm start
   ```

### **Step 2: Push Code to GitHub**

```bash
cd c:\Users\gajer\OneDrive\Desktop\bharosha
git add .
git commit -m "Configure MongoDB Atlas and Render deployment"
git push origin main
```

### **Step 3: Deploy to Render**

#### **Option A: Using Blueprint (Recommended)**

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub account (if not already connected)
4. Select repository: `Akshitgajera96/BHAROSA---KYC-verification-system`
5. Render will detect the `render.yaml` file
6. Click **"Apply"**

#### **Option B: Manual Web Service**

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `bharosa-kyc-app`
   - **Region**: Oregon (or closest to you)
   - **Branch**: `main`
   - **Root Directory**: `bharosa-hyperledger`
   - **Environment**: `Node`
   - **Build Command**: 
     ```bash
     npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend
     ```
   - **Start Command**: 
     ```bash
     cd backend && NODE_ENV=production npm start
     ```
   - **Plan**: Free

### **Step 4: Configure Environment Variables in Render**

Go to your Render service → **Environment** tab and add these variables:

#### **🔴 CRITICAL - Required Variables**

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `MONGODB_URI` | `mongodb+srv://gajeraakshit53_db_user:lvbGcIFW0ul5Bao6@akshit.thyfwea.mongodb.net/bharosa_kyc?retryWrites=true&w=majority` | MongoDB Atlas connection |
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `10000` | Render default port |
| `JWT_SECRET` | `bharosa_kyc_super_secret_jwt_key_2024_production_ready_secure_token_12345` | Authentication secret |
| `JWT_EXPIRE` | `7d` | Token expiry |

#### **🟡 CORS Configuration (Update after deployment)**

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `CORS_ORIGIN` | `https://bharosa-kyc-app.onrender.com` | Your Render URL |
| `ALLOWED_ORIGINS` | `https://bharosa-kyc-app.onrender.com` | Same as CORS_ORIGIN |

#### **🟢 Feature Flags**

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `DUMMY_AI_VERIFICATION` | `true` | Use dummy AI (no Python service on free tier) |
| `SKIP_ARIES_CREDENTIAL` | `true` | Skip Aries integration |
| `ENABLE_IPFS` | `false` | Disable IPFS for now |

#### **🔵 AI Thresholds**

| Variable Name | Value |
|---------------|-------|
| `FACE_MATCH_THRESHOLD` | `75` |
| `OCR_CONFIDENCE_THRESHOLD` | `60` |
| `IMAGE_QUALITY_THRESHOLD` | `50` |
| `TAMPERING_THRESHOLD` | `70` |

#### **⚪ Optional (Can skip for now)**

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `AI_SERVICE_URL` | `http://localhost:8000` | Not used with DUMMY_AI_VERIFICATION=true |
| `BLOCKCHAIN_NETWORK` | Empty or testnet URL | Optional |
| `BLOCKCHAIN_PRIVATE_KEY` | Empty for now | Optional |
| `BLOCKCHAIN_CONTRACT_ADDRESS` | Empty for now | Optional |

### **Step 5: Update CORS After First Deployment**

1. Wait for first deployment to complete (5-10 minutes)
2. Copy your Render URL (e.g., `https://bharosa-kyc-app.onrender.com`)
3. Go back to **Environment** tab
4. Update:
   - `CORS_ORIGIN` = Your Render URL
   - `ALLOWED_ORIGINS` = Your Render URL
5. Click **"Save Changes"** - this will trigger a redeploy

### **Step 6: Test Your Deployment**

1. **Health Check**: 
   ```
   https://your-app.onrender.com/health
   ```
   
2. **API Test**: 
   ```
   https://your-app.onrender.com/api/auth/register
   ```

3. **Frontend**: 
   ```
   https://your-app.onrender.com
   ```

---

## 🧪 Local Testing with MongoDB Atlas

Before deploying to Render, test locally:

```bash
# Make sure .env has MongoDB Atlas connection string
cd c:\Users\gajer\OneDrive\Desktop\bharosha\bharosa-hyperledger

# Start only the backend (no Docker needed for database)
cd backend
npm install
npm start

# In another terminal, start frontend
cd frontend
npm install
npm start
```

Your local app should now connect to MongoDB Atlas instead of Docker MongoDB.

---

## 🔧 Troubleshooting

### **Issue: MongoDB Connection Failed**

**Solution:**
- Verify MongoDB Atlas cluster is running
- Check IP whitelist includes 0.0.0.0/0
- Verify username and password are correct
- Ensure database name is `bharosa_kyc`

### **Issue: Build Fails on Render**

**Solution:**
- Check build logs in Render dashboard
- Verify `package.json` exists in both `backend/` and `frontend/`
- Ensure all dependencies are listed

### **Issue: Service Crashes After Deploy**

**Solution:**
- Check runtime logs
- Verify all required environment variables are set
- Ensure `MONGODB_URI` is correctly formatted

### **Issue: CORS Errors**

**Solution:**
- Update `CORS_ORIGIN` and `ALLOWED_ORIGINS` with your actual Render URL
- Make sure to redeploy after updating

### **Issue: Frontend Not Loading**

**Solution:**
- Verify backend is serving static files from `frontend/build`
- Check if frontend was built during deployment
- Review build command includes frontend build step

---

## ⚠️ Important Notes

### **Free Tier Limitations**

1. **Service Sleeps**: After 15 minutes of inactivity
   - First request takes 30-60 seconds to wake up
   
2. **No AI Service**: Python FastAPI service won't run
   - Must use `DUMMY_AI_VERIFICATION=true`
   
3. **No Local Blockchain**: Ganache won't work
   - Use testnet or skip blockchain features
   
4. **No Persistent Disk**: Uploaded files deleted on restart
   - Consider using cloud storage (AWS S3, Cloudinary)

### **Database Configuration**

- **Local Development**: Use MongoDB Atlas (configured in `.env`)
- **Production (Render)**: Use same MongoDB Atlas
- **Docker MongoDB**: Only for isolated local testing (update `.env` to use local connection)

### **Security Reminders**

- ✅ MongoDB Atlas password is in connection string - don't commit to public repos
- ✅ JWT_SECRET should be strong and unique
- ✅ Never commit `.env` file (it's gitignored)
- ✅ Use separate credentials for production vs development

---

## 📊 Expected Results

After successful deployment:

- ✅ **Backend API**: Running on `https://your-app.onrender.com`
- ✅ **Frontend**: Served from same URL
- ✅ **Database**: MongoDB Atlas cloud database
- ✅ **Health Endpoint**: Returns `{"status": "running"}`
- ✅ **Authentication**: Register/Login working
- ✅ **KYC Submission**: Working with dummy AI verification

---

## 🎯 Next Steps After Deployment

1. **Test Full Flow**:
   - Register a user
   - Login
   - Submit KYC documents
   - Check verification status

2. **Monitor Logs**:
   - Watch for any errors
   - Check performance

3. **Optional Upgrades**:
   - Custom domain (paid plans)
   - Always-on service (no sleep)
   - Background workers for AI service
   - Persistent disk storage

---

## 📞 Quick Reference

- **MongoDB Atlas Dashboard**: https://cloud.mongodb.com
- **Render Dashboard**: https://dashboard.render.com
- **GitHub Repository**: https://github.com/Akshitgajera96/BHAROSA---KYC-verification-system
- **Deployed App**: `https://bharosa-kyc-app.onrender.com` (update after deployment)

---

## ✅ Deployment Checklist

- [ ] MongoDB Atlas cluster created with `bharosa_kyc` database
- [ ] IP whitelist configured (0.0.0.0/0)
- [ ] Code pushed to GitHub main branch
- [ ] `render.yaml` at repository root
- [ ] Render service created
- [ ] All environment variables configured
- [ ] First deployment completed
- [ ] CORS URLs updated with actual Render URL
- [ ] Health endpoint tested
- [ ] User registration tested
- [ ] KYC submission tested

---

**Status**: ✅ **READY FOR DEPLOYMENT**

**Configuration**: ✅ **MongoDB Atlas Connected**

**Last Updated**: November 8, 2024
