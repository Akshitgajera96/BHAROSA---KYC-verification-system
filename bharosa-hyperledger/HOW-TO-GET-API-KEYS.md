# 🔑 How to Get All API Keys - Step by Step Guide

## ✅ Already Configured (No Action Needed)
- ✅ **MongoDB Atlas** - Already working
- ✅ **JWT Secret** - Already configured
- ✅ **Basic Settings** - All set

---

## 📋 Optional Keys - Get Only If You Need These Features

### 1️⃣ PINATA (IPFS Storage) - For Decentralized File Storage

**What is it?** Store files on IPFS (decentralized storage)  
**Cost:** FREE tier available (1GB storage)  
**Do you need it?** Only if you want decentralized file storage instead of local storage

#### Steps to Get Pinata Keys:

1. **Go to Pinata Website**
   - Visit: https://pinata.cloud
   - Click "Start Building for Free"

2. **Sign Up**
   - Enter your email
   - Choose a password
   - Verify your email

3. **Get API Keys**
   - After login, go to: https://app.pinata.cloud/keys
   - Click "New Key" button
   - Select permissions:
     - ✅ pinFileToIPFS
     - ✅ pinJSONToIPFS
   - Name it: "Bharosa KYC App"
   - Click "Create Key"

4. **Copy Your Keys**
   - Copy **API Key**
   - Copy **API Secret**
   - ⚠️ Save immediately - you can't see Secret again!

5. **Update .env File**
   ```env
   ENABLE_IPFS=true
   PINATA_API_KEY=paste_your_api_key_here
   PINATA_SECRET_KEY=paste_your_api_secret_here
   ```

---

### 2️⃣ ALCHEMY (Blockchain Network) - For Real Blockchain

**What is it?** Connect to real Ethereum/Polygon blockchain  
**Cost:** FREE tier (300M compute units/month)  
**Do you need it?** Only if you want real blockchain instead of local Ganache

#### Steps to Get Alchemy Key:

1. **Go to Alchemy Website**
   - Visit: https://www.alchemy.com
   - Click "Get started for free"

2. **Sign Up**
   - Sign up with email or GitHub
   - Verify your email

3. **Create New App**
   - Click "Create App" button
   - Fill details:
     - **Name:** Bharosa KYC
     - **Chain:** Polygon
     - **Network:** Polygon Mumbai (Testnet)
   - Click "Create App"

4. **Get API Key**
   - Click on your app name
   - Click "View Key" button
   - Copy the **HTTPS URL**
   - It looks like: `https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY`

5. **Get Testnet MATIC (Free)**
   - Visit: https://faucet.polygon.technology
   - Connect your wallet (MetaMask)
   - Request testnet MATIC (free)

6. **Update .env File**
   ```env
   BLOCKCHAIN_NETWORK=https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY
   ```
   (Replace YOUR_KEY with your actual key from the URL)

---

### 3️⃣ GMAIL APP PASSWORD (Email Notifications) - For Sending Emails

**What is it?** Send email notifications to users  
**Cost:** FREE (uses your Gmail)  
**Do you need it?** Only if you want to send email notifications

#### Steps to Get Gmail App Password:

1. **Enable 2-Factor Authentication**
   - Go to: https://myaccount.google.com/security
   - Find "2-Step Verification"
   - Click "Get Started"
   - Follow steps to enable 2FA

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Or Google Account → Security → 2-Step Verification → App passwords
   - Select App: "Mail"
   - Select Device: "Other (Custom name)"
   - Enter: "Bharosa KYC App"
   - Click "Generate"

3. **Copy 16-Character Password**
   - Google will show a 16-character password
   - Copy it (looks like: `abcd efgh ijkl mnop`)
   - ⚠️ Save it - you can't see it again!

4. **Update .env File**
   ```env
   SMTP_USER=youremail@gmail.com
   SMTP_PASSWORD=paste_16_character_password_here
   EMAIL_FROM=noreply@bharosa.com
   ```

---

### 4️⃣ INFURA (Alternative to Alchemy) - Optional

**What is it?** Another blockchain provider (alternative to Alchemy)  
**Cost:** FREE tier available  
**Do you need it?** No, if you're already using Alchemy

#### Steps to Get Infura Keys:

1. **Go to Infura Website**
   - Visit: https://infura.io
   - Click "Get Started for Free"

2. **Sign Up**
   - Create account with email
   - Verify email

3. **Create New Project**
   - Dashboard → Click "Create New Key"
   - Select "Web3 API (Formerly Ethereum)"
   - Name: "Bharosa KYC"
   - Click "Create"

4. **Get Project Keys**
   - Click on your project
   - Copy **Project ID**
   - Copy **Project Secret**

5. **Update .env File**
   ```env
   INFURA_PROJECT_ID=paste_project_id_here
   INFURA_PROJECT_SECRET=paste_project_secret_here
   ```

---

### 5️⃣ HYPERLEDGER ARIES (Advanced Credential System) - Skip for Now

**What is it?** Advanced decentralized identity system  
**Cost:** FREE (self-hosted)  
**Do you need it?** No - Keep it disabled for now

This is an advanced feature. Current setting is fine:
```env
SKIP_ARIES_CREDENTIAL=true
```

---

## 📊 Priority Guide - What to Get First

### 🔴 Priority 1: Already Done ✅
- MongoDB Atlas - ✅ Working
- JWT Secret - ✅ Configured
- Basic Config - ✅ Ready

### 🟡 Priority 2: For Production Deployment
Get these if deploying to production:
1. **Alchemy** - For real blockchain (15 minutes)
2. **Pinata** - For file storage (10 minutes)

### 🟢 Priority 3: Nice to Have
Get these if you need specific features:
3. **Gmail App Password** - For email notifications (5 minutes)

---

## 🚀 Quick Start Checklist

**Can I use the system WITHOUT these keys?**  
✅ **YES!** Your system works right now with:
- MongoDB Atlas (configured)
- Local file storage (no IPFS needed)
- Local blockchain (Ganache in Docker)
- No email (users login without email verification)

**When do I NEED these keys?**
- **IPFS/Pinata**: When deploying to production (Render) - files get deleted on free tier
- **Blockchain/Alchemy**: When you want real blockchain instead of test blockchain
- **Email/Gmail**: When you want to send notifications to users

---

## 📝 How to Update Keys After Getting Them

### For Local Development:

1. Open `.env` file in your project
2. Find the variable name (e.g., `PINATA_API_KEY=your_pinata_api_key_here`)
3. Replace the placeholder with your actual key
4. Save the file
5. Restart your backend:
   ```bash
   cd backend
   npm start
   ```

### For Render Production:

1. Go to https://dashboard.render.com
2. Click on your service
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Enter:
   - **Key**: Variable name (e.g., `PINATA_API_KEY`)
   - **Value**: Your actual API key
6. Click "Save Changes"
7. Service will auto-redeploy

---

## ⚠️ Security Best Practices

1. **Never commit .env file to Git**
   - ✅ Already gitignored
   
2. **Use different keys for development and production**
   - Development: Use test/sandbox keys
   - Production: Use production keys

3. **Rotate keys regularly**
   - Change keys every 6 months
   - If compromised, change immediately

4. **Keep secrets safe**
   - Don't share in screenshots
   - Don't paste in public chats
   - Store in password manager

---

## 🆘 Troubleshooting

### "API Key Invalid" Error

**For Pinata:**
- Verify you copied both API Key AND Secret
- Check no extra spaces
- Keys are case-sensitive

**For Alchemy:**
- Ensure you copied the full HTTPS URL
- Network should be "Polygon Mumbai" for testnet
- Check API key is enabled

**For Gmail:**
- Verify 2FA is enabled first
- App password is 16 characters
- Remove spaces when pasting

---

## 📞 Support Links

- **Pinata Docs**: https://docs.pinata.cloud
- **Alchemy Docs**: https://docs.alchemy.com
- **Gmail App Passwords**: https://support.google.com/accounts/answer/185833
- **Infura Docs**: https://docs.infura.io

---

## ✅ Summary

**Current Status:**
- ✅ System is WORKING without optional keys
- ✅ MongoDB Atlas configured
- ✅ Ready to use for local development

**Optional Keys:**
- 🔑 Pinata - Get for production file storage
- 🔑 Alchemy - Get for real blockchain
- 🔑 Gmail - Get for email features
- ⚪ Others - Not needed for basic functionality

**Next Step:**
- Test your app locally first
- Get keys only when you need those features
- Deploy to Render when ready

**Time Estimate:**
- All keys: ~30 minutes total
- Just Pinata + Alchemy: ~25 minutes

---

**Last Updated**: November 8, 2024  
**Status**: Ready to use without optional keys
