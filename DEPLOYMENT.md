# Deployment Guide

## Current Status
The application has been fixed to properly handle environment variables and communication between frontend and backend.

## Environment Variables Setup

### Vercel (Frontend) Environment Variables
Set these in your Vercel dashboard under Settings > Environment Variables:

```
VITE_SERVER_URL=https://question-builder-backend.onrender.com
VITE_NODE_ENV=production
```

### Render (Backend) Environment Variables
Set these in your Render dashboard under Environment:

```
NODE_ENV=production
PORT=3000
MONGODB_CONNECTION=mongodb+srv://xman76066:tAsJ1DNxooflZL6L@cluster0.eotiafj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-in-production-make-it-very-long-and-random
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=AIzaSyCJrOLSJk4CGN1gAn7bRWwTn4R7JJMw2ew
CLOUDINARY_CLOUD_NAME=dpxgutx4o
CLOUDINARY_API_KEY=568469715264196
CLOUDINARY_API_SECRET=-xADOZjPws4swNK2K7-nY7g588M
CLOUDINARY_URL=cloudinary://568469715264196:-xADOZjPws4swNK2K7-nY7g588M@dpxgutx4o
CLIENT_URL=https://question-builder.vercel.app
```

## Render Build Configuration

Make sure your Render service has these settings:

- **Root Directory**: `server`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Node Version**: 18.x or later

## Vercel Build Configuration

Make sure your Vercel project has these settings:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Root Directory**: `client`

## Deployment Steps

1. **Deploy Backend First**:
   - Ensure Render service is deployed with correct environment variables
   - Wait for deployment to complete and test the health endpoint

2. **Update Frontend Environment Variables**:
   - Set `VITE_SERVER_URL` to your actual Render backend URL
   - Redeploy frontend on Vercel

3. **Test Communication**:
   - Open browser dev tools and check Network tab
   - Verify API calls are going to the correct backend URL
   - Check for CORS errors in console

## Troubleshooting

### Frontend Issues
- **API calls fail**: Check `VITE_SERVER_URL` is set correctly
- **Build fails**: Ensure all dependencies are in package.json
- **Environment variables not working**: Prefix with `VITE_`

### Backend Issues
- **CORS errors**: Verify `CLIENT_URL` matches your Vercel deployment URL exactly
- **Database connection fails**: Check MongoDB connection string
- **Images not uploading**: Verify Cloudinary credentials

### Communication Issues
- **Frontend can't reach backend**: Check both URLs are correct and accessible
- **Infinite loading**: Check network tab for failed requests
- **Authentication issues**: Verify JWT secret is consistent

## URLs to Update

After deployment, update these URLs:

1. **Frontend (.env)**:
   ```
   VITE_SERVER_URL=https://[your-render-app-name].onrender.com
   ```

2. **Backend (.env)**:
   ```
   CLIENT_URL=https://[your-vercel-app-name].vercel.app
   ```

## Health Check Endpoints

- **Backend**: `https://[your-render-app-name].onrender.com/api/health`
- **Frontend**: `https://[your-vercel-app-name].vercel.app`

## Notes

- Render services may take 1-2 minutes to spin up from sleep
- Vercel deployments are instant once built
- Both platforms support automatic deployments from Git repositories
- Environment variables require redeployment to take effect