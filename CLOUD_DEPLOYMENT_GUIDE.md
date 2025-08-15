# 🚀 Chat2Chat Web - Cloud Deployment Guide

## 🎯 **10-Minute Production Deployment**

### **📋 Prerequisites**
- GitHub account
- Vercel account (free)
- Railway account (free)

---

## **🔗 Step 1: Deploy Signaling Server (Railway)**

### **1.1 Create Railway Account**
1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign up with GitHub

### **1.2 Deploy Signaling Server**
1. Click "Deploy from GitHub repo"
2. Select your `squish-call-hub` repository
3. Choose "Deploy from subdirectory": `signaling-server`
4. Click "Deploy"

### **1.3 Configure Environment**
1. Go to your Railway project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Add these variables:
   ```
   PORT=3001
   NODE_ENV=production
   ```

### **1.4 Get Your Railway URL**
1. Go to "Settings" tab
2. Click "Generate Domain"
3. Copy the URL (like: `https://your-app-name.railway.app`)
4. **Save this URL - you'll need it!**

---

## **🌐 Step 2: Deploy Frontend (Vercel)**

### **2.1 Create Vercel Account**
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### **2.2 Deploy Frontend**
1. Click "New Project"
2. Import your `squish-call-hub` repository
3. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Root Directory**: `.` (leave as root)

### **2.3 Add Environment Variables**
In Vercel dashboard, go to "Settings" → "Environment Variables":

```
VITE_SIGNALING_SERVER_URL = https://your-railway-app.railway.app
VITE_SUPABASE_URL = your_supabase_url
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
```

### **2.4 Deploy**
1. Click "Deploy"
2. Wait for build to complete
3. Get your Vercel URL (like: `https://your-app.vercel.app`)

---

## **📊 Step 3: Update Configuration**

### **3.1 Update Local Environment**
Create `.env` file in your project root:
```env
VITE_SIGNALING_SERVER_URL=https://your-railway-app.railway.app
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **3.2 Test Production Setup**
1. Open your Vercel URL
2. Create accounts in separate browser tabs
3. Test messaging and calling

---

## **✅ Step 4: Verification Checklist**

### **Railway (Signaling Server)**
- [ ] Service is deployed and running
- [ ] Health check works: `https://your-app.railway.app/health`
- [ ] Environment variables are set
- [ ] Domain is generated

### **Vercel (Frontend)**
- [ ] App builds successfully
- [ ] Environment variables are configured
- [ ] App loads at your Vercel URL
- [ ] All features work (auth, messaging, calling)

### **Integration Test**
- [ ] Can create accounts
- [ ] Can add friends
- [ ] Can send messages
- [ ] Can make calls with sound effects
- [ ] WebRTC connection works

---

## **🎉 Success! Your App is Live**

### **🌐 Your Production URLs:**
- **Frontend**: `https://your-app.vercel.app`
- **Signaling Server**: `https://your-app.railway.app`
- **Database**: Already on Supabase cloud

### **🚀 What You Now Have:**
- ✅ **99.9% Uptime** - Professional hosting
- ✅ **Global CDN** - Fast worldwide access
- ✅ **Auto-scaling** - Handles traffic spikes
- ✅ **SSL Certificates** - Secure HTTPS
- ✅ **Custom Domains** - Professional URLs
- ✅ **Auto-deployments** - Push to deploy

### **📱 Share Your App:**
Send your Vercel URL to friends - they can use it instantly!

---

## **🔧 Troubleshooting**

### **Common Issues:**

**"Can't connect to signaling server"**
- Check Railway deployment logs
- Verify environment variables
- Ensure Railway domain is accessible

**"Build failed on Vercel"**
- Check build logs in Vercel dashboard
- Verify all dependencies are in package.json
- Check TypeScript errors

**"WebRTC not working"**
- Verify signaling server URL in environment variables
- Check browser console for errors
- Test with two different devices/networks

### **Getting Help:**
- Railway logs: Railway dashboard → your service → "Logs"
- Vercel logs: Vercel dashboard → your project → "Deployments" → click failed deployment
- Browser logs: F12 → Console tab

---

## **🎯 Next Steps**

### **Optional Enhancements:**
1. **Custom Domain**: Add your own domain in Vercel/Railway
2. **Analytics**: Add Vercel Analytics
3. **Monitoring**: Set up uptime monitoring
4. **TURN Servers**: Add for enterprise NAT traversal

**Your Chat2Chat Web is now running on professional cloud infrastructure! 🎉**
