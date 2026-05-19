# The Written Entity - Frontend

## Deploy to Vercel

### Option 1: Using Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy from this directory:
```bash
cd frontend
vercel
```

3. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? **the-written-entity** (or your choice)
   - In which directory is your code located? **./**
   - Want to override settings? **N**

### Option 2: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Set **Root Directory** to `frontend`
5. Click "Deploy"

## Configuration

The frontend automatically detects the backend URL:
- **Local development**: `http://localhost:3001`
- **Production**: `https://the-written-entity-production.up.railway.app`

No environment variables needed!

## After Deployment

1. Get your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Update Railway backend environment variable:
   - `FRONTEND_URL=https://your-app.vercel.app`
3. Update Google OAuth redirect URIs if using Google integration
