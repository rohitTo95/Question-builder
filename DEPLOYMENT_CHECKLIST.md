# 🚀 Deployment Fix Checklist

## ✅ Issues Resolved
- [x] Fixed Vite config to use environment variable instead of hardcoded URL
- [x] Added health endpoint for backend monitoring
- [x] Updated backend NODE_ENV to production
- [x] Created comprehensive deployment guide

## 🔧 Environment Variables to Update

### Vercel (Frontend)
Update these environment variables in your Vercel dashboard:

```
VITE_SERVER_URL=https://question-builder-3gg4.onrender.com
VITE_NODE_ENV=production
```

⚠️ **IMPORTANT**: Replace `question-builder-3gg4.onrender.com` with your actual Render app URL.

### Render (Backend)
Ensure these environment variables are set in your Render dashboard:

```
NODE_ENV=production
CLIENT_URL=https://question-builder.vercel.app
MONGODB_CONNECTION=mongodb+srv://xman76066:tAsJ1DNxooflZL6L@cluster0.eotiafj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-in-production-make-it-very-long-and-random
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=AIzaSyCJrOLSJk4CGN1gAn7bRWwTn4R7JJMw2ew
CLOUDINARY_CLOUD_NAME=dpxgutx4o
CLOUDINARY_API_KEY=568469715264196
CLOUDINARY_API_SECRET=-xADOZjPws4swNK2K7-nY7g588M
CLOUDINARY_URL=cloudinary://568469715264196:-xADOZjPws4swNK2K7-nY7g588M@dpxgutx4o
PORT=3000
```

⚠️ **IMPORTANT**: Replace `question-builder.vercel.app` with your actual Vercel app URL.

## 🧪 Testing After Deployment

1. **Check Backend Health**:
   ```
   GET https://[your-render-app].onrender.com/api/health
   ```
   Should return:
   ```json
   {
     "status": "healthy",
     "environment": "production",
     "timestamp": "...",
     "uptime": ...,
     "clientUrl": "https://[your-vercel-app].vercel.app"
   }
   ```

2. **Check Frontend**:
   - Open browser dev tools (Network tab)
   - Visit your Vercel app
   - Verify API calls go to your Render backend URL
   - Check for CORS errors in console

3. **Test CORS**:
   - Login/Register should work without CORS errors
   - Form creation should work
   - Image uploads should work

## 🔄 Deployment Steps

1. **Update Environment Variables**:
   - Update Vercel environment variables
   - Update Render environment variables

2. **Redeploy Both Services**:
   - Trigger a redeploy on Render (or push to trigger auto-deploy)
   - Trigger a redeploy on Vercel (or push to trigger auto-deploy)

3. **Test Communication**:
   - Wait for both deployments to complete
   - Test the health endpoint
   - Test frontend functionality

## 🐛 Common Issues & Solutions

### Issue: API calls still going to localhost
**Solution**: Clear browser cache, ensure `VITE_SERVER_URL` is set correctly

### Issue: CORS errors
**Solution**: Verify `CLIENT_URL` exactly matches your Vercel URL (no trailing slash)

### Issue: Frontend shows "Network Error"
**Solution**: Check if backend is up, test health endpoint directly

### Issue: Render service not responding
**Solution**: Render services sleep after inactivity, first request may take 1-2 minutes

## 📝 Final Verification

After deployment, these should all work:
- [ ] Health endpoint responds correctly
- [ ] Frontend loads without console errors
- [ ] User registration/login works
- [ ] Form creation works
- [ ] Image uploads work
- [ ] Public form sharing works

## 🔗 Quick Links

Once deployed, bookmark these for monitoring:
- Backend Health: `https://[your-render-app].onrender.com/api/health`
- Frontend: `https://[your-vercel-app].vercel.app`
- Render Logs: Render dashboard > Services > Your service > Logs
- Vercel Logs: Vercel dashboard > Projects > Your project > Functions
